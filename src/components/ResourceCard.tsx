import React from 'react';
import { 
  FileText, 
  Video, 
  Globe, 
  Presentation, 
  BookOpen, 
  Folder, 
  Bookmark, 
  Eye, 
  ExternalLink,
  ShieldAlert,
  User,
  Clock
} from 'lucide-react';
import { Resource, MediaType } from '../types';

interface ResourceCardProps {
  resource: Resource;
  isFavorite: boolean;
  onToggleFavorite: (resource: Resource) => void;
  onSelect: (resource: Resource) => void;
  isOwner?: boolean;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  isFavorite,
  onToggleFavorite,
  onSelect,
  isOwner = false,
}) => {
  const getMediaBadge = (type: MediaType) => {
    switch (type) {
      case 'pdf':
        return {
          icon: <FileText className="w-4 h-4 text-rose-600" />,
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          label: 'PDF'
        };
      case 'video':
        return {
          icon: <Video className="w-4 h-4 text-purple-600" />,
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
          label: 'วิดีโอ'
        };
      case 'website':
        return {
          icon: <Globe className="w-4 h-4 text-emerald-600" />,
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          label: 'เว็บไซต์'
        };
      case 'slides':
        return {
          icon: <Presentation className="w-4 h-4 text-amber-600" />,
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          label: 'สไลด์'
        };
      case 'article':
        return {
          icon: <BookOpen className="w-4 h-4 text-blue-600" />,
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          label: 'บทความ'
        };
      default:
        return {
          icon: <Folder className="w-4 h-4 text-slate-600" />,
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
          label: 'สื่อการสอน'
        };
    }
  };

  const media = getMediaBadge(resource.mediaType);

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return '';
    }
  };

  return (
    <div 
      onClick={() => onSelect(resource)}
      className="group relative bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-lg transition-all duration-200 flex flex-col justify-between p-5 cursor-pointer overflow-hidden"
    >
      {/* Top Header: Category & Media Badge */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border ${media.bg}`}>
              {media.icon}
              <span>{media.label}</span>
            </span>
            <span className="inline-block px-2 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-600 rounded-md truncate max-w-[140px]">
              {resource.category}
            </span>
          </div>

          {/* Favorite button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(resource);
            }}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              isFavorite
                ? 'bg-amber-50 text-amber-500 hover:bg-amber-100'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
            }`}
            title={isFavorite ? 'นำออกจากรายการโปรด' : 'บันทึกรายการโปรด'}
          >
            <Bookmark className={`w-4 h-4 ${isFavorite ? 'fill-amber-500' : ''}`} />
          </button>
        </div>

        {/* Title */}
        <h4 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug mb-2">
          {resource.title}
        </h4>

        {/* Description Excerpt */}
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
          {resource.description || 'ไม่มีคำอธิบายเพิ่มเติม คลิกเพื่อดูรายละเอียดและสื่อต้นทาง'}
        </p>

        {/* Grade level chip */}
        <div className="mb-4">
          <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-100">
            {resource.gradeLevel}
          </span>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2 max-w-[60%]">
          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[10px] shrink-0">
            {resource.authorName?.[0] || 'U'}
          </div>
          <span className="truncate text-slate-700 font-medium">
            {resource.authorName}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="flex items-center gap-1 text-slate-400" title="จำนวนผู้เข้าชม">
            <Eye className="w-3.5 h-3.5" />
            <span>{resource.viewCount || 0}</span>
          </span>
          <span className="flex items-center gap-1 text-slate-400" title="บันทึกเป็นรายการโปรด">
            <Bookmark className="w-3.5 h-3.5" />
            <span>{resource.favoriteCount || 0}</span>
          </span>
        </div>
      </div>

      {resource.isHidden && (
        <div className="absolute top-2 right-12 px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-700 rounded-md border border-rose-200">
          ถูกซ่อนไว้
        </div>
      )}
    </div>
  );
};
