import { useState, useEffect, useCallback } from 'react';
import { getCollection, insertItem, updateItem } from '../utils/localStorageUtils';

/**
 * Hook to manage child development milestones.
 * Handles fetching, filtering, joining with records, saving, and checking red flags offline.
 * 
 * @param {string} [childId] - Optional active child ID to auto-load progress.
 */
export function useMilestones(childId) {
  const [milestonesList, setMilestonesList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load progress for a specific child
  const loadProgress = useCallback((cId) => {
    const targetChild = cId || childId;
    if (!targetChild) {
      setMilestonesList([]);
      return;
    }
    
    setLoading(true);
    try {
      const milestones = getCollection('milestones');
      const records = getCollection('milestoneRecords').filter(r => r.childId === targetChild);
      
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
      console.error('Error in useMilestones loadProgress:', err);
      setError('Gagal memuat data perkembangan, Bunda.');
    } finally {
      setLoading(false);
    }
  }, [childId]);

  // Load on mount or when childId changes
  useEffect(() => {
    loadProgress();
  }, [childId, loadProgress]);

  /**
   * Filters static milestones master data for the age group.
   * 
   * @param {number} ageInMonths - Child age in months.
   * @returns {Array} List of milestones matching the age group.
   */
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

  /**
   * Returns list of milestones joined with milestoneRecords.
   * 
   * @param {string} cId - Child ID.
   * @returns {Array} Milestones with status and notes.
   */
  const getMilestoneProgress = useCallback((cId) => {
    const targetChild = cId || childId;
    if (!targetChild) return [];

    const milestones = getCollection('milestones');
    const records = getCollection('milestoneRecords').filter(r => r.childId === targetChild);
    
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
  }, [childId]);

  /**
   * Updates or inserts a milestone progress record.
   * 
   * @param {string} cId - Child ID.
   * @param {string} milestoneId - Milestone ID.
   * @param {'achieved'|'monitoring'|'not_yet'} status - Status.
   * @param {string|Object} notes - Notes or config object { notes, achievedAt }.
   */
  const toggleMilestone = useCallback(async (cId, milestoneId, status, notes) => {
    const targetChild = cId || childId;
    if (!targetChild) {
      throw new Error("Bunda belum memilih profil si Kecil ya. 🧡");
    }

    const child = getCollection('children').find(c => c.id === targetChild);
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
      const existing = records.find(r => r.childId === targetChild && r.milestoneId === milestoneId);
      
      const recordData = {
        childId: targetChild,
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

      // Check if critical milestone achieved to trigger local in-app notification
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

      // Refresh local list state
      loadProgress(targetChild);
      setError(null);
    } catch (err) {
      console.error('Error toggling milestone:', err);
      throw err;
    }
  }, [childId, loadProgress]);

  /**
   * Scans for red flags based on child age and schedules warning notifications if necessary.
   * 
   * @param {string} cId - Child ID.
   * @param {number} ageInMonths - Child's age in months.
   */
  const checkRedFlags = useCallback((cId, ageInMonths) => {
    const targetChild = cId || childId;
    if (!targetChild) return;

    const child = getCollection('children').find(c => c.id === targetChild);
    if (!child) return;

    const progress = getMilestoneProgress(targetChild);
    const notifications = getCollection('notifications');

    progress.forEach(m => {
      if (m.isCritical && ageInMonths > m.ageMaxMonths && m.status !== 'achieved') {
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
  }, [childId, getMilestoneProgress]);

  return {
    milestonesList,
    loading,
    error,
    getMilestonesByAge,
    getMilestoneProgress,
    toggleMilestone,
    checkRedFlags,
    refresh: () => loadProgress(childId)
  };
}
