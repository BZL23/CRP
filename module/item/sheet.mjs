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
      template: "systems/crp/templates/item/item-sheet.hbs"
    }
  };

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