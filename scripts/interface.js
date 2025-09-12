import { tirarDados } from "./roll.js";
import { calcularPuntuacionFarkle, calcularPuntuacionTurno, mostrarResumenPuntuacion } from "./scoring.js";

let jugadores = ["Jugador 1", "Jugador 2"];
let turnoActual = 0;
let puntuaciones = [0, 0];
let puntuacionObjetivo = 4000;
let apartados = [];
let tiradaActual = [];
let puntuacionActual = 0;

export function mostrarConfiguracionInicial() {
  new Dialog({
    title: "🎲 Configuración de la partida Farkle",
    content: `
      <form>
        <div class="form-group">
          <label for="target-score">🎯 Puntuación objetivo:</label>
          <input type="number" id="target-score" name="target-score" value="4000" min="1000" step="100"/>
        </div>
      </form>
    `,
    buttons: {
      aceptar: {
        label: "Comenzar partida",
        callback: async html => {
          puntuacionObjetivo = Number(html.find('#target-score').val());
          await iniciarPrimerTurno();
        }
      }
    },
    default: "aceptar"
  }).render(true);
}

async function iniciarPrimerTurno() {
  const msg = await ChatMessage.create({
    speaker: ChatMessage.getSpeaker(),
    content: `
      <div class="farkle-buttons">
        <button class="farkle-btn btn-inicial">🎲 Tirar dados</button>
      </div>
    `
  });

  Hooks.once("renderChatMessage", (message, htmlElement) => {
    if (message.id !== msg.id) return;
    htmlElement.find(".btn-inicial").off("click").on("click", async () => {
      apartados = [];
      puntuacionActual = 0;
      tiradaActual = await tirarDados(6);
      await crearMensajeTirada();
    });
  });
}

export async function crearMensajeTirada() {
  const puntuacionSeleccionada = calcularPuntuacionFarkle(
    tiradaActual.filter(d => d.seleccionado).map(d => d.valor)
  );

  const apartadosHTML = apartados.length > 0 ? `
    <div class="farkle-container">
      <div class="farkle-header">🎯 Dados apartados</div>
      <div class="dados-apartados">
        ${apartados.map(d => `<div class="dado-apartado">${d.valor}</div>`).join("")}
      </div>
      <hr class="farkle-separador">
      <div class="farkle-score">Puntos acumulados: ${puntuacionActual}</div>
    </div>
  ` : "";

  const tiradaHTML = `
    <div><strong>🎲 Dados tirados:</strong></div>
    <div class="dados-grid">
      ${tiradaActual.map(d => `
        <div class="dado" data-index="${d.index}">${d.valor}</div>
      `).join("")}
    </div>
  `;

  const botonesHTML = `
    <div class="farkle-buttons">
      <button class="farkle-btn btn-tirar">Tirar de nuevo</button>
      <button class="farkle-btn btn-plantarse">Plantarse</button>
      <button class="farkle-btn btn-rendirse">Rendirse</button>
    </div>
  `;

  const html = `
    <div><strong>🔄 Turno de ${jugadores[turnoActual]}</strong></div>
    ${apartadosHTML}
    ${tiradaHTML}
    <div style="margin-top:5px;">Puntuación de la selección actual: <strong class="puntuacion">${puntuacionSeleccionada}</strong></div>
    ${botonesHTML}
  `;

  const msg = await ChatMessage.create({
    speaker: ChatMessage.getSpeaker(),
    content: html
  });

  Hooks.once("renderChatMessage", (message, htmlElement) => {
    if (message.id !== msg.id) return;

    htmlElement.find(".dado").on("click", function () {
      const index = Number(this.dataset.index);
      const dado = tiradaActual.find(d => d.index === index);
      dado.seleccionado = !dado.seleccionado;
      this.classList.toggle("seleccionado", dado.seleccionado);

      const nuevaPuntuacion = calcularPuntuacionFarkle(
        tiradaActual.filter(d => d.seleccionado).map(d => d.valor)
      );
      htmlElement.find(".puntuacion").text(nuevaPuntuacion);
    });

    htmlElement.find(".btn-tirar").on("click", async () => {
      const seleccionados = tiradaActual.filter(d => d.seleccionado);
      if (seleccionados.length === 0) {
        ui.notifications.warn("Debes seleccionar al menos un dado para apartar.");
        return;
      }

      const puntos = calcularPuntuacionFarkle(seleccionados.map(d => d.valor));
      puntuacionActual += puntos;
      apartados = apartados.concat(seleccionados);

      const dadosRestantes = tiradaActual.filter(d => !d.seleccionado);
      await tirarDadosRestantes(dadosRestantes, crearMensajeTirada);
    });

    htmlElement.find(".btn-plantarse").on("click", async () => {
      const seleccionados = tiradaActual.filter(d => d.seleccionado);
      const puntosTurno = calcularPuntuacionTurno(apartados, seleccionados);
      puntuaciones[turnoActual] += puntosTurno;

      const jugador = jugadores[turnoActual];
      const contrincanteIndex = (turnoActual + 1) % jugadores.length;
      const contrincante = jugadores[contrincanteIndex];

      await mostrarResumenPuntuacion(
        jugador,
        puntosTurno,
        puntuaciones[turnoActual],
        contrincante,
        puntuaciones[contrincanteIndex]
      );

      apartados = [];
      tiradaActual = [];
      puntuacionActual = 0;
      turnoActual = contrincanteIndex;
      await iniciarPrimerTurno();
    });

    htmlElement.find(".btn-rendirse").on("click", async () => {
      const jugadorRendido = jugadores[turnoActual];
      const jugadorGanador = jugadores[(turnoActual + 1) % jugadores.length];

      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker(),
        content: `
          🏁 ${jugadorRendido} se ha rendido.<br>
          🎉 ¡Victoria para ${jugadorGanador}!<br>
          <strong>Resumen final:</strong><br>
          ${jugadores[0]}: ${puntuaciones[0]} puntos<br>
          ${jugadores[1]}: ${puntuaciones[1]} puntos
        `
      });

      apartados = [];
      tiradaActual = [];
    });
  });
}

// 👇 Esta línea expone la función al espacio global de Foundry
game.farkle = {
  iniciar: mostrarConfiguracionInicial
};
