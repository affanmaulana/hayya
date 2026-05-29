import { useContext } from 'react';
import { useMpasiContext } from '../context/MpasiContext';
import { 
  getCollection, 
  insertItem, 
  updateItem, 
  deleteItem,
  getAppData,
  saveAppData
} from '../utils/localStorageUtils';

/**
 * Standard weekly meal planning date helper
 */
const getDayDate = (startDateStr, daysToAdd) => {
  const d = new Date(startDateStr);
  d.setDate(d.getDate() + daysToAdd);
  return d.toISOString().split('T')[0];
};

/**
 * Standalone/Fallback implementation of getRecipes
 */
export function getRecipesStandalone(filters = {}) {
  let list = [...getCollection('mpasiRecipes')];
  
  if (filters.ageMinMonths !== undefined && filters.ageMinMonths !== null) {
    const age = Number(filters.ageMinMonths);
    list = list.filter(r => age >= r.ageMinMonths && age <= r.ageMaxMonths);
  }
  
  if (filters.textureStage) {
    list = list.filter(r => r.textureStage === filters.textureStage);
  }
  
  if (filters.estimatedCostIdr !== undefined && filters.estimatedCostIdr !== null) {
    const maxCost = Number(filters.estimatedCostIdr);
    list = list.filter(r => r.estimatedCostIdr <= maxCost);
  }
  
  if (filters.allergies && Array.isArray(filters.allergies) && filters.allergies.length > 0) {
    list = list.filter(r => {
      if (!r.allergens || !Array.isArray(r.allergens)) return true;
      return !r.allergens.some(allergen => filters.allergies.includes(allergen));
    });
  }
  
  return list;
}

/**
 * Standalone/Fallback implementation of getMpasiPlan
 */
export function getMpasiPlanStandalone(childId, weekStartDate) {
  const allPlans = getCollection('mpasiPlans');
  return allPlans.find(p => p.childId === childId && p.weekStartDate === weekStartDate) || null;
}

/**
 * Standalone/Fallback implementation of createMpasiPlan
 */
export function createMpasiPlanStandalone(childId, planData) {
  if (!childId) {
    throw new Error('ID Anak tidak boleh kosong, Bunda! 🧡');
  }
  if (!planData.weekStartDate) {
    throw new Error('Tanggal mulai rencana mingguan wajib diisi ya, Bunda! 🧡');
  }
  if (!planData.planData || typeof planData.planData !== 'object') {
    throw new Error('Data menu harian tidak boleh kosong! 🧡');
  }

  try {
    const allPlans = getCollection('mpasiPlans');
    const existingIndex = allPlans.findIndex(
      p => p.childId === childId && p.weekStartDate === planData.weekStartDate
    );

    const planPayload = {
      childId,
      weekStartDate: planData.weekStartDate,
      childAgeMonths: Number(planData.childAgeMonths || 6),
      dailyBudgetIdr: Number(planData.dailyBudgetIdr || 30000),
      allergies: planData.allergies || [],
      planData: planData.planData
    };

    let savedPlan;
    if (existingIndex > -1) {
      savedPlan = updateItem('mpasiPlans', allPlans[existingIndex].id, planPayload);
    } else {
      savedPlan = insertItem('mpasiPlans', planPayload);
    }

    // Automatically sync and queue local breakfast notifications for the 7 days of the week
    const childrenList = getCollection('children');
    const activeChild = childrenList.find(c => c.id === childId);
    const childName = activeChild ? activeChild.name : 'Si Kecil';

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    const appData = getAppData();
    // Remove any existing notifications of type 'mpasi' for this child and week to prevent duplicates
    appData.notifications = (appData.notifications || []).filter(
      n => !(n.childId === childId && n.type === 'mpasi' && n.weekStartDate === planData.weekStartDate)
    );

    days.forEach((day, index) => {
      const dayMenu = planData.planData[day];
      if (dayMenu && dayMenu.breakfast) {
        const recipe = appData.mpasiRecipes.find(r => r.id === dayMenu.breakfast);
        const recipeName = recipe ? recipe.name : 'Menu Spesial';
        const scheduledDate = getDayDate(planData.weekStartDate, index);
        
        appData.notifications.push({
          id: crypto.randomUUID(),
          userId: activeChild ? activeChild.userId : '',
          childId,
          weekStartDate: planData.weekStartDate,
          title: `Waktunya Masak MPASI, Bunda! 🧡`,
          content: `Hari ini jadwal Dek ${childName} adalah ${recipeName} untuk sarapan. Yuk intip resep lengkapnya di sini!`,
          type: 'mpasi',
          scheduledAt: `${scheduledDate}T07:00:00.000Z`,
          isRead: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    });
    saveAppData(appData);
    return savedPlan;

  } catch (error) {
    console.error('Error in standalone createMpasiPlan:', error);
    if (error.name === 'QuotaExceededError') {
      throw new Error('Memori HP Bunda Penuh! ⚠️ Aplikasi tidak dapat menyimpan rencana menu baru karena kapasitas memori browser HP Bunda sudah penuh. Bunda dapat menghapus rencana menu MPASI lama yang sudah lewat.');
    }
    throw error;
  }
}

/**
 * Standalone/Fallback implementation of toggleBookmarkRecipe
 */
export function toggleBookmarkRecipeStandalone(userId, recipeId) {
  if (!userId || !recipeId) {
    throw new Error('ID User dan ID Resep wajib disertakan, Bunda! 🧡');
  }

  const saved = getCollection('savedArticles');
  const existing = saved.find(item => item.userId === userId && item.recipeId === recipeId);

  if (existing) {
    deleteItem('savedArticles', existing.id, false); // physical delete
    return { bookmarked: false, message: 'Resep dihapus dari koleksi Bunda.' };
  } else {
    const newItem = {
      userId,
      recipeId,
      savedAt: new Date().toISOString()
    };
    insertItem('savedArticles', newItem);
    return { bookmarked: true, message: 'Resep berhasil disimpan ke koleksi Bunda! 🧡' };
  }
}

/**
 * Custom hook useMpasi
 */
export default function useMpasi() {
  let contextValue = null;
  try {
    contextValue = useMpasiContext();
  } catch (e) {
    // Context provider is missing, fall back to standalone functions
  }

  if (contextValue) {
    return contextValue;
  }

  // If outside of provider, return standalone helpers and warning
  console.warn('useMpasi is being used outside of MpasiProvider. State updates will not be reactive.');
  
  return {
    recipes: getCollection('mpasiRecipes'),
    plans: getCollection('mpasiPlans'),
    savedRecipesList: getCollection('savedArticles').filter(item => item.recipeId),
    draftPlan: null,
    config: {
      weekStartDate: '',
      childAgeMonths: 6,
      dailyBudgetIdr: 30000,
      allergies: []
    },
    errors: null,
    isGenerating: false,
    getRecipes: getRecipesStandalone,
    getMpasiPlan: getMpasiPlanStandalone,
    createMpasiPlan: createMpasiPlanStandalone,
    toggleBookmarkRecipe: toggleBookmarkRecipeStandalone,
    generateDraft: () => {
      throw new Error('generateDraft requires MpasiProvider to manage reactivity, Bunda!');
    },
    shuffleDraftSlot: () => {
      throw new Error('shuffleDraftSlot requires MpasiProvider to manage reactivity, Bunda!');
    },
    saveDraftAsPlan: () => {
      throw new Error('saveDraftAsPlan requires MpasiProvider to manage reactivity, Bunda!');
    }
  };
}
