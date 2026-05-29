import { useContext } from 'react';
import { ChildContext } from '../context/ChildContext.jsx';
import { getCollection, insertItem, updateItem, deleteItem } from '../utils/localStorageUtils.js';

export function useChild() {
  const context = useContext(ChildContext);
  const refreshChildren = context ? context.refreshChildren : () => {};
  const activeChildId = context ? context.activeChildId : '';
  const setActiveChildId = context ? context.setActiveChildId : () => {};

  // Helper to get logged-in user ID
  const getLoggedInUserId = () => {
    return localStorage.getItem('hayya_active_user_id') || 
           localStorage.getItem('hayya_logged_in_user_id') || 
           localStorage.getItem('hayya_current_user_id') || 
           '';
  };

  /**
   * Retrieves active children records (isActive !== false) for the logged-in user.
   * 
   * @returns {Array} List of active children.
   */
  const getChildren = () => {
    const loggedInUserId = getLoggedInUserId();
    if (!loggedInUserId) return [];
    
    const allChildren = getCollection('children');
    return allChildren.filter(c => c.userId === loggedInUserId && c.isActive !== false);
  };

  /**
   * Adds a new child profile for the logged-in user.
   * Validates dateOfBirth <= today, generates UUID, and sets default metadata.
   * 
   * @param {Object} childData - Form input data of the child.
   * @returns {Object} Newly inserted child object.
   */
  const addChild = (childData) => {
    const loggedInUserId = getLoggedInUserId();
    if (!loggedInUserId) {
      throw new Error('Bunda harus masuk log terlebih dahulu untuk menambahkan profil si kecil. 🧡');
    }

    // Input Validation
    if (!childData.name || !childData.name.trim()) {
      throw new Error('Nama panggilan si kecil tidak boleh kosong, Bunda. 🧡');
    }
    if (!childData.dateOfBirth) {
      throw new Error('Tanggal lahir si kecil tidak boleh kosong, Bunda. 🧡');
    }

    const dob = new Date(childData.dateOfBirth);
    const today = new Date();
    // Compare dates ignoring times
    const dobDateOnly = new Date(dob.getFullYear(), dob.getMonth(), dob.getDate());
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (dobDateOnly > todayDateOnly) {
      throw new Error('Tanggal lahir si kecil tidak boleh melewati hari ini, ya Bunda. 🧡');
    }

    const id = crypto.randomUUID();
    const newChild = {
      ...childData,
      id,
      userId: loggedInUserId,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    const inserted = insertItem('children', newChild);
    
    // Auto-select this newly created child as the active child
    localStorage.setItem('hayya_active_child_id', id);
    updateItem('users', loggedInUserId, { lastActiveChildId: id });
    
    // Refresh the context state
    refreshChildren();

    return inserted;
  };

  /**
   * Updates an existing child profile.
   * Validates dateOfBirth if it is being updated.
   * 
   * @param {string} childId - Child ID to update.
   * @param {Object} updates - Properties to update.
   * @returns {Object|null} Updated child object or null.
   */
  const updateChild = (childId, updates) => {
    const loggedInUserId = getLoggedInUserId();
    if (!loggedInUserId) {
      throw new Error('Bunda harus masuk log terlebih dahulu untuk mengubah profil si kecil. 🧡');
    }

    // Validate date of birth if included in updates
    if (updates.dateOfBirth) {
      const dob = new Date(updates.dateOfBirth);
      const today = new Date();
      const dobDateOnly = new Date(dob.getFullYear(), dob.getMonth(), dob.getDate());
      const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      if (dobDateOnly > todayDateOnly) {
        throw new Error('Tanggal lahir si kecil tidak boleh melewati hari ini, ya Bunda. 🧡');
      }
    }

    const updated = updateItem('children', childId, updates);
    refreshChildren();
    return updated;
  };

  /**
   * Soft deletes a child profile (isActive: false).
   * Automatically clears or updates active child references if they match the deleted child.
   * 
   * @param {string} childId - Child ID to delete.
   * @returns {boolean} Success status of deletion.
   */
  const deleteChild = (childId) => {
    const loggedInUserId = getLoggedInUserId();
    if (!loggedInUserId) {
      throw new Error('Bunda harus masuk log terlebih dahulu untuk menghapus profil si kecil. 🧡');
    }

    // Soft delete the child using standard localStorage utility
    const success = deleteItem('children', childId, true);
    
    if (success) {
      // If the deleted child was currently selected, clear or transition selection to next child
      const currentActiveId = localStorage.getItem('hayya_active_child_id') || activeChildId;
      if (currentActiveId === childId) {
        const remainingChildren = getChildren().filter(c => c.id !== childId);
        const nextActiveId = remainingChildren.length > 0 ? remainingChildren[0].id : '';
        
        localStorage.setItem('hayya_active_child_id', nextActiveId);
        updateItem('users', loggedInUserId, { lastActiveChildId: nextActiveId });
        
        if (context) {
          setActiveChildId(nextActiveId);
        }
      }
      
      refreshChildren();
    }
    
    return success;
  };

  return {
    getChildren,
    addChild,
    updateChild,
    deleteChild,
    activeChildId,
    setActiveChildId,
    activeChild: context ? context.activeChild : null,
    childrenList: context ? context.childrenList : []
  };
}
