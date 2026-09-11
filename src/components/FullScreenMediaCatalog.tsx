import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Play,
  Flame,
  Star,
  Film,
  Tv,
  Search,
  Sliders,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Filter,
  Check,
  Plus,
  Trash2,
  Layers,
  ArrowLeft,
  Loader2,
  Info,
} from 'lucide-react';
import { MediaItem, MediaType, PlayerConfig, CustomSubtitle } from '../types';
import { TRENDING_MEDIA, getPaginatedMediaBatch } from '../data/mediaPresets';

interface FullScreenMediaCatalogProps {
  isOpen: boolean;
  onClose: () => void;
  currentMedia: MediaItem;
  onSelectMedia: (media: MediaItem) => void;
  config: PlayerConfig;
  onUpdateConfig: (config: PlayerConfig) => void;
}

const GENRES = [
  'All',
  'Action',
  'Sci-Fi',
  'Adventure',
  'Animation',
  'Drama',
  'Crime',
  'Comedy',
  'Horror',
  'Fantasy',
];

export const FullScreenMediaCatalog: React.FC<FullScreenMediaCatalogProps> = ({
  isOpen,
  onClose,
  currentMedia,
  onSelectMedia,
  config,
  onUpdateConfig,
}) => {
  // Navigation & Filtering
  const [filterType, setFilterType] = useState<'all' | 'movie' | 'tv'>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Infinite Scroll State
  const [page, setPage] = useState<number>(1);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);

  // Trending Carousel / Spotlight
  const [trendingIndex, setTrendingIndex] = useState<number>(0);
  const trendingList = TRENDING_MEDIA;
  const currentTrending = trendingList[trendingIndex] || trendingList[0];

  // TV Episode Picker State
  const [selectedTvForModal, setSelectedTvForModal] = useState<MediaItem | null>(null);
  const [tvSeason, setTvSeason] = useState<number>(1);
  const [tvEpisode, setTvEpisode] = useState<number>(1);

  // Custom Stream Modal / Drawer
  const [isCustomDrawerOpen, setIsCustomDrawerOpen] = useState<boolean>(false);
  const [customType, setCustomType] = useState<MediaType>('movie');
  const [customId, setCustomId] = useState<string>('');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customSeason, setCustomSeason] = useState<number>(1);
  const [customEpisode, setCustomEpisode] = useState<number>(1);

  // Subtitle custom inputs
  const [newSubUrl, setNewSubUrl] = useState<string>('');
  const [newSubLabel, setNewSubLabel] = useState<string>('');

  // IntersectionObserver sentinel ref
  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Load items whenever filter or page changes
  useEffect(() => {
    if (!isOpen) return;

    // Reset pagination on filter change
    setPage(1);
    const initialBatch = getPaginatedMediaBatch(
      1,
      12,
      filterType,
      selectedGenre === 'All' ? 'all' : selectedGenre,
      searchQuery
    );
    setItems(initialBatch);
    setHasMore(true);
  }, [isOpen, filterType, selectedGenre, searchQuery]);

  // Load next batch when page increments
  useEffect(() => {
    if (page === 1) return;

    setIsLoadingMore(true);
    const timer = setTimeout(() => {
      const nextBatch = getPaginatedMediaBatch(
        page,
        12,
        filterType,
        selectedGenre === 'All' ? 'all' : selectedGenre,
        searchQuery
      );

      setItems(nextBatch);
      setIsLoadingMore(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [page, filterType, selectedGenre, searchQuery]);

  // Infinite scroll intersection observer
  useEffect(() => {
    if (!isOpen) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && !isLoadingMore && hasMore) {
          setPage((prev) => prev + 1);
        }
      },
      {
        root: scrollContainerRef.current,
        rootMargin: '250px',
        threshold: 0.1,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isOpen, isLoadingMore, hasMore]);

  // Auto-rotate trending billboard every 7 seconds
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setTrendingIndex((prev) => (prev + 1) % trendingList.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [isOpen, trendingList.length]);

  if (!isOpen) return null;

  const handleMediaClick = (media: MediaItem) => {
    if (media.type === 'tv') {
      // Open Season & Episode Selector for TV series
      setSelectedTvForModal(media);
      setTvSeason(media.season || 1);
      setTvEpisode(media.episode || 1);
    } else {
      // Immediately play movie
      onSelectMedia(media);
      onClose();
    }
  };

  const handleConfirmTvPlay = () => {
    if (!selectedTvForModal) return;
    onSelectMedia({
      ...selectedTvForModal,
      season: tvSeason,
      episode: tvEpisode,
    });
    setSelectedTvForModal(null);
    onClose();
  };

  const handleCustomStreamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customId.trim()) return;

    const trimmed = customId.trim();
    const media: MediaItem = {
      id: trimmed,
      title: customTitle.trim() || `Custom Stream (${trimmed})`,
      type: customType,
      season: customType === 'tv' ? customSeason : undefined,
      episode: customType === 'tv' ? customEpisode : undefined,
      year: 'Custom',
    };

    onSelectMedia(media);
    setIsCustomDrawerOpen(false);
    onClose();
  };

  const handleAddSubtitle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubUrl.trim() || !newSubLabel.trim()) return;

    const updated = [
      ...config.subtitles,
      { url: newSubUrl.trim(), label: newSubLabel.trim() },
    ];
    onUpdateConfig({ ...config, subtitles: updated });
    setNewSubUrl('');
    setNewSubLabel('');
  };

  const handleRemoveSubtitle = (index: number) => {
    const updated = config.subtitles.filter((_, idx) => idx !== index);
    onUpdateConfig({ ...config, subtitles: updated });
  };

  return (
    <div
      id="fullscreen-media-catalog-page"
      className="fixed inset-0 z-50 bg-[#05060b] text-white flex flex-col overflow-hidden animate-in fade-in duration-200 select-none"
    >
      {/* 1. TOP STICKY HEADER NAV */}
      <header className="flex-shrink-0 z-30 flex items-center justify-between px-4 sm:px-8 py-3 bg-[#080912]/95 border-b border-white/[0.08] backdrop-blur-xl">
        {/* Left: Back to Player & Title */}
        <div className="flex items-center gap-3">
          <button
            id="btn-catalog-back-to-player"
            onClick={onClose}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-neutral-200 hover:text-white transition active:scale-95 border border-white/[0.06]"
            title="Return to Video Player"
          >
            <ArrowLeft className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold hidden sm:inline">Back to Player</span>
          </button>

          <div className="h-4 w-[1px] bg-white/[0.08] hidden sm:block" />

          {/* Currently Streaming Badge */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-neutral-400 hidden md:inline">Playing Now:</span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold truncate max-w-[150px] sm:max-w-[220px]">
                {currentMedia.title}
              </span>
              <span className="text-[10px] font-mono text-blue-400">
                {currentMedia.type === 'tv' ? `S${currentMedia.season}E${currentMedia.episode}` : currentMedia.id}
              </span>
            </div>
          </div>
        </div>

        {/* Center/Right: Custom Stream & Options & Close */}
        <div className="flex items-center gap-2">
          {/* Custom Stream Button */}
          <button
            id="btn-catalog-custom-stream"
            onClick={() => setIsCustomDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md active:scale-95 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Custom ID / Options</span>
          </button>

          {/* Close Button */}
          <button
            id="btn-catalog-close"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-neutral-300 hover:text-white transition"
            title="Close Catalog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 2. MAIN SCROLLABLE BODY (INFINITE SCROLL CONTAINER) */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{ scrollBehavior: 'smooth' }}
      >
        {/* ========================================================= */}
        {/* SECTION A: TOP NEW TRENDING MOVIES & TV SHOWS SHOWCASE    */}
        {/* ========================================================= */}
        <section
          id="trending-spotlight-section"
          className="relative w-full border-b border-white/[0.08] bg-gradient-to-b from-[#090b16] via-[#060810] to-[#05060b] overflow-hidden"
        >
          {/* Hero Backdrop Visual */}
          <div className="relative w-full min-h-[360px] sm:min-h-[440px] lg:min-h-[480px] flex items-end p-6 sm:p-10 lg:p-14 overflow-hidden">
            {/* Background Image with Cinematic Gradients */}
            {currentTrending.backdropUrl && (
              <img
                src={currentTrending.backdropUrl}
                alt={currentTrending.title}
                className="absolute inset-0 w-full h-full object-cover object-center opacity-35 scale-105 transition-all duration-700 blur-[1px]"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#05060b] via-[#05060b]/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#05060b] via-[#05060b]/60 to-transparent" />

            {/* Content Container */}
            <div className="relative z-10 max-w-3xl space-y-3.5">
              {/* Trending Badges Row */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-lg">
                  <Flame className="w-3.5 h-3.5 fill-white" />
                  #{currentTrending.trendingRank || 1} Trending Now
                </span>

                <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-600/30 text-blue-300 border border-blue-500/40">
                  {currentTrending.type === 'tv' ? 'TV Series' : 'Movie'}
                </span>

                {currentTrending.rating && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {currentTrending.rating} Rating
                  </span>
                )}

                <span className="text-xs font-mono text-neutral-300 bg-white/[0.08] px-2.5 py-1 rounded-full">
                  {currentTrending.year}
                </span>

                <span className="text-xs font-mono text-neutral-400">
                  {currentTrending.duration}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white drop-shadow-md">
                {currentTrending.title}
              </h1>

              {/* Genre line */}
              <p className="text-xs sm:text-sm font-semibold text-blue-400">
                {currentTrending.genre} &bull; <span className="font-mono text-neutral-400">{currentTrending.id}</span>
              </p>

              {/* Description */}
              <p className="text-xs sm:text-sm text-neutral-300 max-w-2xl leading-relaxed line-clamp-3">
                {currentTrending.description}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  id="btn-trending-play-now"
                  onClick={() => handleMediaClick(currentTrending)}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white hover:bg-neutral-200 text-black font-extrabold text-sm shadow-[0_0_30px_rgba(255,255,255,0.3)] transition active:scale-95"
                >
                  <Play className="w-4 h-4 fill-black" />
                  <span>
                    {currentTrending.type === 'tv' ? 'Watch Episode' : 'Play Now'}
                  </span>
                </button>

                {currentTrending.type === 'tv' && (
                  <button
                    onClick={() => {
                      setSelectedTvForModal(currentTrending);
                      setTvSeason(1);
                      setTvEpisode(1);
                    }}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/[0.1] hover:bg-white/[0.18] text-white font-bold text-sm border border-white/[0.12] transition active:scale-95"
                  >
                    <Tv className="w-4 h-4 text-purple-400" />
                    <span>Select Season & Episode</span>
                  </button>
                )}

                {/* Switcher Indicator Dots */}
                <div className="flex items-center gap-1.5 ml-auto hidden sm:flex">
                  {trendingList.map((item, idx) => (
                    <button
                      key={item.id}
                      onClick={() => setTrendingIndex(idx)}
                      className={`h-2 rounded-full transition-all ${
                        idx === trendingIndex
                          ? 'w-6 bg-blue-500'
                          : 'w-2 bg-white/20 hover:bg-white/40'
                      }`}
                      title={item.title}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Trending Carousel Strip (Horizontal Quick Select) */}
          <div className="px-4 sm:px-8 py-4 border-t border-white/[0.06] bg-[#070913]/90">
            <div className="flex items-center justify-between pb-2.5">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
                  Trending Top Picks This Week
                </h2>
              </div>
              <span className="text-[11px] text-neutral-400 font-mono">
                Click card to play or select
              </span>
            </div>

            {/* Horizontal Scroll Row */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10">
              {trendingList.map((item, idx) => {
                const isCurrentActive = currentMedia.id === item.id;
                const isSelectedInSpotlight = trendingIndex === idx;

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setTrendingIndex(idx);
                      handleMediaClick(item);
                    }}
                    className={`relative flex-shrink-0 w-36 sm:w-44 rounded-xl p-2 border transition-all cursor-pointer group select-none ${
                      isCurrentActive
                        ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                        : isSelectedInSpotlight
                        ? 'bg-white/[0.08] border-white/20'
                        : 'bg-[#0e101c] border-white/[0.06] hover:bg-[#151728] hover:border-white/[0.14]'
                    }`}
                  >
                    {/* Rank Badge */}
                    <div className="absolute top-3 left-3 z-10 px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md text-[10px] font-black text-amber-400 border border-amber-400/30">
                      #{idx + 1}
                    </div>

                    {/* Poster Thumbnail */}
                    <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden bg-neutral-900 mb-2">
                      {item.posterUrl ? (
                        <img
                          src={item.posterUrl}
                          alt={item.title}
                          className="poster w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-neutral-800 text-neutral-500">
                          <Film className="w-6 h-6" />
                        </div>
                      )}

                      {/* Play Hover Overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                          <Play className="w-4 h-4 fill-white ml-0.5" />
                        </div>
                      </div>
                    </div>

                    {/* Meta */}
                    <h3 className="text-xs font-bold text-white truncate group-hover:text-blue-300 transition-colors">
                      {item.title}
                    </h3>
                    <div className="flex items-center justify-between text-[10px] text-neutral-400 mt-1">
                      <span className="uppercase font-semibold text-blue-400">{item.type}</span>
                      <span>{item.year}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION B: FILTER BAR & SEARCH                           */}
        {/* ========================================================= */}
        <section className="sticky top-0 z-20 px-4 sm:px-8 py-3.5 bg-[#080912]/95 border-b border-white/[0.08] backdrop-blur-xl space-y-3">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Type Selector (All / Movies / TV Series) */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#10121f] border border-white/[0.06] w-full md:w-auto">
              <button
                id="btn-filter-all"
                onClick={() => setFilterType('all')}
                className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                  filterType === 'all'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                All Content
              </button>

              <button
                id="btn-filter-movies"
                onClick={() => setFilterType('movie')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-1 px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                  filterType === 'movie'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>Movies</span>
              </button>

              <button
                id="btn-filter-tv"
                onClick={() => setFilterType('tv')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-1 px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                  filterType === 'tv'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                <span>TV Series</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-80 flex items-center">
              <Search className="absolute left-3 w-4 h-4 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title, genre, IMDb ID (tt...)..."
                className="w-full bg-[#10121f] border border-white/[0.08] rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 text-neutral-400 hover:text-white p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Genre Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-neutral-500 flex items-center gap-1 text-[11px] font-semibold mr-1">
              <Filter className="w-3 h-3" /> Genre:
            </span>
            {GENRES.map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGenre(g)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                  selectedGenre === g
                    ? 'bg-white text-black font-bold shadow-md'
                    : 'bg-white/[0.05] text-neutral-400 hover:text-white hover:bg-white/[0.1]'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION C: INFINITE SCROLLING MOVIE & TV SHOWS GRID       */}
        {/* ========================================================= */}
        <section id="infinite-catalog-grid-section" className="px-4 sm:px-8 py-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                Explore All Movies & TV Shows
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/[0.08] text-neutral-400">
                {items.length} items loaded
              </span>
            </div>
            <span className="text-xs text-neutral-500 hidden sm:inline font-mono">
              Scroll down for endless recommendations &bull; Infinity Scrolling Active
            </span>
          </div>

          {/* Responsive Card Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
            {items.map((media, idx) => {
              const isCurrent = currentMedia.id === media.id;

              return (
                <div
                  key={`${media.id}-${idx}`}
                  tabIndex={0}
                  role="button"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ' || e.keyCode === 13) {
                      e.preventDefault();
                      handleMediaClick(media);
                    }
                  }}
                  onClick={() => handleMediaClick(media)}
                  className={`group interactive-element relative rounded-2xl p-2.5 border transition-all duration-200 cursor-pointer flex flex-col justify-between select-none ${
                    isCurrent
                      ? 'bg-blue-600/15 border-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.3)] ring-1 ring-blue-400/50'
                      : 'bg-[#0d0f1a] border-white/[0.06] hover:bg-[#141728] hover:border-white/[0.16] hover:shadow-xl'
                  }`}
                >
                  {/* Poster Thumbnail */}
                  <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden bg-neutral-900 mb-2">
                    {media.posterUrl ? (
                      <img
                        src={media.posterUrl}
                        alt={media.title}
                        loading="lazy"
                        className="poster w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-gradient-to-br from-neutral-800 to-neutral-950">
                        {media.type === 'tv' ? (
                          <Tv className="w-8 h-8 text-purple-400 mb-1" />
                        ) : (
                          <Film className="w-8 h-8 text-blue-400 mb-1" />
                        )}
                        <span className="text-[10px] font-bold text-neutral-300">{media.title}</span>
                      </div>
                    )}

                    {/* Media Type Badge */}
                    <div className="absolute top-2 left-2 z-10">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${
                          media.type === 'tv'
                            ? 'bg-purple-600/90 text-white'
                            : 'bg-blue-600/90 text-white'
                        }`}
                      >
                        {media.type === 'tv' ? 'TV' : 'MOVIE'}
                      </span>
                    </div>

                    {/* Rating Badge */}
                    {media.rating && (
                      <div className="absolute top-2 right-2 z-10 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[9px] font-bold text-amber-300">
                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                        <span>{media.rating}</span>
                      </div>
                    )}

                    {/* Hover Play Button Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-3 text-center gap-2">
                      <div className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center shadow-2xl transform scale-90 group-hover:scale-100 transition-transform">
                        <Play className="w-5 h-5 fill-black ml-0.5" />
                      </div>
                      <span className="text-[11px] font-bold text-white">
                        {media.type === 'tv' ? 'Pick Episode' : 'Stream Now'}
                      </span>
                    </div>

                    {/* Active Indicator */}
                    {isCurrent && (
                      <div className="absolute bottom-2 left-2 right-2 bg-blue-600 text-white text-[10px] font-bold py-0.5 px-1.5 rounded text-center shadow">
                        Currently Playing
                      </div>
                    )}
                  </div>

                  {/* Title & Metadata */}
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors line-clamp-1">
                      {media.title}
                    </h3>
                    <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                      <span>{media.year}</span>
                      <span className="truncate max-w-[80px]">{media.duration || media.id}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* INFINITE SCROLL SENTINEL & LOADING SPINNER */}
          <div
            ref={sentinelRef}
            className="w-full py-8 flex flex-col items-center justify-center gap-2 text-center"
          >
            {isLoadingMore ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.08] text-xs font-semibold text-neutral-300 border border-white/[0.08]">
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                <span>Loading more movies &amp; series into feed...</span>
              </div>
            ) : hasMore ? (
              <div className="text-[11px] text-neutral-500 font-mono flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                Scroll down to load next catalog page continuously
              </div>
            ) : (
              <div className="text-xs text-neutral-500 italic">
                You have reached the end of the catalog.
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ========================================================= */}
      {/* TV SEASON & EPISODE PICKER MODAL (WHEN TV SERIES CLICKED) */}
      {/* ========================================================= */}
      {selectedTvForModal && (
        <div
          id="tv-episode-picker-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setSelectedTvForModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-[#0e101c] border border-white/[0.12] rounded-2xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                  TV Series Selection
                </span>
                <h3 className="text-base font-bold text-white">
                  {selectedTvForModal.title}
                </h3>
                <p className="text-xs text-neutral-400 font-mono">
                  IMDb ID: {selectedTvForModal.id}
                </p>
              </div>
              <button
                onClick={() => setSelectedTvForModal(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Season Selector */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-neutral-300">Choose Season:</span>
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: selectedTvForModal.totalSeasons || 5 }, (_, i) => i + 1).map(
                  (s) => (
                    <button
                      key={s}
                      onClick={() => setTvSeason(s)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        tvSeason === s
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-[#181a2c] text-neutral-400 hover:text-white'
                      }`}
                    >
                      Season {s}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Episode Selector */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-neutral-300">Choose Episode:</span>
              <div className="grid grid-cols-5 gap-1.5">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((ep) => (
                  <button
                    key={ep}
                    onClick={() => setTvEpisode(ep)}
                    className={`py-2 rounded-xl text-xs font-mono font-bold transition ${
                      tvEpisode === ep
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-[#181a2c] text-neutral-400 hover:text-white'
                    }`}
                  >
                    EP {ep}
                  </button>
                ))}
              </div>
            </div>

            {/* Target URL Preview */}
            <div className="p-2.5 rounded-xl bg-black/60 border border-white/[0.06] text-[11px] font-mono text-purple-300 break-all">
              Stream: /tv/{selectedTvForModal.id}/{tvSeason}/{tvEpisode}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setSelectedTvForModal(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-bold text-neutral-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmTvPlay}
                className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold shadow-lg transition active:scale-95"
              >
                Stream S{tvSeason} E{tvEpisode} Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* CUSTOM STREAM & PLAYER CONFIG DRAWER/MODAL                */}
      {/* ========================================================= */}
      {isCustomDrawerOpen && (
        <div
          id="custom-stream-drawer-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setIsCustomDrawerOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl max-h-[85vh] bg-[#0c0e1a] border border-white/[0.1] rounded-2xl flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08] bg-[#080912]">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Custom Stream &amp; Player Settings</h3>
              </div>
              <button
                onClick={() => setIsCustomDrawerOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {/* Custom ID Form */}
              <form onSubmit={handleCustomStreamSubmit} className="space-y-3">
                <span className="font-bold text-neutral-200 block uppercase tracking-wider text-[10px]">
                  Play Custom IMDb or TMDB ID
                </span>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomType('movie')}
                    className={`flex-1 py-2 rounded-xl font-bold border transition ${
                      customType === 'movie'
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-[#151728] border-white/[0.06] text-neutral-400'
                    }`}
                  >
                    Movie Stream
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomType('tv')}
                    className={`flex-1 py-2 rounded-xl font-bold border transition ${
                      customType === 'tv'
                        ? 'bg-purple-600 border-purple-500 text-white'
                        : 'bg-[#151728] border-white/[0.06] text-neutral-400'
                    }`}
                  >
                    TV Series
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-neutral-400 block">
                    IMDb or TMDB ID:
                  </label>
                  <input
                    type="text"
                    required
                    value={customId}
                    onChange={(e) => setCustomId(e.target.value)}
                    placeholder="e.g. tt31193180 or 969681"
                    className="w-full bg-[#151728] border border-white/[0.08] rounded-xl px-3 py-2 font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {customType === 'tv' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-neutral-400 block mb-1">
                        Season:
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={customSeason}
                        onChange={(e) => setCustomSeason(parseInt(e.target.value, 10) || 1)}
                        className="w-full bg-[#151728] border border-white/[0.08] rounded-xl px-3 py-2 font-mono text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-neutral-400 block mb-1">
                        Episode:
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={customEpisode}
                        onChange={(e) => setCustomEpisode(parseInt(e.target.value, 10) || 1)}
                        className="w-full bg-[#151728] border border-white/[0.08] rounded-xl px-3 py-2 font-mono text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow-md"
                >
                  Load Custom Stream
                </button>
              </form>

              {/* Player Configuration (Skin, Welcome Page, Autoplay) */}
              <div className="pt-3 border-t border-white/[0.06] space-y-3">
                <span className="font-bold text-neutral-200 block uppercase tracking-wider text-[10px]">
                  Player Settings (EmbedMaster Query Parameters)
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-neutral-400 block mb-1">Skin:</label>
                    <div className="flex gap-1 bg-[#151728] p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => onUpdateConfig({ ...config, skin: 'onyx' })}
                        className={`flex-1 py-1 rounded-lg font-semibold ${
                          config.skin === 'onyx' ? 'bg-blue-600 text-white' : 'text-neutral-400'
                        }`}
                      >
                        onyx
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateConfig({ ...config, skin: 'aurora' })}
                        className={`flex-1 py-1 rounded-lg font-semibold ${
                          config.skin === 'aurora' ? 'bg-blue-600 text-white' : 'text-neutral-400'
                        }`}
                      >
                        aurora
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-neutral-400 block mb-1">Welcome Page:</label>
                    <div className="flex gap-1 bg-[#151728] p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => onUpdateConfig({ ...config, welcomePage: 'off' })}
                        className={`flex-1 py-1 rounded-lg font-semibold ${
                          config.welcomePage === 'off' ? 'bg-blue-600 text-white' : 'text-neutral-400'
                        }`}
                      >
                        off
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateConfig({ ...config, welcomePage: 'on' })}
                        className={`flex-1 py-1 rounded-lg font-semibold ${
                          config.welcomePage === 'on' ? 'bg-blue-600 text-white' : 'text-neutral-400'
                        }`}
                      >
                        on
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subtitles Manager */}
              <div className="pt-3 border-t border-white/[0.06] space-y-2">
                <span className="font-bold text-neutral-200 block uppercase tracking-wider text-[10px]">
                  Custom Subtitles (VTT/SRT)
                </span>

                {config.subtitles.length > 0 ? (
                  <div className="space-y-1">
                    {config.subtitles.map((sub, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 rounded-lg bg-[#151728] border border-white/[0.04]"
                      >
                        <span className="font-semibold text-white">{sub.label}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubtitle(i)}
                          className="text-rose-400 hover:text-rose-300"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-neutral-500 italic block">No custom subtitles added.</span>
                )}

                <form onSubmit={handleAddSubtitle} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Label (e.g. English)"
                    value={newSubLabel}
                    onChange={(e) => setNewSubLabel(e.target.value)}
                    className="w-1/3 bg-[#151728] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-white"
                  />
                  <input
                    type="url"
                    placeholder="URL (https://...vtt)"
                    value={newSubUrl}
                    onChange={(e) => setNewSubUrl(e.target.value)}
                    className="w-2/3 bg-[#151728] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-white font-mono"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold"
                  >
                    Add
                  </button>
                </form>
              </div>
            </div>

            <div className="p-4 border-t border-white/[0.08] bg-[#080912] flex justify-end">
              <button
                onClick={() => setIsCustomDrawerOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white font-bold text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
