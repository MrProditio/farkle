// scripts/scoring.js
export default class Scoring {
  
  /**
   * Calcula la puntuación total de una tirada y qué dados se usaron.
   * @param {number[]} dice - Array con los valores de los dados (ej. [1, 5, 3, 3, 3, 2])
   * @returns {object} { score, usedDice, isFarkle }
   */
  static calculateScore(dice) {
    let score = 0;
    let usedDice = [];
    const counts = {};

    // Contamos ocurrencias
    for (let d of dice) {
      counts[d] = (counts[d] || 0) + 1;
    }

    // --- Escalera completa (1-6) ---
    if ([1,2,3,4,5,6].every(v => counts[v] === 1)) {
      return { score: 1500, usedDice: [...dice], isFarkle: false };
    }

    // --- Tres pares ---
    const pairs = Object.values(counts).filter(c => c === 2).length;
    if (pairs === 3) {
      return { score: 1500, usedDice: [...dice], isFarkle: false };
    }

    // --- Tríos, cuádruples, etc. ---
    for (let face = 1; face <= 6; face++) {
      const count = counts[face] || 0;
      if (count >= 3) {
        if (face === 1) {
          score += 1000 * Math.pow(2, count - 3);
        } else {
          score += face * 100 * Math.pow(2, count - 3);
        }
        for (let i = 0; i < count; i++) {
          usedDice.push(face);
        }
        counts[face] = 0; // ya se usaron
      }
    }

    // --- Unos y cincos sueltos ---
    if (counts[1]) {
      score += counts[1] * 100;
      usedDice.push(...Array(counts[1]).fill(1));
    }
    if (counts[5]) {
      score += counts[5] * 50;
      usedDice.push(...Array(counts[5]).fill(5));
    }

    // --- Detectar Farkle ---
    const isFarkle = score === 0;

    return { score, usedDice, isFarkle };
  }

  /**
   * Comprueba si la tirada es Farkle (sin puntos).
   * @param {number[]} dice
   * @returns {boolean}
   */
  static isFarkle(dice) {
    return this.calculateScore(dice).isFarkle;
  }
}
