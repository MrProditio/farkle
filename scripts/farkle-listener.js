import { farkleTurn } from "./farkle-turn.js";

Hooks.once("ready", () => {
  console.log("🎧 Farkle Listener activo en esta sesión");

  game.socket.on("module.farkle", async (data) => {
    if (!data || !data.action) return;

    // Solo ejecuta si el evento está dirigido a este jugador
    if (data.action === "startTurn" && data.userId === game.user.id) {
      const token = canvas.tokens.get(data.tokenId);
      if (!token) {
        ui.notifications.warn("No se encontró el token para este turno.");
        return;
      }

      console.log(`🎲 Turno recibido por ${game.user.name} para ${token.name}`);
      farkleTurn(token, data.currentPlayerIndex, data.playerScores, data.targetScore);
    }
  });
});
