import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  getCollection, 
  insertItem, 
  updateItem, 
  deleteItem, 
  getAppData, 
  saveAppData 
} from '../utils/localStorageUtils';

const MpasiContext = createContext(null);

export function MpasiProvider({ children }) {
  const [recipes, setRecipes] = useState([]);
  const [plans, setPlans] = useState([]);
  const [savedRecipesList, setSavedRecipesList] = useState([]);
  const [draftPlan, setDraftPlan] = useState(null);
  const [config, setConfig] = useState({
    weekStartDate: '',
    childAgeMonths: 6,
    dailyBudgetIdr: 30000,
    allergies: []
  });
  const [errors, setErrors] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Sync state with LocalStorage on mount
  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    const allRecipes = getCollection('mpasiRecipes');
    const allPlans = getCollection('mpasiPlans');
    const allSaved = getCollection('savedArticles');
    
    // Extract recipe bookmarks only (those that have recipeId)
    const recipeBookmarks = allSaved.filter(item => item.recipeId);

    setRecipes(allRecipes);
    setPlans(allPlans);
    setSavedRecipesList(recipeBookmarks);
  };

  /**
   * Filter mpasiRecipes by child age, texture, budget, and exclude allergens.
   */
  const getRecipes = (filters = {}) => {
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
  };

  /**
   * Fetch weekly menu plan for a child.
   */
  const getMpasiPlan = (childId, weekStartDate) => {
    const allPlans = getCollection('mpasiPlans');
    return allPlans.find(p => p.childId === childId && p.weekStartDate === weekStartDate) || null;
  };

  /**
   * Helper to add days to a starting YYYY-MM-DD date.
   */
  const getDayDate = (startDateStr, daysToAdd) => {
    const d = new Date(startDateStr);
    d.setDate(d.getDate() + daysToAdd);
    return d.toISOString().split('T')[0];
  };

  /**
   * Save or update a weekly plan. Also schedules breakfast notifications.
   */
  const createMpasiPlan = (childId, planData) => {
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
        childAgeMonths: Number(planData.childAgeMonths || config.childAgeMonths),
        dailyBudgetIdr: Number(planData.dailyBudgetIdr || config.dailyBudgetIdr),
        allergies: planData.allergies || config.allergies || [],
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

      // Refresh context states
      refreshData();
      return savedPlan;

    } catch (error) {
      console.error('Error creating MPASI Plan:', error);
      if (error.name === 'QuotaExceededError') {
        throw new Error('Memori HP Bunda Penuh! ⚠️ Aplikasi tidak dapat menyimpan rencana menu baru karena kapasitas memori browser HP Bunda sudah penuh. Bunda dapat menghapus rencana menu MPASI lama yang sudah lewat.');
      }
      throw error;
    }
  };

  /**
   * Bookmark or unbookmark a recipe.
   */
  const toggleBookmarkRecipe = (userId, recipeId) => {
    if (!userId || !recipeId) {
      throw new Error('ID User dan ID Resep wajib disertakan, Bunda! 🧡');
    }

    const saved = getCollection('savedArticles');
    const existing = saved.find(item => item.userId === userId && item.recipeId === recipeId);

    if (existing) {
      deleteItem('savedArticles', existing.id, false); // physical delete
      refreshData();
      return { bookmarked: false, message: 'Resep dihapus dari koleksi Bunda.' };
    } else {
      const newItem = {
        userId,
        recipeId,
        savedAt: new Date().toISOString()
      };
      insertItem('savedArticles', newItem);
      refreshData();
      return { bookmarked: true, message: 'Resep berhasil disimpan ke koleksi Bunda! 🧡' };
    }
  };

  /**
   * Generates a 7-day weekly menu draf plan locally and saves to context state.
   */
  const generateDraft = (childId, customConfig = {}) => {
    setIsGenerating(true);
    setErrors(null);

    const mergedConfig = { ...config, ...customConfig };
    const { childAgeMonths, dailyBudgetIdr, allergies, weekStartDate } = mergedConfig;

    // Standard clinical validation
    if (childAgeMonths < 6) {
      setIsGenerating(false);
      const err = new Error(`Si Kecil Masih Berusia ${childAgeMonths} Bulan, Bunda! 🧡 Berdasarkan anjuran medis dan IDAI, bayi di bawah usia 6 bulan direkomendasikan untuk mendapatkan ASI Eksklusif saja.`);
      setErrors({ global: err.message });
      throw err;
    }
    if (childAgeMonths > 59) {
      setIsGenerating(false);
      const err = new Error('Usia anak sudah melebihi rentang MPASI yang didukung (maksimal 59 bulan), Bunda! 🧡');
      setErrors({ global: err.message });
      throw err;
    }
    if (dailyBudgetIdr <= 0) {
      setIsGenerating(false);
      const err = new Error('Batas anggaran harian harus berupa angka positif, Bunda! 🧡');
      setErrors({ dailyBudgetIdr: err.message });
      throw err;
    }

    try {
      // 1. Get filtered list of recipes matching current config
      const filteredRecipes = getRecipes({
        ageMinMonths: childAgeMonths,
        allergies: allergies
      });

      if (filteredRecipes.length === 0) {
        throw new Error('Waduh Bunda, resep tidak ditemukan! 🧡 Kriteria menu MPASI yang Bunda masukkan terlalu ketat (misalnya budget terlalu rendah atau daftar alergen terlalu banyak). Yuk coba naikkan batas anggaran harian Bunda atau kurangi beberapa pantangan makanan jika memungkinkan agar rekomendasi menu bisa disusun.');
      }

      // Group recipes by mealType
      const byType = {
        breakfast: filteredRecipes.filter(r => r.mealType === 'breakfast'),
        lunch: filteredRecipes.filter(r => r.mealType === 'lunch'),
        dinner: filteredRecipes.filter(r => r.mealType === 'dinner'),
        snack: filteredRecipes.filter(r => r.mealType === 'snack')
      };

      // Fallback helper to provide at least some recipes if a slot is empty
      const getSlotRecipes = (type) => {
        if (byType[type] && byType[type].length > 0) {
          return byType[type];
        }
        return filteredRecipes; // fall back to all matching age & allergies
      };

      const breakfastList = getSlotRecipes('breakfast');
      const lunchList = getSlotRecipes('lunch');
      const dinnerList = getSlotRecipes('dinner');
      const snackList = getSlotRecipes('snack');

      const planData = {};
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

      for (const day of days) {
        let selectedCombo = null;
        let attempts = 0;

        // Try to select a random combo that fits the daily budget
        while (attempts < 100) {
          const b = breakfastList[Math.floor(Math.random() * breakfastList.length)];
          const l = lunchList[Math.floor(Math.random() * lunchList.length)];
          const d = dinnerList[Math.floor(Math.random() * dinnerList.length)];
          const s = snackList[Math.floor(Math.random() * snackList.length)];

          const totalCost = (b?.estimatedCostIdr || 0) + (l?.estimatedCostIdr || 0) + (d?.estimatedCostIdr || 0) + (s?.estimatedCostIdr || 0);
          if (totalCost <= dailyBudgetIdr) {
            selectedCombo = { breakfast: b.id, lunch: l.id, dinner: d.id, snack: s.id };
            break;
          }
          attempts++;
        }

        // If random selection failed, fall back to the absolute cheapest combination
        if (!selectedCombo) {
          const bSorted = [...breakfastList].sort((x, y) => x.estimatedCostIdr - y.estimatedCostIdr);
          const lSorted = [...lunchList].sort((x, y) => x.estimatedCostIdr - y.estimatedCostIdr);
          const dSorted = [...dinnerList].sort((x, y) => x.estimatedCostIdr - y.estimatedCostIdr);
          const sSorted = [...snackList].sort((x, y) => x.estimatedCostIdr - y.estimatedCostIdr);

          const bCheapest = bSorted[0];
          const lCheapest = lSorted[0];
          const dCheapest = dSorted[0];
          const sCheapest = sSorted[0];

          const minTotalCost = (bCheapest?.estimatedCostIdr || 0) + (lCheapest?.estimatedCostIdr || 0) + (dCheapest?.estimatedCostIdr || 0) + (sCheapest?.estimatedCostIdr || 0);

          if (minTotalCost <= dailyBudgetIdr) {
            selectedCombo = {
              breakfast: bCheapest.id,
              lunch: lCheapest.id,
              dinner: dCheapest.id,
              snack: sCheapest.id
            };
          } else {
            throw new Error('Waduh Bunda, resep tidak ditemukan! 🧡 Kriteria menu MPASI yang Bunda masukkan terlalu ketat (misalnya budget terlalu rendah atau daftar alergen terlalu banyak). Yuk coba naikkan batas anggaran harian Bunda atau kurangi beberapa pantangan makanan jika memungkinkan agar rekomendasi menu bisa disusun.');
          }
        }

        planData[day] = selectedCombo;
      }

      const generatedDraft = {
        childId,
        weekStartDate: weekStartDate || new Date().toISOString().split('T')[0],
        childAgeMonths,
        dailyBudgetIdr,
        allergies,
        planData
      };

      setDraftPlan(generatedDraft);
      setConfig(mergedConfig);
      setIsGenerating(false);
      return generatedDraft;

    } catch (err) {
      setIsGenerating(false);
      setErrors({ global: err.message });
      throw err;
    }
  };

  /**
   * Shuffles an individual slot (breakfast, lunch, etc.) on a specific day of the draft plan,
   * ensuring that the daily cost limits and allergies filters remain respected.
   */
  const shuffleDraftSlot = (day, slot) => {
    if (!draftPlan) return;

    try {
      const { childAgeMonths, dailyBudgetIdr, allergies } = config;

      // 1. Fetch bank recipes matching config
      const filteredRecipes = getRecipes({
        ageMinMonths: childAgeMonths,
        allergies: allergies
      });

      // Get recipes specifically for this slot, excluding the current recipe
      const currentRecipeId = draftPlan.planData[day][slot];
      let alternatives = filteredRecipes.filter(r => r.mealType === slot && r.id !== currentRecipeId);

      // Fallback: if no slot-specific alternatives, look for any alternative
      if (alternatives.length === 0) {
        alternatives = filteredRecipes.filter(r => r.id !== currentRecipeId);
      }

      if (alternatives.length === 0) {
        throw new Error('Tidak ada resep alternatif yang cocok untuk menggantikan menu ini, Bunda. 🧡');
      }

      // Calculate cost of other slots in that same day
      const dayPlan = draftPlan.planData[day];
      
      const getCost = (id) => {
        const r = recipes.find(item => item.id === id);
        return r ? r.estimatedCostIdr || 0 : 0;
      };

      const breakfastCost = slot === 'breakfast' ? 0 : getCost(dayPlan.breakfast);
      const lunchCost = slot === 'lunch' ? 0 : getCost(dayPlan.lunch);
      const dinnerCost = slot === 'dinner' ? 0 : getCost(dayPlan.dinner);
      const snackCost = slot === 'snack' ? 0 : getCost(dayPlan.snack);

      const baseDayCost = breakfastCost + lunchCost + dinnerCost + snackCost;

      // Filter alternatives to those that satisfy the daily budget limit
      const budgetFitAlternatives = alternatives.filter(
        r => (baseDayCost + (r.estimatedCostIdr || 0)) <= dailyBudgetIdr
      );

      if (budgetFitAlternatives.length === 0) {
        throw new Error('Resep alternatif melebihi batas anggaran harian Bunda. Coba naikkan batas anggaran harian terlebih dahulu ya. 🧡');
      }

      // Pick one randomly
      const selectedRecipe = budgetFitAlternatives[Math.floor(Math.random() * budgetFitAlternatives.length)];

      const updatedDraft = {
        ...draftPlan,
        planData: {
          ...draftPlan.planData,
          [day]: {
            ...draftPlan.planData[day],
            [slot]: selectedRecipe.id
          }
        }
      };

      setDraftPlan(updatedDraft);

    } catch (err) {
      setErrors({ global: err.message });
      throw err;
    }
  };

  /**
   * Saves the current draft plan to LocalStorage and clears the draft state.
   */
  const saveDraftAsPlan = (childId) => {
    if (!draftPlan) {
      throw new Error('Tidak ada draf rencana menu untuk disimpan, Bunda! 🧡');
    }
    const saved = createMpasiPlan(childId, draftPlan);
    setDraftPlan(null);
    return saved;
  };

  return (
    <MpasiContext.Provider value={{
      recipes,
      plans,
      savedRecipesList,
      draftPlan,
      config,
      errors,
      isGenerating,
      setConfig,
      setErrors,
      setDraftPlan,
      getRecipes,
      getMpasiPlan,
      createMpasiPlan,
      toggleBookmarkRecipe,
      generateDraft,
      shuffleDraftSlot,
      saveDraftAsPlan,
      refreshMpasiData: refreshData
    }}>
      {children}
    </MpasiContext.Provider>
  );
}

export function useMpasiContext() {
  const ctx = useContext(MpasiContext);
  if (!ctx) {
    throw new Error('useMpasiContext must be used within an MpasiProvider');
  }
  return ctx;
}
