import { CRPRoll } from "../rolls/roll.mjs";

// module/actor/actor.mjs

export class CRPActor extends Actor {
  prepareDerivedData() {

    super.prepareDerivedData();

    const system = this.system;
    const attr = system.attributes;
    const derived = system.derived;

    // Inicjatywa
    derived.initiative =
      attr.agility.value +
      attr.perception.value;

    // Zdrowie
    const maxHealth =
      attr.strength.value +
      attr.character.value;

    derived.health.max = maxHealth;

    // clamp
    if (derived.health.value > maxHealth) {
      derived.health.value = maxHealth;
    }

    // Siła woli
    derived.willpower =
      attr.character.value +
      attr.reason.value;

    // PUNKTY MANEWRU
    const combatSkills = [
      attr.strength.skills.twoHanded.value,
      attr.strength.skills.brawl.value,
      attr.agility.skills.oneHanded.value,
      attr.agility.skills.lightWeapons.value,
      attr.agility.skills.shield.value,
      attr.perception.skills.ranged.value
    ];

    const bestCombatSkill = Math.max(...combatSkills);

    derived.maneuver =
      bestCombatSkill +
      attr.character.skills.charisma.value;

    const hp = derived.health.value;
const max = derived.health.max;

    let penalty = 0;

    // progi
    if (hp <= 0) {
      penalty = -2;
    } else if (hp <= Math.floor(max / 2)) {
      penalty = -1;
    }

    system.derived.woundPenalty = penalty;

    let woundState = "healthy";

    if (hp <= 0) {
      woundState = "critical";
    } else if (hp <= Math.floor(max / 2)) {
      woundState = "wounded";
    }

    system.derived.woundState = woundState;
  
  }

  async rollSkill(attrKey, skillKey) {
  return await CRPRoll.skill(this, attrKey, skillKey);

  
}

async opposedTest(targetActor, attrA, skillA, attrB, skillB) {
  return await CRPRoll.opposed(
    this, attrA, skillA,
    targetActor, attrB, skillB
  );
}

async spendFate(amount = 1) {

  const current = this.system.resources.fate.value;

  if (current < amount) {
    ui.notifications.warn("Brak punktów Doli!");
    return false;
  }

  await this.update({
    "system.resources.fate.value": current - amount
  });

  return true;
}

async applyWoundsState() {
  const hp = this.system.derived.health.value;

  const update = {};

  if (hp <= 0 && !this.system.state.bleeding) {
    update["system.state.bleeding"] = true;
  }

  if (hp > 0 && this.system.state.bleeding) {
    update["system.state.bleeding"] = false;
  }

  if (Object.keys(update).length) {
    await this.update(update);
  }
}

async clearWoundsState() {
  await this.update({
    "system.state.bleeding": false,
    "system.state.unconscious": false,
    "system.state.life": "alive"
  });
}

async applyDamage(amount) {

  if (amount <= 0) return;

  const hp = this.system.derived.health.value;
  const max = this.system.derived.health.max;

  const currentHp = Number(hp) || 0;
  const newHp = Math.max(-max, currentHp - amount);

  await this.update({
    "system.derived.health.value": newHp
  });

  await this.applyWoundsState();
}

}

