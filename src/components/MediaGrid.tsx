import { FC } from 'react';
import { TMDBMediaItem } from '../types';
import { MediaCard } from './MediaCard';
import { Loader2, Film, RefreshCw } from 'lucide-react';

interface MediaGridProps {
  items: TMDBMediaItem[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  onItemClick: (item: TMDBMediaItem) => void;
  onQuickCast?: (item: TMDBMediaItem) => void;
  isTvConnected?: boolean;
  onRetry?: () => void;
  errorMessage?: string | null;
}

export const MediaGrid: FC<MediaGridProps> = ({
  items,
  isLoading,
  isLoadingMore,
  hasMore,
  onItemClick,
  onQuickCast,
  isTvConnected,
  onRetry,
  errorMessage,
}) => {
  if (isLoading && items.length === 0) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-5">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="flex flex-col rounded-2xl bg-neutral-900/60 border border-neutral-800/60 overflow-hidden animate-pulse"
          >
            <div className="aspect-2/3 w-full bg-neutral-800" />
            <div className="p-3 space-y-2">
              <div className="h-3.5 bg-neutral-800 rounded w-3/4" />
              <div className="h-2.5 bg-neutral-800 rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (errorMessage && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-3xl bg-neutral-900/40 border border-neutral-800">
        <Film className="w-12 h-12 text-neutral-600 mb-3" />
        <h3 className="text-lg font-bold text-white mb-1">Unable to Load Media</h3>
        <p className="text-sm text-neutral-400 max-w-sm mb-4 leading-relaxed">{errorMessage}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold text-xs shadow-lg transition active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        )}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-3xl bg-neutral-900/40 border border-neutral-800">
        <Film className="w-12 h-12 text-neutral-600 mb-3" />
        <h3 className="text-lg font-bold text-white mb-1">No Results Found</h3>
        <p className="text-sm text-neutral-400 max-w-sm">
          Try searching for different keywords or switch categories.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Media Cards Grid */}
      <div
        id="media-grid-container"
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-5"
      >
        {items.map((item, index) => (
          <MediaCard
            key={`${item.id}-${index}`}
            item={item}
            onClick={() => onItemClick(item)}
            onQuickCast={onQuickCast ? () => onQuickCast(item) : undefined}
            isTvConnected={isTvConnected}
            navId={`grid-item-${item.id}`}
          />
        ))}
      </div>

      {/* Infinite Scroll Loader */}
      {isLoadingMore && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs font-semibold shadow-lg">
            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
            <span>Loading More Titles...</span>
          </div>
        </div>
      )}

      {/* End of results indication */}
      {!hasMore && items.length > 0 && (
        <div className="text-center py-6 text-xs text-neutral-500 font-medium">
          You have viewed all available titles in this section
        </div>
      )}
    </div>
  );
};
