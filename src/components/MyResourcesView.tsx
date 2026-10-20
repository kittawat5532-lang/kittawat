import React, { useState, useEffect } from 'react';
import { FolderGit2, Plus, RefreshCw, Eye, Bookmark, Trash2, Edit3, ExternalLink } from 'lucide-react';
import { Resource } from '../types';
import { useAuth } from '../context/AuthContext';
import { fetchUserResources, deleteResource } from '../services/resourceService';
import { EmptyState, LoadingSkeletonGrid } from './EmptyState';

interface MyResourcesViewProps {
  onSelectResource: (resource: Resource) => void;
  onEditResource: (resource: Resource) => void;
  onOpenCreate: () => void;
}

export const MyResourcesView: React.FC<MyResourcesViewProps> = ({
  onSelectResource,
  onEditResource,
  onOpenCreate
}) => {
  const { currentUser } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Resource | null>(null);

  const loadMyPosts = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const data = await fetchUserResources(currentUser.uid);
      setResources(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyPosts();
  }, [currentUser]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteResource(deleteTarget.id);
      setResources(prev => prev.filter(r => r.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FolderGit2 className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              สื่อการเรียนรู้ที่ฉันแบ่งปัน
            </h2>
          </div>
          <p className="text-sm text-slate-500">
            คุณได้แบ่งปันความรู้ไปแล้วทั้งหมด <strong className="text-slate-800">{resources.length}</strong> ชิ้นงาน
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadMyPosts}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>รีเฟรช</span>
          </button>
          <button
            onClick={onOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>แบ่งปันสื่อใหม่</span>
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSkeletonGrid count={3} />
      ) : resources.length === 0 ? (
        <EmptyState
          type="my-posts"
          title="คุณยังไม่ได้แบ่งปันสื่อการเรียนรู้"
          description="ร่วมเป็นผู้สร้างสังคมแห่งการเรียนรู้ แบ่งปันชีทสรุป คลิป หรือลิงก์ที่เป็นประโยชน์เพื่อช่วยเพื่อนๆ"
          actionText="เริ่มแบ่งปันสื่อแรกของคุณ"
          onAction={onOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((res) => (
            <div
              key={res.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-blue-400 p-5 shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 rounded-lg">
                    {res.category}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(res.createdAt).toLocaleDateString('th-TH')}
                  </span>
                </div>

                <h4 
                  onClick={() => onSelectResource(res)}
                  className="text-base font-bold text-slate-900 hover:text-blue-600 transition-colors cursor-pointer line-clamp-2 mb-2"
                >
                  {res.title}
                </h4>

                <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                  {res.description || 'ไม่มีคำอธิบาย'}
                </p>

                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-600 rounded">
                    {res.gradeLevel}
                  </span>
                  <span className="px-2 py-0.5 text-[11px] font-medium bg-sky-50 text-sky-700 rounded uppercase">
                    {res.mediaType}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{res.viewCount}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>{res.favoriteCount}</span>
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEditResource(res)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    title="แก้ไขสื่อนี้"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(res)}
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="ลบสื่อนี้"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <h4 className="text-lg font-bold text-slate-900 mb-2">ยืนยันการลบสื่อ</h4>
            <p className="text-xs text-slate-600 mb-6 bg-slate-50 p-3 rounded-xl border border-slate-200">
              คุณต้องการลบ <strong>"{deleteTarget.title}"</strong> ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-md cursor-pointer"
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
