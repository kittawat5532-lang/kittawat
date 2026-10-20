import React, { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  Download, 
  Bookmark, 
  Share2, 
  Flag, 
  Eye, 
  Calendar, 
  User, 
  Check, 
  Edit3, 
  Trash2, 
  EyeOff, 
  FileText, 
  Video, 
  Globe, 
  Presentation, 
  BookOpen, 
  AlertTriangle 
} from 'lucide-react';
import { Resource } from '../types';
import { useAuth } from '../context/AuthContext';

interface ResourceDetailModalProps {
  resource: Resource | null;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (resource: Resource) => void;
  onReport: (resource: Resource) => void;
  onEdit: (resource: Resource) => void;
  onDelete: (resource: Resource) => void;
  onToggleHide?: (resource: Resource) => void;
}

export const ResourceDetailModal: React.FC<ResourceDetailModalProps> = ({
  resource,
  onClose,
  isFavorite,
  onToggleFavorite,
  onReport,
  onEdit,
  onDelete,
  onToggleHide
}) => {
  const { currentUser, isAdmin, isModerator } = useAuth();
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!resource) return null;

  const isAuthor = currentUser?.uid === resource.authorId;
  const canManage = isAuthor || isModerator || isAdmin;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Check if link is YouTube
  const getYouTubeEmbedUrl = (url?: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

  const youtubeUrl = getYouTubeEmbedUrl(resource.url);
  const targetUrl = resource.fileUrl || resource.url;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-3">
            <span className="px-3 py-1 text-xs font-semibold rounded-lg bg-white/20 backdrop-blur-md text-white border border-white/20">
              {resource.category}
            </span>
            <span className="px-3 py-1 text-xs font-medium rounded-lg bg-sky-500/20 text-sky-200 border border-sky-400/20">
              {resource.gradeLevel}
            </span>
            {resource.isHidden && (
              <span className="px-3 py-1 text-xs font-bold rounded-lg bg-rose-500 text-white">
                ซ่อนจากการค้นหาสาธารณะ
              </span>
            )}
          </div>

          <h3 className="text-xl sm:text-2xl font-bold leading-snug tracking-tight pr-10">
            {resource.title}
          </h3>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-blue-200">
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4" />
              <span>ผู้แบ่งปัน: <strong className="text-white font-medium">{resource.authorName}</strong></span>
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>{new Date(resource.createdAt).toLocaleDateString('th-TH')}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              <span>{resource.viewCount} เข้าชม</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Bookmark className="w-4 h-4" />
              <span>{resource.favoriteCount} บันทึก</span>
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Media Preview if YouTube */}
          {youtubeUrl && (
            <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-inner bg-black">
              <iframe
                src={youtubeUrl}
                title={resource.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          {/* Description */}
          <div>
            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">
              รายละเอียดเนื้อหา
            </h4>
            <div className="text-slate-700 text-sm sm:text-base leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-2xl border border-slate-200">
              {resource.description || 'ไม่มีคำอธิบายเพิ่มเติม'}
            </div>
          </div>

          {/* Resource Links / Attachments Box */}
          <div className="bg-sky-50/70 border border-sky-100 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
                {resource.mediaType === 'pdf' ? <FileText className="w-6 h-6" /> :
                 resource.mediaType === 'video' ? <Video className="w-6 h-6" /> :
                 resource.mediaType === 'slides' ? <Presentation className="w-6 h-6" /> :
                 <Globe className="w-6 h-6" />}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  {resource.fileName || 'เปิดสื่อต้นฉบับ / แหล่งข้อมูล'}
                </p>
                <p className="text-xs text-slate-500 max-w-sm truncate">
                  {targetUrl || 'ไม่มีลิงก์ต้นฉบับ'}
                </p>
              </div>
            </div>

            {targetUrl ? (
              <a
                href={targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl shadow-md transition-all cursor-pointer"
              >
                <span>เปิดดูสื่อ / ดาวน์โหลด</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            ) : (
              <span className="text-xs text-slate-400">ไม่มีลิงก์</span>
            )}
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2">
              {/* Bookmark */}
              <button
                onClick={() => onToggleFavorite(resource)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  isFavorite
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${isFavorite ? 'fill-amber-600 text-amber-600' : ''}`} />
                <span>{isFavorite ? 'บันทึกแล้ว' : 'บันทึกรายการโปรด'}</span>
              </button>

              {/* Share */}
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                <span>{copied ? 'คัดลอกลิงก์แล้ว' : 'แชร์'}</span>
              </button>

              {/* Report */}
              <button
                onClick={() => onReport(resource)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl text-sm font-medium transition-colors cursor-pointer"
              >
                <Flag className="w-4 h-4" />
                <span>รายงานสื่อนี้</span>
              </button>
            </div>

            {/* Author / Moderator Controls */}
            {canManage && (
              <div className="flex items-center gap-2">
                {onToggleHide && (isModerator || isAdmin) && (
                  <button
                    onClick={() => onToggleHide(resource)}
                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    title={resource.isHidden ? 'ยกเลิกการซ่อน' : 'ซ่อนเนื้อหานี้'}
                  >
                    <EyeOff className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => onEdit(resource)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-sm font-medium transition-colors cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>แก้ไข</span>
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-sm font-medium transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>ลบ</span>
                </button>
              </div>
            )}
          </div>

          {/* Delete Confirmation Modal Overlay */}
          {confirmDelete && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl animate-in fade-in duration-150">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-rose-900">
                    ยืนยันการลบสื่อการเรียนรู้นี้?
                  </p>
                  <p className="text-xs text-rose-700 mt-1">
                    การกระทำนี้ไม่สามารถย้อนกลับได้ ข้อมูลสื่อจะถูกลบออกจากฐานข้อมูลทันที
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => onDelete(resource)}
                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer"
                    >
                      ยืนยันการลบ
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50 cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
