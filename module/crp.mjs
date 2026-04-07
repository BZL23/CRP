// module/crp.mjs

import { CRPActor } from "./actor/actor.mjs";
import { CRPActorData } from "./actor/actor-data.mjs";
import { CRP } from "./config.mjs";
import { CRPRoll } from "./rolls/roll.mjs";

Hooks.once("init", () => {
  console.log("CRP | System init");

  CONFIG.Actor.documentClass = CRPActor;

  CONFIG.Actor.dataModels = {
    character: CRPActorData,
    npc: CRPActorData,
    creature: CRPActorData
  };
  CONFIG.CRP = CRP;
});

Hooks.on("renderChatMessageHTML", (message, html) => {

const button = html.querySelector(".crp-use-fate");
  if (!button) return;

  if (!button.dataset.messageId) return;
  
  if (button.dataset.bound) return;
  button.dataset.bound = "true";

  button.addEventListener("click", async ev => {

  ev.preventDefault();
  ev.stopPropagation();

  if (button.classList.contains("used")) return;

  button.disabled = true;
  button.innerText = "⏳...";

  const actorUuid = button.dataset.actorUuid;
  const attrKey = button.dataset.attr;
  const skillKey = button.dataset.skill;
  const messageId = button.dataset.messageId;

  const actor = await fromUuid(actorUuid);
  const chatMessage = game.messages.get(messageId);

  if (!actor || !chatMessage) {
    ui.notifications.error("Błąd danych");
    button.disabled = false;
    button.innerText = "✨ Użyj Doli";
    return;
  }

  const spent = await actor.spendFate(1);

  if (!spent) {
    button.disabled = false;
    button.innerText = "✨ Użyj Doli";
    return;
  }

  const result = await CRPRoll.skill(actor, attrKey, skillKey, {
    chat: false
  });

  if (!result) {
    button.disabled = false;
    button.innerText = "✨ Użyj Doli";
    return;
  }

  const newContent = CRPRoll.renderRollHTML(
    actor,
    attrKey,
    skillKey,
    result,
    { usedFate: true }
  );

  await chatMessage.update({
    content: newContent
  });

  button.innerText = "✔ Dola użyta";
  button.classList.add("used");
  button.disabled = true;

});

});