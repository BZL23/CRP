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
      width: 800,
      height: 800
    },
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

const attackWeapon = this.document.items.get(system.attack?.weaponId);

return {
  ...context,
  system,
  config,
  attributesList,
  tokenImg,
  attackWeapon
};

  }

  _onRender(context, options) {
    super._onRender(context, options);
    const TextEditorImpl =
  foundry.applications?.ux?.TextEditor?.implementation ?? TextEditor;

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
html.querySelectorAll("input[data-path], textarea[data-path]").forEach(input => {

  input.addEventListener("input", ev => {

    const path = ev.currentTarget.dataset.path;

    let value = ev.currentTarget.value;

    if (ev.currentTarget.type === "number") {
      value = Number(value);
      if (isNaN(value)) value = 0;

      if (path.startsWith("system.attributes")) {
        value = Math.max(0, Math.min(10, value));
      } else {
        value = Math.max(0, value);
      }
    }

if (input._updateTimeout) {
  clearTimeout(input._updateTimeout);
}

    input._updateTimeout = setTimeout(async () => {
      await this.document.update({
        [path]: value
      });
    }, 200);

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

    html.querySelectorAll(".crp-attack-slot").forEach(slot => {

        //  hover efekt
slot.addEventListener("dragenter", () => {
  slot.classList.add("dragover");
});

slot.addEventListener("dragleave", ev => {
  if (!slot.contains(ev.relatedTarget)) {
    slot.classList.remove("dragover");
  }
});


  slot.addEventListener("dragover", ev => {
    ev.preventDefault();
  });

  slot.addEventListener("drop", async ev => {
    ev.preventDefault();
    ev.stopPropagation();

    slot.classList.remove("dragover");

    const data = TextEditorImpl.getDragEventData(ev);

    if (data.type !== "Item") return;

    const item = await fromUuid(data.uuid);
    if (!item || item.type !== "weapon") {
      ui.notifications.warn("Tu możesz wrzucić tylko broń");
      return;
    }

    // 👇 musi być item aktora
    const actorItem =
  this.document.items.get(item.id) ??
  this.document.items.find(i => i.uuid === item.uuid);
    if (!actorItem) {
      ui.notifications.warn("Najpierw dodaj broń do ekwipunku");
      return;
    }

    console.log("DROP DATA", data);
console.log("ITEM", item);
console.log("ITEM ID", item.id);
console.log("ACTOR ITEMS", this.document.items);

    await this.document.update({
      "system.attack.weaponId": actorItem.id
    });

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

        ev.stopPropagation(); //  żeby nie triggerować kliknięcia equip

        const itemId = ev.currentTarget.dataset.itemId;
        const item = this.document.items.get(itemId);

        if (!item) return;

        // 👇 opcjonalne potwierdzenie

        const DialogImpl =
  foundry.applications?.api?.DialogV2 ?? Dialog;

const confirmed = await DialogImpl.confirm({
  window: { title: "Usuń broń" },
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

// 🔥 bind tylko raz
if (!this._dropBound) {
  this._dropBound = true;

  root.addEventListener("dragover", ev => ev.preventDefault());

  root.addEventListener("drop", async ev => {

    if (ev.target.closest(".crp-attack-slot")) return;

    ev.preventDefault();

    const data = TextEditorImpl.getDragEventData(ev);

    if (data.type !== "Item") return;

    const item = await fromUuid(data.uuid);
    if (!item) return;

    const [created] = await this.document.createEmbeddedDocuments("Item", [item.toObject()]);

    if (created.type === "weapon") {
      await created.update({ "system.equipped": true });
    }

  });
}


html.querySelectorAll(".crp-weapon-row").forEach(row => {

  if (row.dataset.dragBound) return;
  row.dataset.dragBound = "true";

  row.addEventListener("dragstart", ev => {

    const itemId = row.dataset.itemId;
    const item = this.document.items.get(itemId);
    if (!item) return;

    ev.dataTransfer.setData("text/plain", JSON.stringify({
      type: "Item",
      uuid: item.uuid
    }));

  });

});


html.querySelectorAll(".crp-attack-card").forEach(card => {

  if (card.dataset.clickBound) return;
  card.dataset.clickBound = "true";

  card.addEventListener("click", async ev => {

    const itemId = card.dataset.itemId;
    const item = this.document.items.get(itemId);
    if (!item) return;

    const skill = item.system.skill;
    const attr = this.document._mapSkillToAttribute?.(skill);

    if (!attr) {
      ui.notifications.error("Brak mapowania skilla");
      return;
    }

    await this.document.rollSkill(attr, skill);

  });

});

    html.querySelectorAll(".crp-attack-remove").forEach(btn => {

      btn.addEventListener("click", async ev => {
        ev.stopPropagation();

        await this.document.update({
          "system.attack.weaponId": null
        });

      });

    });




  }



}