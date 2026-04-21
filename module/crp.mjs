// module/crp.mjs

import { CRPActor } from "./actor/actor.mjs";
import { CRPActorData } from "./actor/actor-data.mjs";
import { CRP } from "./config.mjs";
import { CRPRoll } from "./rolls/roll.mjs";
import { CRPActorSheet } from "./actor/sheet.mjs";
import { CRPGMPanel } from "./gm-panel.mjs";
import { CRPWeaponData, CRPArmorData, CRPShieldData, CRPStuffData } from "./item/item-data.mjs";
import { CRPItemSheet, CRPWeaponSheet, CRPArmorSheet, CRPShieldSheet, CRPStuffSheet } from "./item/sheet.mjs";

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
CONFIG.Item.dataModels = CONFIG.Item.dataModels || {};

CONFIG.Item.dataModels.weapon = CRPWeaponData;
CONFIG.Item.dataModels.armor = CRPArmorData;
CONFIG.Item.dataModels.shield = CRPShieldData;
CONFIG.Item.dataModels.stuff = CRPStuffData;

foundry.documents.collections.Items.registerSheet("crp", CRPWeaponSheet, {
  types: ["weapon"],
  makeDefault: true
});

foundry.documents.collections.Items.registerSheet("crp", CRPArmorSheet, {
  types: ["armor"],
  makeDefault: true
});

foundry.documents.collections.Items.registerSheet("crp", CRPShieldSheet, {
  types: ["shield"],
  makeDefault: true
});

foundry.documents.collections.Items.registerSheet("crp", CRPStuffSheet, {
  types: ["stuff"],
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

  const buttons = html.querySelectorAll(".crp-defense-choice button");
if (!buttons.length) return;

for (const btn of buttons) {

  if (btn.dataset.bound) continue;
  btn.dataset.bound = "true";

  btn.addEventListener("click", async ev => {

    const container = btn.closest(".crp-defense-choice");
    const messageId = container.dataset.messageId;

    const attackerUuid = container.dataset.attacker;
    const defenderUuid = container.dataset.defender;
    const defenseType = btn.dataset.defense;
    const skill = container.dataset.skill;

    const attacker = await fromUuid(attackerUuid);
    const defender = await fromUuid(defenderUuid);

    if (!attacker || !defender) return;

    // 🔒 uprawnienia
    const isGM = game.user.isGM;
    const ownsDefender = defender.isOwner;

    if (!isGM && !ownsDefender) {
      ui.notifications.warn("Nie kontrolujesz tej postaci");
      return;
    }

    let defSkill;

    if (defenseType === "parry") {

  const eq = defender.system.equipment;

  const getWeaponSkill = (slot) => {
    const id = eq[slot]?.id;
    if (!id) return null;

    const item = defender.items.get(id);
    if (!item) return null;

    return item.system.skill;
  };

  const getTotal = (skill) => {
    if (!skill) return -999;

    const attr = defender._mapSkillToAttribute(skill);
    if (!attr) return -999;

    const attrVal = defender.system.attributes[attr]?.value ?? 0;
    const skillVal = defender.system.attributes[attr]?.skills?.[skill]?.value ?? 0;

    return attrVal + skillVal;
  };

const getParrySkill = (slot) => {
  const id = eq[slot]?.id;
  if (!id) return null;

  const item = defender.items.get(id);
  if (!item) return null;

  if (item.system.skill === "ranged") return null;

  return item.system.skill;
};

const rightSkill = getParrySkill("rightHand");
const leftSkill = getParrySkill("leftHand");

  const rightTotal = getTotal(rightSkill);
  const leftTotal = getTotal(leftSkill);

  defSkill = rightTotal >= leftTotal ? rightSkill : leftSkill;

  if (!defSkill) {
    ui.notifications.warn("Brak broni do parowania");
    return;
  }
}
    if (defenseType === "dodge") defSkill = "athletics";
    if (defenseType === "shield") defSkill = "shield";

const result = await attacker.opposedTest(
  defender,
  attacker._mapSkillToAttribute(skill),
  skill,
  defender._mapSkillToAttribute(defSkill),
  defSkill
);

// =====================
// OBRAŻENIA
// =====================
if (result?.winner === "A") {

  const marginA = result.rollA?.margin ?? 0;
  const marginB = result.rollB?.margin ?? 0;

const baseDamage = Math.max(0, marginA - marginB);
let damage = baseDamage;

// =====================
// REDUKCJA OBRAŻEŃ
// =====================
const eq = defender.system.equipment;

// --- ARMOR ---
let armorProtection = 0;

if (eq.armor?.id) {
  const armorItem = defender.items.get(eq.armor.id);
  armorProtection = armorItem?.system?.protection ?? 0;
}

// --- SHIELD ---
let shieldProtection = 0;

const rightShield = eq.rightHand?.id
  ? defender.items.get(eq.rightHand.id)
  : null;

const leftShield = eq.leftHand?.id
  ? defender.items.get(eq.leftHand.id)
  : null;

const getShieldProt = (item) =>
  item?.type === "shield"
    ? item.system?.protection ?? 0
    : 0;

const rightProt = getShieldProt(rightShield);
const leftProt = getShieldProt(leftShield);

// wybór jednej tarczy (większej)
shieldProtection = Math.max(rightProt, leftProt);

// --- FINAL ---
const reduction = armorProtection + shieldProtection;

damage = Math.max(0, damage - reduction);

const reductionText = `
  🛡 Redukcja: ${reduction}
  (${armorProtection} pancerz${shieldProtection ? ` + ${shieldProtection} tarcza` : ""})
`;

// =====================
// APPLY DAMAGE
// =====================
if (damage > 0) {
  await defender.applyDamage(damage);
}

// =====================
// UPDATE WIADOMOŚCI PO ID
// =====================
if (result?.messageId) {

  const msg = game.messages.get(result.messageId);

  if (msg) {
const newContent = msg.content + `
  <div class="crp-damage">
    💥 Obrażenia bazowe: <b>${baseDamage}</b><br>
    ${reductionText}<br>
    👉 Obrażenia końcowe: <b>${damage}</b>
  </div>
`;

    await msg.update({ content: newContent });
  }
}

}

const defenseLabel = {
  parry: "Parowanie",
  dodge: "Unik",
  shield: "Tarcza"
}[defenseType] ?? defenseType;

// lokalna podmiana tylko u tego gracza
for (const b of container.querySelectorAll("button")) {
  b.disabled = true;
}
container.innerHTML = `
  <div class="crp-defense-result">
    🛡 Wybrałeś: <b>${defenseLabel}</b>
  </div>
`;

  });
}

});

// =====================
// SOCKET → GM UPDATE
// =====================
Hooks.once("ready", () => {

  game.socket.on("system.crp", async (data) => {

    if (!game.user.isGM) return;
    if (data.type !== "defenseSelected") return;

    const msg = game.messages.get(data.messageId);
    if (!msg) return;

    const defenseLabel = {
      parry: "Parowanie",
      dodge: "Unik",
      shield: "Tarcza"
    }[data.defenseType] ?? data.defenseType;

    await msg.update({
      content: `
        <div class="crp-defense-result">
          🛡 Wybrana obrona: <b>${defenseLabel}</b>
        </div>
      `
    });

  });

});