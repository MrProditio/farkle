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

  // 🧩 Escaleras
  const esEscaleraCompleta = totalDados === 6 && dadosUnicos.join('') === '123456';
  const esEscaleraParcial1 = totalDados >= 5 && dadosUnicos.slice(0, 5).join('') === '12345';
  const esEscaleraParcial2 = totalDados >= 5 && dadosUnicos.slice(0, 5).join('') === '23456';

  if (esEscaleraCompleta) return 1500;
  if (esEscaleraParcial1 || esEscaleraParcial2) {
    // Verificar si el dado extra es puntuable
    const extra = dados.filter(d => ![1,2,3,4,5,6].includes(d)).length;
    puntos += esEscaleraParcial1 ? 500 : 750;
    puntos += counts[1] * 100;
    puntos += counts[5] * 50;
    return puntos;
  }

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

  const hayDadosNoPuntuables = dadosRestantes.some(d => ![1, 5].includes(d));
  const hayDadosPuntuables = dadosRestantes.some(d => [1, 5].includes(d));

  // Si hay puntuables y no puntuables mezclados, invalida
  if (hayDadosPuntuables && hayDadosNoPuntuables) return 0;

  // Si hay solo puntuables, se suman
  if (hayDadosPuntuables && !hayDadosNoPuntuables) puntos += puntosIndividuales;

  // Si hay solo no puntuables y no hay combinaciones válidas, es Farkle
  if (!hayDadosPuntuables && combinaciones.length === 0) return 0;

  return puntos;
}
