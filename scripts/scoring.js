// farkle/scripts/puntuaciones.js

/**
 * Calcula la puntuación de una tirada de Farkle según las reglas clásicas.
 * @param {number[]} dados - Array de valores de dados (1-6).
 * @returns {number} - Puntuación total de la tirada.
 */
export function calcularPuntuacionFarkle(dados) {
  const counts = {};
  for (let i = 1; i <= 6; i++) counts[i] = 0;
  for (const d of dados) counts[d]++;

  const dadosUnicos = [...new Set(dados)].sort((a, b) => a - b);
  let puntos = 0;

  // 🧩 Combinaciones especiales (sin contar 1s y 5s por separado)
  const esEscaleraCompleta = dadosUnicos.length === 6 && dadosUnicos.join('') === '123456';
  const esEscaleraParcial1 = dadosUnicos.length === 5 && dadosUnicos.join('') === '12345';
  const esEscaleraParcial2 = dadosUnicos.length === 5 && dadosUnicos.join('') === '23456';

  if (esEscaleraCompleta) return 1500;
  if (esEscaleraParcial1) return 500;
  if (esEscaleraParcial2) return 750;

  let hayCombinacion = false;

  // 🎯 Tríos y superiores
  for (let v = 1; v <= 6; v++) {
    const cantidad = counts[v];
    if (cantidad >= 3) {
      hayCombinacion = true;
      const base = v === 1 ? 1000 : v * 100;
      const extraMultiplicador = Math.pow(2, cantidad - 3); // trío = x1, cuarteto = x2, etc.
      puntos += base * extraMultiplicador;
      counts[v] -= cantidad; // eliminar todos los dados usados en la combinación
    }
  }

  // 🎯 1s y 5s individuales (solo si no fueron parte de tríos)
  if (counts[1] > 0 || counts[5] > 0) hayCombinacion = true;
  puntos += counts[1] * 100;
  puntos += counts[5] * 50;

  return hayCombinacion ? puntos : 0;
}

/**
 * Calcula la puntuación total del turno, sumando dados apartados y seleccionados.
 * @param {Array} apartados - Dados apartados previamente.
 * @param {Array} seleccionados - Dados seleccionados en la tirada actual.
 * @returns {number} - Puntuación total del turno.
 */
export function calcularPuntuacionTurno(apartados, seleccionados) {
  const todos = [...apartados, ...seleccionados];
  const valores = todos.map(d => d.valor);
  return calcularPuntuacionFarkle(valores);
}

/**
 * Muestra un resumen visual de puntuaciones en el chat.
 * @param {string} jugador - Nombre del jugador actual.
 * @param {number} puntosSumados - Puntos ganados en el turno.
 * @param {number} puntosTotales - Puntos acumulados del jugador.
 * @param {string} contrincante - Nombre del otro jugador.
 * @param {number} puntosContrincante - Puntos del contrincante.
 */
export async function mostrarResumenPuntuacion(jugador, puntosSumados, puntosTotales, contrincante, puntosContrincante) {
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker(),
    content: `
      <div class="farkle-resumen">
        <strong>📊 Resumen de la partida:</strong><br>
        ${jugador}: <strong>${puntosTotales}</strong> puntos <span style="color: #007bff;">(+${puntosSumados})</span><br>
        ${contrincante}: <strong>${puntosContrincante}</strong> puntos
      </div>
    `
  });
}
