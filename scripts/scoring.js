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
  let esValida = false;

  // 🧩 Escalera completa
  if (totalDados === 6 && dadosUnicos.join('') === '123456') return 1500;

  // 🧩 Escaleras parciales
  if (dadosUnicos.length >= 5 && dadosUnicos.slice(0, 5).join('') === '12345' && !dadosUnicos.includes(6)) {
    return 500;
  }
  if (dadosUnicos.length >= 5 && dadosUnicos.slice(0, 5).join('') === '23456' && !dadosUnicos.includes(1)) {
    return 750;
  }

  // 🎯 Tríos y superiores
  for (let v = 1; v <= 6; v++) {
    const cantidad = counts[v];
    if (cantidad >= 3) {
      const base = v === 1 ? 1000 : v * 100;
      const extraMultiplicador = Math.pow(2, cantidad - 3);
      puntos += base * extraMultiplicador;
      esValida = true;
      counts[v] -= cantidad; // eliminamos los usados
    }
  }

  // 🎯 1s y 5s individuales (pendientes de validar)
  const puntosIndividuales = counts[1] * 100 + counts[5] * 50;
  const tiene1sO5s = counts[1] > 0 || counts[5] > 0;
  const tieneNoValidos = [2, 3, 4, 6].some(v => counts[v] > 0);

  // ❌ Si hay mezcla de válidos y no válidos sin tríos → inválida
  if (tiene1sO5s && tieneNoValidos && !esValida) return 0;

  // ❌ Si solo hay dados no válidos sin formar tríos → inválida
  if (!tiene1sO5s && !esValida) return 0;

  // ✅ Si llegamos aquí, entonces sí se pueden sumar 1s y 5s
  puntos += puntosIndividuales;

  return puntos;
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
