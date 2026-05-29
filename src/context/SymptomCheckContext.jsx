import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  getCollection, 
  insertItem, 
  getAppData, 
  saveAppData 
} from '../utils/localStorageUtils';

const SymptomCheckContext = createContext(null);

const fallbackDisease = {
  id: 'd-fallback',
  name: 'Gejala Tidak Spesifik / Umum',
  medicalName: 'Gejala Umum',
  description: 'Kondisi kesehatan umum anak yang tidak spesifik mengarah pada satu penyakit tertentu.',
  homeRemedies: 'Pastikan anak mendapatkan istirahat yang cukup, penuhi kebutuhan cairan (ASI/air putih hangat), dan pantau suhu badannya secara berkala.',
  warningSigns: [
    'Anak lemas, sulit dibangunkan',
    'Suhu tubuh melebihi 39°C',
    'Sesak napas atau napas cepat'
  ],
  urgencyDefault: 'home'
};

export function SymptomCheckProvider({ children }) {
  const [history, setHistory] = useState([]);
  const [diseases, setDiseases] = useState([]);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setHistory(getCollection('symptomChecks'));
    setDiseases(getCollection('diseases'));
  };

  /**
   * Simple and smart weight-based matching algorithm.
   */
  const matchDisease = (symptomsSelected) => {
    const list = getCollection('diseases');
    if (!list || list.length === 0) return fallbackDisease;

    let matched = fallbackDisease;
    let maxScore = 0;

    list.forEach(disease => {
      let score = 0;
      symptomsSelected.forEach(symptom => {
        const lowerSymptom = symptom.toLowerCase();

        // High weight for exact name match (e.g. symptom "demam" matches "Demam Biasa")
        if (disease.name.toLowerCase().includes(lowerSymptom)) {
          score += 5;
        }
        
        // High weight for medicalName match
        if (disease.medicalName && disease.medicalName.toLowerCase().includes(lowerSymptom)) {
          score += 4;
        }

        // Match against commonSymptoms array
        if (disease.commonSymptoms && Array.isArray(disease.commonSymptoms)) {
          const hasCommon = disease.commonSymptoms.some(s => {
            const lowerS = s.toLowerCase();
            return lowerS.includes(lowerSymptom) || 
                   (lowerSymptom === 'demam' && lowerS.includes('suhu'));
          });
          if (hasCommon) {
            score += 2;
          }
        }
      });

      if (score > maxScore) {
        maxScore = score;
        matched = disease;
      }
    });

    return matched;
  };

  /**
   * Helper to retrieve related educational articles.
   */
  const getRelatedArticles = (matchedDisease, symptomsSelected) => {
    const allArticles = getCollection('articles');
    
    return allArticles.filter(art => {
      const titleLower = art.title.toLowerCase();
      const bodyLower = art.contentBody.toLowerCase();
      const diseaseNameLower = matchedDisease.name.toLowerCase();
      const medicalNameLower = (matchedDisease.medicalName || '').toLowerCase();
      
      const matchesDisease = titleLower.includes(diseaseNameLower) || 
                            bodyLower.includes(diseaseNameLower) ||
                            (medicalNameLower && (titleLower.includes(medicalNameLower) || bodyLower.includes(medicalNameLower)));
                            
      const matchesSymptom = symptomsSelected.some(sym => {
        const symLower = sym.toLowerCase();
        return titleLower.includes(symLower) || bodyLower.includes(symLower);
      });
      
      return matchesDisease || matchesSymptom;
    }).slice(0, 2);
  };

  /**
   * Evaluates checked symptoms & answers against clinical guidelines
   * to determine urgency, saves assessment, and queues push warning.
   */
  const runSymptomCheck = (childId, symptomsSelected, answers, selectedRedFlags = []) => {
    if (!childId) {
      throw new Error('Pilih profil si kecil terlebih dahulu, Bunda! 🧡');
    }
    if (!symptomsSelected || symptomsSelected.length === 0) {
      throw new Error('Bunda, pilih minimal satu gejala utama si kecil yang dirasakan saat ini ya. 🧡');
    }

    // 1. Resolve Red Flags (can be passed inside answers or explicitly)
    const redFlagsList = (Array.isArray(selectedRedFlags) && selectedRedFlags.length > 0)
      ? selectedRedFlags
      : (answers.selectedRedFlags || answers.redFlags || []);
      
    // Exclude exclusive "no red flags" from actual red flag detections
    const actualRedFlags = redFlagsList.filter(
      flag => flag && 
              flag !== 'Tidak ada tanda bahaya di atas (Kondisi Stabil)' && 
              flag !== 'no_red_flags' &&
              flag !== 'Tidak ada tanda bahaya di atas'
    );
    const hasRedFlags = actualRedFlags.length > 0;

    // 2. Perform Disease Matching
    const matchedDisease = matchDisease(symptomsSelected);

    // 3. Clinical Defensiveness & Urgency Evaluation
    const tempSuhu = parseFloat(answers.suhu);
    
    const isSuhuTinggi = !isNaN(tempSuhu) && tempSuhu >= 39.5;
    const isDiareDarah = answers.diare_darah === true || 
                         answers.diare_darah === 'yes' || 
                         answers.diare_darah === 'Ada darah atau lendir' ||
                         answers.konsistensi === 'Ada darah atau lendir' ||
                         answers.diare_konsistensi === 'Ada darah atau lendir';
                         
    const isMuntahTerus = answers.muntah_terus === true || 
                          answers.muntah_terus === 'yes' || 
                          answers.muntah_terus === 'Ya, selalu muntah' ||
                          answers.muntah_keparahan === 'Ya, selalu muntah';
                          
    const isBatukSesak = answers.batuk_sesak === true || 
                         answers.batuk_sesak === 'yes' || 
                         answers.batuk_sesak === 'Ya' ||
                         answers.batuk_intensitas === 'Ya';

    const isDurasiDemamLama = answers.durasi_demam === '>= 3 hari' || 
                              answers.durasi_demam === '3 hari atau lebih';
                              
    const isDiareFrekuensiTinggi = answers.diare_frekuensi === '>= 4 kali' || 
                                   answers.diare_frekuensi === '4 kali atau lebih';

    let urgencyLevel = 'home'; // Fallback / Default

    if (hasRedFlags || isSuhuTinggi || isDiareDarah || isMuntahTerus || isBatukSesak) {
      urgencyLevel = 'emergency';
    } else if (isDurasiDemamLama || isDiareFrekuensiTinggi || matchedDisease.urgencyDefault === 'doctor') {
      urgencyLevel = 'doctor';
    }

    // 4. Retrieve Related Articles
    const relatedArticles = getRelatedArticles(matchedDisease, symptomsSelected);

    // 5. Construct Record Payload
    const checkRecord = {
      childId,
      symptomsSelected,
      answers,
      results: {
        diseaseId: matchedDisease.id,
        diseaseName: matchedDisease.name,
        medicalName: matchedDisease.medicalName || '',
        description: matchedDisease.description || '',
        homeRemedies: matchedDisease.homeRemedies || '',
        warningSigns: matchedDisease.warningSigns || [],
        relatedArticles: relatedArticles.map(art => ({
          id: art.id,
          title: art.title,
          category: art.category
        }))
      },
      urgencyLevel,
      checkedAt: new Date().toISOString()
    };

    // 6. DB Insertion with FIFO eviction fallback
    let savedCheck;
    try {
      savedCheck = insertItem('symptomChecks', checkRecord);
    } catch (error) {
      console.warn('Quota limit hit, executing FIFO symptom checks eviction...');
      const appData = getAppData();
      let checks = appData.symptomChecks || [];
      
      if (checks.length >= 3) {
        checks.sort((a, b) => new Date(a.checkedAt || a.createdAt) - new Date(b.checkedAt || b.createdAt));
        // Evict 3 oldest checks
        checks = checks.slice(3);
        appData.symptomChecks = checks;
        saveAppData(appData);
        
        try {
          savedCheck = insertItem('symptomChecks', checkRecord);
          console.log('FIFO eviction successful! Check saved.');
        } catch (retryError) {
          throw new Error('Memori HP Bunda Penuh! ⚠️ Silakan bersihkan penyimpanan browser Bunda untuk terus menyimpan riwayat baru.');
        }
      } else {
        throw error;
      }
    }

    // 7. Save automatic post-check notification
    const childrenList = getCollection('children');
    const child = childrenList.find(c => c.id === childId);
    const childName = child ? child.name : 'Si Kecil';

    if (urgencyLevel === 'emergency' || urgencyLevel === 'doctor') {
      const symptomText = symptomsSelected.map(s => {
        const mapping = {
          demam: 'demam',
          diare: 'diare',
          batuk: 'batuk',
          muntah: 'muntah',
          ruam: 'ruam'
        };
        return mapping[s] || s;
      }).join(', ');

      const notificationItem = {
        userId: child ? child.userId : '',
        title: `Pantau Kondisi Dek ${childName} 🧡`,
        content: `Pantau terus kondisi Dek ${childName} setelah gejala ${symptomText} kemarin ya, Bunda. Segera bawa ke dokter jika tanda bahaya muncul!`,
        type: 'general',
        isRead: false
      };
      insertItem('notifications', notificationItem);
    }

    refreshData();
    // Return check details combined with full article objects for rendering
    return {
      ...savedCheck,
      relatedArticlesFull: relatedArticles
    };
  };

  /**
   * Retrieves past checks for a specific child, sorted by date descending.
   */
  const getSymptomCheckHistory = (childId) => {
    const allChecks = getCollection('symptomChecks');
    return allChecks
      .filter(item => item.childId === childId)
      .sort((a, b) => new Date(b.checkedAt) - new Date(a.checkedAt));
  };

  return (
    <SymptomCheckContext.Provider value={{
      history,
      diseases,
      runSymptomCheck,
      getSymptomCheckHistory,
      refreshSymptomData: refreshData
    }}>
      {children}
    </SymptomCheckContext.Provider>
  );
}

export function useSymptomCheckContext() {
  const ctx = useContext(SymptomCheckContext);
  if (!ctx) {
    throw new Error('useSymptomCheckContext must be used within a SymptomCheckProvider');
  }
  return ctx;
}
