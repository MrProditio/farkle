export function calculateValidScore(results) {
  const counts = results.reduce((acc, val) => {
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {});

  let score = 0;

  const hasStraight_1_6 = [1, 2, 3, 4, 5, 6].every(n => counts[n] === 1);
  const hasStraight_1_5 = [1, 2, 3, 4, 5].every(n => counts[n] === 1);
  const hasStraight_2_6 = [2, 3, 4, 5, 6].every(n => counts[n] === 1);

  if (hasStraight_1_6) return 1500;
  if (hasStraight_2_6) return 750;
  if (hasStraight_1_5) return 500;

  for (let i = 1; i <= 6; i++) {
    const count = counts[i] || 0;
    if (count >= 3) {
      const base = i === 1 ? 1000 : i * 100;
      const multiplier = Math.pow(2, count - 3);
      score += base * multiplier;
    }
  }

  const leftoverOnes = (counts[1] || 0) < 3 ? (counts[1] || 0) : (counts[1] - 3);
  const leftoverFives = (counts[5] || 0) < 3 ? (counts[5] || 0) : (counts[5] - 3);

  score += leftoverOnes * 100;
  score += leftoverFives * 50;

  return score;
}

export function isValidCombo(selected, rolled) {
  const rolledCounts = rolled.reduce((acc, val) => {
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {});
  
  const selectedCounts = selected.reduce((acc, val) => {
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {});
  
  return Object.entries(selectedCounts).every(([val, count]) => {
    return (rolledCounts[val] || 0) >= count;
  });
}
