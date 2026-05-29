import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCollection, insertItem, updateItem, getAppData } from '../utils/localStorageUtils';

const MilestonesContext = createContext(null);

export function MilestonesProvider({ children }) {
  const [milestonesList, setMilestonesList] = useState([]);
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
      console.error('Error syncing active child in MilestonesContext:', err);
    }
  }, []);

  // Sync active child on mount
  useEffect(() => {
    syncActiveChild();
    
    // Set up a storage event listener for cross-tab or external changes
    const handleStorageChange = (e) => {
      if (e.key === 'hayya_app_data') {
        syncActiveChild();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [syncActiveChild]);

  // Load progress for a specific child or active child
  const loadProgress = useCallback((cId) => {
    const targetChildId = cId || activeChildId;
    if (!targetChildId) {
      setMilestonesList([]);
      return;
    }
    
    setLoading(true);
    try {
      const milestones = getCollection('milestones');
      const records = getCollection('milestoneRecords').filter(r => r.childId === targetChildId);
      
      const joined = milestones.map(m => {
        const record = records.find(r => r.milestoneId === m.id);
        return {
          ...m,
          status: record ? record.status : 'not_yet',
          achievedAt: record ? record.achievedAt : null,
          notes: record ? record.notes : '',
          recordId: record ? record.id : null,
          updatedAt: record ? record.updatedAt : null
        };
      });
      
      setMilestonesList(joined);
      setError(null);
    } catch (err) {
      console.error('Error loading milestone progress:', err);
      setError('Gagal memuat data perkembangan, Bunda.');
    } finally {
      setLoading(false);
    }
  }, [activeChildId]);

  // Reload progress when active child changes
  useEffect(() => {
    loadProgress();
  }, [activeChildId, loadProgress]);

  // getMilestonesByAge: Filters static milestones master data for the age group
  const getMilestonesByAge = useCallback((ageInMonths) => {
    const milestones = getCollection('milestones');
    let min = 0, max = 3;
    
    if (ageInMonths < 3) { min = 0; max = 3; }
    else if (ageInMonths < 6) { min = 3; max = 6; }
    else if (ageInMonths < 9) { min = 6; max = 9; }
    else if (ageInMonths < 12) { min = 9; max = 12; }
    else if (ageInMonths < 18) { min = 12; max = 18; }
    else if (ageInMonths < 24) { min = 18; max = 24; }
    else if (ageInMonths < 36) { min = 24; max = 36; }
    else if (ageInMonths < 48) { min = 36; max = 48; }
    else { min = 48; max = 60; }

    return milestones.filter(m => m.ageMinMonths === min && m.ageMaxMonths === max);
  }, []);

  // getMilestoneProgress: Returns list of milestones joined with milestoneRecords
  const getMilestoneProgress = useCallback((cId) => {
    const targetChildId = cId || activeChildId;
    if (!targetChildId) return [];

    const milestones = getCollection('milestones');
    const records = getCollection('milestoneRecords').filter(r => r.childId === targetChildId);
    
    return milestones.map(m => {
      const record = records.find(r => r.milestoneId === m.id);
      return {
        ...m,
        status: record ? record.status : 'not_yet',
        achievedAt: record ? record.achievedAt : null,
        notes: record ? record.notes : '',
        recordId: record ? record.id : null,
        updatedAt: record ? record.updatedAt : null
      };
    });
  }, [activeChildId]);

  // toggleMilestone: Updates or inserts a record in milestoneRecords table
  const toggleMilestone = useCallback(async (cId, milestoneId, status, notes) => {
    const targetChildId = cId || activeChildId;
    if (!targetChildId) {
      throw new Error("Bunda belum memilih profil si Kecil ya. 🧡");
    }

    const child = getCollection('children').find(c => c.id === targetChildId);
    if (!child) {
      throw new Error("Profil anak tidak ditemukan ya, Bunda. 🧡");
    }

    let notesText = '';
    let achievedAtVal = null;
    if (notes && typeof notes === 'object') {
      notesText = notes.notes || '';
      achievedAtVal = notes.achievedAt || new Date().toISOString().split('T')[0];
    } else {
      notesText = notes || '';
      achievedAtVal = new Date().toISOString().split('T')[0];
    }

    if (status === 'achieved') {
      const dob = child.dateOfBirth;
      const today = new Date().toISOString().split('T')[0];
      if (achievedAtVal < dob) {
        throw new Error("Tanggal pencapaian tidak boleh sebelum tanggal lahir si Kecil ya, Bunda! 🧡");
      }
      if (achievedAtVal > today) {
        throw new Error("Tanggal pencapaian tidak boleh melebihi tanggal hari ini, Bunda.");
      }
    } else {
      achievedAtVal = null;
    }

    try {
      const records = getCollection('milestoneRecords');
      const existing = records.find(r => r.childId === targetChildId && r.milestoneId === milestoneId);
      
      const recordData = {
        childId: targetChildId,
        milestoneId,
        status,
        achievedAt: achievedAtVal,
        notes: notesText,
      };

      if (existing) {
        updateItem('milestoneRecords', existing.id, recordData);
      } else {
        insertItem('milestoneRecords', recordData);
      }

      // Check for isCritical achievement to trigger notification
      const milestone = getCollection('milestones').find(m => m.id === milestoneId);
      if (milestone && milestone.isCritical && status === 'achieved') {
        const notifMessage = `Hebat sekali Bunda! Si Kecil ${child.name} sudah berhasil melewati fase perkembangan penting: "${milestone.description}". Terus berikan stimulasi terbaik ya! 🎉`;
        insertItem('notifications', {
          userId: child.userId,
          type: 'milestone',
          title: 'Perkembangan Penting Tercapai! 🧡',
          body: notifMessage,
          isRead: false,
          referenceId: milestoneId,
          scheduledAt: new Date().toISOString()
        });
      }

      // Reload state
      loadProgress(targetChildId);
      setError(null);
    } catch (err) {
      console.error('Error updating milestone record:', err);
      throw err;
    }
  }, [activeChildId, loadProgress]);

  // checkRedFlags: Scans and generates red flag alerts inside notifications collection
  const checkRedFlags = useCallback((cId, ageInMonths) => {
    const targetChildId = cId || activeChildId;
    if (!targetChildId) return;

    const child = getCollection('children').find(c => c.id === targetChildId);
    if (!child) return;

    const progress = getMilestoneProgress(targetChildId);
    const notifications = getCollection('notifications');

    progress.forEach(m => {
      // Check if child age exceeds ageMaxMonths and milestone is critical (Red Flag) and not achieved yet
      if (m.isCritical && ageInMonths > m.ageMaxMonths && m.status !== 'achieved') {
        // Check if notification already exists
        const exists = notifications.some(n => n.userId === child.userId && n.referenceId === m.id && n.type === 'red_flag');
        if (!exists) {
          const bodyMessage = `Peringatan Red Flag: Si Kecil ${child.name} sudah berusia ${ageInMonths} bulan tetapi belum mencapai milestone: "${m.description}". Yuk Bunda, coba lakukan stimulasi harian atau konsultasikan ke tenaga medis terdekat. 🩺`;
          insertItem('notifications', {
            userId: child.userId,
            type: 'red_flag',
            title: 'Peringatan Perkembangan (Red Flag) 🩺',
            body: bodyMessage,
            isRead: false,
            referenceId: m.id,
            scheduledAt: new Date().toISOString()
          });
        }
      }
    });
  }, [activeChildId, getMilestoneProgress]);

  return (
    <MilestonesContext.Provider value={{
      milestonesList,
      loading,
      error,
      getMilestonesByAge,
      getMilestoneProgress,
      toggleMilestone,
      checkRedFlags,
      refresh: () => loadProgress(activeChildId),
      syncActiveChild
    }}>
      {children}
    </MilestonesContext.Provider>
  );
}

export function useMilestonesContext() {
  const context = useContext(MilestonesContext);
  if (!context) {
    throw new Error('useMilestonesContext must be used within a MilestonesProvider');
  }
  return context;
}
