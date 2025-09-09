import { sendTurnToPlayer } from "./farkle-turn.js";

let targetScore = 4000;
let playerTokens = [];
let playerScores = [];
let currentPlayerIndex = 0;

function askGameSetup() {
  const tokens = canvas.tokens.placeables.filter(t => t.actor);
  const options = tokens.map(t => `<option value="${t.id}">${t.name}</option>`).join("");

  new Dialog({
    title: "Configuración de partida Farkle",
    content: `
      <form>
        <div class="form-group">
          <label for="target-score">Puntuación objetivo:</label>
          <input type="number" name="target-score" value="4000" min="1000" step="100" />
        </div>
        <div class="form-group">
          <label for="player1">Jugador 1:</label>
          <select name="player1">${options}</select>
        </div>
        <div class="form-group">
          <label for="player2">Jugador 2:</label>
          <select name="player2">${options}</select>
        </div>
      </form>
    `,
    buttons: {
      start: {
        label: "Iniciar partida",
        callback: (html) => {
          targetScore = parseInt(html.find('[name="target-score"]').val()) || 4000;
          const token1 = canvas.tokens.get(html.find('[name="player1"]').val());
          const token2 = canvas.tokens.get(html.find('[name="player2"]').val());

          if (!token1 || !token2 || token1.id === token2.id) {
            ui.notifications.warn("Selecciona dos tokens distintos.");
            return;
          }

          playerTokens = [token1, token2];
          playerScores = [0, 0];
          currentPlayerIndex = 0;

          ChatMessage.create({ content: `<h2>🎲 ¡Comienza la partida de Farkle!</h2><p>Puntuación objetivo: <strong>${targetScore}</strong></p>` });

          sendTurnToPlayer(playerTokens[currentPlayerIndex], currentPlayerIndex, playerScores, targetScore);
        }
      }
    },
    default: "start"
  }).render(true);
}

Hooks.once("ready", () => {
  if (game.user.isGM) {
    console.log("🧠 Farkle Controller activo (GM)");
    askGameSetup();
  }

  game.socket.on("module.farkle", (data) => {
    if (!data || !data.action) return;

    if (data.action === "endTurn" && game.user.isGM) {
      const { turnScore, currentPlayerIndex: index } = data;
      playerScores[index] += turnScore;

      const currentToken = playerTokens[index];
      const opponentToken = playerTokens[(index + 1) % 2];

      const pointsRemainingCurrent = targetScore - playerScores[index];
      const pointsRemainingOpponent = targetScore - playerScores[(index + 1) % 2];

      ChatMessage.create({
        content: `
          <h2>📣 Fin del turno de <strong>${currentToken.name}</strong></h2>
          <p>🎲 Ha ganado <strong>${turnScore}</strong> puntos en esta ronda.</p>
          <p><strong>Resumen de la partida:</strong></p>
          <ul>
            <li>${currentToken.name}: <strong>${playerScores[index]}</strong> puntos (le faltan ${pointsRemainingCurrent})</li>
            <li>${opponentToken.name}: <strong>${playerScores[(index + 1) % 2]}</strong> puntos (le faltan ${pointsRemainingOpponent})</li>
          </ul>
        `
      });

      if (playerScores[index] >= targetScore) {
        ChatMessage.create({
          content: `
            <h2>🎉 ¡${currentToken.name} ha ganado la partida con ${playerScores[index]} puntos! 🎉</h2>
            <p><strong>Resumen final:</strong></p>
            <ul>
              <li>${currentToken.name}: ${playerScores[index]} puntos</li>
              <li>${opponentToken.name}: ${playerScores[(index + 1) % 2]} puntos</li>
            </ul>
          `
        });
        return;
      }

      currentPlayerIndex = (index + 1) % 2;
      sendTurnToPlayer(playerTokens[currentPlayerIndex], currentPlayerIndex, playerScores, targetScore);
    }
  });
});
