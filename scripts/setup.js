Hooks.once("ready", async () => {
  if (!game.user.isGM) return;

  // === Crear Macro "Hola Mundo" en Compendio "farkle-macros" ===
  const macroPack = game.packs.find(p => p.collection === "farkle-macros");
  if (macroPack) {
    const macros = await macroPack.getDocuments();
    const macroExistente = macros.find(m => m.name === "Hola Mundo!");

    if (!macroExistente) {
      await macroPack.createDocument({
        name: "Hola Mundo!",
        type: "script",
        img: "icons/svg/speech.svg",
        command: `
          new Dialog({
            title: "Saludo",
            content: "<p>¡Hola Mundo!</p>",
            buttons: {
              ok: { label: "Cerrar" }
            }
          }).render(true);
        `
      });
      console.log("✅ Macro 'Hola Mundo!' creada en el compendio farkle-macros.");
    }
  } else {
    console.warn("⚠️ No se encontró el compendio 'farkle-macros'.");
  }

  // === Crear Journal vacío en Compendio "farkle-rules" ===
  const journalPack = game.packs.find(p => p.collection === "farkle-rules");
  if (journalPack) {
    const journals = await journalPack.getDocuments();
    const journalExistente = journals.find(j => j.name === "Entrada Vacía");

    if (!journalExistente) {
      await journalPack.createDocument({
        name: "Entrada Vacía",
        pages: [
          {
            name: "Página 1",
            type: "text",
            text: {
              format: 1,
              content: ""
            }
          }
        ]
      });
      console.log("✅ Entrada de diario vacía creada en el compendio farkle-rules.");
    }
  } else {
    console.warn("⚠️ No se encontró el compendio 'farkle-rules'.");
  }
});
