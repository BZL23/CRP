// module/crp.mjs

import { CRPActor } from "./actor/actor.mjs";
import { CRPActorData } from "./actor/actor-data.mjs";
import { CRP } from "./config.mjs";
import { CRPRoll } from "./rolls/roll.mjs";
import { CRPActorSheet } from "./actor/sheet.mjs";
import { CRPGMPanel } from "./gm-panel.mjs";

Hooks.once("init", () => {
  console.log("CRP | System init");

  CONFIG.Actor.documentClass = CRPActor;

  CONFIG.Actor.dataModels = {
    character: CRPActorData,
    npc: CRPActorData,
    creature: CRPActorData
  };

  CONFIG.CRP = CRP;

foundry.documents.collections.Actors.registerSheet("crp", CRPActorSheet, {
  types: ["character"],
  makeDefault: true
});

});


Hooks.on("createActor", async (actor) => {

  if (actor.type !== "character") return;

  const max = actor.system.derived.health.max;

  await actor.update({
    "system.derived.health.value": max
  });

});

Hooks.on("renderChatMessageHTML", (message, html) => {

  const buttons = html.querySelectorAll(".crp-use-fate");
  if (!buttons.length) return;

  for (const button of buttons) {

    //  zabezpieczenie przed wielokrotnym bindem
    if (button.dataset.bound) continue;
    button.dataset.bound = "true";

    button.addEventListener("click", async ev => {

      ev.preventDefault();
      ev.stopPropagation();

      //  jeśli już użyto
      if (button.classList.contains("used")) return;

      button.disabled = true;
      button.innerText = "⏳ Rzut...";

      const actorUuid = button.dataset.actorUuid;
      const attrKey = button.dataset.attr;
      const skillKey = button.dataset.skill;

      if (!actorUuid) {
        ui.notifications.error("Brak UUID aktora");
        button.disabled = false;
        button.innerText = "✨ Użyj Doli";
        return;
      }

      const actor = await fromUuid(actorUuid);

      if (!actor || (!actor.isOwner && !game.user.isGM)) {
        ui.notifications.error("Brak uprawnień do aktora");
        button.disabled = false;
        button.innerText = "✨ Użyj Doli";
        return;
      }

      //  zużycie Doli
      let spent;
      try {
        spent = await actor.spendFate(1);
      } catch (e) {
        console.error(e);
        ui.notifications.error("Błąd Doli");
        button.disabled = false;
        button.innerText = "✨ Użyj Doli";
        return;
      }

      if (!spent) {
        button.disabled = false;
        button.innerText = "✨ Użyj Doli";
        return;
      }

      //  reroll (bez nowej wiadomości)
      const result = await CRPRoll.skill(actor, attrKey, skillKey, {
        chat: false
      });

      if (!result) {
        button.disabled = false;
        button.innerText = "✨ Użyj Doli";
        return;
      }

      //  generujemy nowy HTML
const newContent = CRPRoll.renderRollHTML(
  
  actor,
  attrKey,
  skillKey,
  result,
  {
    usedFate: true,
    allowFate: false
  }
);

      //  KLUCZ: aktualizujemy TĘ wiadomość
      await message.update({
        content: newContent
      });

      button.innerText = "✔ Dola użyta";
button.classList.add("used");
button.disabled = true;

    });

  }

});

Hooks.on("updateCombat", async (combat, changed) => {

  if (!combat.started || (changed.turn === undefined && changed.round === undefined)) return;

  // RESET FLAG
await Promise.all(
  combat.combatants
    .map(c => c.actor)
    .filter(Boolean)
    .map(actor => actor.setFlag("crp", "processedTurn", false))
);

  // AKTUALNY COMBATANT
  const combatant = combat.combatant;
  if (!combatant) return;

  const actor = combatant.actor;
  if (!actor) return;

  if (actor.type !== "character") return;

  await CRPRoll.processTurn(actor);
});


Hooks.on("renderActorDirectory", (app, html) => {

  if (!game.user.isGM) return;

  if (html.querySelector(".crp-btn")) return;

  const btn = document.createElement("button");
  btn.innerHTML = "👑 CRP Panel";
  btn.classList.add("crp-btn");

  btn.addEventListener("click", () => {
    new CRPGMPanel().render(true);
  });

  html.querySelector(".directory-header").appendChild(btn);

});