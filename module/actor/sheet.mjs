const { DocumentSheetV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class CRPActorSheet extends HandlebarsApplicationMixin(DocumentSheetV2) {

  static DEFAULT_OPTIONS = {
    classes: ["crp", "sheet", "actor"],
    tag: "section",
    window: {
      title: "CRP Actor",
      resizable: true
    },
    position: {
      width: 950,
      height: 800
    },

    dragDrop: [{ dropSelector: ".crp-sheet" }]

  };

  static PARTS = {
    body: {
      template: "systems/crp/templates/actor/character-sheet.hbs"
    }
  };

  //  JEDYNE źródło danych dla template
  _preparePartContext(partId, context) {
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
  tokenImg
};

  }

_onRender(context, options) {
  const scrollTop = this.element?.scrollTop;

  super._onRender(context, options);

  const html = this.element;

  if (scrollTop !== undefined) {
    html.scrollTop = scrollTop;
  }

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
  //  INPUTY
  // ======================
  html.querySelectorAll("input[data-path]").forEach(input => {
    input.addEventListener("change", async ev => {
      const path = ev.currentTarget.dataset.path;
      let value = Number(ev.currentTarget.value);

      if (isNaN(value)) value = 0;

      if (path.startsWith("system.attributes")) {
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

//  USUWANIE BRONI

html.querySelectorAll(".crp-item-delete").forEach(btn => {
  btn.addEventListener("click", async ev => {

    ev.stopPropagation();

    const itemId = ev.currentTarget.dataset.itemId;
    const item = this.document.items.get(itemId);
    if (!item) return;

    const eq = this.document.system.equipment;

for (const slot of Object.keys(eq)) {
  if (eq[slot]?.id === itemId) {
    await this.document.update({
      [`system.equipment.${slot}`]: {
        id: null,
        name: null,
        img: null
      }
    });
  }
}

await item.delete();

  });
});

  // ======================
  //  DRAG & DROP (FIX)
  // ======================
const root = this.element;

// tylko DROP ma być jednokrotny
if (!root.dataset.dropBound) {
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

        await this.document.update({
          [`system.equipment.${slot}`]: {
            id: item.id,
            name: item.name,
            img: item.img
          }
        });

        return;
      }

      if (item.parent?.id === this.document.id) return;

      const [created] = await this.document.createEmbeddedDocuments("Item", [item.toObject()]);

      if (created.type === "weapon") {
        await created.update({ "system.equipped": true });
      }

    } finally {
      this._dropping = false;
    }
  });
}



html.querySelectorAll(".crp-item-row").forEach(el => {
  el.addEventListener("dragstart", ev => {

    const itemId = el.dataset.itemId;
    const item = this.document.items.get(itemId);
    if (!item) return;

    ev.dataTransfer.setData("text/plain", JSON.stringify({
      type: "Item",
      uuid: item.uuid
    }));

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

    if (!itemId) return;

    const item = this.document.items.get(itemId);
    if (!item) return;

    // target
    const targets = Array.from(game.user.targets);
    if (!targets.length) {
      ui.notifications.warn("Brak celu");
      return;
    }

    const targetActor = targets[0].actor;
    if (!targetActor) return;

const equipment = targetActor.system.equipment;

const isValidParryWeapon = (item) => {
  if (!item) return false;

  const skill = item.system.skill;

  // ❌ broń strzelecka nie może parować
  if (skill === "ranged") return false;

  return true;
};

const rightItem = equipment.rightHand?.id
  ? targetActor.items.get(equipment.rightHand.id)
  : null;

const leftItem = equipment.leftHand?.id
  ? targetActor.items.get(equipment.leftHand.id)
  : null;

const hasWeapon =
  isValidParryWeapon(rightItem) ||
  isValidParryWeapon(leftItem);

const msg = await ChatMessage.create({
content: `
  <div class="crp-defense-choice"
    data-message-id=""
    data-attacker="${this.document.uuid}"
    data-defender="${targetActor.uuid}"
    data-skill="${item.system.skill}">

    <p>Wybierz obronę:</p>

    <button data-defense="parry" ${!hasWeapon ? "disabled" : ""}>
      Parowanie
    </button>

    <button data-defense="dodge">Unik</button>
    <button data-defense="shield">Tarcza</button>
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

await this.document.update({
  [`system.equipment.${slot}`]: {
  id: null,
  name: null,
  img: null
}
});


  });
});

}



}