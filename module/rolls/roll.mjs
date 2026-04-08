// module/rolls/roll.mjs

export class CRPRoll {
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

        const penalty = actor.system.derived.woundPenalty ?? 0;
        const target = Math.max(2, attr.value + skill.value + penalty);

        // rzut 2k10
        const roll = await new Roll("2d10").roll();
        const dice = roll.dice?.[0]?.results?.map(r => r.result) ?? [];
        const total = roll.total;

        // poziom sukcesu
        const margin = target - total;

        // sukces / porażka
        let success = total <= target;

        // krytyki
        const isDouble = dice.length === 2 && dice[0] === dice[1];
        let critical = null;

        if (isDouble) {
            if (total === 2) {
                critical = "criticalSuccess";
                success = true;
            } else if (total === 20) {
                critical = "criticalFailure";
                success = false;
            }
        }

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

        let usedFate = false;

        if (allowFate && !result.success) {
            // na razie nic nie robimy
        }

        console.log("CRP Roll:", result);

        // WYŚLIJ DO CHATA
        const speaker = ChatMessage.getSpeaker({
            actor,
            token: actor.token ?? null
        });

        // opis skilla (na razie techniczny)
        const skillLabel = CONFIG.CRP.skills[skillKey] ?? skillKey;
        const attrLabel = CONFIG.CRP.attributes[attrKey] ?? attrKey;
        const label = `${skillLabel} (${attrLabel})`;

        // status
        let resultText;

        if (result.critical === "criticalSuccess") {
            resultText = "🔥 KRYTYCZNY SUKCES";
        } else if (result.critical === "criticalFailure") {
            resultText = "💀 KRYTYCZNA PORAŻKA";
        } else {
            resultText = result.success ? "SUKCES" : "PORAŻKA";
        }

        // symbole
        let symbols = "";

        if (result.eagles > 0) symbols += `🦅 ${result.eagles} `;
        if (result.shields > 0) symbols += `🛡️ ${result.shields}`;

        const marginText = result.margin >= 0 
        ? `+${result.margin}` 
        : result.margin;

        // HTML wiadomości
        const content = `
            <div class="crp-roll">
                <h3>${label}</h3>

                ${allowFate && !result.success ? `
                    <button class="crp-use-fate"
                    data-actor-uuid="${actor.uuid}"
                    data-attr="${attrKey}"
                    data-skill="${skillKey}"
                    data-message-id="{{MESSAGE_ID}}">
                        ✨ Użyj Doli
                    </button>
                ` : ""}

                ${usedFate ? `<p>✨ Użyto Doli</p>` : ""}
                <p><strong>Kostki:</strong> ${result.dice.length ? result.dice.join(", ") : "—"}</p>
                <p><strong>Wynik:</strong> ${result.total}</p>
                <p><strong>Cel:</strong> ${result.target}</p>
                ${penalty !== 0 ? `<p>⚠ Kara za rany: ${penalty}</p>` : ""}
                <p><strong>${resultText}</strong></p>
                <p><strong>Margin:</strong> ${marginText}</p>
                ${symbols ? `<p>${symbols}</p>` : ""}
            </div>
        `;

        // wyślij
        if (chat) {
            const message = await ChatMessage.create({
                speaker,
                content
            });

            const updatedContent = content.replace(
                "{{MESSAGE_ID}}",
                message.id
            );

            await message.update({
                content: updatedContent
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

        const marginTextA = rollA.margin >= 0 
        ? `+${rollA.margin}` 
        : rollA.margin;

        const marginTextB = rollB.margin >= 0 
        ? `+${rollB.margin}` 
        : rollB.margin;

        //  porównanie marginów
        let winner;


       

if (rollA.critical === "criticalSuccess") {
  winner = "A";
} else if (rollB.critical === "criticalSuccess") {
  winner = "B";
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
                    Margin: ${marginTextA}
                </p>
                <p>
                    <strong>${actorB.name}</strong><br>
                    ${skillLabelB} (${attrLabelB})<br>
                    🎲 ${rollB.dice.length ? rollB.dice.join(", ") : "—"} = ${rollB.total}<br>
                    Cel: ${rollB.target}<br>
                    ${penaltyB !== 0 ? `⚠ Kara za rany: ${penaltyB}<br>` : ""}
                    Margin: ${marginTextB}
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

    static renderRollHTML(actor, attrKey, skillKey, result, { usedFate = false } = {}) {

        const skillLabel = CONFIG.CRP.skills[skillKey] ?? skillKey;
        const attrLabel = CONFIG.CRP.attributes[attrKey] ?? attrKey;

        const label = `${skillLabel} (${attrLabel})`;
        const penalty = actor.system.derived.woundPenalty ?? 0;

        let resultText;

        if (result.critical === "criticalSuccess") {
            resultText = "🔥 KRYTYCZNY SUKCES";
        } else if (result.critical === "criticalFailure") {
            resultText = "💀 KRYTYCZNA PORAŻKA";
        } else {
            resultText = result.success ? "SUKCES" : "PORAŻKA";
        }

        const marginText = result.margin >= 0 ? `+${result.margin}` : result.margin;

        let symbols = "";
        if (result.eagles > 0) symbols += `🦅 ${result.eagles} `;
        if (result.shields > 0) symbols += `🛡️ ${result.shields}`;

        return `
            <div class="crp-roll">
            <h3>${label}</h3>
            ${usedFate ? `<p>✔ Dola użyta</p>` : ""}

            <p><strong>Kostki:</strong> ${result.dice.length ? result.dice.join(", ") : "—"}</p>
            <p><strong>Wynik:</strong> ${result.total}</p>
            <p><strong>Cel:</strong> ${result.target}</p>
            ${penalty !== 0 ? `<p>⚠ Kara za rany: ${penalty}</p>` : ""}
            <p><strong>${resultText}</strong></p>
            <p><strong>Margin:</strong> ${marginText}</p>

            ${symbols ? `<p>${symbols}</p>` : ""}
            </div>
        `;
    }

   static async fortitude(actor, { chat = true } = {}) {

  // jeśli już martwy → nic nie rób
  if (actor.system.state?.life === "dead") return null;

  const attr = actor.system.attributes.strength;

  if (!attr) {
    console.error("Brak atrybutu tężyzny");
    return null;
  }

  const penalty = actor.system.derived.woundPenalty ?? 0;
  const target = Math.max(2, attr.value + penalty);

  // rzut
  const roll = await new Roll("2d10").roll();
  const dice = roll.dice?.[0]?.results?.map(r => r.result) ?? [];
  const total = roll.total;

  // sukces bazowy
  let success = total <= target;

  // krytyki (spójne ze skill)
  const isDouble = dice.length === 2 && dice[0] === dice[1];
  let critical = null;

  if (isDouble) {
    if (total === 2) {
      success = true;
      critical = "criticalSuccess";
    } else if (total === 20) {
      success = false;
      critical = "criticalFailure";
    }
  }

  const margin = target - total;

  // tekst wyniku
  let resultText;

  if (critical === "criticalSuccess") {
    resultText = "🔥 CUD! PRZETRWAŁ";
  } else if (critical === "criticalFailure") {
    resultText = "💀 NATYCHMIASTOWA ŚMIERĆ";
  } else {
    resultText = success ? "PRZETRWAŁ" : "UMIERA";
  }

  const result = {
    dice,
    total,
    target,
    success,
    margin,
    critical
  };

  const speaker = ChatMessage.getSpeaker({
    actor,
    token: actor.token ?? null
  });

  const content = `
    <div class="crp-roll">
      <h3>💀 Test tężyzny</h3>

      <p><strong>Kostki:</strong> ${dice.length ? dice.join(", ") : "—"}</p>
      <p><strong>Wynik:</strong> ${total}</p>
      <p><strong>Cel:</strong> ${target}</p>

      ${penalty !== 0 ? `<p>⚠ Kara za rany: ${penalty}</p>` : ""}

      <p><strong>${resultText}</strong></p>
      <p>Margin: ${margin}</p>
    </div>
  `;

  if (chat) {
    await ChatMessage.create({
      speaker,
      content
    });
  }

  return result;
}

static async processTurn(actor) {

  const state = actor.system.state;

  // martwy → nic
  if (state.life === "dead") return;

  // nie krwawi → nic
  if (!state.bleeding) return;

  // test tężyzny
  const result = await this.fortitude(actor, { chat: true });

  if (!result) return;

  // =====================
  // PRZYTOMNY → NIEPRZYTOMNY
  // =====================
  if (state.life === "alive") {

    if (!result.success) {
      await actor.update({
        "system.state.life": "unconscious"
      });

      ui.notifications.warn(`${actor.name} traci przytomność!`);
    }

    return;
  }

  // =====================
  // NIEPRZYTOMNY → ŚMIERĆ
  // =====================
  if (state.life === "unconscious") {

    if (!result.success) {
      await actor.update({
       // system.state.life": "dead",
        "system.state.bleeding": false
      });

      ui.notifications.error(`${actor.name} umiera!`);
    }

    return;
  }
}

static async processTurn(actor) {

  const state = actor.system.state;

  // martwy → nic
  if (state.life === "dead") return;

  // nie krwawi → nic
  if (!state.bleeding) return;

  // rzut na tężyznę
  const result = await this.fortitude(actor, { chat: true });

  if (!result) return;

  // =====================
  // PRZYTOMNY → NIEPRZYTOMNY
  // =====================
  if (state.life === "alive") {

    if (!result.success) {
      await actor.update({
        "system.state.life": "unconscious"
      });

      ui.notifications.warn(`${actor.name} traci przytomność!`);
    }

    return;
  }

  // =====================
  // NIEPRZYTOMNY → ŚMIERĆ
  // =====================
  if (state.life === "unconscious") {

    if (!result.success) {
      await actor.update({
        // "system.state.life": "dead",
        "system.state.bleeding": false
      });

      ui.notifications.error(`${actor.name} umiera!`);
    }

    return;
  }
}

}