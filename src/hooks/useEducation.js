import { useState, useEffect, useCallback } from 'react';
import { getCollection, insertItem, deleteItem } from '../utils/localStorageUtils';

/**
 * Custom hook to manage parenting education articles and bookmarks offline.
 */
export function useEducation() {
  const [articles, setArticles] = useState([]);
  const [savedArticlesList, setSavedArticlesList] = useState([]);

  // Load and refresh articles/bookmarks from local storage
  const refreshData = useCallback(() => {
    try {
      const allArticles = getCollection('articles');
      const allSaved = getCollection('savedArticles');
      
      // Filter out bookmarks that target articles (carrying articleId but not recipeId)
      const articleBookmarks = allSaved.filter(item => item.articleId && !item.recipeId);

      setArticles(allArticles);
      setSavedArticlesList(articleBookmarks);
    } catch (err) {
      console.error('Error refreshing education data:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Toggle bookmark state for an article
  const toggleBookmarkArticle = useCallback((userId, articleId) => {
    if (!userId || !articleId) {
      throw new Error('ID User dan ID Artikel wajib disertakan, Bunda! 🧡');
    }

    try {
      const saved = getCollection('savedArticles');
      const existing = saved.find(item => item.userId === userId && item.articleId === articleId);

      if (existing) {
        deleteItem('savedArticles', existing.id, false); // physical delete
        refreshData();
        return { bookmarked: false, message: 'Artikel dihapus dari koleksi Bunda.' };
      } else {
        const newItem = {
          id: crypto.randomUUID(),
          userId,
          articleId,
          savedAt: new Date().toISOString()
        };
        insertItem('savedArticles', newItem);
        refreshData();
        return { bookmarked: true, message: 'Artikel disimpan ke koleksi Bunda! 🧡' };
      }
    } catch (err) {
      console.error('Error toggling article bookmark:', err);
      throw err;
    }
  }, [refreshData]);

  return {
    articles,
    savedArticlesList,
    toggleBookmarkArticle,
    refresh: refreshData
  };
}

export default useEducation;
