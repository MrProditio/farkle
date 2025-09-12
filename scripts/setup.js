Hooks.once("ready", async () => {
  if (!game.user.isGM) return;

  // Verifica si ya existe la carpeta
  const existingFolder = game.folders.find(f => f.name === "Farkle" && f.type === "Compendium");
  if (existingFolder) {
    console.log("📁 La carpeta de compendios 'Farkle' ya existe.");
    return;
  }

  // Crea la carpeta vacía en el navegador de compendios
  await Folder.create({
    name: "Farkle",
    type: "Compendium",
    color: "#ff9800",
    sorting: "a",
    parent: null
  });

  console.log("✅ Carpeta de compendios 'Farkle' creada exitosamente.");
});
