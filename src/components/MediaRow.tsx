import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TMDBMedia } from '../types';
import { MediaCard } from './MediaCard';

interface MediaRowProps {
  title: string;
  items: TMDBMedia[];
  onSelectMedia: (media: TMDBMedia) => void;
  rowId: string;
}

export const MediaRow: React.FC<MediaRowProps> = ({
  title,
  items,
  onSelectMedia,
  rowId
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!items || items.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.75;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="my-6 sm:my-8 group relative" aria-label={title}>
      {/* Row Header */}
      <div className="tv-safe-area flex items-center justify-between mb-3">
        <h2 className="font-heading text-lg sm:text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <span className="w-1.5 h-5 rounded-full bg-sky-500 inline-block" />
          {title}
        </h2>

        {/* Scroll indicator controls */}
        <div className="hidden sm:flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => scroll('left')}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 transition-colors"
            title="Scroll Left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 transition-colors"
            title="Scroll Right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cards Scroll Container */}
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex items-stretch gap-3.5 sm:gap-4 overflow-x-auto no-scrollbar tv-safe-area pb-4 pt-1 scroll-smooth"
        >
          {items.map((media, idx) => (
            <MediaCard
              key={`${media.id}-${idx}`}
              media={media}
              onSelect={onSelectMedia}
              index={idx}
              rowId={rowId}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
