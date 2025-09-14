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
  const totalDados = dados.length;
  let puntos = 0;

  // 🧩 Escalera completa
  const esEscaleraCompleta = totalDados === 6 && dadosUnicos.join('') === '123456';
  if (esEscaleraCompleta) return 1500;

  // 🎯 Tríos y superiores
  const combinaciones = [];
  for (let v = 1; v <= 6; v++) {
    const cantidad = counts[v];
    if (cantidad >= 3) {
      const base = v === 1 ? 1000 : v * 100;
      const extraMultiplicador = Math.pow(2, cantidad - 3);
      puntos += base * extraMultiplicador;
      combinaciones.push(v);
      counts[v] -= cantidad;
    }
  }

  // 🎯 1s y 5s individuales
  const puntosIndividuales = counts[1] * 100 + counts[5] * 50;
  const dadosRestantes = [];
  for (let v = 1; v <= 6; v++) {
    for (let i = 0; i < counts[v]; i++) {
      dadosRestantes.push(v);
    }
  }

  const hayNoPuntuables = dadosRestantes.some(d => ![1, 5].includes(d));
  const hayPuntuables = dadosRestantes.some(d => [1, 5].includes(d));

  // ❌ Si hay mezcla de puntuables y no puntuables, invalida la selección
  if (hayPuntuables && hayNoPuntuables) return 0;

  // ✅ Si solo hay puntuables, se suman
  if (hayPuntuables && !hayNoPuntuables) puntos += puntosIndividuales;

  // ❌ Si no hay puntuables ni combinaciones, es inválido
  if (!hayPuntuables && combinaciones.length === 0) return 0;

  return puntos;
}

export function calcularPuntuacionTurno(apartados, seleccionados) {
  const todos = apartados.concat(seleccionados).map(d => d.valor);
  return calcularPuntuacionFarkle(todos);
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
