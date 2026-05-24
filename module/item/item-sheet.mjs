import {
  formatMoney,
  obolsToMoney,
  normalizeMoney
} from "../currency.mjs";

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
      width: 450,
      height: "auto"
    }
  };

static PARTS = {
  body: {
    template: "systems/crp/templates/item/item-sheet.hbs"
  }
};



static getDefaultOptions() {
  const options = super.getDefaultOptions();
  return options;
}

_getRootElement() {
  return this.element instanceof HTMLElement
    ? this.element
    : this.element?.[0];
}

_getScrollContainers(root = this._getRootElement()) {
  const containers = [
    root?.closest?.(".window-content"),
    root?.querySelector(".window-content"),
    root?.querySelector(".crp-item"),
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

_preparePartContext(partId, context) {
  if (partId !== "body") return context;

  const system = this.document.system;

  const itemWeights = CONFIG.CRP.itemWeights ?? {};

  const weight = Object.hasOwn(itemWeights, system.weight)
    ? system.weight
    : "Ś";

  return {
    ...context,
    system,
    item: this.document,
    config: CONFIG.CRP,
    itemWeight: weight,

    formattedPrice: formatMoney(
      obolsToMoney(system.price.total)
    )

  };
}


  _onRender(context, options) {
    const scrollTop = this._pendingScrollTop;

    super._onRender(context, options);

    const html = this._getRootElement();
    if (!html) return;

    this._restoreScrollPosition(scrollTop);
    this._pendingScrollTop = undefined;

html.querySelectorAll("input[data-path], textarea[data-path], select[data-path]").forEach(input => {
  input.addEventListener("change", async ev => {

    const path = ev.currentTarget.dataset.path;
    let value = ev.currentTarget.value;

    if (ev.currentTarget.type === "number") {
      value = Number(value);
      if (isNaN(value)) value = 0;
    }

    // SPECJALNIE DLA NAME
    if (path === "name") {
      this._rememberScrollPosition();
      await this.document.update({ name: value });
    } else {
if (path.startsWith("system.price")) {
  const key = path.replace("system.price.", "");
  const price = foundry.utils.deepClone(this.document.system.price);
  price[key] = value;
  const normalized = normalizeMoney(price);

  this._rememberScrollPosition();
  await this.document.update({
    "system.price": normalized
  });

  return;
}

this._rememberScrollPosition();
await this.document.update({
  [path]: value
});
    }

  });
});

html.querySelectorAll("[data-edit='name']").forEach(nameEl => {
  nameEl.addEventListener("keydown", ev => {
    if (ev.key !== "Enter") return;

    ev.preventDefault();
    ev.currentTarget.blur();
  });

  nameEl.addEventListener("blur", async ev => {
    const name = ev.currentTarget.innerText.trim();
    if (!name || name === this.document.name) return;

    this._rememberScrollPosition();
    await this.document.update({ name });
  });
});

html.querySelectorAll("[data-edit='img']").forEach(img => {
  img.addEventListener("click", () => {

    new foundry.applications.apps.FilePicker.implementation({
      type: "image",
      current: this.document.img,
      callback: async (path) => {

        this._rememberScrollPosition();
        await this.document.update({
          img: path
        });

      }
    }).render(true);

  });
});

// KLIK BRONI = EQUIP
html.querySelectorAll(".crp-weapon-row").forEach(row => {

  row.addEventListener("click", async ev => {

    const itemId = row.dataset.itemId;
    const item = this.document.items.get(itemId);

    if (!item) return;

    // zdejmij inne bronie
    for (const i of this.document.items) {
      if (i.type === "weapon" && i.id !== item.id && i.system.equipped) {
        this._rememberScrollPosition();
        await i.update({ "system.equipped": false });
      }
    }

    // toggle tej
    this._rememberScrollPosition();
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

export class CRPShieldSheet extends CRPItemSheet {
  static PARTS = {
    body: {
      template: "systems/crp/templates/item/shield-sheet.hbs"
    }
  };
}

export class CRPStuffSheet extends CRPItemSheet {
  static PARTS = {
    body: {
      template: "systems/crp/templates/item/stuff-sheet.hbs"
    }
  };
}
