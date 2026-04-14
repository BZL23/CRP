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
  super._onRender(context, options);

  const html = this.element;

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
html.querySelectorAll(".crp-weapon-delete").forEach(btn => {
  btn.addEventListener("click", async ev => {

    ev.stopPropagation(); // 👈 żeby nie triggerować kliknięcia equip

    const itemId = ev.currentTarget.dataset.itemId;
    const item = this.document.items.get(itemId);

    if (!item) return;

    // 👇 opcjonalne potwierdzenie
    const confirmed = await Dialog.confirm({
      title: "Usuń broń",
      content: `<p>Czy na pewno chcesz usunąć <b>${item.name}</b>?</p>`
    });

    if (!confirmed) return;

    await item.delete();

  });
});

  // ======================
  //  DRAG & DROP (FIX)
  // ======================
  const root = this.element;

  // 👇 KLUCZOWE — blokuje wielokrotne bindowanie
  if (root.dataset.dropBound) return;
  root.dataset.dropBound = "true";

  root.addEventListener("dragover", ev => ev.preventDefault());

  root.addEventListener("drop", async ev => {
    ev.preventDefault();

    // 👇 zabezpieczenie przed spamem
    if (this._dropping) return;
    this._dropping = true;

    try {
      console.log("DROP 🔥");

      const TextEditorImpl =
        foundry.applications?.ux?.TextEditor?.implementation ?? TextEditor;

      const data = TextEditorImpl.getDragEventData(ev);
      console.log(data);

      if (data.type !== "Item") return;

      const item = await fromUuid(data.uuid);
      if (!item) return;

      const [created] = await this.document.createEmbeddedDocuments("Item", [item.toObject()]);

      if (created.type === "weapon") {
        await created.update({ "system.equipped": true });
      }

      console.log("DODANO ITEM ✅");

    } finally {
      this._dropping = false;
    }
  });

}



}