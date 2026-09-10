import React, { useState } from 'react';
import { MediaItem } from '../types';
import { POPULAR_CATALOG } from '../data/mockCatalog';
import { Film, Tv, Search, PlusCircle, Star, PlayCircle } from 'lucide-react';

interface MediaCatalogProps {
  currentMediaId: string;
  onSelectMedia: (media: MediaItem) => void;
}

export const MediaCatalog: React.FC<MediaCatalogProps> = ({
  currentMediaId,
  onSelectMedia,
}) => {
  const [filter, setFilter] = useState<'all' | 'movie' | 'tv'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Custom Quick Loader
  const [customId, setCustomId] = useState('');
  const [customType, setCustomType] = useState<'movie' | 'tv'>('movie');
  const [customTitle, setCustomTitle] = useState('');
  const [customSeason, setCustomSeason] = useState(1);
  const [customEpisode, setCustomEpisode] = useState(1);

  const filteredCatalog = POPULAR_CATALOG.filter((item) => {
    if (filter !== 'all' && item.type !== filter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        (item.genre && item.genre.some((g) => g.toLowerCase().includes(q)))
      );
    }
    return true;
  });

  const handleCustomLoad = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customId.trim()) return;

    const newMedia: MediaItem = {
      id: customId.trim(),
      title: customTitle.trim() || `Custom (${customId.trim()})`,
      type: customType,
      season: customType === 'tv' ? customSeason : undefined,
      episode: customType === 'tv' ? customEpisode : undefined,
    };
    onSelectMedia(newMedia);
    setCustomId('');
    setCustomTitle('');
  };

  return (
    <section id="media_catalog_section" className="space-y-4 hardware-mono">
      {/* Quick Custom ID Embed Box - Styled as Signal / Feed Injector */}
      <div className="bg-[#111111] border-2 border-[#2b2b2b] rounded-md p-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#222222] pb-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="led led-cyan"></span>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>MANUAL_FEED_INJECTOR</span>
            </h3>
          </div>
          <span className="text-[10px] text-[#888888]">
            FORMAT: IMDb <code className="text-[#00F0FF]">tt...</code> OR TMDB NUMERIC
          </span>
        </div>

        <form onSubmit={handleCustomLoad} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
          <div className="sm:col-span-2">
            <label className="block text-[10px] text-[#888888] uppercase mb-1">Type</label>
            <select
              value={customType}
              onChange={(e) => setCustomType(e.target.value as 'movie' | 'tv')}
              className="w-full px-2.5 py-1.5 rounded-[3px] bg-[#050505] border border-[#333333] text-xs text-white focus:outline-none focus:border-[#00F0FF] cursor-pointer"
            >
              <option value="movie">MOVIE</option>
              <option value="tv">TV_SERIES</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-[10px] text-[#888888] uppercase mb-1">
              TARGET_ID (tt...)
            </label>
            <input
              type="text"
              required
              placeholder="e.g. tt31193180"
              value={customId}
              onChange={(e) => setCustomId(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-[3px] bg-[#050505] border border-[#333333] text-xs text-[#00F0FF] focus:outline-none focus:border-[#00F0FF]"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-[10px] text-[#888888] uppercase mb-1">
              DISPLAY_LABEL (OPTIONAL)
            </label>
            <input
              type="text"
              placeholder="e.g. Inception"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-[3px] bg-[#050505] border border-[#333333] text-xs text-white focus:outline-none focus:border-[#00F0FF]"
            />
          </div>

          {customType === 'tv' ? (
            <>
              <div className="sm:col-span-1">
                <label className="block text-[10px] text-[#888888] uppercase mb-1">S#</label>
                <input
                  type="number"
                  min={1}
                  value={customSeason}
                  onChange={(e) => setCustomSeason(Math.max(1, Number(e.target.value)))}
                  className="w-full px-1.5 py-1.5 rounded-[3px] bg-[#050505] border border-[#333333] text-xs text-[#00F0FF] text-center"
                />
              </div>
              <div className="sm:col-span-1">
                <label className="block text-[10px] text-[#888888] uppercase mb-1">Ep#</label>
                <input
                  type="number"
                  min={1}
                  value={customEpisode}
                  onChange={(e) => setCustomEpisode(Math.max(1, Number(e.target.value)))}
                  className="w-full px-1.5 py-1.5 rounded-[3px] bg-[#050505] border border-[#333333] text-xs text-[#00F0FF] text-center"
                />
              </div>
            </>
          ) : (
            <div className="sm:col-span-2 hidden sm:block" />
          )}

          <div className="sm:col-span-2">
            <button
              type="submit"
              className="hardware-btn-accent w-full py-1.5 px-3 rounded-[3px] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>LOAD_FEED</span>
            </button>
          </div>
        </form>
      </div>

      {/* Catalog Search & Category Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0a0a0a] border border-[#222222] p-2.5 rounded-[3px]">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilter('all')}
            className={`hardware-btn px-2.5 py-1 text-xs font-bold uppercase ${
              filter === 'all' ? 'active' : ''
            }`}
          >
            ALL_FEEDS
          </button>
          <button
            onClick={() => setFilter('movie')}
            className={`hardware-btn px-2.5 py-1 text-xs font-bold uppercase flex items-center gap-1 ${
              filter === 'movie' ? 'active' : ''
            }`}
          >
            <Film className="w-3 h-3" />
            <span>MOVIES</span>
          </button>
          <button
            onClick={() => setFilter('tv')}
            className={`hardware-btn px-2.5 py-1 text-xs font-bold uppercase flex items-center gap-1 ${
              filter === 'tv' ? 'active' : ''
            }`}
          >
            <Tv className="w-3 h-3" />
            <span>TV_SERIES</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-[#666666] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="FILTER BY ID, TITLE, GENRE..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1 rounded-[3px] bg-[#050505] border border-[#333333] text-xs text-white focus:outline-none focus:border-[#00F0FF] placeholder:text-[#555555]"
          />
        </div>
      </div>

      {/* Catalog Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {filteredCatalog.map((item) => {
          const isSelected = item.id === currentMediaId;
          return (
            <div
              key={item.id}
              onClick={() => onSelectMedia(item)}
              className={`group relative rounded-[3px] overflow-hidden bg-[#111111] border-2 transition-all cursor-pointer flex flex-col ${
                isSelected
                  ? 'border-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                  : 'border-[#222222] hover:border-[#444444]'
              }`}
            >
              {/* Poster Image */}
              <div className="aspect-[2/3] w-full bg-[#050505] overflow-hidden relative border-b border-[#222222]">
                {item.poster ? (
                  <img
                    src={item.poster}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#444444]">
                    <Film className="w-8 h-8" />
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
                  <span className="px-1.5 py-0.5 rounded-[2px] bg-[#050505]/90 border border-[#333333] text-[9px] font-bold text-[#00F0FF]">
                    {item.type === 'tv' ? 'TV' : 'CINEMA'}
                  </span>
                  {isSelected && (
                    <span className="px-1.5 py-0.5 rounded-[2px] bg-[#00FF66]/20 border border-[#00FF66] text-[8px] font-bold text-[#00FF66] flex items-center gap-1">
                      <span className="led led-green" />
                      ACTIVE
                    </span>
                  )}
                </div>

                {item.rating && (
                  <div className="absolute top-1.5 right-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] bg-[#050505]/90 border border-[#FFB300]/40 text-[9px] font-bold text-[#FFB300]">
                    <Star className="w-2.5 h-2.5 fill-current text-[#FFB300]" />
                    <span>{item.rating}</span>
                  </div>
                )}

                {/* Hover Play Button Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="px-2.5 py-1 rounded-[2px] bg-[#00F0FF] text-black text-[10px] font-bold flex items-center gap-1 shadow-md">
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>PATCH_FEED</span>
                  </div>
                </div>
              </div>

              {/* Card Meta */}
              <div className="p-2.5 flex-1 flex flex-col justify-between bg-[#0e0e0e]">
                <div>
                  <h4 className="text-xs font-bold text-white truncate group-hover:text-[#00F0FF] transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-[9px] text-[#888888] mt-0.5">
                    {item.id} {item.year ? `// ${item.year}` : ''}
                  </p>
                </div>
                {item.genre && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.genre.slice(0, 2).map((g) => (
                      <span
                        key={g}
                        className="text-[8px] px-1 py-0.5 rounded-[2px] bg-[#1a1a1a] text-[#888888] border border-[#2b2b2b]"
                      >
                        {g.toUpperCase()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
