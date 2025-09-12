Hooks.once("ready", async () => {
  if (!game.user.isGM) return;

  // Verifica si ya existe la carpeta de compendios
  const existingFolder = game.compendiumFolders?.contents.find(f => f.name === "Farkle");
  if (existingFolder) {
    console.log("📁 La carpeta de compendios 'Farkle' ya existe.");
    return;
  }

  // Crea la carpeta vacía en el navegador de compendios
  await CompendiumFolder.create({
    name: "Farkle",
    type: "Compendium",
    sorting: "a",
    color: "#ff9800",
    description: "Carpeta para organizar compendios del juego Farkle"
  });

  console.log("✅ Carpeta de compendios 'Farkle' creada exitosamente.");
});
