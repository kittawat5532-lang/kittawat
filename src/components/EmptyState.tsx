import React from 'react';
import { FolderOpen, SearchX, BookmarkX, Plus } from 'lucide-react';

interface EmptyStateProps {
  type?: 'resources' | 'search' | 'favorites' | 'my-posts' | 'reports';
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'resources',
  title,
  description,
  actionText,
  onAction,
}) => {
  const getDefaults = () => {
    switch (type) {
      case 'search':
        return {
          icon: <SearchX className="w-16 h-16 text-sky-400" />,
          title: title || 'ไม่พบสื่อการเรียนรู้ที่ค้นหา',
          desc: description || 'ลองปรับเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่อื่นๆ ดูนะครับ',
          btn: actionText || 'ล้างตัวกรองทั้งหมด'
        };
      case 'favorites':
        return {
          icon: <BookmarkX className="w-16 h-16 text-amber-400" />,
          title: title || 'ยังไม่มีรายการโปรด',
          desc: description || 'คุณสามารถกดบันทึกสื่อที่น่าสนใจได้จากการ์ดหรือหน้ารายละเอียดเพื่อกลับมาอ่านได้ทุกเมื่อ',
          btn: actionText || 'ค้นหาคลังความรู้'
        };
      case 'my-posts':
        return {
          icon: <FolderOpen className="w-16 h-16 text-blue-500" />,
          title: title || 'คุณยังไม่ได้แบ่งปันสื่อการเรียนรู้',
          desc: description || 'ร่วมเป็นส่วนหนึ่งของการแบ่งปันความรู้เพื่อการศึกษาไทย โพสต์ชีทสรุป คลิป หรือลิงก์ได้เลย!',
          btn: actionText || 'แบ่งปันสื่อแรกของคุณ'
        };
      case 'reports':
        return {
          icon: <FolderOpen className="w-16 h-16 text-emerald-500" />,
          title: title || 'ไม่มีรายงานค้างการตรวจสอบ',
          desc: description || 'เนื้อหาทั้งหมดในระบบขณะนี้เป็นไปตามระเบียบเรียบร้อยดี',
          btn: actionText
        };
      default:
        return {
          icon: <FolderOpen className="w-16 h-16 text-blue-400" />,
          title: title || 'ยังไม่มีสื่อการเรียนรู้ในหมวดหมู่นี้',
          desc: description || 'ร่วมแบ่งปันชีทสรุป วิดีโอ หรือแหล่งเรียนรู้ เพื่อเป็นวิทยาทานให้แก่เพื่อนๆ กันครับ',
          btn: actionText || 'ร่วมแบ่งปันความรู้'
        };
    }
  };

  const config = getDefaults();

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm max-w-xl mx-auto my-8">
      <div className="p-4 bg-sky-50 rounded-full mb-4">
        {config.icon}
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">{config.title}</h3>
      <p className="text-slate-500 text-sm max-w-md leading-relaxed mb-6">{config.desc}</p>
      {onAction && config.btn && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{config.btn}</span>
        </button>
      )}
    </div>
  );
};

export const LoadingSkeletonGrid: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm animate-pulse flex flex-col justify-between h-72"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 w-24 bg-slate-200 rounded-md"></div>
              <div className="h-6 w-20 bg-slate-100 rounded-md"></div>
            </div>
            <div className="h-6 w-5/6 bg-slate-200 rounded mb-3"></div>
            <div className="h-4 w-full bg-slate-100 rounded mb-2"></div>
            <div className="h-4 w-3/4 bg-slate-100 rounded mb-4"></div>
          </div>
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-200"></div>
              <div className="h-4 w-24 bg-slate-200 rounded"></div>
            </div>
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-100"></div>
              <div className="w-8 h-8 rounded-lg bg-slate-100"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
