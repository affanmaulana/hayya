import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCollection, insertItem, updateItem, getAppData, saveAppData } from '../utils/localStorageUtils';
import { addMonths, formatDate } from '../utils/dateHelpers';

const ImmunizationContext = createContext(null);

export function ImmunizationProvider({ children }) {
  const [calendar, setCalendar] = useState([]);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeChildId, setActiveChildId] = useState(null);

  // Sync active child ID from LocalStorage
  const syncActiveChild = useCallback(() => {
    try {
      const childrenList = getCollection('children');
      const activeChild = childrenList.find(c => c.isActive === true);
      if (activeChild) {
        setActiveChildId(activeChild.id);
      } else {
        setActiveChildId(null);
      }
    } catch (err) {
      console.error('Error syncing active child in ImmunizationContext:', err);
    }
  }, []);

  // Sync active child on mount
  useEffect(() => {
    syncActiveChild();
    
    const handleStorageChange = (e) => {
      if (e.key === 'hayya_app_data') {
        syncActiveChild();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [syncActiveChild]);

  // scanAndTriggerNotifications: Checks for upcoming schedules (<= 7 days) and creates notifications
  const scanAndTriggerNotifications = useCallback((cId) => {
    const targetChildId = cId || activeChildId;
    if (!targetChildId) return;

    const child = getCollection('children').find(c => c.id === targetChildId);
    if (!child) return;

    const records = getCollection('immunizationRecords').filter(r => r.childId === targetChildId);
    const vaccines = getCollection('vaccines');
    const notifications = getCollection('notifications');
    const today = new Date();
    
    records.forEach(r => {
      if (r.status === 'scheduled') {
        const scheduled = new Date(r.scheduledDate);
        const diffTime = scheduled - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Trigger if scheduledDate is within 7 days or already late/terlambat
        if (diffDays <= 7) {
          const vaccine = vaccines.find(v => v.id === r.vaccineId);
          if (!vaccine) return;

          // Check if there is already a notification for this record
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
  }, [activeChildId]);

  // getImmunizationCalendar: returns chronological list of vaccines joined with completed/scheduled records
  const getImmunizationCalendar = useCallback((cId, dateOfBirth) => {
    const targetChildId = cId || activeChildId;
    if (!targetChildId) return [];

    let dob = dateOfBirth;
    const child = getCollection('children').find(c => c.id === targetChildId);
    if (child && !dob) {
      dob = child.dateOfBirth;
    }

    if (!dob) return [];

    let records = getCollection('immunizationRecords').filter(r => r.childId === targetChildId);
    const vaccines = getCollection('vaccines');

    // 1. Initial Seeding if empty
    if (records.length === 0 && vaccines.length > 0) {
      const initialRecords = vaccines.map(v => {
        const scheduledDate = addMonths(dob, v.recommendedAgeMonths);
        return {
          id: crypto.randomUUID(),
          childId: targetChildId,
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

    // 2. Handle DOB change (Recalculate target dates for uncompleted vaccines)
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
        if (r.childId === targetChildId && r.status === 'scheduled') {
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
      records = appData.immunizationRecords.filter(r => r.childId === targetChildId);
    }

    // 3. Join with vaccines and sort chronologically
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

    // Sort chronologically by scheduled date
    return joined.sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
  }, [activeChildId]);

  // Load calendar state automatically for active child
  const loadCalendar = useCallback(() => {
    if (!activeChildId) {
      setCalendar([]);
      setProgress(0);
      return;
    }

    setLoading(true);
    try {
      const list = getImmunizationCalendar(activeChildId);
      setCalendar(list);

      // Calculate progress percentage
      if (list.length > 0) {
        const completed = list.filter(r => r.status === 'done').length;
        const pct = Math.round((completed / list.length) * 100);
        setProgress(pct);
      } else {
        setProgress(0);
      }
      
      // Auto-scan for upcoming immunizations
      scanAndTriggerNotifications(activeChildId);
      setError(null);
    } catch (err) {
      console.error('Error loading immunization calendar:', err);
      setError('Gagal memuat kalender imunisasi, Bunda.');
    } finally {
      setLoading(false);
    }
  }, [activeChildId, getImmunizationCalendar, scanAndTriggerNotifications]);

  // Load when activeChildId changes
  useEffect(() => {
    loadCalendar();
  }, [activeChildId, loadCalendar]);

  // updateImmunizationRecord: Marks a vaccine as done or scheduled with validations
  const updateImmunizationRecord = useCallback(async (
    cId,
    vaccineId,
    status,
    actualDate,
    location,
    healthworker,
    KIPI
  ) => {
    const targetChildId = cId || activeChildId;
    if (!targetChildId) {
      throw new Error("Bunda belum memilih profil si Kecil ya. 🧡");
    }

    const child = getCollection('children').find(c => c.id === targetChildId);
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
      const existing = records.find(r => r.childId === targetChildId && r.vaccineId === vaccineId);

      const recordData = {
        childId: targetChildId,
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
        // Fallback initialization
        const vaccine = getCollection('vaccines').find(v => v.id === vaccineId);
        const scheduledDate = vaccine ? addMonths(child.dateOfBirth, vaccine.recommendedAgeMonths) : child.dateOfBirth;
        insertItem('immunizationRecords', {
          ...recordData,
          scheduledDate
        });
      }

      // Add success / congrats in-app notification if marked as completed
      if (status === 'done') {
        const vaccine = getCollection('vaccines').find(v => v.id === vaccineId);
        const congratsMsg = `Yeay! Imunisasi ${vaccine ? vaccine.name : 'Vaksin'} untuk si Kecil ${child.name} berhasil dicatat. Semoga sehat selalu ya, Bunda! 🧡`;
        insertItem('notifications', {
          userId: child.userId,
          type: 'immunization_done',
          title: 'Imunisasi Berhasil Dicatat! 🎉',
          body: congratsMsg,
          isRead: false,
          referenceId: vaccineId,
          scheduledAt: new Date().toISOString()
        });
      }

      // Reload calendar to reflect updates in the UI
      loadCalendar();
      setError(null);
    } catch (err) {
      console.error('Error updating immunization record:', err);
      throw err;
    }
  }, [activeChildId, loadCalendar]);

  return (
    <ImmunizationContext.Provider value={{
      calendar,
      progress,
      loading,
      error,
      getImmunizationCalendar,
      updateImmunizationRecord,
      scanAndTriggerNotifications,
      refresh: loadCalendar,
      syncActiveChild
    }}>
      {children}
    </ImmunizationContext.Provider>
  );
}

export function useImmunizationContext() {
  const context = useContext(ImmunizationContext);
  if (!context) {
    throw new Error('useImmunizationContext must be used within an ImmunizationProvider');
  }
  return context;
}
