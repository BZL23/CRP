const { DocumentSheetV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class CRPItemSheet extends HandlebarsApplicationMixin(DocumentSheetV2) {

  static DEFAULT_OPTIONS = {
    classes: ["crp", "sheet", "item"],
    tag: "section",
    window: {
      title: "CRP Item",
      resizable: true
    },
    position: {
      width: 400,
      height: "auto"
    }
  };


static PARTS = {
  body: {
    template: "systems/crp/templates/item/weapon-sheet.hbs"
  }
};

_getPartConfig(partId) {
  const config = super._getPartConfig(partId);

  if (partId === "body") {

    if (this.document.type === "armor") {
      config.template = "systems/crp/templates/item/armor-sheet.hbs";
    }

    if (this.document.type === "weapon") {
      config.template = "systems/crp/templates/item/weapon-sheet.hbs";
    }
  }

  return config;
}


  _preparePartContext(partId, context) {
    if (partId !== "body") return context;

    return {
      ...context,
      system: this.document.system,
      item: this.document,
      config: CONFIG.CRP
    };
  }

  _onRender(context, options) {
    super._onRender(context, options);

    const html = this.element;

    // INPUTY
    html.querySelectorAll("input[data-path], textarea[data-path]").forEach(input => {
      input.addEventListener("change", async ev => {

        const path = ev.currentTarget.dataset.path;
        let value = ev.currentTarget.value;

        if (ev.currentTarget.type === "number") {
          value = Number(value);
          if (isNaN(value)) value = 0;
        }

        await this.document.update({
          [path]: value
        });

      });
    });

// ======================
//  NAZWA ITEMU
// ======================
const nameEl = html.querySelector("[data-edit='name']");
if (nameEl) {
  nameEl.addEventListener("blur", async ev => {
    await this.document.update({
      name: ev.currentTarget.innerText.trim()
    });
  });
}

html.querySelectorAll("[data-edit='img']").forEach(img => {
  img.addEventListener("click", () => {

    new foundry.applications.apps.FilePicker.implementation({
      type: "image",
      current: this.document.img,
      callback: async (path) => {

        await this.document.update({
          img: path
        });

      }
    }).render(true);

  });
});

// 🗡️ KLIK BRONI = EQUIP
html.querySelectorAll(".crp-weapon-row").forEach(row => {

  row.addEventListener("click", async ev => {

    const itemId = row.dataset.itemId;
    const item = this.document.items.get(itemId);

    if (!item) return;

    // 🔥 zdejmij inne bronie
    for (const i of this.document.items) {
      if (i.type === "weapon" && i.id !== item.id && i.system.equipped) {
        await i.update({ "system.equipped": false });
      }
    }

    // toggle tej
    await item.update({
      "system.equipped": !item.system.equipped
    });

  });

});

  }

  
}

export class CRPWeaponSheet extends CRPItemSheet {
  static PARTS = {
    body: {
      template: "systems/crp/templates/item/weapon-sheet.hbs"
    }
  };
}

export class CRPArmorSheet extends CRPItemSheet {
  static PARTS = {
    body: {
      template: "systems/crp/templates/item/armor-sheet.hbs"
    }
  };
}