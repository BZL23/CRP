const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class CRPGMPanel extends HandlebarsApplicationMixin(ApplicationV2) {

  static DEFAULT_OPTIONS = {
    id: "crp-gm-panel",
    classes: ["crp", "gm-panel"],
    window: {
      title: "CRP – Panel MG",
      resizable: true
    },
    position: {
      width: 400,
      height: "auto"
    }
  };

  static PARTS = {
    body: {
      template: "systems/crp/templates/gm-panel.hbs"
    }
  };


  _prepareContext() {

  const actors = game.actors.contents
    .filter(a => a.type === "character" && a.hasPlayerOwner)
    .map(a => ({
      id: a.id,
      name: a.name,
      fate: a.system.resources.fate.value
    }));

  return { actors };
}

_onRender(context, options) {
  super._onRender(context, options);

  const html = this.element;

  html.querySelectorAll(".crp-actor-row").forEach(row => {
  row.addEventListener("click", ev => {
    if (ev.target.tagName === "INPUT") return;

    const checkbox = row.querySelector("input");
    checkbox.checked = !checkbox.checked;
  });
});

html.querySelector("[data-action='give-fate-selected']")?.addEventListener("click", async () => {

  const selected = html.querySelectorAll(".crp-actor-row input:checked");

  if (!selected.length) {
    ui.notifications.warn("Wybierz przynajmniej jednego gracza");
    return;
  }

  for (const checkbox of selected) {

    const actorId = checkbox.value;
    const actor = game.actors.get(actorId);
    if (!actor) continue;

    const current = actor.system.resources.fate.value ?? 0;

    await actor.update({
      "system.resources.fate.value": current + 1
    });

  }

  ui.notifications.info("✨ Dodano +1 Doli wybranym");

  this.render(); // odśwież panel (ważne!)
});

html.querySelector("[data-action='toggle-all']")?.addEventListener("click", () => {

  const checkboxes = html.querySelectorAll(".crp-actor-row input");
  const allChecked = [...checkboxes].every(cb => cb.checked);

  checkboxes.forEach(cb => cb.checked = !allChecked);

});

  // 🎲 RESET DOLI
  html.querySelector("[data-action='reset-fate']")?.addEventListener("click", async () => {
    for (const actor of game.actors.contents) {
      if (actor.type !== "character" || !actor.hasPlayerOwner) continue;

      await actor.update({
        "system.resources.fate.value": 2
      });
    }

    ui.notifications.info("✨ Dola ustawiona na 2");

    this.render(); // odśwież panel
    
  });

  // ➕ +1 DOLA
  html.querySelector("[data-action='give-fate']")?.addEventListener("click", async () => {
    for (const actor of game.actors.contents) {
      if (actor.type !== "character" || !actor.hasPlayerOwner) continue;

      const current = actor.system.resources.fate.value ?? 0;

      await actor.update({
        "system.resources.fate.value": current + 1
      });
    }

    ui.notifications.info("✨ Dodano +1 Doli");

  });

  // ❤️ HEAL
  html.querySelector("[data-action='heal-all']")?.addEventListener("click", async () => {
    for (const actor of game.actors.contents) {
      if (actor.type !== "character" || !actor.hasPlayerOwner) continue;

      const max = actor.system.derived.health.max;

      await actor.update({
        "system.derived.health.value": max
      });
    }

    ui.notifications.info("❤️ Wszyscy wyleczeni");
  });


  html.querySelector("[data-action='give-fate-selected']")?.addEventListener("click", async () => {

  const checkboxes = html.querySelectorAll(".crp-actor-row input:checked");

  if (!checkboxes.length) {
    ui.notifications.warn("Wybierz przynajmniej jednego gracza");
    return;
  }

  for (const cb of checkboxes) {

    const actor = game.actors.get(cb.value);
    if (!actor) continue;

    const current = actor.system.resources.fate.value ?? 0;

    await actor.update({
      "system.resources.fate.value": current + 1
    });

  }

  ui.notifications.info("✨ Dodano Dolę wybranym");

  this.render(); // odśwież panel

});

}

_prepareContext() {

  const actors = game.actors.contents
    .filter(a => a.type === "character" && a.hasPlayerOwner)
    .map(a => ({
      id: a.id,
      name: a.name,
      fate: a.system.resources.fate.value
    }));

  console.log("CRP ACTORS:", actors); // 👈 DEBUG

  return { actors };
}


}