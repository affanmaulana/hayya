import growthStandards from '../data/growthStandards.json';

/**
 * Interpolates the median and SD values for a given age in months.
 * Uses growthStandards JSON database.
 * 
 * @param {Array<Object>} table - Reference standard table from JSON.
 * @param {number} ageMonths - Age of the child in months.
 * @returns {{median: number, sd: number}} Interpolated values.
 */
function interpolate(table, ageMonths) {
  if (!table || table.length === 0) {
    return { median: 0, sd: 1 };
  }

  // Helper to extract median and computed standard deviation
  const getValues = (item) => {
    const median = item.median;
    const sd = (item["+1SD"] - item["-1SD"]) / 2;
    return { median, sd };
  };

  // Edge case: age below first entry
  if (ageMonths <= table[0].age) {
    return getValues(table[0]);
  }
  
  // Edge case: age above max entry
  const lastIndex = table.length - 1;
  if (ageMonths >= table[lastIndex].age) {
    return getValues(table[lastIndex]);
  }
  
  // Find interpolation interval
  for (let i = 0; i < table.length - 1; i++) {
    const current = table[i];
    const next = table[i + 1];
    if (ageMonths >= current.age && ageMonths <= next.age) {
      const ratio = (ageMonths - current.age) / (next.age - current.age);
      const curVals = getValues(current);
      const nextVals = getValues(next);
      
      const median = curVals.median + ratio * (nextVals.median - curVals.median);
      const sd = curVals.sd + ratio * (nextVals.sd - curVals.sd);
      return { median, sd };
    }
  }
  
  return getValues(table[0]);
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
  
  const standards = growthStandards[normGender];
  
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
