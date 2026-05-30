import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChild } from '../hooks/useChild';
import useAuth from '../hooks/useAuth';
import useMpasi from '../hooks/useMpasi';
import { calculateAgeInMonthsAndDays, formatDate } from '../utils/dateHelpers';

export default function MpasiView() {
  const navigate = useNavigate();
  const { activeChild, loading } = useChild();
  const { currentUser } = useAuth();
  
  if (!activeChild) return null;
  
  // Consume MPASI hooks & contexts
  const { 
    recipes, 
    savedRecipesList, 
    toggleBookmarkRecipe 
  } = useMpasi();

  // Active recipe category filter: 'all', '6-8', '9-11', '12+', 'bookmarked'
  const [activeFilter, setActiveFilter] = useState('all');

  // Desktop drag-to-scroll support
  const trackRef = useRef(null);
  const [dragState, setDragState] = useState({
    isDown: false,
    startX: 0,
    scrollLeft: 0
  });

  const handleMouseDown = (e) => {
    const track = trackRef.current;
    if (!track) return;
    setDragState({
      isDown: true,
      startX: e.pageX - track.offsetLeft,
      scrollLeft: track.scrollLeft
    });
  };

  const handleMouseLeave = () => {
    setDragState(prev => ({ ...prev, isDown: false }));
  };

  const handleMouseUp = () => {
    setDragState(prev => ({ ...prev, isDown: false }));
  };

  const handleMouseMove = (e) => {
    if (!dragState.isDown) return;
    e.preventDefault();
    const track = trackRef.current;
    if (!track) return;
    const x = e.pageX - track.offsetLeft;
    const walk = (x - dragState.startX) * 1.5;
    track.scrollLeft = dragState.scrollLeft - walk;
  };

  // Track expanded recipes for viewing ingredients/steps
  const [expandedRecipeIds, setExpandedRecipeIds] = useState({});

  // Reset internal UI states when active child switches
  const [prevChildId, setPrevChildId] = useState(activeChild?.id || '');
  if (activeChild?.id !== prevChildId) {
    setPrevChildId(activeChild?.id || '');
    setExpandedRecipeIds({});
    setActiveFilter('all');
  }

  // Calculate age parameters
  const childAgeMonths = useMemo(() => {
    if (!activeChild || !activeChild.dateOfBirth) return 0;
    const { months } = calculateAgeInMonthsAndDays(activeChild.dateOfBirth);
    return months;
  }, [activeChild]);

  const childAgeDays = useMemo(() => {
    if (!activeChild || !activeChild.dateOfBirth) return 0;
    const { days } = calculateAgeInMonthsAndDays(activeChild.dateOfBirth);
    return days;
  }, [activeChild]);

  // Determine Indonesia clinical recommendations based on age
  const clinicalGuide = useMemo(() => {
    if (childAgeMonths < 6) {
      return {
        stage: 'ASI Eksklusif 🤱',
        texture: 'Cairan (Hanya ASI)',
        frequency: 'Sesuai kebutuhan bayi (on demand), minimal 8-12 kali sehari',
        portion: 'Sesuai kebutuhan kenyang si kecil',
        isAsiOnly: true
      };
    } else if (childAgeMonths <= 8) {
      return {
        stage: 'MPASI Awal (6-8 Bulan) 🥣',
        texture: 'Bubur Saring Halus / Puree (lembut, kental, tidak encer)',
        frequency: '2-3 kali makan besar + 1-2 kali makanan selingan',
        portion: '2-3 sendok makan bertahap hingga setengah mangkuk kecil (125 ml)',
        isAsiOnly: false
      };
    } else if (childAgeMonths <= 11) {
      return {
        stage: 'MPASI Lanjutan (9-11 Bulan) 🍲',
        texture: 'Bubur Kasar / Cincang Halus / Nasi Tim Lembek',
        frequency: '3-4 kali makan besar + 1-2 kali makanan selingan',
        portion: 'Setengah hingga tiga perempat mangkuk kecil (125 ml - 250 ml)',
        isAsiOnly: false
      };
    } else {
      return {
        stage: 'Makanan Keluarga (12 Bulan+) 🍽️',
        texture: 'Makanan Keluarga (nasi, lauk dipotong kecil, makanan padat)',
        frequency: '3-4 kali makan besar + 1-2 kali makanan selingan',
        portion: 'Semangkuk penuh ukuran 250 ml',
        isAsiOnly: false
      };
    }
  }, [childAgeMonths]);

  // Check if a specific recipe is bookmarked
  const isBookmarked = (recipeId) => {
    return savedRecipesList.some(
      item => item.recipeId === recipeId && item.userId === currentUser?.id
    );
  };

  // Handle recipe bookmark toggle
  const handleBookmarkToggle = (e, recipeId) => {
    e.stopPropagation(); // Avoid card expansion when bookmarking
    if (!currentUser?.id) return;
    try {
      toggleBookmarkRecipe(currentUser.id, recipeId);
    } catch (err) {
      console.error('Error toggling bookmark:', err);
    }
  };

  // Filtered recipes list
  const filteredRecipes = useMemo(() => {
    return recipes.filter(r => {
      if (activeFilter === 'bookmarked') {
        return isBookmarked(r.id);
      }
      if (activeFilter === '6-8') {
        return r.ageMinMonths >= 6 && r.ageMaxMonths <= 8;
      }
      if (activeFilter === '9-11') {
        return r.ageMinMonths >= 9 && r.ageMaxMonths <= 11;
      }
      if (activeFilter === '12+') {
        return r.ageMinMonths >= 12;
      }
      return true; // 'all'
    });
  }, [recipes, activeFilter, savedRecipesList, currentUser?.id]);

  // Toggle card expansion
  const toggleRecipeExpand = (recipeId) => {
    setExpandedRecipeIds(prev => ({
      ...prev,
      [recipeId]: !prev[recipeId]
    }));
  };

  // Format texture display names
  const getTextureLabel = (stage) => {
    switch (stage) {
      case 'puree': return 'Saring / Puree';
      case 'porridge': return 'Bubur Lembek';
      case 'soft_chunk': return 'Cincang Kasar';
      case 'family': return 'Makanan Keluarga';
      default: return stage;
    }
  };



  return (
    <div className="space-y-6 font-[var(--font-body)] px-0 animate-fade-in">
      
      {/* HEADER SECTION - Child Profile Summary */}
      <div className="bg-white rounded-card border border-gray-100 p-5 shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.04)] transition-all duration-200 ease-in-out flex items-center gap-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold border ${
          activeChild.gender === 'L'
            ? 'bg-accent/10 border-accent/15 text-accent'
            : 'bg-primary/10 border-primary/15 text-primary'
        }`}>
          {activeChild.name ? activeChild.name.charAt(0).toUpperCase() : '👶'}
        </div>
        <div>
          <h2 className="text-base font-extrabold font-[var(--font-heading)] text-gray-900 leading-tight">
            Menu MPASI {activeChild.name}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Lahir: {formatDate(activeChild.dateOfBirth)} • <span className="font-semibold text-primary">Usia {childAgeMonths} Bulan {childAgeDays} Hari</span>
          </p>
        </div>
      </div>

      {/* DAILY MEAL PLANNER TEMPLATE CARD */}
      <div className="bg-white rounded-card border border-gray-100 p-5 shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.04)] transition-all duration-200 ease-in-out space-y-4">
        <div className="border-b border-gray-100 pb-3 flex justify-between items-center">
          <div className="space-y-0.5">
            <span className="text-[10px] text-primary font-bold uppercase tracking-wider font-[var(--font-heading)]">Rekomendasi Tahapan</span>
            <h3 className="text-sm font-extrabold font-[var(--font-heading)] text-gray-900">
              {clinicalGuide.stage}
            </h3>
          </div>
          <span className="text-2xl">🥣</span>
        </div>

        {clinicalGuide.isAsiOnly ? (
          /* ASI Eksklusif Phase under 6 Months */
          <div className="p-4 bg-primary/[0.02] border border-primary/15 rounded-xl space-y-2">
            <p className="text-xs text-primary font-bold">Bunda, Si Kecil belum waktunya MPASI 🧡</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Berdasarkan anjuran medis IDAI dan Kementerian Kesehatan, bayi di bawah 6 bulan disarankan mendapatkan **ASI Eksklusif** saja demi menjaga kesehatan pencernaannya. Bunda bisa mulai menyusun rencana MPASI setelah si kecil genap 6 bulan.
            </p>
          </div>
        ) : (
          /* Active MPASI Phase */
          <div className="space-y-4">
            
            {/* Texture and Portion specs */}
            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
              <div className="bg-gray-50/40 rounded-xl p-3 border border-gray-100">
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Tekstur Anjuran</span>
                <p className="text-gray-900 font-bold mt-1 leading-tight">{clinicalGuide.texture}</p>
              </div>
              <div className="bg-gray-50/40 rounded-xl p-3 border border-gray-100">
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Frekuensi & Porsi</span>
                <p className="text-gray-900 font-bold mt-1 leading-tight">{clinicalGuide.frequency}</p>
              </div>
            </div>

            <hr className="border-gray-100/80" />

            {/* Daily Planner Meal Slots */}
            <div className="space-y-3">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Jadwal Makan Harian</span>
              
              <div className="space-y-2.5">
                {[
                  { slot: 'Sarapan 🌅', time: '07.00 - 08.00', texture: clinicalGuide.texture },
                  { slot: 'Selingan Pagi 🍎', time: '10.00', texture: 'Selingan (Buah Lembut / Puree Buah)' },
                  { slot: 'Makan Siang ☀️', time: '12.00 - 13.00', texture: clinicalGuide.texture },
                  { slot: 'Makan Malam 🌙', time: '18.00 - 19.00', texture: clinicalGuide.texture }
                ].map((item, idx) => (
                  <div key={`slot-${idx}`} className="flex items-center gap-3 p-3 bg-gray-50/20 border border-gray-100 rounded-xl hover:bg-gray-50/50 transition-all duration-200 ease-in-out">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-xs font-bold text-secondary">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center gap-1.5">
                        <span className="text-xs font-bold text-gray-900 whitespace-normal break-words">{item.slot}</span>
                        <span className="text-[10px] text-gray-400 font-semibold shrink-0">{item.time}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5 whitespace-normal break-words leading-relaxed">{item.texture}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FILTER BAR FOR MPASI RECIPES */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between border-b border-border/60 pb-2">
          <h3 className="text-sm font-extrabold font-[var(--font-heading)] text-text">
            📖 Katalog Resep MPASI Sehat
          </h3>
        </div>

        {/* Clean, high-whitespace horizontal filter bar */}
        <div className="w-full max-w-full overflow-hidden select-none">
          <div 
            ref={trackRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            className="flex flex-row overflow-x-auto whitespace-nowrap scroll-smooth gap-2 pb-2"
            style={{ 
              touchAction: 'pan-x',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            {[
              { id: 'all', label: 'Semua' },
              { id: '6-8', label: '6-8 Bln' },
              { id: '9-11', label: '9-11 Bln' },
              { id: '12+', label: '12+ Bln' },
              { id: 'bookmarked', label: '❤️ Simpanan' }
            ].map((tab) => {
              const isActive = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`px-4 py-2 text-xs font-bold rounded-full border cursor-pointer flex-shrink-0 transition-all focus:outline-none ${
                    isActive
                      ? 'bg-primary border-primary text-white shadow-sm'
                      : 'bg-white border-border text-text-secondary hover:bg-bg/40'
                  }`}
                >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

        {/* RECIPES LIST GRID */}
        {filteredRecipes.length === 0 ? (
          <div className="p-8 bg-white border border-gray-100 rounded-card text-center text-xs text-gray-400 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
            {activeFilter === 'bookmarked' 
              ? 'Buku resep Bunda masih kosong. Simpan resep pilihan Bunda dengan menekan ikon hati pada kartu resep!' 
              : 'Tidak ada resep yang ditemukan untuk kategori ini.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredRecipes.map((recipe) => {
              const isExpanded = !!expandedRecipeIds[recipe.id];
              const bookmarked = isBookmarked(recipe.id);
              return (
                <div
                  key={recipe.id}
                  className="bg-white rounded-card border border-gray-100 hover:border-gray-200 shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.04)] transition-all duration-200 ease-in-out overflow-hidden"
                >
                  {/* Recipe Header Card */}
                  <div
                    onClick={() => toggleRecipeExpand(recipe.id)}
                    className="p-4 flex gap-4 items-start cursor-pointer select-none"
                  >
                    {/* Visual Thumbnail Icon */}
                    <div className="w-14 h-14 bg-secondary/10 border border-secondary/15 rounded-xl flex items-center justify-center text-2xl shrink-0">
                      🥗
                    </div>

                    {/* Brief specifications */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-sm font-bold font-[var(--font-heading)] text-text leading-snug">
                          {recipe.name}
                        </h4>
                        
                        {/* Bookmark Button */}
                        <button
                          type="button"
                          onClick={(e) => handleBookmarkToggle(e, recipe.id)}
                          className="p-1 -mr-1 text-text-muted hover:text-primary transition-all focus:outline-none cursor-pointer"
                          aria-label={bookmarked ? 'Hapus bookmark resep' : 'Simpan resep'}
                        >
                          <svg
                            className={`w-5 h-5 transition-transform duration-200 active:scale-125 ${
                              bookmarked ? 'fill-primary text-primary' : 'fill-transparent text-text-muted hover:text-primary'
                            }`}
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                          </svg>
                        </button>
                      </div>

                      {/* Tag badges */}
                      <div className="flex gap-1.5 flex-wrap pt-0.5">
                        <span className="px-2 py-0.5 text-[9px] font-bold bg-bg border border-border text-text-secondary rounded-md">
                          {recipe.ageMinMonths}-{recipe.ageMaxMonths} Bln
                        </span>
                        <span className="px-2 py-0.5 text-[9px] font-bold bg-bg border border-border text-text-secondary rounded-md">
                          {getTextureLabel(recipe.textureStage)}
                        </span>
                        {recipe.nutritionInfo?.energi && (
                          <span className="px-2 py-0.5 text-[9px] font-bold bg-accent/5 border border-accent/15 text-accent rounded-md">
                            ⚡ {recipe.nutritionInfo.energi}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded preparation detail */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 bg-bg/35 border-t border-border/40 text-xs space-y-3.5 animate-slide-down">
                      
                      {/* Ingredients */}
                      <div className="space-y-1">
                        <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Bahan-Bahan:</span>
                        <ul className="list-disc list-inside text-text-secondary font-medium leading-relaxed space-y-0.5 pl-0.5">
                          {recipe.ingredients.map((ing, idx) => (
                            <li key={`ing-${idx}`}>
                              {ing.name} <span className="text-text font-semibold">({ing.amount} {ing.unit})</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Cook Steps */}
                      <div className="space-y-1.5 pt-1 border-t border-border/30">
                        <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Langkah Pembuatan:</span>
                        <ol className="list-decimal list-inside text-text-secondary font-medium leading-relaxed space-y-1 pl-0.5">
                          {recipe.steps.map((step, idx) => (
                            <li key={`step-${idx}`} className="align-top">
                              <span className="text-text font-semibold mr-1">{idx + 1}.</span> {step}
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* Nutrient Detail Info */}
                      {recipe.nutritionInfo && (
                        <div className="pt-2.5 border-t border-border/30 flex gap-4 text-[10px]">
                          {recipe.nutritionInfo.energi && (
                            <div>
                              <span className="text-text-muted font-bold uppercase tracking-wider">Energi:</span>
                              <p className="text-text font-extrabold mt-0.5">{recipe.nutritionInfo.energi}</p>
                            </div>
                          )}
                          {recipe.nutritionInfo.protein && (
                            <div>
                              <span className="text-text-muted font-bold uppercase tracking-wider">Protein:</span>
                              <p className="text-text font-extrabold mt-0.5">{recipe.nutritionInfo.protein}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
