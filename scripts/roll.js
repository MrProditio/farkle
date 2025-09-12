/**
 * Realiza una tirada de dados y devuelve los resultados formateados.
 * @param {number} cantidad - Número de dados a tirar.
 * @returns {Promise<Array>} - Array de objetos con valor, índice y estado de selección.
 */
export async function tirarDados(cantidad = 6) {
  const roll = new Roll(`${cantidad}d6`);
  await roll.evaluate({ async: true });

  // Mostrar visualmente los dados con Dice So Nice
  if (game.dice3d) {
    await game.dice3d.showForRoll(roll, game.user, true);
  }

  // Formatear resultados
  return roll.terms[0].results.map((r, i) => ({
    valor: r.result,
    index: i,
    seleccionado: false
  }));
}

/**
 * Realiza una tirada inicial desde el mensaje de configuración.
 * @param {HTMLElement} htmlElement - Elemento HTML del mensaje de chat.
 * @param {Function} crearMensajeTirada - Función para renderizar el mensaje de tirada.
 */
export function prepararTiradaInicial(htmlElement, crearMensajeTirada) {
  htmlElement.find(".btn-inicial").off("click").on("click", async () => {
    apartados = [];
    tiradaActual = await tirarDados(6);
    await crearMensajeTirada();
  });
}

/**
 * Realiza una tirada posterior durante el turno.
 * @param {Array} dadosNoSeleccionados - Dados que no fueron apartados.
 * @param {Function} crearMensajeTirada - Función para renderizar el mensaje actualizado.
 */
export async function tirarDadosRestantes(dadosNoSeleccionados, crearMensajeTirada) {
  const cantidad = dadosNoSeleccionados.length;

  // Si todos los dados fueron apartados, relanzar 6
  if (cantidad === 0) {
    ui.notifications.info("¡Todos los dados fueron apartados! Se relanzan los 6 dados.");
    tiradaActual = await tirarDados(6);
  } else {
    const nuevosDados = await tirarDados(cantidad);
    const puntuacionNuevaTirada = calcularPuntuacionFarkle(nuevosDados.map(d => d.valor));

    // Farkle: sin puntuación válida
    if (puntuacionNuevaTirada === 0) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker(),
        content: `💥 ¡Farkle! ${jugadores[turnoActual]} pierde el turno y no acumula puntos.`
      });
      apartados = [];
      tiradaActual = [];
      puntuacionActual = 0;
      turnoActual = (turnoActual + 1) % jugadores.length;
      await esperarInicioTurno();
      return;
    }

    tiradaActual = nuevosDados;
  }

  await crearMensajeTirada();
}
