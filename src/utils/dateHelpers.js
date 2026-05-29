/**
 * Helper to calculate precise child age in total months and days.
 * 
 * @param {string} dobString - Date of Birth (YYYY-MM-DD).
 * @returns {{months: number, days: number}} Age in total months and remaining days.
 */
export function calculateAgeInMonthsAndDays(dobString) {
  if (!dobString) return { months: 0, days: 0 };
  
  const dob = new Date(dobString);
  const today = new Date();
  
  let years = today.getFullYear() - dob.getFullYear();
  let months = today.getMonth() - dob.getMonth();
  let days = today.getDate() - dob.getDate();
  
  if (days < 0) {
    months--;
    // Get total days in the previous month
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += prevMonth.getDate();
  }
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  const totalMonths = (years * 12) + months;
  
  // If dates are invalid (e.g. future birthdate), return zero
  if (totalMonths < 0 || days < 0) {
    return { months: 0, days: 0 };
  }
  
  return { months: totalMonths, days };
}

/**
 * Helper to format standard YYYY-MM-DD date to friendly Indonesian format.
 * Example: '2026-05-29' -> '29 Mei 2026'
 * 
 * @param {string} dateString - YYYY-MM-DD Date.
 * @returns {string} Friendly Indonesian date.
 */
export function formatDate(dateString) {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const day = date.getDate();
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  } catch (e) {
    return dateString;
  }
}

/**
 * Calculates a future date by adding a specific number of months to a base date.
 * Useful for calculating immunization calendar schedules.
 * 
 * @param {string} dateString - Starting base date YYYY-MM-DD.
 * @param {number} monthsToAdd - Number of months to add.
 * @returns {string} Future date YYYY-MM-DD.
 */
export function addMonths(dateString, monthsToAdd) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  
  date.setMonth(date.getMonth() + monthsToAdd);
  return date.toISOString().split('T')[0];
}
