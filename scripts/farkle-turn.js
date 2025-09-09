import { calculateValidScore, isValidCombo } from "./farkle-utils.js";

export function sendTurnToPlayer(token, currentPlayerIndex, playerScores, targetScore) {
  const ownerUser = game.users.find(u =>
    u.active && token.actor?.permissions[u.id] === 3
  );

  if (!ownerUser) {
    ui.notifications.warn(`No se encontró un usuario propietario para el token ${token.name}`);
    return;
  }

  game.socket.emit("module.farkle", {
    action: "startTurn",
    userId: ownerUser.id,
    tokenId: token.id,
    currentPlayerIndex,
    playerScores,
    targetScore
  });
}

export async function farkleTurn(token, currentPlayerIndex, playerScores, targetScore) {
  let remainingDice = 6;
  let turnScore = 0;

  async function rollDice() {
    const roll = new Roll(`${remainingDice}d6`);
    await roll.roll({ async: true });
    const results = roll.terms[0].results.map(r => r.result);

    ChatMessage.create({
      speaker: {
        alias: token.name,
        token: token.id,
        actor: token.actor.id
      },
      content: `<p style="font-size: 1.5em;"><strong>Resultados:</strong> ${results.join(", ")}</p>`
    });

    if (game.dice3d) game.dice3d.showForRoll(roll);

    const counts = results.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {});
    const hasOneOrFive = results.includes(1) || results.includes(5);
    const hasTripleCombo = [1, 2, 3, 4, 5, 6].some(n => counts[n] >= 3);
    const hasStraight = [1, 2, 3, 4, 5, 6].every(n => counts[n] === 1) ||
                        [1, 2, 3, 4, 5].every(n => counts[n] === 1) ||
                        [2, 3, 4, 5, 6].every(n => counts[n] === 1);

    if (!hasOneOrFive && !hasTripleCombo && !hasStraight) {
      ChatMessage.create({
        speaker: {
          alias: token.name,
          token: token.id,
          actor: token.actor.id
        },
        content: `<p><strong>${token.name} ha hecho Farkle. No gana puntos este turno.</strong></p>`
      });

      game.socket.emit("module.farkle", {
        action: "endTurn",
        turnScore: 0,
        currentPlayerIndex
      });

      return;
    }

    let selectedDice = [];

    const diceHtml = results.map((val, i) => `
      <button class="die-button" data-index="${i}" data-value="${val}" style="
        width: 40px;
        height: 40px;
        margin: 5px;
        font-size: 1.2em;
        text-align: center;
        border-radius: 6px;
        border: 2px solid #ccc;
      ">
        ${val}
      </button>
    `).join("");

    new Dialog({
      title: `Turno de ${token.name}`,
      content: `
        <div style="margin-bottom: 1em; text-align: center;">
          <p id="turn-score-display" style="font-size: 1.2em;">
            <strong>Puntuación acumulada en este turno:</strong> ${turnScore}
          </p>
        </div>
        <div id="dice-container" style="display: flex; justify-content: center; flex-wrap: wrap;">
          ${diceHtml}
        </div>
      `,
      buttons: {
        reroll: {
          label: "Tirar",
          callback: async (html) => {
            if (!isValidCombo(selectedDice, results)) {
              ui.notifications.warn("La combinación seleccionada no coincide con los dados tirados.");
              return;
            }

            const score = calculateValidScore(selectedDice);
            turnScore += score;
            remainingDice -= selectedDice.length;
            if (remainingDice < 1) remainingDice = 6;

            rollDice();
          }
        },
        stop: {
          label: "Plantarse",
          callback: () => {
            if (!isValidCombo(selectedDice, results)) {
              ui.notifications.warn("La combinación seleccionada no coincide con los dados tirados.");
              return;
            }

            const score = calculateValidScore(selectedDice);
            turnScore += score;

            game.socket.emit("module.farkle", {
              action: "endTurn",
              turnScore,
              currentPlayerIndex
            });
          }
        },
        surrender: {
          label: "Rendirse",
          callback: () => {
            ChatMessage.create({
              speaker: {
                alias: token.name,
                token: token.id,
                actor: token.actor.id
              },
              content: `<p><strong>${token.name} se ha rendido. Fin de la partida.</strong></p>`
            });

            game.socket.emit("module.farkle", {
              action: "endTurn",
              turnScore: -9999,
              currentPlayerIndex
            });
          }
        }
      },
      default: "reroll",
      render: html => {
        html.find('.die-button').on('click', function () {
          const value = parseInt($(this).data('value'));
          const index = parseInt($(this).data('index'));

          if ($(this).hasClass('selected')) {
            $(this).removeClass('selected').css('background-color', '');
            selectedDice.splice(selectedDice.indexOf(value), 1);
          } else {
            $(this).addClass('selected').css('background-color', '#6c6');
            selectedDice.push(value);
          }

          const tempScore = calculateValidScore(selectedDice);
          html.find('#turn-score-display').html(`<strong>Puntuación acumulada en este turno:</strong> ${turnScore + tempScore}`);
        });
      }
    }).render(true);
  }

  rollDice();
}
