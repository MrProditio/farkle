// interface.js
import { tirarDados, tirarDadosRestantes } from "./roll.js";
import { calcularPuntuacionFarkle, calcularPuntuacionTurno, mostrarResumenPuntuacion } from "./scoring.js";

let jugadores = ["Jugador 1", "Jugador 2"];
let turnoActual = 0;
let puntuaciones = [0, 0];
let puntuacionObjetivo = 4000;
let apartados = [];
let tiradaActual = [];
let puntuacionActual = 0;

// === CONFIGURACIÓN INICIAL ===
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
        callback: async (html) => {
          puntuacionObjetivo = Number(html.querySelector('#target-score').value);
          await iniciarPrimerTurno();
        }
      }
    },
    default: "aceptar"
  }).render(true);
}

// === INICIO DE TURNO ===
async function iniciarPrimerTurno() {
  const msg = await ChatMessage.create({
    speaker: ChatMessage.getSpeaker(),
    content: `
      <div class="farkle-buttons">
        <button class="farkle-btn btn-inicial">🎲 Tirar dados</button>
      </div>
    `
  });

  // Hook actualizado V13+
  Hooks.once("renderChatMessageHTML", async (message, htmlElement) => {
    if (message.id !== msg.id) return;

    const btnInicial = htmlElement.querySelector(".btn-inicial");
    btnInicial.addEventListener("click", async () => {
      apartados = [];
      puntuacionActual = 0;
      tiradaActual = await tirarDados(6);
      await crearMensajeTirada();
    });
  });
}

// === CREACIÓN DE MENSAJE DE TIRADA ===
export async function crearMensajeTirada() {
  const valoresTirada = tiradaActual.map(d => d.valor);
  const esFarkle = calcularPuntuacionFarkle(valoresTirada) === 0;

  const apartadosHTML = apartados.length > 0
    ? `<div class="farkle-container">
        <div class="farkle-header">🎯 Dados apartados</div>
        <div class="dados-apartados">
          ${apartados.map(d => `<div class="dado-apartado">${d.valor}</div>`).join("")}
        </div>
        <hr class="farkle-separador">
        <div class="farkle-score">Puntos acumulados: ${puntuacionActual}</div>
      </div>`
    : "";

  const tiradaHTML = `<div><strong>🎲 Dados tirados:</strong></div>
    <div class="dados-grid">
      ${tiradaActual.map(d => `<div class="dado" data-index="${d.index}">${d.valor}</div>`).join("")}
    </div>`;

  const mensajeFarkle = esFarkle
    ? `<div style="text-align:center; margin-top:10px;">
        <div style="font-size:1.5em; font-weight:bold;">💥 ¡Farkle!</div>
        <div><strong>${jugadores[turnoActual]} pierde el turno y no acumula puntos.</strong></div>
      </div>`
    : "";

  const botonesHTML = !esFarkle
    ? `<div class="farkle-buttons">
        <button class="farkle-btn btn-tirar">Tirar de nuevo</button>
        <button class="farkle-btn btn-plantarse">Plantarse</button>
        <button class="farkle-btn btn-rendirse">Rendirse</button>
      </div>`
    : "";

  const htmlContent = `
    <div><strong>🔄 Turno de ${jugadores[turnoActual]}</strong></div>
    ${apartadosHTML}
    ${tiradaHTML}
    <div style="margin-top:5px;">Puntuación de la selección actual: <strong class="puntuacion">0</strong></div>
    ${mensajeFarkle}
    ${botonesHTML}
  `;

  const msg = await ChatMessage.create({
    speaker: ChatMessage.getSpeaker(),
    content: htmlContent
  });

  // --- Hook para interacción de dados y botones
  Hooks.once("renderChatMessageHTML", (message, htmlElement) => {
    if (message.id !== msg.id) return;

    // Si es Farkle, cambiar turno automáticamente
    if (esFarkle) {
      apartados = [];
      tiradaActual = [];
      puntuacionActual = 0;
      turnoActual = (turnoActual + 1) % jugadores.length;
      setTimeout(() => iniciarPrimerTurno(), 500);
      return;
    }

    const display = htmlElement.querySelector(".puntuacion");

    const computeSelectedScore = () => {
      const seleccionadosVals = tiradaActual
        .filter(d => d.seleccionado)
        .map(d => Number(d.valor));
      return calcularPuntuacionFarkle(seleccionadosVals);
    };

    let currentCorrect = computeSelectedScore();
    display.textContent = currentCorrect;

    htmlElement.querySelectorAll(".dado").forEach(dadoEl => {
      dadoEl.addEventListener("click", () => {
        const index = Number(dadoEl.dataset.index);
        const dado = tiradaActual.find(d => d.index === index);
        dado.seleccionado = !dado.seleccionado;
        dadoEl.classList.toggle("seleccionado", dado.seleccionado);

        currentCorrect = computeSelectedScore();
        display.textContent = currentCorrect;

        const btnTirar = htmlElement.querySelector(".btn-tirar");
        btnTirar.disabled = currentCorrect === 0;
      });
    });

    // Botón Tirar
    const btnTirar = htmlElement.querySelector(".btn-tirar");
    if (btnTirar) {
      btnTirar.addEventListener("click", async () => {
        const seleccionados = tiradaActual.filter(d => d.seleccionado);
        if (seleccionados.length === 0) {
          ui.notifications.warn("Debes seleccionar al menos un dado para apartar.");
          return;
        }

        const puntos = calcularPuntuacionFarkle(seleccionados.map(d => d.valor));
        if (puntos === 0) {
          ui.notifications.warn("La combinación seleccionada no es válida. Debes seleccionar solo dados puntuables.");
          return;
        }

        puntuacionActual += puntos;
        apartados = apartados.concat(seleccionados);
        const dadosRestantes = tiradaActual.filter(d => !d.seleccionado);
        await tirarDadosRestantes(dadosRestantes, crearMensajeTirada);
      });
    }

    // Botón Plantarse
    const btnPlantarse = htmlElement.querySelector(".btn-plantarse");
    if (btnPlantarse) {
      btnPlantarse.addEventListener("click", async () => {
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
    }

    // Botón Rendirse
    const btnRendirse = htmlElement.querySelector(".btn-rendirse");
    if (btnRendirse) {
      btnRendirse.addEventListener("click", async () => {
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
    }
  });

  // Farkle automático al renderizar
  if (esFarkle) {
    apartados = [];
    tiradaActual = [];
    puntuacionActual = 0;
    turnoActual = (turnoActual + 1) % jugadores.length;
    setTimeout(() => iniciarPrimerTurno(), 500);
  }
}
