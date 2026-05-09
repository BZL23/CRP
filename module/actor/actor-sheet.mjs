import { CRPRoll } from "../rolls/roll.mjs";

const { DocumentSheetV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class CRPActorSheet extends HandlebarsApplicationMixin(DocumentSheetV2) {

  activeTab = "sheet";

  get isEditable() {
  return true;
}

  static DEFAULT_OPTIONS = {
      ...super.DEFAULT_OPTIONS,
    editable: true,

    classes: ["crp", "sheet", "actor"],
    tag: "section",
    editable: true,
    window: {
      title: "CRP Actor",
      resizable: true
    },
    position: {
      width: 1000,
      height: 800
    },

    dragDrop: [{ dropSelector: ".crp-sheet" }]

  };

  static PARTS = {
    body: {
      template: "systems/crp/templates/actor/character-sheet.hbs"
    }
  };

  _getRootElement() {
    return this.element instanceof HTMLElement
      ? this.element
      : this.element?.[0];
  }

  _getScrollContainers(root = this._getRootElement()) {
    const containers = [
      root?.querySelector(".window-content"),
      root?.querySelector(".crp-sheet"),
      root
    ].filter(el => el && typeof el.scrollTop === "number");

    return [...new Set(containers)];
  }

  _getScrollTop() {
    const containers = this._getScrollContainers();
    const scrolled = containers.find(el => el.scrollTop > 0);

    return scrolled?.scrollTop ?? containers[0]?.scrollTop ?? 0;
  }

  _rememberScrollPosition() {
    this._pendingScrollTop = this._getScrollTop();
  }

  _restoreScrollPosition(scrollTop = this._pendingScrollTop) {
    if (scrollTop === undefined) return;

    const restore = () => {
      for (const container of this._getScrollContainers()) {
        container.scrollTop = scrollTop;
      }
    };

    restore();
    requestAnimationFrame(restore);
    setTimeout(restore, 0);
  }

  async _openBioEditor() {
    const current = this.document.system.bio?.description ?? "";
    const value = foundry.utils.escapeHTML(current);

    const content = `
      <div class="crp-bio-dialog">
        <prose-mirror
          name="bio"
          value="${value}">
        </prose-mirror>
      </div>
    `;

    const result = await foundry.applications.api.DialogV2.wait({
      window: {
        title: `Biografia: ${this.document.name}`,
        icon: "fa-solid fa-feather"
      },
      position: {
        width: 760
      },
      content,
      buttons: [
        {
          action: "save",
          label: "Zapisz",
          icon: "fa-solid fa-save",
          default: true,
          callback: (_event, _button, dialog) =>
            dialog.element.querySelector("prose-mirror[name='bio']")?.value ?? ""
        },
        {
          action: "cancel",
          label: "Anuluj",
          icon: "fa-solid fa-times",
          callback: () => null
        }
      ],
      render: (_event, dialog) => {
        dialog.element.querySelector("prose-mirror[name='bio']")?.focus();
      }
    });

    if (result === null) return;

    await this.document.update({
      "system.bio.description": result
    });

    this.render(false);
  }

  //  JEDYNE źródło danych dla template
async _preparePartContext(partId, context) {
    if (partId !== "body") return context;

    const system = this.document.system;
    const config = CONFIG.CRP;

    const tokenImg =
  this.document.prototypeToken?.texture?.src ||
  this.document.img;

    const attributesList = [];

    for (const key of Object.keys(config.attributes)) {
      const attrData = system.attributes?.[key];

      attributesList.push({
        key,
        label: String(config.attributes[key]), // 👈 ważne
        value: attrData?.value ?? 0,
        skills: Object.keys(attrData?.skills ?? {}).map(sk => {
  const skillValue = attrData.skills[sk].value ?? 0;
  const attrValue = attrData?.value ?? 0;

  
  return {
    key: sk,
    label: String(config.skills[sk]),
    value: skillValue,
    total: skillValue + attrValue
  };
})
      });
    }

    const hp = system.derived.health;

hp.percent = hp.max > 0
  ? Math.floor((hp.value / hp.max) * 100)
  : 0;

return {
  ...context,
  system,
  config,
  attributesList,
  initiative: {
    weaponModifierText: system.derived.initiativeWeaponModifier >= 0
      ? `+${system.derived.initiativeWeaponModifier}`
      : `${system.derived.initiativeWeaponModifier}`,
    armorModifierText: system.derived.initiativeArmorModifier >= 0
      ? `+${system.derived.initiativeArmorModifier}`
      : `${system.derived.initiativeArmorModifier}`
  },
  tokenImg,
  activeTab: this.activeTab,
};

  }

_onRender(context, options) {
  const scrollTop = this._pendingScrollTop ?? this._getScrollTop();

  super._onRender(context, options);

const html = this._getRootElement();

if (!html) {
  console.error("CRP: HTML root NOT FOUND");
  return;
}

this._restoreScrollPosition(scrollTop);
this._pendingScrollTop = undefined;

  // ======================
  //  ROLL
  // ======================
  html.querySelectorAll(".crp-skill").forEach(el => {
    el.addEventListener("click", ev => {

      if (ev.target.closest("input")) return;

      const attr = el.dataset.attr;
      const skill = el.dataset.skill;

      this.document.rollSkill(attr, skill);
    });
  });

  // ======================
//  ROLL WILLPOWER
// ======================
html.querySelectorAll(".crp-roll-willpower").forEach(btn => {
  btn.addEventListener("click", ev => {

    ev.stopPropagation();

    CRPRoll.willpower(this.document);

  });
});

// ======================
//  ROLL INITIATIVE
// ======================
html.querySelectorAll(".crp-roll-initiative").forEach(btn => {
  btn.addEventListener("click", ev => {

    ev.stopPropagation();

    CRPRoll.initiative(this.document);

  });
});

  // ======================
  //  INPUTY
  // ======================
  html.querySelectorAll("input[data-path]").forEach(input => {
    input.addEventListener("change", async ev => {
      const path = ev.currentTarget.dataset.path;
      const isCheckbox = ev.currentTarget.type === "checkbox";
      let value = isCheckbox
        ? ev.currentTarget.checked
        : Number(ev.currentTarget.value);

      if (!isCheckbox && isNaN(value)) value = 0;

      if (isCheckbox) {
        // checkboxy zapisują stan logiczny bez ograniczeń liczbowych
      } else if (path.startsWith("system.attributes")) {
        value = Math.max(0, Math.min(10, value));
      } else {
        value = Math.max(0, value);
      }

      await this.document.update({
        [path]: value
      });
    });
  });


  // ======================
  //  NAZWA
  // ======================
  const nameEl = html.querySelector("[data-edit='name']");
  if (nameEl) {
    nameEl.addEventListener("blur", async ev => {
      await this.document.update({
        name: ev.currentTarget.innerText
      });
    });
  }

  // ======================
  //  PORTRET
  // ======================
  html.querySelectorAll("[data-edit='img']").forEach(img => {
    img.addEventListener("click", () => {
      new foundry.applications.apps.FilePicker.implementation({
        type: "image",
        current: this.document.img,
        callback: async (path) => {

          const currentToken = this.document.prototypeToken?.texture?.src;
          const currentPortrait = this.document.img;

          const isDefaultToken =
            !currentToken || currentToken === currentPortrait;

          await this.document.update({
            img: path,
            ...(isDefaultToken && {
              "prototypeToken.texture.src": path
            })
          });

        }
      }).render(true);
    });
  });

  // ======================
  //  TOKEN
  // ======================
  html.querySelectorAll("[data-edit='token']").forEach(img => {
    img.addEventListener("click", () => {
      new foundry.applications.apps.FilePicker.implementation({
        type: "image",
        current: this.document.prototypeToken?.texture?.src || this.document.img,
        callback: async (path) => {

          await this.document.update({
            "prototypeToken.texture.src": path
          });

        }
      }).render(true);
    });
  });

  // ======================
  //  EQUIP
  // ======================
  html.querySelectorAll(".crp-equip").forEach(el => {
    el.addEventListener("change", async ev => {

      const item = this.document.items.get(ev.target.dataset.itemId);
      if (!item) return;

      await item.update({
        "system.equipped": ev.target.checked
      });

    });
  });

//  USUWANIE PRZEDMIOTÓW
if (!html.dataset.deleteBound) {
  html.dataset.deleteBound = "true";

  html.addEventListener("click", async ev => {

  const btn = ev.target.closest(".crp-item-delete");

  if (!btn) return;

  ev.preventDefault();
  ev.stopPropagation();

  const itemId = btn.dataset.itemId;

  if (!itemId) return;

  const item = this.document.items.get(itemId);

  const eq = this.document.system.equipment;
  const updates = {};
  const slots = ["rightHand", "leftHand", "armor"];

  for (const slot of slots) {
    if (eq[slot]?.id === itemId) {
      updates[`system.equipment.${slot}`] = {
        id: null,
        name: null,
        img: null
      };
    }
  }

  this._rememberScrollPosition();
  await this.document.deleteEmbeddedDocuments("Item", [itemId]);

  if (Object.keys(updates).length) {
    this._rememberScrollPosition();
    await this.document.update(updates);
  }

});
}

  // ======================
  //  DRAG & DROP (FIX)
  // ======================
const root = this.element[0] ?? this.element;

// tylko DROP ma być jednokrotny
if (!root.dataset?.dropBound) {
  root.dataset.dropBound = "true";

  root.addEventListener("dragover", ev => ev.preventDefault());

  root.addEventListener("drop", async ev => {
    ev.preventDefault();

    if (this._dropping) return;
    this._dropping = true;

    try {
      const TextEditorImpl =
        foundry.applications?.ux?.TextEditor?.implementation ?? TextEditor;

      let data = TextEditorImpl.getDragEventData(ev);

      if (!data || !data.type) {
        try {
          data = JSON.parse(ev.dataTransfer.getData("text/plain"));
        } catch {
          return;
        }
      }

      if (data.type !== "Item") return;

      const item = await fromUuid(data.uuid);
      if (!item) return;

      let slotEl = ev.target;

      while (slotEl && !slotEl.classList?.contains("crp-eq-slot")) {
        slotEl = slotEl.parentElement;
      }

if (slotEl) {
  const slot = slotEl.dataset.slot;

  if (item.parent?.id !== this.document.id) {
    ui.notifications.warn("Możesz używać tylko przedmiotów z ekwipunku!");
    return;
  }

  // 🔥 WALIDACJA SLOTU
  const isHand = slot === "rightHand" || slot === "leftHand";

  const valid =
    (slot === "armor" && item.type === "armor") ||
    (isHand && (item.type === "weapon" || item.type === "shield"));

  if (!valid) {
    ui.notifications.warn("Nie można umieścić tego przedmiotu w tym slocie");
    return;
  }

  const eq = this.document.system.equipment;

  const updates = {};
  const isTwoHandedWeapon = (item) =>
    item?.type === "weapon" && Number(item.system.hands) === 2;

  // broń dwuręczna zawsze zajmuje obie ręce
  if (isHand && isTwoHandedWeapon(item)) {
    const slotData = {
      id: item.id,
      name: item.name,
      img: item.img
    };

    updates["system.equipment.rightHand"] = slotData;
    updates["system.equipment.leftHand"] = slotData;

    this._rememberScrollPosition();
    await this.document.update(updates);

    return;
  }

  // 🔥 USUŃ Z DRUGIEGO SLOTU RĘKI
  if (isHand) {
    const otherSlot = slot === "rightHand" ? "leftHand" : "rightHand";
    const otherItemId = eq[otherSlot]?.id;
    const otherItem = otherItemId ? this.document.items.get(otherItemId) : null;

    if (otherItemId === item.id || isTwoHandedWeapon(otherItem)) {
      updates[`system.equipment.${otherSlot}`] = {
        id: null,
        name: null,
        img: null
      };
    }
  }

  // 🔥 USTAW W NOWYM SLOCIE
  updates[`system.equipment.${slot}`] = {
    id: item.id,
    name: item.name,
    img: item.img
  };

  this._rememberScrollPosition();
  await this.document.update(updates);

  return;
}

      if (item.parent?.id === this.document.id) return;

      this._rememberScrollPosition();
      const [created] = await this.document.createEmbeddedDocuments("Item", [item.toObject()]);

      if (created.type === "weapon") {
        this._rememberScrollPosition();
        await created.update({ "system.equipped": true });
      }

    } finally {
      this._dropping = false;
    }
  });
}



html.querySelectorAll(".crp-item-row").forEach(el => {

  // ======================
  // DRAG
  // ======================
  el.addEventListener("dragstart", ev => {

    const itemId = el.dataset.itemId;
    const item = this.document.items.get(itemId);
    if (!item) return;

    ev.dataTransfer.setData("text/plain", JSON.stringify({
      type: "Item",
      uuid: item.uuid
    }));

  });

  // ======================
  // CLICK → OTWÓRZ ITEM
  // ======================
  el.addEventListener("click", ev => {

    // ❗ NIE otwieraj przy kliknięciu delete
    if (ev.target.closest(".crp-item-delete")) return;

    const itemId = el.dataset.itemId;
    if (!itemId) return;

    const item = this.document.items.get(itemId);
    if (!item) return;

    item.sheet.render(true);
  });

});

html.querySelectorAll(".crp-eq-slot").forEach(el => {
  el.addEventListener("click", async ev => {

    // ❗ ignoruj klik w delete
    if (ev.target.closest(".crp-slot-clear")) return;

    // ❗ znajdź slot po DOM (nie po el)
    let slotEl = ev.target;
    while (slotEl && !slotEl.classList?.contains("crp-eq-slot")) {
      slotEl = slotEl.parentElement;
    }

    if (!slotEl) return;

    const slot = slotEl.dataset.slot;

    // tylko ręce
    if (slot !== "rightHand" && slot !== "leftHand") return;

    const eq = this.document.system.equipment[slot];
const itemId = typeof eq === "string" ? eq : eq?.id;
    const item = itemId ? this.document.items.get(itemId) : null;

    if (item && item.type !== "weapon") {
      ui.notifications.warn("Tarcza nie sluzy do ataku.");
      return;
    }

    const isUnarmedAttack = !item;
    const attackSkill = isUnarmedAttack ? "brawl" : item.system?.skill;
    const itemType = isUnarmedAttack ? "unarmed" : item.type;
    const itemRange = isUnarmedAttack ? "melee" : item.system?.range;
    const attackerMounted = !!this.document.system.equipment.mounted;
    const getSlotAttackModifier = () => {
      if (isUnarmedAttack) return -3;
      if (item.type !== "weapon") return 0;
      if (itemRange === "ranged" || attackSkill === "ranged") return 2;
      if (attackSkill === "lightWeapons") return -1;
      if (Number(item.system?.hands) === 2 || attackSkill === "twoHanded") return 3;
      return 1;
    };
    const attackModifier = getSlotAttackModifier();

    // target
    const targets = Array.from(game.user.targets);
    if (!targets.length) {
      ui.notifications.warn("Brak celu");
      return;
    }

    const targetActor = targets[0].actor;
    if (!targetActor) return;

const equipment = targetActor.system.equipment;
const defenderMounted = !!equipment.mounted;

const isValidParryWeapon = (item) => {
  if (!item) return false;

  if (item.type !== "weapon") return false;

  // KLUCZOWE
  if (item.system.range === "ranged") return false;

  return true;
};

const rightItem = equipment.rightHand?.id
  ? targetActor.items.get(equipment.rightHand.id)
  : null;

const leftItem = equipment.leftHand?.id
  ? targetActor.items.get(equipment.leftHand.id)
  : null;

const isRangedAttack = itemRange === "ranged";

const hasParryWeapon =
  isValidParryWeapon(rightItem) ||
  isValidParryWeapon(leftItem);

const hasEmptyHand =
  !equipment.rightHand?.id ||
  !equipment.leftHand?.id;

const canParry = hasParryWeapon || (isUnarmedAttack && hasEmptyHand);

  const isShield = (item) => item?.type === "shield";

const hasShield =
  isShield(rightItem) ||
  isShield(leftItem);

const canDodge = !defenderMounted;
const mountedAdvantage = attackerMounted && !defenderMounted ? 2 : 0;

const msg = await ChatMessage.create({
content: `
  <div class="crp-defense-choice"
    data-message-id=""
    data-attacker="${this.document.uuid}"
    data-defender="${targetActor.uuid}"
    data-skill="${attackSkill}"
data-item-type="${itemType}"
data-range="${itemRange}"
data-attack-modifier="${attackModifier + mountedAdvantage}"
data-attacker-mounted="${attackerMounted ? "true" : "false"}"
data-defender-mounted="${defenderMounted ? "true" : "false"}">

    <p>Wybierz obronę:</p>

<button 
  data-defense="parry"
  ${!canParry ? "disabled" : ""}
  data-blocked-by-range="${isRangedAttack ? "true" : "false"}">
  Parowanie
</button>

<button data-defense="dodge" ${!canDodge ? "disabled" : ""}>Unik</button>

<button data-defense="shield" ${!hasShield ? "disabled" : ""}>
  Tarcza
</button>
  </div>
`
});

await msg.update({
  content: msg.content.replace(
    'data-message-id=""',
    `data-message-id="${msg.id}"`
  )
});

  });
});

html.querySelectorAll(".crp-slot-clear").forEach(btn => {
  btn.addEventListener("click", async ev => {

    ev.stopPropagation();

    const slot = ev.currentTarget.dataset.slot;
    const eq = this.document.system.equipment;
    const itemId = eq[slot]?.id;
    const item = itemId ? this.document.items.get(itemId) : null;
    const updates = {};

    const clearSlot = (slot) => {
      updates[`system.equipment.${slot}`] = {
        id: null,
        name: null,
        img: null
      };
    };

    if (item?.type === "weapon" && Number(item.system.hands) === 2) {
      clearSlot("rightHand");
      clearSlot("leftHand");
    } else {
      clearSlot(slot);
    }

this._rememberScrollPosition();
await this.document.update(updates);


  });
});

// ======================
// TOKEN CONFIG BUTTON
// ======================
const header = this.element.querySelector(".window-header");

if (header && !header.querySelector(".crp-token-config")) {

  const btn = document.createElement("a");
  btn.classList.add("crp-token-config");
  //btn.innerHTML = "👤";
  // btn.innerHTML = `<img src="systems/crp/assets/token.svg" width="16" height="16">`;

btn.innerHTML = `
<svg class="crp-token-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dcdcdc" stroke-width="2">
  <circle cx="12" cy="8" r="4"/>
  <path d="M4 20c0-4 4-6 8-6s8 2 8 6"/>
</svg>
`;

  btn.title = "Ustawienia tokena";

  btn.addEventListener("click", async (ev) => {
    ev.preventDefault();
    ev.stopPropagation();

const tokenDoc = await this.document.getTokenDocument();

new foundry.applications.sheets.TokenConfig({
  document: tokenDoc
}).render(true);

  });

  header.appendChild(btn);

// 🔥 PRZESUŃ O 2 POZYCJE W LEWO (PEWNE)
const prev1 = btn.previousElementSibling;
const prev2 = prev1?.previousElementSibling;

if (prev2) {
  header.insertBefore(btn, prev2);
}
}

// ======================
// TABS
// ======================
html.querySelectorAll(".crp-tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    this.activeTab = btn.dataset.tab;
    this.render(false);
  });
});


// ======================
// BIO EDITOR
// ======================
html.querySelector(".crp-bio-edit")?.addEventListener("click", ev => {
  ev.preventDefault();
  ev.stopPropagation();

  this._openBioEditor();
});


}


}
