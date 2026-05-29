import { getCollection, insertItem, updateItem, deleteItem, getAppData, saveAppData } from '../utils/localStorageUtils.js';
import { calculateZScores } from '../utils/growthCalculations.js';

/**
 * Calculates precise child age in total months at a specific measurement date.
 * This is crucial for plotting historical points correctly on WHO growth curves.
 * 
 * @param {string} dobString - Date of Birth (YYYY-MM-DD).
 * @param {string} measuredAtString - Date of measurement (YYYY-MM-DD).
 * @returns {number} Age in total months (rounded down).
 */
function calculateAgeInMonthsAt(dobString, measuredAtString) {
  if (!dobString || !measuredAtString) return 0;
  const dob = new Date(dobString);
  const measured = new Date(measuredAtString);
  
  let years = measured.getFullYear() - dob.getFullYear();
  let months = measured.getMonth() - dob.getMonth();
  let days = measured.getDate() - dob.getDate();
  
  if (days < 0) {
    months--;
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  
  const totalMonths = (years * 12) + months;
  return Math.max(0, totalMonths);
}

export function useGrowth() {
  /**
   * Retrieves historical growth records for a child, evaluates them with real-time WHO Z-Scores,
   * and returns them sorted chronologically by measuredAt.
   * 
   * @param {string} childId - The target child profile ID.
   * @returns {Array} Evaluated, sorted growth record list.
   */
  const getGrowthRecords = (childId) => {
    if (!childId) return [];

    const children = getCollection('children');
    const child = children.find(c => c.id === childId);
    if (!child) {
      console.warn(`Child with ID ${childId} not found.`);
      return [];
    }

    const gender = child.gender || 'L';
    const dateOfBirth = child.dateOfBirth;

    const rawRecords = getCollection('growthRecords').filter(r => r.childId === childId);
    
    const evaluatedRecords = rawRecords.map(record => {
      const ageMonths = calculateAgeInMonthsAt(dateOfBirth, record.measuredAt);
      const zScores = calculateZScores(
        gender,
        ageMonths,
        record.weightKg,
        record.heightCm,
        record.headCircCm
      );
      
      return {
        ...record,
        ageMonths,
        zScores
      };
    });

    // Sort ascending by measuredAt (chronological order for drawing graphs)
    return evaluatedRecords.sort((a, b) => new Date(a.measuredAt) - new Date(b.measuredAt));
  };

  /**
   * Validates and inserts or updates a growth measurement record.
   * Supports overwrite mode for duplications on the same date, calculates WHO Z-Scores,
   * and publishes automated system notifications about the child's status.
   * 
   * @param {string} childId - Target child profile ID.
   * @param {Object} recordData - The input measurement details.
   * @returns {Object} Saved growth record object.
   */
  const addGrowthRecord = (childId, recordData) => {
    const children = getCollection('children');
    const child = children.find(c => c.id === childId);
    if (!child) {
      throw new Error('Profil anak tidak ditemukan, Bunda. 🧡');
    }

    const weightKg = parseFloat(recordData.weightKg);
    const heightCm = parseFloat(recordData.heightCm);
    const headCircCm = recordData.headCircCm ? parseFloat(recordData.headCircCm) : null;
    const measuredAt = recordData.measuredAt;
    const notes = recordData.notes || '';

    // General Validations
    if (!measuredAt) {
      throw new Error('Tanggal pengukuran tidak boleh kosong, Bunda. 🧡');
    }
    if (isNaN(weightKg) || weightKg <= 0) {
      throw new Error('Berat badan si kecil tidak boleh kosong dan harus bernilai positif, Bunda. 🧡');
    }
    if (isNaN(heightCm) || heightCm <= 0) {
      throw new Error('Tinggi badan si kecil tidak boleh kosong dan harus bernilai positif, Bunda. 🧡');
    }
    if (recordData.headCircCm !== undefined && recordData.headCircCm !== null && recordData.headCircCm !== '') {
      if (isNaN(headCircCm) || headCircCm <= 0) {
        throw new Error('Lingkar kepala si kecil harus bernilai positif, Bunda. 🧡');
      }
    }

    // Typo Protection / Medical Boundary Validations
    if (weightKg < 1.0 || weightKg > 40.0) {
      throw new Error('Berat badan harus berada di antara rentang wajar 1.0 kg dan 40.0 kg, ya Bunda. 🧡');
    }
    if (heightCm < 30.0 || heightCm > 130.0) {
      throw new Error('Tinggi badan harus berada di antara rentang wajar 30.0 cm dan 130.0 cm, ya Bunda. 🧡');
    }
    if (headCircCm !== null && (headCircCm < 25.0 || headCircCm > 60.0)) {
      throw new Error('Lingkar kepala harus berada di antara rentang wajar 25.0 cm dan 60.0 cm, ya Bunda. 🧡');
    }

    // Date validations
    const dob = new Date(child.dateOfBirth);
    const measured = new Date(measuredAt);
    const today = new Date();
    
    const dobDateOnly = new Date(dob.getFullYear(), dob.getMonth(), dob.getDate());
    const measuredDateOnly = new Date(measured.getFullYear(), measured.getMonth(), measured.getDate());
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (measuredDateOnly > todayDateOnly) {
      throw new Error('Tanggal pengukuran tidak boleh melewati hari ini, ya Bunda. 🧡');
    }
    if (measuredDateOnly < dobDateOnly) {
      throw new Error(`Tanggal pengukuran tidak boleh mendahului tanggal lahir si kecil (${child.dateOfBirth}), ya Bunda. 🧡`);
    }

    // Duplicate Check
    const existingRecords = getCollection('growthRecords').filter(r => r.childId === childId);
    const duplicate = existingRecords.find(r => r.measuredAt === measuredAt);
    
    let resultRecord;

    if (duplicate) {
      if (!recordData.overwrite) {
        const err = new Error('DUPLICATE_MEASUREMENT_DATE');
        err.message = `Bunda sudah pernah mencatat pertumbuhan si kecil pada tanggal ${measuredAt}.`;
        throw err;
      }
      
      // Update/overwrite record
      resultRecord = updateItem('growthRecords', duplicate.id, {
        weightKg,
        heightCm,
        headCircCm,
        notes,
        updatedAt: new Date().toISOString()
      });
    } else {
      // Insert new record
      const recordId = crypto.randomUUID();
      const newRecord = {
        id: recordId,
        childId,
        measuredAt,
        weightKg,
        heightCm,
        headCircCm,
        notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      resultRecord = insertItem('growthRecords', newRecord);
    }

    // Calculate real-time WHO Z-Scores to write a descriptive notification
    const gender = child.gender || 'L';
    const ageMonths = calculateAgeInMonthsAt(child.dateOfBirth, measuredAt);
    const zScores = calculateZScores(gender, ageMonths, weightKg, heightCm, headCircCm);
    const weightStatus = zScores.weightForAge.status;

    // TODO: Clean up notifications older than 30 days to prevent infinite array growth (Issue 2c)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const appData = getAppData();
    const cleanNotifications = (appData.notifications || []).filter(n => {
      const createdDate = new Date(n.createdAt || n.scheduledAt);
      return createdDate >= thirtyDaysAgo;
    });

    // Generate in-app growth notification
    const notificationBody = `Catatan pertumbuhan ${child.name} tanggal ${measuredAt} berhasil disimpan dengan status ${weightStatus}. Kerja bagus, Bunda! 🧡`;
    
    const newNotification = {
      id: crypto.randomUUID(),
      userId: child.userId,
      type: 'growth',
      title: `Pertumbuhan ${child.name}`,
      body: notificationBody,
      isRead: false,
      scheduledAt: new Date().toISOString(),
      referenceId: resultRecord.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    cleanNotifications.push(newNotification);
    appData.notifications = cleanNotifications;
    saveAppData(appData);

    return resultRecord;
  };

  /**
   * Updates an existing growth record.
   * 
   * @param {string} recordId - Growth record ID.
   * @param {Object} updates - Properties to modify.
   * @returns {Object|null} Updated record.
   */
  const updateGrowthRecord = (recordId, updates) => {
    return updateItem('growthRecords', recordId, updates);
  };

  /**
   * Deletes a growth record physically.
   * 
   * @param {string} recordId - Target growth record ID.
   * @returns {boolean} Success status.
   */
  const deleteGrowthRecord = (recordId) => {
    return deleteItem('growthRecords', recordId, false);
  };

  return {
    getGrowthRecords,
    addGrowthRecord,
    updateGrowthRecord,
    deleteGrowthRecord
  };
}
