// module/crp.mjs

import { CRPActor } from "./actor/actor.mjs";
import { CRPActorData } from "./actor/actor-data.mjs";
import { CRP } from "./config.mjs";
import { CRPRoll } from "./rolls/roll.mjs";
import { CRPActorSheet } from "./actor/sheet.mjs";
import { CRPGMPanel } from "./gm-panel.mjs";
import { CRPWeaponData, CRPArmorData } from "./item/item-data.mjs";
import { CRPWeaponSheet, CRPArmorSheet } from "./item/sheet.mjs";

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

    CONFIG.Item = CONFIG.Item || {};


CONFIG.Item.dataModels = {
  weapon: CRPWeaponData,
  armor: CRPArmorData
};

foundry.documents.collections.Items.registerSheet("crp", CRPWeaponSheet, {
  types: ["weapon"],
  makeDefault: true
});

foundry.documents.collections.Items.registerSheet("crp", CRPArmorSheet, {
  types: ["armor"],
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

Handlebars.registerHelper("eq", (a, b) => a === b);


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

Hooks.on("renderChatMessageHTML", (message, html) => {

  // 👉 tylko nasze wiadomości
  if (message.flags?.crp?.type !== "defensePrompt") return;

  html.querySelectorAll(".defense-btn").forEach(btn => {

    // zabezpieczenie przed wielokrotnym bindem
    if (btn.dataset.bound) return;
    btn.dataset.bound = "true";

    btn.addEventListener("click", async ev => {

      const container = ev.currentTarget.closest(".crp-defense-choice");

      const attackerId = container.dataset.attacker;
      const defenderId = container.dataset.defender;
      const weaponId = container.dataset.weapon;

      const defenseType = ev.currentTarget.dataset.type;

      const attacker = game.actors.get(attackerId);
      const defender = game.actors.get(defenderId);
      const weapon = attacker.items.get(weaponId);

const isGM = game.user.isGM;

// ✔ czy user kontroluje token tego aktora
const controlsDefender = canvas.tokens.placeables
  .filter(t => t.actor?.id === defenderId)
  .some(t => t.isOwner);

if (!isGM && !controlsDefender) {
  ui.notifications.warn("Nie kontrolujesz tej postaci.");
  return;
}

      //  blokada lokalna (UX)
      html.querySelectorAll(".defense-btn").forEach(b => b.disabled = true);

      //  MAPOWANIE
      let defSkill, defAttr;

      switch (defenseType) {
        case "parry":
          defSkill = weapon.system.skill;
          defAttr = defender._mapSkillToAttribute?.(defSkill);
          break;

        case "dodge":
          defSkill = "athletics";
          defAttr = "strength";
          break;

        case "shield":
          defSkill = "shield";
          defAttr = defender._mapSkillToAttribute?.(defSkill);
          break;
      }

      const atkSkill = weapon.system.skill;
      const atkAttr = attacker._mapSkillToAttribute?.(atkSkill);

      if (!atkAttr || !defAttr) {
        ui.notifications.error("Błąd mapowania cech/skilli");
        return;
      }

// 🔥 ZAWSZE wykonujemy test lokalnie
await CRPRoll.opposed(
  attacker, atkAttr, atkSkill,
  defender, defAttr, defSkill,
  {
    messageId: message.id,
    defenseType
  }
);


    });

  });

});

Hooks.once("ready", () => {

  game.socket.on(`system.${game.system.id}`, async data => {

    if (!game.user.isGM) return;

    console.log("CRP SOCKET RECEIVED", data);

    // 🔥 DODAJ TO:
    if (data.type === "updateMessage") {
      const msg = game.messages.get(data.messageId);
      if (msg) await msg.update({ content: data.content });
      return;
    }
    console.log("GM UPDATE MESSAGE", data);

    if (data.type === "resolveDefense") {

const { attackerUuid, defenderUuid, weaponUuid, defenseType, messageId } = data;

const attacker = await fromUuid(attackerUuid);
const defender = await fromUuid(defenderUuid);

const weaponDoc = await fromUuid(weaponUuid);
const weapon = attacker.items.get(weaponDoc.id) ?? weaponDoc;

      let defSkill, defAttr;

      switch (defenseType) {
        case "parry":
          defSkill = weapon.system.skill;
          defAttr = defender._mapSkillToAttribute?.(defSkill);
          break;
        case "dodge":
          defSkill = "athletics";
          defAttr = "strength";
          break;
        case "shield":
          defSkill = "shield";
          defAttr = defender._mapSkillToAttribute?.(defSkill);
          break;
      }

      const atkSkill = weapon.system.skill;
      const atkAttr = attacker._mapSkillToAttribute?.(atkSkill);

      await CRPRoll.opposed(
        attacker, atkAttr, atkSkill,
        defender, defAttr, defSkill,
        {
          messageId,
          defenseType
        }
      );
    }

  });

});

