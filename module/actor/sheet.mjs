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
    }
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

    //  ROLL
html.querySelectorAll(".crp-skill").forEach(el => {
  el.addEventListener("click", ev => {

    // NIE rzucaj jeśli kliknięto input
    if (ev.target.closest("input")) return;

    const attr = el.dataset.attr;
    const skill = el.dataset.skill;

    this.document.rollSkill(attr, skill);
  });
});


    //  INPUTY
    html.querySelectorAll("input[data-path]").forEach(input => {
      input.addEventListener("change", async ev => {
        const path = ev.currentTarget.dataset.path;
        let value = Number(ev.currentTarget.value);

if (isNaN(value)) value = 0;

// clamp
value = Math.max(0, Math.min(10, value));

        if (isNaN(value)) value = 0;

        await this.document.update({
          [path]: value
        });
      });
    });

    //  NAZWA
    const nameEl = html.querySelector("[data-edit='name']");
    if (nameEl) {
      nameEl.addEventListener("blur", async ev => {
        await this.document.update({
          name: ev.currentTarget.innerText
        });
      });
    }

    //  PORTRET
    html.querySelectorAll("[data-edit='img']").forEach(img => {
      img.addEventListener("click", () => {
        new foundry.applications.apps.FilePicker({
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

    // TOKEN (zmiana obrazka)
html.querySelectorAll("[data-edit='token']").forEach(img => {
  img.addEventListener("click", () => {
    new foundry.applications.apps.FilePicker({
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


  }
}