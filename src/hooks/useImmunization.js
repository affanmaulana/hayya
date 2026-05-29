import { useState, useEffect, useCallback } from 'react';
import { getCollection, insertItem, updateItem, getAppData, saveAppData } from '../utils/localStorageUtils';
import { addMonths, formatDate } from '../utils/dateHelpers';

/**
 * Hook to manage child immunization calendars and logs offline.
 * 
 * @param {string} [childId] - Optional active child ID to auto-load calendar.
 */
export function useImmunization(childId) {
  const [calendar, setCalendar] = useState([]);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Scans for upcoming immunization schedules and writes a alert to notifications.
   */
  const scanAndTriggerNotifications = useCallback((cId) => {
    const targetChild = cId || childId;
    if (!targetChild) return;

    const child = getCollection('children').find(c => c.id === targetChild);
    if (!child) return;

    const records = getCollection('immunizationRecords').filter(r => r.childId === targetChild);
    const vaccines = getCollection('vaccines');
    const notifications = getCollection('notifications');
    const today = new Date();
    
    records.forEach(r => {
      if (r.status === 'scheduled') {
        const scheduled = new Date(r.scheduledDate);
        const diffTime = scheduled - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 7) {
          const vaccine = vaccines.find(v => v.id === r.vaccineId);
          if (!vaccine) return;

          const exists = notifications.some(n => n.referenceId === r.id && n.type === 'immunization');
          if (!exists) {
            const formattedDate = formatDate(r.scheduledDate);
            const bodyMessage = `Bunda, jadwal imunisasi ${vaccine.name} untuk ${child.name} mendekati tanggal target (${formattedDate}). Yuk persiapkan kunjungan ke Posyandu atau Klinik!`;
            
            insertItem('notifications', {
              userId: child.userId,
              type: 'immunization',
              title: 'Jadwal Imunisasi Mendekati Target 🧡',
              body: bodyMessage,
              isRead: false,
              scheduledAt: new Date().toISOString(),
              referenceId: r.id
            });
          }
        }
      }
    });
  }, [childId]);

  /**
   * Returns child immunization calendar with target dates and details.
   * Auto-seeds immunization records if empty, and auto-adjusts scheduled dates on DOB changes.
   * 
   * @param {string} cId - Child ID.
   * @param {string} [dateOfBirth] - Child's birthdate.
   * @returns {Array} List of immunization records.
   */
  const getImmunizationCalendar = useCallback((cId, dateOfBirth) => {
    const targetChild = cId || childId;
    if (!targetChild) return [];

    let dob = dateOfBirth;
    const child = getCollection('children').find(c => c.id === targetChild);
    if (child && !dob) {
      dob = child.dateOfBirth;
    }

    if (!dob) return [];

    let records = getCollection('immunizationRecords').filter(r => r.childId === targetChild);
    const vaccines = getCollection('vaccines');

    // 1. Initialize records if empty
    if (records.length === 0 && vaccines.length > 0) {
      const initialRecords = vaccines.map(v => {
        const scheduledDate = addMonths(dob, v.recommendedAgeMonths);
        return {
          id: crypto.randomUUID(),
          childId: targetChild,
          vaccineId: v.id,
          status: 'scheduled',
          scheduledDate,
          actualDate: null,
          location: '',
          healthcareWorker: '',
          sideEffectsNoted: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      });

      const appData = getAppData();
      appData.immunizationRecords = [...appData.immunizationRecords, ...initialRecords];
      saveAppData(appData);

      records = initialRecords;
    }

    // 2. Adjust scheduled dates if DOB changes on child profile
    let hasDobChanged = false;
    records.forEach(r => {
      if (r.status === 'scheduled') {
        const v = vaccines.find(vac => vac.id === r.vaccineId);
        if (v) {
          const expectedDate = addMonths(dob, v.recommendedAgeMonths);
          if (r.scheduledDate !== expectedDate) {
            hasDobChanged = true;
          }
        }
      }
    });

    if (hasDobChanged) {
      const appData = getAppData();
      appData.immunizationRecords = appData.immunizationRecords.map(r => {
        if (r.childId === targetChild && r.status === 'scheduled') {
          const v = vaccines.find(vac => vac.id === r.vaccineId);
          if (v) {
            return {
              ...r,
              scheduledDate: addMonths(dob, v.recommendedAgeMonths),
              updatedAt: new Date().toISOString()
            };
          }
        }
        return r;
      });
      saveAppData(appData);
      records = appData.immunizationRecords.filter(r => r.childId === targetChild);
    }

    // 3. Join with vaccine details
    const joined = records.map(r => {
      const v = vaccines.find(vac => vac.id === r.vaccineId) || {};
      const scheduledTime = new Date(r.scheduledDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isLate = r.status === 'scheduled' && scheduledTime < today;

      return {
        ...r,
        vaccine: v,
        isLate
      };
    });

    return joined.sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
  }, [childId]);

  // Load calendar state automatically for provided childId
  const loadCalendar = useCallback(() => {
    if (!childId) {
      setCalendar([]);
      setProgress(0);
      return;
    }

    setLoading(true);
    try {
      const list = getImmunizationCalendar(childId);
      setCalendar(list);

      if (list.length > 0) {
        const completedCount = list.filter(r => r.status === 'done').length;
        setProgress(Math.round((completedCount / list.length) * 100));
      } else {
        setProgress(0);
      }

      scanAndTriggerNotifications(childId);
      setError(null);
    } catch (err) {
      console.error('Error in useImmunization loadCalendar:', err);
      setError('Gagal memuat kalender imunisasi, Bunda.');
    } finally {
      setLoading(false);
    }
  }, [childId, getImmunizationCalendar, scanAndTriggerNotifications]);

  // Sync calendar on childId change
  useEffect(() => {
    loadCalendar();
  }, [childId, loadCalendar]);

  /**
   * Updates or inserts a vaccine immunization record.
   * 
   * @param {string} cId - Child ID.
   * @param {string} vaccineId - Vaccine ID.
   * @param {'done'|'scheduled'} status - Completed status.
   * @param {string} actualDate - Real immunization date YYYY-MM-DD.
   * @param {string} location - Location.
   * @param {string} healthworker - Healthcare worker.
   * @param {string} KIPI - Side effects notes.
   */
  const updateImmunizationRecord = useCallback(async (
    cId,
    vaccineId,
    status,
    actualDate,
    location,
    healthworker,
    KIPI
  ) => {
    const targetChild = cId || childId;
    if (!targetChild) {
      throw new Error("Bunda belum memilih profil si Kecil ya. 🧡");
    }

    const child = getCollection('children').find(c => c.id === targetChild);
    if (!child) {
      throw new Error("Profil anak tidak ditemukan ya, Bunda. 🧡");
    }

    if (status === 'done') {
      if (!actualDate) {
        throw new Error("Tanggal pemberian harus diisi ya, Bunda. 🧡");
      }
      const today = new Date().toISOString().split('T')[0];
      if (actualDate > today) {
        throw new Error("Tanggal imunisasi tidak boleh di masa depan ya, Bunda.");
      }
      if (actualDate < child.dateOfBirth) {
        throw new Error(`Tanggal imunisasi tidak boleh mendahului tanggal lahir si Kecil (${formatDate(child.dateOfBirth)}) ya, Bunda.`);
      }
    }

    try {
      const records = getCollection('immunizationRecords');
      const existing = records.find(r => r.childId === targetChild && r.vaccineId === vaccineId);

      const recordData = {
        childId: targetChild,
        vaccineId,
        status,
        actualDate: status === 'done' ? actualDate : null,
        location: status === 'done' ? (location || '') : '',
        healthcareWorker: status === 'done' ? (healthworker || '') : '',
        sideEffectsNoted: status === 'done' ? (KIPI || '') : '',
        updatedAt: new Date().toISOString()
      };

      if (existing) {
        updateItem('immunizationRecords', existing.id, recordData);
      } else {
        const vaccine = getCollection('vaccines').find(v => v.id === vaccineId);
        const scheduledDate = vaccine ? addMonths(child.dateOfBirth, vaccine.recommendedAgeMonths) : child.dateOfBirth;
        insertItem('immunizationRecords', {
          ...recordData,
          scheduledDate
        });
      }

      // Automatically add a local notification for successful vaccination with 30-day cleanup (Issue 2c)
      if (status === 'done') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const appData = getAppData();
        const cleanNotifications = (appData.notifications || []).filter(n => {
          const createdDate = new Date(n.createdAt || n.scheduledAt);
          return createdDate >= thirtyDaysAgo;
        });

        const vaccine = getCollection('vaccines').find(v => v.id === vaccineId);
        const congratsMsg = `Yeay! Imunisasi ${vaccine ? vaccine.name : 'Vaksin'} untuk si Kecil ${child.name} berhasil dicatat. Semoga sehat selalu ya, Bunda! 🧡`;
        
        const newNotification = {
          id: crypto.randomUUID(),
          userId: child.userId,
          type: 'immunization_done',
          title: 'Imunisasi Berhasil Dicatat! 🎉',
          body: congratsMsg,
          isRead: false,
          referenceId: vaccineId,
          scheduledAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        cleanNotifications.push(newNotification);
        appData.notifications = cleanNotifications;
        saveAppData(appData);
      }

      // Reload calendar to update the UI
      loadCalendar();
      setError(null);
    } catch (err) {
      console.error('Error updating immunization record in useImmunization:', err);
      throw err;
    }
  }, [childId, loadCalendar]);

  return {
    calendar,
    progress,
    loading,
    error,
    getImmunizationCalendar,
    updateImmunizationRecord,
    scanAndTriggerNotifications,
    refresh: loadCalendar
  };
}
export default useImmunization;
