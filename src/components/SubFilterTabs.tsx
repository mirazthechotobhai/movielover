import { FC } from 'react';
import { FilterSortOption, ActiveCategory } from '../types';
import { TrendingUp, Flame, Star, PlayCircle } from 'lucide-react';

interface SubFilterTabsProps {
  category: ActiveCategory;
  selectedFilter: FilterSortOption;
  onSelectFilter: (filter: FilterSortOption) => void;
}

export const SubFilterTabs: FC<SubFilterTabsProps> = ({
  category,
  selectedFilter,
  onSelectFilter,
}) => {
  const filters: { id: FilterSortOption; label: string; icon: any }[] = [
    { id: 'popular', label: 'Popular', icon: Flame },
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'top_rated', label: 'Top Rated', icon: Star },
    ...(category !== 'anime'
      ? [{ id: 'now_playing' as FilterSortOption, label: category === 'movies' ? 'Now Playing' : 'On The Air', icon: PlayCircle }]
      : []),
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
      {filters.map((f) => {
        const Icon = f.icon;
        const isActive = selectedFilter === f.id;
        return (
          <button
            key={f.id}
            id={`filter-tab-${f.id}`}
            onClick={() => onSelectFilter(f.id)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex-shrink-0 ${
              isActive
                ? 'bg-neutral-800 text-cyan-400 border border-cyan-500/40'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-transparent'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{f.label}</span>
          </button>
        );
      })}
    </div>
  );
};
