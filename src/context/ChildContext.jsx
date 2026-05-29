import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCollection, updateItem } from '../utils/localStorageUtils.js';

export const ChildContext = createContext(null);

export const ChildProvider = ({ children }) => {
  const [childrenList, setChildrenList] = useState([]);
  const [activeChildId, setActiveChildIdState] = useState('');
  const [activeChild, setActiveChild] = useState(null);

  // Helper to get logged-in user ID
  const getLoggedInUserId = useCallback(() => {
    return localStorage.getItem('hayya_active_user_id') || 
           localStorage.getItem('hayya_logged_in_user_id') || 
           localStorage.getItem('hayya_current_user_id') || 
           '';
  }, []);

  const refreshChildren = useCallback(() => {
    const loggedInUserId = getLoggedInUserId();
    if (!loggedInUserId) {
      setChildrenList([]);
      setActiveChildIdState('');
      setActiveChild(null);
      return;
    }

    const allChildren = getCollection('children');
    const activeChildren = allChildren.filter(
      c => c.userId === loggedInUserId && c.isActive !== false
    );

    setChildrenList(activeChildren);

    // Determine active child ID
    let selectedId = '';

    // 1. Try from active user record in local storage
    const users = getCollection('users');
    const currentUser = users.find(u => u.id === loggedInUserId);
    if (currentUser && currentUser.lastActiveChildId) {
      const exists = activeChildren.some(c => c.id === currentUser.lastActiveChildId);
      if (exists) {
        selectedId = currentUser.lastActiveChildId;
      }
    }

    // 2. Try from separate localStorage key
    if (!selectedId) {
      const localActiveId = localStorage.getItem('hayya_active_child_id');
      const exists = activeChildren.some(c => c.id === localActiveId);
      if (exists) {
        selectedId = localActiveId;
      }
    }

    // 3. Fallback to first child in the active list
    if (!selectedId && activeChildren.length > 0) {
      selectedId = activeChildren[0].id;
    }

    setActiveChildIdState(selectedId);

    // Sync local storage keys
    if (selectedId) {
      localStorage.setItem('hayya_active_child_id', selectedId);
      if (currentUser && currentUser.lastActiveChildId !== selectedId) {
        updateItem('users', loggedInUserId, { lastActiveChildId: selectedId });
      }
    } else {
      localStorage.removeItem('hayya_active_child_id');
    }

    const currentActiveChild = activeChildren.find(c => c.id === selectedId) || null;
    setActiveChild(currentActiveChild);
  }, [getLoggedInUserId]);

  const setActiveChildId = useCallback((id) => {
    const loggedInUserId = getLoggedInUserId();
    if (!loggedInUserId) return;

    const allChildren = getCollection('children');
    const activeChildren = allChildren.filter(
      c => c.userId === loggedInUserId && c.isActive !== false
    );

    const exists = activeChildren.some(c => c.id === id);
    if (!exists && id !== '') {
      console.warn(`Child with ID ${id} is not an active child for the logged-in user.`);
      return;
    }

    setActiveChildIdState(id);
    
    if (id) {
      localStorage.setItem('hayya_active_child_id', id);
      updateItem('users', loggedInUserId, { lastActiveChildId: id });
    } else {
      localStorage.removeItem('hayya_active_child_id');
      updateItem('users', loggedInUserId, { lastActiveChildId: '' });
    }

    const currentActiveChild = activeChildren.find(c => c.id === id) || null;
    setActiveChild(currentActiveChild);
  }, [getLoggedInUserId]);

  // Initialize on mount
  useEffect(() => {
    refreshChildren();
  }, [refreshChildren]);

  // Synchronize across multiple tabs or when login status changes in localStorage
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (
        e.key === 'hayya_app_data' || 
        e.key === 'hayya_active_user_id' || 
        e.key === 'hayya_logged_in_user_id' || 
        e.key === 'hayya_current_user_id' ||
        e.key === 'hayya_active_child_id'
      ) {
        refreshChildren();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshChildren]);

  return (
    <ChildContext.Provider value={{
      childrenList,
      activeChildId,
      activeChild,
      setActiveChildId,
      refreshChildren
    }}>
      {children}
    </ChildContext.Provider>
  );
};

export const useChildContext = () => {
  const context = useContext(ChildContext);
  if (!context) {
    throw new Error('useChildContext must be used within a ChildProvider');
  }
  return context;
};
