const STORAGE_KEY = 'hayya_app_data';

/**
 * Empty schema representing the database collections.
 */
const DEFAULT_SCHEMA = {
  users: [],
  children: [],
  growthRecords: [],
  milestones: [],
  milestoneRecords: [],
  vaccines: [],
  immunizationRecords: [],
  mpasiPlans: [],
  mpasiRecipes: [],
  symptomChecks: [],
  diseases: [],
  articles: [],
  savedArticles: [],
  notifications: []
};

/**
 * Retrieves the entire application data object from LocalStorage.
 * Initializes it if it does not exist.
 * 
 * @returns {Object} Root application data object.
 */
export function getAppData() {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (!rawData) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SCHEMA));
      return { ...DEFAULT_SCHEMA };
    }
    
    const parsedData = JSON.parse(rawData);
    // Deep merge to ensure any newly added tables in future versions exist
    const mergedData = { ...DEFAULT_SCHEMA };
    Object.keys(DEFAULT_SCHEMA).forEach((key) => {
      mergedData[key] = Array.isArray(parsedData[key]) ? parsedData[key] : [];
    });
    return mergedData;
  } catch (error) {
    console.error('Error reading hayya_app_data from LocalStorage:', error);
    return { ...DEFAULT_SCHEMA };
  }
}

/**
 * Saves the entire application data object back to LocalStorage.
 * 
 * @param {Object} data - Full app data object to save.
 */
export function saveAppData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error writing to LocalStorage:', error);
    throw error; // Let hooks handle QuotaExceededError or other write failures
  }
}

/**
 * Gets a specific collection from the application data.
 * 
 * @param {string} key - Collection name (e.g. 'users', 'children').
 * @returns {Array} List of objects in the collection.
 */
export function getCollection(key) {
  const data = getAppData();
  return data[key] || [];
}

/**
 * Inserts an item into a specific collection.
 * Generates UUID for ID if not already provided.
 * 
 * @param {string} key - Collection name.
 * @param {Object} item - Objek data to add.
 * @returns {Object} The generated item with generated metadata (id, timestamps).
 */
export function insertItem(key, item) {
  const data = getAppData();
  const collection = data[key] || [];
  
  const newItem = {
    id: item.id || crypto.randomUUID(),
    ...item,
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  collection.push(newItem);
  data[key] = collection;
  saveAppData(data);
  return newItem;
}

/**
 * Updates an item matching the specified ID in a collection.
 * 
 * @param {string} key - Collection name.
 * @param {string} id - Primary key of item.
 * @param {Object} updates - Key-value updates to merge.
 * @returns {Object|null} Updated item or null if not found.
 */
export function updateItem(key, id, updates) {
  const data = getAppData();
  const collection = data[key] || [];
  const index = collection.findIndex(item => item.id === id);
  
  if (index === -1) {
    return null;
  }
  
  const updatedItem = {
    ...collection[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  collection[index] = updatedItem;
  data[key] = collection;
  saveAppData(data);
  return updatedItem;
}

/**
 * Deletes or archives an item in a specific collection.
 * 
 * @param {string} key - Collection name.
 * @param {string} id - Item ID.
 * @param {boolean} [soft=true] - If true, sets isActive=false instead of physical deletion.
 * @returns {boolean} True if deleted, false if not found.
 */
export function deleteItem(key, id, soft = true) {
  const data = getAppData();
  const collection = data[key] || [];
  const index = collection.findIndex(item => item.id === id);
  
  if (index === -1) {
    return false;
  }
  
  if (soft) {
    collection[index] = {
      ...collection[index],
      isActive: false,
      updatedAt: new Date().toISOString()
    };
  } else {
    collection.splice(index, 1);
  }
  
  data[key] = collection;
  saveAppData(data);
  return true;
}
