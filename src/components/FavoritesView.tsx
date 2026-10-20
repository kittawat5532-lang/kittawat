import React, { useState, useEffect } from 'react';
import { Bookmark, RefreshCw } from 'lucide-react';
import { Favorite, Resource } from '../types';
import { useAuth } from '../context/AuthContext';
import { fetchUserFavorites } from '../services/favoriteService';
import { fetchResourceById } from '../services/resourceService';
import { ResourceCard } from './ResourceCard';
import { EmptyState, LoadingSkeletonGrid } from './EmptyState';

interface FavoritesViewProps {
  onSelectResource: (resource: Resource) => void;
  onToggleFavorite: (resource: Resource) => void;
  favoriteIds: Set<string>;
  onExplore: () => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  onSelectResource,
  onToggleFavorite,
  favoriteIds,
  onExplore
}) => {
  const { currentUser } = useAuth();
  const [favoriteResources, setFavoriteResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const favList = await fetchUserFavorites(currentUser.uid);
      // Fetch corresponding resources
      const resourcePromises = favList.map(f => fetchResourceById(f.resourceId));
      const results = await Promise.all(resourcePromises);
      const validResources = results.filter((r): r is Resource => r !== null && !r.isHidden);
      setFavoriteResources(validResources);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, [currentUser]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Bookmark className="w-6 h-6 text-amber-500 fill-amber-500" />
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              รายการโปรดของฉัน (Bookmarks)
            </h2>
          </div>
          <p className="text-sm text-slate-500">
            คลังสื่อที่คุณบันทึกไว้ ซิงค์ตรงกันทุกอุปกรณ์ด้วยบัญชีของคุณ
          </p>
        </div>
        <button
          onClick={loadFavorites}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>รีเฟรช</span>
        </button>
      </div>

      {loading ? (
        <LoadingSkeletonGrid count={3} />
      ) : favoriteResources.length === 0 ? (
        <EmptyState
          type="favorites"
          title="ยังไม่มีรายการที่บันทึกไว้"
          description="เมื่อคุณพบชีทสรุป คลิป หรือสื่อการสอนที่สนใจ กดไอคอนบุ๊กมาร์กเพื่อบันทึกไว้ที่นี่ได้เลย"
          actionText="ไปสำรวจคลังความรู้"
          onAction={onExplore}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favoriteResources.map((res) => (
            <ResourceCard
              key={res.id}
              resource={res}
              isFavorite={favoriteIds.has(res.id)}
              onToggleFavorite={async (r) => {
                await onToggleFavorite(r);
                setFavoriteResources(prev => prev.filter(item => item.id !== r.id));
              }}
              onSelect={onSelectResource}
            />
          ))}
        </div>
      )}
    </div>
  );
};
