import { useState, useMemo, useRef } from 'react';
import { useEducation } from '../hooks/useEducation';
import useAuth from '../hooks/useAuth';

export default function EducationView({ onBack }) {
  const { currentUser } = useAuth();
  
  // Consume hook
  const { 
    articles, 
    savedArticlesList, 
    toggleBookmarkArticle 
  } = useEducation();

  // Active category filter: 'all', 'menyusui', 'gizi', 'newborn', 'toddler'
  const [activeCategory, setActiveCategory] = useState('all');

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

  // Toggle view state: 'catalog' or 'saved'
  const [activeTab, setActiveTab] = useState('catalog');

  // Track expanded articles for full reading
  const [expandedArticleIds, setExpandedArticleIds] = useState({});

  // Reset internal states on tab switches
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setExpandedArticleIds({});
  };

  // Check if an article is bookmarked
  const isBookmarked = (articleId) => {
    return savedArticlesList.some(
      item => item.articleId === articleId && item.userId === currentUser?.id
    );
  };

  // Handle bookmark click
  const handleBookmarkToggle = (e, articleId) => {
    e.stopPropagation(); // Avoid card expansion when bookmarking
    if (!currentUser?.id) return;
    try {
      toggleBookmarkArticle(currentUser.id, articleId);
    } catch (err) {
      console.error('Error toggling bookmark:', err);
    }
  };

  // Toggle article expansion
  const toggleArticleExpand = (articleId) => {
    setExpandedArticleIds(prev => ({
      ...prev,
      [articleId]: !prev[articleId]
    }));
  };

  // Filtered articles list
  const filteredArticles = useMemo(() => {
    // 1. Filter by Saved tab if active
    let list = articles;
    if (activeTab === 'saved') {
      list = articles.filter(art => isBookmarked(art.id));
    }

    // 2. Filter by Category scroll tab
    if (activeCategory !== 'all') {
      list = list.filter(art => art.category === activeCategory);
    }

    return list;
  }, [articles, activeTab, activeCategory, savedArticlesList, currentUser?.id]);

  // Translate categories to friendly Indonesian labels
  const getCategoryLabel = (category) => {
    switch (category) {
      case 'menyusui': return 'Menyusui';
      case 'gizi': return 'Nutrisi & MPASI';
      case 'newborn': return 'Tumbuh Kembang';
      case 'toddler': return 'Pola Asuh';
      default: return category;
    }
  };

  // Color mapping for category badges
  const getCategoryBadgeStyle = (category) => {
    switch (category) {
      case 'menyusui': return 'bg-primary/10 border-primary/15 text-primary';
      case 'gizi': return 'bg-secondary/10 border-secondary/15 text-secondary';
      case 'newborn': return 'bg-accent/10 border-accent/15 text-accent';
      case 'toddler': return 'bg-warning/10 border-warning/15 text-warning';
      default: return 'bg-bg border-border text-text-secondary';
    }
  };

  return (
    <div className="space-y-6 font-[var(--font-body)] px-0 py-4 pb-24 animate-fade-in">
      
      {/* Header with back button */}
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-gray-50/80 text-gray-500 transition-colors duration-200 cursor-pointer focus:outline-none"
          aria-label="Kembali ke profil"
        >
          <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h2 className="text-xl font-bold font-[var(--font-heading)] text-gray-900 tracking-tight">
          Edukasi & Artikel 📚
        </h2>
      </div>

      {/* SUB-TABS: Catalog vs Saved Articles */}
      <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-1 flex">
        <button
          onClick={() => handleTabChange('catalog')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all duration-200 ease-in-out focus:outline-none ${
            activeTab === 'catalog'
              ? 'bg-white text-primary shadow-[0_2px_8px_rgba(0,0,0,0.01)] border border-gray-100/50'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Artikel Edukasi
        </button>
        <button
          onClick={() => handleTabChange('saved')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all duration-200 ease-in-out focus:outline-none ${
            activeTab === 'saved'
              ? 'bg-white text-primary shadow-[0_2px_8px_rgba(0,0,0,0.01)] border border-gray-100/50'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Simpanan Bunda ({savedArticlesList.length})
        </button>
      </div>

      {/* HORIZONTAL CATEGORY FILTER BAR */}
      <div className="space-y-2">
        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider pl-1">
          Topik Pembahasan
        </span>
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
              { id: 'all', label: 'Semua Topik' },
              { id: 'menyusui', label: 'Menyusui' },
              { id: 'gizi', label: 'Nutrisi & MPASI' },
              { id: 'newborn', label: 'Tumbuh Kembang' },
              { id: 'toddler', label: 'Pola Asuh' }
            ].map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 text-xs font-bold rounded-full border cursor-pointer flex-shrink-0 transition-all duration-200 ease-in-out focus:outline-none ${
                    isActive
                      ? 'bg-primary border-primary text-white shadow-sm'
                      : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50/50 hover:border-gray-300'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ARTICLES CONTENT LIST */}
      {filteredArticles.length === 0 ? (
        <div className="p-8 bg-white border border-gray-100 rounded-card text-center text-xs text-gray-400 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
          {activeTab === 'saved'
            ? 'Bunda belum menyimpan artikel apa pun. Tekan ikon hati pada artikel bermanfaat untuk menyimpannya di sini! 🧡'
            : 'Tidak ada artikel yang ditemukan untuk kategori ini.'}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredArticles.map((article) => {
            const isExpanded = !!expandedArticleIds[article.id];
            const bookmarked = isBookmarked(article.id);
            return (
              <div
                key={article.id}
                className="bg-white rounded-card border border-gray-100 hover:border-gray-200 shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.04)] transition-all duration-200 ease-in-out overflow-hidden"
              >
                
                {/* Article Header Card */}
                <div
                  onClick={() => toggleArticleExpand(article.id)}
                  className="p-5 space-y-3 cursor-pointer select-none"
                >
                  <div className="flex justify-between items-center gap-4">
                    {/* Category tag */}
                    <span className={`px-2.5 py-0.5 text-[9px] font-extrabold rounded-full border uppercase tracking-wider ${getCategoryBadgeStyle(article.category)}`}>
                      {getCategoryLabel(article.category)}
                    </span>

                    {/* Bookmark heart icon */}
                    <button
                      type="button"
                      onClick={(e) => handleBookmarkToggle(e, article.id)}
                      className="p-1 -mr-1 text-gray-400 hover:text-primary transition-all duration-200 ease-in-out focus:outline-none cursor-pointer"
                      aria-label={bookmarked ? 'Hapus dari simpanan' : 'Simpan artikel'}
                    >
                      <svg
                        className={`w-5 h-5 transition-transform duration-200 active:scale-125 ${
                          bookmarked ? 'fill-primary text-primary' : 'fill-transparent text-gray-400 hover:text-primary'
                        }`}
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                      </svg>
                    </button>
                  </div>

                  {/* Title wrapping naturally */}
                  <h3 className="text-sm font-semibold font-[var(--font-heading)] text-gray-900 leading-snug whitespace-normal break-words">
                    {article.title}
                  </h3>

                  {/* Collapsed body teaser or Action trigger */}
                  <div className="flex justify-between items-center text-[10px] text-primary font-bold uppercase tracking-wider pt-1.5">
                    <span>{isExpanded ? 'Tutup Artikel' : 'Baca Selengkapnya'}</span>
                    <svg
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Expanded article detailed content */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-gray-100 bg-gray-50/40 text-xs text-gray-600 leading-relaxed space-y-3 whitespace-normal break-words animate-slide-down font-[var(--font-body)]">
                    {/* Render paragraphs cleanly */}
                    {article.contentBody.split('\n\n').map((paragraph, index) => {
                      if (paragraph.startsWith('###')) {
                        return (
                          <h4 key={`header-${index}`} className="text-xs font-semibold text-gray-900 pt-2 font-[var(--font-heading)]">
                            {paragraph.replace('###', '').trim()}
                          </h4>
                        );
                      }
                      if (paragraph.includes('- **') || paragraph.includes('1. **')) {
                        // Render simple bullets/lists
                        return (
                          <div key={`list-${index}`} className="space-y-1.5 pl-1">
                            {paragraph.split('\n').map((line, lIdx) => {
                              const cleanedLine = line.replace(/^[-\d.]\s+/, '').replace(/\*\*/g, '');
                              const isBoldTitle = line.match(/\*\*(.*?)\*\*/);
                              return (
                                <p key={`line-${lIdx}`} className="flex gap-2">
                                  <span className="text-primary font-black">•</span>
                                  <span>
                                    {isBoldTitle ? (
                                      <>
                                        <span className="text-gray-900 font-semibold mr-1">{isBoldTitle[1]}</span>
                                        {cleanedLine.replace(isBoldTitle[1], '')}
                                      </>
                                    ) : (
                                      cleanedLine
                                    )}
                                  </span>
                                </p>
                              );
                            })}
                          </div>
                        );
                      }
                      return (
                        <p key={`p-${index}`}>
                          {paragraph.replace(/\*\*/g, '')}
                        </p>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
