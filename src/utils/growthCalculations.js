// Key WHO Growth Standard Data Points for Boys ('L') and Girls ('P')
// Structure: [month, median, standardDeviation]
const WHO_STANDARDS = {
  L: {
    weight: [
      [0, 3.3, 0.5],
      [1, 4.5, 0.6],
      [2, 5.6, 0.7],
      [3, 6.4, 0.8],
      [6, 7.9, 0.9],
      [9, 8.9, 1.0],
      [12, 9.6, 1.1],
      [18, 10.9, 1.2],
      [24, 12.2, 1.3],
      [36, 14.3, 1.6],
      [48, 16.3, 1.8],
      [60, 18.3, 2.1]
    ],
    height: [
      [0, 49.9, 2.0],
      [1, 54.7, 2.1],
      [2, 58.4, 2.2],
      [3, 61.4, 2.3],
      [6, 67.6, 2.4],
      [9, 72.0, 2.5],
      [12, 75.7, 2.6],
      [18, 82.3, 2.8],
      [24, 87.8, 3.0],
      [36, 96.1, 3.3],
      [48, 103.3, 3.6],
      [60, 110.0, 4.0]
    ],
    headCirc: [
      [0, 34.5, 1.2],
      [3, 40.5, 1.3],
      [6, 43.3, 1.3],
      [12, 46.0, 1.3],
      [24, 48.3, 1.4],
      [36, 49.5, 1.4],
      [48, 50.2, 1.5],
      [60, 50.8, 1.5]
    ]
  },
  P: {
    weight: [
      [0, 3.2, 0.4],
      [1, 4.2, 0.5],
      [2, 5.1, 0.6],
      [3, 5.8, 0.7],
      [6, 7.3, 0.8],
      [9, 8.2, 0.9],
      [12, 8.9, 1.0],
      [18, 10.2, 1.1],
      [24, 11.5, 1.2],
      [36, 13.9, 1.5],
      [48, 16.0, 1.8],
      [60, 18.0, 2.1]
    ],
    height: [
      [0, 49.1, 1.9],
      [1, 53.7, 2.0],
      [2, 57.1, 2.1],
      [3, 59.8, 2.2],
      [6, 65.7, 2.3],
      [9, 70.1, 2.4],
      [12, 74.0, 2.5],
      [18, 80.7, 2.7],
      [24, 86.4, 3.0],
      [36, 95.1, 3.3],
      [48, 102.7, 3.6],
      [60, 109.4, 4.0]
    ],
    headCirc: [
      [0, 33.9, 1.1],
      [3, 39.5, 1.2],
      [6, 42.2, 1.2],
      [12, 44.8, 1.2],
      [24, 47.2, 1.3],
      [36, 48.4, 1.3],
      [48, 49.2, 1.4],
      [60, 49.9, 1.4]
    ]
  }
};

/**
 * Interpolates the median and SD values for a given age in months.
 * 
 * @param {Array<Array>} table - Reference standard table.
 * @param {number} ageMonths - Age of the child in months.
 * @returns {{median: number, sd: number}} Interpolated values.
 */
function interpolate(table, ageMonths) {
  // Edge case: age below 0
  if (ageMonths <= table[0][0]) {
    return { median: table[0][1], sd: table[0][2] };
  }
  
  // Edge case: age above max
  const lastIndex = table.length - 1;
  if (ageMonths >= table[lastIndex][0]) {
    return { median: table[lastIndex][1], sd: table[lastIndex][2] };
  }
  
  // Find interpolation interval
  for (let i = 0; i < table.length - 1; i++) {
    const current = table[i];
    const next = table[i + 1];
    if (ageMonths >= current[0] && ageMonths <= next[0]) {
      const ratio = (ageMonths - current[0]) / (next[0] - current[0]);
      const median = current[1] + ratio * (next[1] - current[1]);
      const sd = current[2] + ratio * (next[2] - current[2]);
      return { median, sd };
    }
  }
  
  return { median: table[0][1], sd: table[0][2] };
}

/**
 * Calculates growth indicators and classifications based on WHO Z-Score.
 * 
 * @param {string} gender - 'L' (Laki-laki) or 'P' (Perempuan).
 * @param {number} ageMonths - Child's age in total months.
 * @param {number} [weightKg] - Weight in Kg.
 * @param {number} [heightCm] - Height in Cm.
 * @param {number} [headCircCm] - Head circumference in Cm.
 * @returns {Object} Complete Z-Score evaluation results.
 */
export function calculateZScores(gender, ageMonths, weightKg, heightCm, headCircCm) {
  const normGender = (gender === 'L' || gender === 'P') ? gender : 'L';
  const age = Math.max(0, Math.min(60, ageMonths)); // clamp 0-5 years
  
  const results = {
    weightForAge: { zScore: null, status: 'Tidak ada data' },
    heightForAge: { zScore: null, status: 'Tidak ada data' },
    headCircForAge: { zScore: null, status: 'Tidak ada data' }
  };
  
  const standards = WHO_STANDARDS[normGender];
  
  // 1. BB/U (Weight for Age)
  if (weightKg && weightKg > 0) {
    const { median, sd } = interpolate(standards.weight, age);
    const zScore = parseFloat(((weightKg - median) / sd).toFixed(2));
    
    let status = 'Gizi Baik (Normal)';
    if (zScore < -3) {
      status = 'Gizi Buruk';
    } else if (zScore >= -3 && zScore < -2) {
      status = 'Gizi Kurang';
    } else if (zScore > 2) {
      status = 'Risiko Gizi Lebih';
    }
    
    results.weightForAge = { zScore, status };
  }
  
  // 2. TB/U (Height for Age)
  if (heightCm && heightCm > 0) {
    const { median, sd } = interpolate(standards.height, age);
    const zScore = parseFloat(((heightCm - median) / sd).toFixed(2));
    
    let status = 'Normal';
    if (zScore < -3) {
      status = 'Sangat Pendek (Severely Stunted)';
    } else if (zScore >= -3 && zScore < -2) {
      status = 'Pendek (Stunted)';
    } else if (zScore > 3) {
      status = 'Tinggi';
    }
    
    results.heightForAge = { zScore, status };
  }
  
  // 3. LK/U (Head Circumference for Age)
  if (headCircCm && headCircCm > 0) {
    const { median, sd } = interpolate(standards.headCirc, age);
    const zScore = parseFloat(((headCircCm - median) / sd).toFixed(2));
    
    let status = 'Normal';
    if (zScore < -2) {
      status = 'Mikrosefali (Kecil)';
    } else if (zScore > 2) {
      status = 'Makrosefali (Besar)';
    }
    
    results.headCircForAge = { zScore, status };
  }
  
  return results;
}
