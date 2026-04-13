// module/rolls/roll.mjs

export class CRPRoll {

      static resolveCritical(dice, total) {
  const isDouble = dice.length === 2 && dice[0] === dice[1];

  if (isDouble && total === 2) return "criticalSuccess";
  if (isDouble && total === 20) return "criticalFailure";

  return null;
}

static resolveOutcome(dice, total, target) {
  const critical = this.resolveCritical(dice, total);

  const success =
    critical === "criticalSuccess" ||
    (critical !== "criticalFailure" && total <= target);

  return { critical, success };
}

static formatMargin(margin) {
  return margin >= 0 ? `+${margin}` : margin;
}


    static async skill(actor, attrKey, skillKey, { chat = true, allowFate = true } = {}) {

        if (!actor) {
            console.error("Brak aktora");
            return null;
        }

        const attr = actor.system.attributes[attrKey];

        if (!attr) {
            console.error("Brak atrybutu:", attrKey);
            return null;
        }

        const skill = attr.skills[skillKey];

        if (!skill) {
            console.error("Brak skilla:", skillKey);
            return null;
        }

        const weapon = actor.getEquippedWeapon();

let weaponBonus = 0;

if (weapon && weapon.system.skill === skillKey) {
  weaponBonus += weapon.system.accuracy ?? 0;
}


        const penalty = actor.system.derived.woundPenalty ?? 0;

        const target = Math.max(
  2,
  attr.value + skill.value + penalty + weaponBonus
);


        // rzut 2k10
        const roll = await new Roll("2d10").roll();
        const dice = roll.dice?.[0]?.results?.map(r => r.result) ?? [];
        const total = roll.total;

        // poziom sukcesu
        const margin = target - total;

        // sukces / porażka

const { critical, success } = this.resolveOutcome(dice, total, target);


        // symbole
        const eagles = dice.filter(d => d === 1).length;
        const shields = dice.filter(d => d === 10).length;

        // wynik
const result = {
  dice,
  total,
  target,
  margin,
  success,
  critical,
  eagles,
  shields
};

console.log("CRP Roll:", result);

if (chat) {
  const content = this.renderRollHTML(actor, attrKey, skillKey, result, {
    usedFate: false,
    allowFate
  });

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content
  });
}

return result;


    }

    static async opposed(
        actorA, attrA, skillA,
        actorB, attrB, skillB
    ) {
        const rollA = await this.skill(actorA, attrA, skillA, { chat: false });
        const rollB = await this.skill(actorB, attrB, skillB, { chat: false });

        if (!rollA || !rollB) {
            console.error("Błąd testu przeciwstawnego");
            ui.notifications.warn("Nie można wykonać testu");
            return;
        }

        const penaltyA = actorA.system.derived.woundPenalty ?? 0;
        const penaltyB = actorB.system.derived.woundPenalty ?? 0;

const marginTextA = rollA.critical
  ? null
  : this.formatMargin(rollA.margin);

const marginTextB = rollB.critical
  ? null
  : this.formatMargin(rollB.margin);

        //  porównanie marginów
        let winner;


if (rollA.critical === "criticalSuccess" && rollB.critical === "criticalSuccess") {
  winner = "tie";
} else if (rollA.critical === "criticalSuccess") {
  winner = "A";
} else if (rollB.critical === "criticalSuccess") {
  winner = "B";
} else if (rollA.critical === "criticalFailure" && rollB.critical === "criticalFailure") {
  winner = "tie";
} else if (rollA.critical === "criticalFailure") {
  winner = "B";
} else if (rollB.critical === "criticalFailure") {
  winner = "A";
} else {
  if (rollA.margin > rollB.margin) {
    winner = "A";
  } else if (rollB.margin > rollA.margin) {
    winner = "B";
  } else {
    winner = "tie";
  }
}


        //  Chat summary
        const speaker = ChatMessage.getSpeaker({ actor: actorA });

        // nazwy (ładne)
        const skillLabelA = CONFIG.CRP.skills[skillA] ?? skillA;
        const attrLabelA = CONFIG.CRP.attributes[attrA] ?? attrA;   
        const skillLabelB = CONFIG.CRP.skills[skillB] ?? skillB;
        const attrLabelB = CONFIG.CRP.attributes[attrB] ?? attrB;

        // wynik
        let resultText;

        if (winner === "A") {
            resultText = `👉 ${actorA.name} wygrywa`;
        } else if (winner === "B") {
            resultText = `👉 ${actorB.name} wygrywa`;
        } else {
            resultText = "👉 REMIS";
        }

        // HTML
        const content = `
            <div class="crp-roll">
                <h3>Test przeciwstawny</h3>
                <hr>
                <p>
                    <strong>${actorA.name}</strong><br>
                    ${skillLabelA} (${attrLabelA})<br>
                    🎲 ${rollA.dice.length ? rollA.dice.join(", ") : "—"} = ${rollA.total}<br>
                    Cel: ${rollA.target}<br>
                    ${penaltyA !== 0 ? `⚠ Kara za rany: ${penaltyA}<br>` : ""}
                    ${marginTextA !== null ? `Margin: ${marginTextA}<br>` : ""}
                </p>
                <p>
                    <strong>${actorB.name}</strong><br>
                    ${skillLabelB} (${attrLabelB})<br>
                    🎲 ${rollB.dice.length ? rollB.dice.join(", ") : "—"} = ${rollB.total}<br>
                    Cel: ${rollB.target}<br>
                    ${penaltyB !== 0 ? `⚠ Kara za rany: ${penaltyB}<br>` : ""}
                    ${marginTextB !== null ? `Margin: ${marginTextB}<br>` : ""}
                </p>
                <hr>
                <p><strong>${resultText}</strong></p>
            </div>
        `;

        await ChatMessage.create({
            speaker,
            content
        });

        return {
            rollA,
            rollB,
            winner
        };
    }

static renderRollHTML(actor, attrKey, skillKey, result, { usedFate = false, allowFate = true } = {}) {

  const canUseFate = actor.isOwner || game.user.isGM;

  const skillLabel = CONFIG.CRP.skills[skillKey] ?? skillKey;
  const attrLabel = CONFIG.CRP.attributes[attrKey] ?? attrKey;

  const penalty = actor.system.derived.woundPenalty ?? 0;

  //  wynik tekstowy
  let resultText;
  if (result.critical === "criticalSuccess") {
    resultText = "🔥 KRYTYCZNY SUKCES";
  } else if (result.critical === "criticalFailure") {
    resultText = "💀 KRYTYCZNA PORAŻKA";
  } else {
    resultText = result.success ? "✔ SUKCES" : "❌ PORAŻKA";
  }

  //  margin
  const marginText = result.critical
    ? ""
    : `<div class="crp-roll-margin">Margin: ${this.formatMargin(result.margin)}</div>`;

  //  symbole
  let symbols = "";
  if (result.eagles > 0) symbols += `🦅 ${result.eagles} `;
  if (result.shields > 0) symbols += `🛡️ ${result.shields}`;

  //  przycisk Doli
const fateButton = canUseFate ? `
  <button class="crp-use-fate ${usedFate ? "used" : ""}"
          data-actor-uuid="${actor.uuid}"
          data-attr="${attrKey}"
          data-skill="${skillKey}"
          ${usedFate ? "disabled" : ""}>
    ${usedFate ? "✔ Dola użyta" : "✨ Użyj Doli"}
  </button>
` : "";

  return `
    <div class="crp-roll-card ${result.success ? "success" : "fail"}">

      <div class="crp-roll-header">
        <img src="${actor.img}" class="crp-roll-avatar">
        <div>
          <div class="crp-roll-actor">${actor.name}</div>
          <div class="crp-roll-skill">${skillLabel} (${attrLabel})</div>
        </div>
      </div>

      <div class="crp-roll-body">

        ${usedFate ? `<div class="crp-roll-fate-used">✔ Dola użyta</div>` : ""}

        <div class="crp-roll-dice">
          🎲 ${result.dice.length ? result.dice.join(", ") : "—"} 
          → <strong>${result.total}</strong>
        </div>

        <div class="crp-roll-target">
          🎯 Cel: ${result.target}
        </div>

        ${penalty !== 0 ? `<div class="crp-roll-penalty">⚠ Kara za rany: ${penalty}</div>` : ""}

        <div class="crp-roll-result">${resultText}</div>

        ${marginText}

        ${symbols ? `<div class="crp-roll-symbols">${symbols}</div>` : ""}

        ${fateButton}


        
      </div>
    </div>
  `;
}


static async processTurn(actor) {

  // blokada wielokrotnego wywołania w tej samej turze
  if (actor.getFlag("crp", "processedTurn")) return;
  await actor.setFlag("crp", "processedTurn", true);

if (actor.system.state.life === "dead") return;
if (!actor.system.state.bleeding) return;

  // rzut (BEZ chata)
  const result = await this.fortitude(actor, { chat: false });
  if (!result) return;

  // =====================
  // LOGIKA STANÓW (NA AKTUALNYM STANIE)
  // =====================
 
  if (!actor.system.state.unconscious) {

    // był przytomny → może stracić przytomność
    if (!result.success) {
      await actor.update({
        "system.state.unconscious": true
      });

      ui.notifications.warn(`${actor.name} traci przytomność!`);
    }

  } else {

    // był nieprzytomny → może umrzeć
    if (!result.success) {
      await actor.update({
        "system.state.life": "dead",
        "system.state.bleeding": false,
        "system.state.unconscious": false
      });

      ui.notifications.error(`${actor.name} umiera!`);
    }

  }

  // odśwież UI (opcjonalne, ale OK)
  await actor.sheet?.render(false);

  // render do chata (już po update → stan jest aktualny)
  const content = this.renderFortitudeHTML(actor, result);

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content
  });
}

static renderFortitudeHTML(actor, result) {

  const penalty = actor.system.derived.woundPenalty ?? 0;

  const resultText =
    result.critical === "criticalSuccess" ? "🔥 CUD! PRZETRWAŁ" :
    result.critical === "criticalFailure" ? "💀 NATYCHMIASTOWA ŚMIERĆ" :
    result.success ? "PRZETRWAŁ" : "UMIERA";

const marginText = result.critical
  ? null
  : this.formatMargin(result.margin);

  return `
    <div class="crp-roll">
      <h3>💀 Test tężyzny</h3>

      <p><strong>Kostki:</strong> ${result.dice?.length ? result.dice.join(", ") : "—"}</p>
      <p><strong>Wynik:</strong> ${result.total}</p>
      <p><strong>Cel:</strong> ${result.target}</p>

      ${penalty !== 0 ? `<p>⚠ Kara za rany: ${penalty}</p>` : ""}

      <p><strong>${resultText}</strong></p>
      ${marginText !== null ? `<p><strong>Margin:</strong> ${marginText}</p>` : ""}

      <p>Stan: ${
        actor.system.state.life === "dead" ? "💀 martwy" :
        actor.system.state.unconscious ? "😵 nieprzytomny" :
        actor.system.state.bleeding ? "🩸 krwawi" :
        "✔ stabilny"
      }</p>
    </div>
  `;
}

// actor.mjs

async rollAttack(skillKey) {

  const weapon = this.getEquippedWeapon();

  const attrKey = this._mapSkillToAttribute(skillKey);

  const result = await this.rollSkill(attrKey, skillKey);

  if (!result.success) return result;

  let damage = weapon?.system.damage ?? 1;

  // opcjonalnie margin jako bonus
  damage += Math.max(0, result.margin);

  return {
    ...result,
    damage
  };
}

}