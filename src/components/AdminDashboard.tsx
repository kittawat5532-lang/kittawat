import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Flag, 
  Users, 
  Settings, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  EyeOff, 
  Eye, 
  Trash2, 
  Search, 
  Plus, 
  Save, 
  RefreshCw,
  Clock,
  History,
  Lock,
  Unlock,
  ExternalLink
} from 'lucide-react';
import { 
  Report, 
  UserProfile, 
  SiteSettings, 
  ModerationLog, 
  UserRole, 
  UserStatus, 
  Resource 
} from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  fetchReports, 
  updateReportStatus, 
  logModerationAction, 
  fetchModerationLogs 
} from '../services/reportService';
import { 
  fetchAllUsers, 
  updateUserRole, 
  toggleUserStatus, 
  updateSiteSettings, 
  updateCustomCategories 
} from '../services/adminService';
import { deleteResource, toggleHideResource, fetchResourceById } from '../services/resourceService';

interface AdminDashboardProps {
  siteSettings: SiteSettings;
  categories: string[];
  onSettingsUpdated: (newSettings: SiteSettings) => void;
  onCategoriesUpdated: (newCategories: string[]) => void;
  onSelectResource: (resource: Resource) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  siteSettings,
  categories,
  onSettingsUpdated,
  onCategoriesUpdated,
  onSelectResource
}) => {
  const { currentUser, userProfile, isAdmin, isModerator } = useAuth();
  const [activeTab, setActiveTab] = useState<'reports' | 'users' | 'settings' | 'logs'>('reports');

  // Reports State
  const [reports, setReports] = useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  // Users State
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);

  // Settings State
  const [formData, setFormData] = useState<SiteSettings>(siteSettings);
  const [categoryList, setCategoryList] = useState<string[]>(categories);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Logs State
  const [logs, setLogs] = useState<ModerationLog[]>([]);

  // Action status messages
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Confirmation modal
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; report?: Report; resourceId?: string; title?: string }>({
    isOpen: false
  });

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    loadReports();
    if (isAdmin) {
      loadUsers();
      loadLogs();
    }
  }, [isAdmin]);

  const loadReports = async () => {
    setReportsLoading(true);
    try {
      const data = await fetchReports();
      setReports(data);
    } catch (err: any) {
      showToast('error', 'ไม่สามารถโหลดรายงานได้: ' + (err?.message || ''));
    } finally {
      setReportsLoading(false);
    }
  };

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const data = await fetchAllUsers();
      setUsers(data);
    } catch (err: any) {
      showToast('error', 'ไม่สามารถโหลดรายชื่อสมาชิกได้: ' + (err?.message || ''));
    } finally {
      setUsersLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      const data = await fetchModerationLogs();
      setLogs(data);
    } catch (e) {
      console.warn(e);
    }
  };

  // Moderate Report Action
  const handleResolveReport = async (report: Report, status: 'resolved' | 'dismissed') => {
    if (!currentUser) return;
    try {
      await updateReportStatus(report.id, status, currentUser.uid);
      await logModerationAction({
        action: status === 'resolved' ? 'แก้ไขปัญหาตามรายงาน' : 'ยกเลิกการรายงาน',
        targetType: 'report',
        targetId: report.id,
        targetTitle: report.resourceTitle,
        performedBy: currentUser.uid,
        performedByName: userProfile?.displayName || 'ผู้ดูแลระบบ',
        timestamp: new Date().toISOString()
      });
      showToast('success', `อัปเดตสถานะรายงานเป็น "${status === 'resolved' ? 'ดำเนินการแล้ว' : 'ยกเลิกคำขอ'}" สำเร็จ`);
      loadReports();
    } catch (err: any) {
      showToast('error', err?.message || 'เกิดข้อผิดพลาด');
    }
  };

  // Toggle Hide Resource
  const handleToggleHide = async (resourceId: string, resourceTitle: string) => {
    if (!currentUser) return;
    try {
      const res = await fetchResourceById(resourceId);
      if (!res) {
        showToast('error', 'ไม่พบสื่อการเรียนรู้นี้ในระบบ');
        return;
      }
      await toggleHideResource(resourceId, res.isHidden);
      await logModerationAction({
        action: res.isHidden ? 'ยกเลิกการซ่อนสื่อ' : 'ซ่อนสื่อจากสาธารณะ',
        targetType: 'resource',
        targetId: resourceId,
        targetTitle: resourceTitle,
        performedBy: currentUser.uid,
        performedByName: userProfile?.displayName || 'ผู้ดูแลระบบ',
        timestamp: new Date().toISOString()
      });
      showToast('success', res.isHidden ? 'ยกเลิกการซ่อนสื่อแล้ว' : 'ซ่อนสื่อการเรียนรู้เรียบร้อยแล้ว');
      loadReports();
    } catch (err: any) {
      showToast('error', err?.message || 'ไม่สามารถเปลี่ยนสถานะการซ่อนได้');
    }
  };

  // Permanent Delete Resource
  const handleExecuteDeleteResource = async () => {
    if (!deleteModal.resourceId || !currentUser) return;
    try {
      await deleteResource(deleteModal.resourceId);
      if (deleteModal.report) {
        await updateReportStatus(deleteModal.report.id, 'resolved', currentUser.uid);
      }
      await logModerationAction({
        action: 'ลบสื่อการเรียนรู้ออกจากฐานข้อมูล',
        targetType: 'resource',
        targetId: deleteModal.resourceId,
        targetTitle: deleteModal.title || 'สื่อการเรียนรู้',
        performedBy: currentUser.uid,
        performedByName: userProfile?.displayName || 'ผู้ดูแลระบบ',
        timestamp: new Date().toISOString()
      });
      showToast('success', 'ลบสื่อการเรียนรู้ออกจากระบบเรียบร้อย');
      setDeleteModal({ isOpen: false });
      loadReports();
    } catch (err: any) {
      showToast('error', err?.message || 'เกิดข้อผิดพลาดในการลบ');
    }
  };

  // User Role Change
  const handleChangeRole = async (targetUser: UserProfile, newRole: UserRole) => {
    if (!isAdmin) return;
    try {
      await updateUserRole(targetUser.uid, newRole);
      setUsers(users.map(u => u.uid === targetUser.uid ? { ...u, role: newRole } : u));
      await logModerationAction({
        action: `เปลี่ยนบทบาทเป็น ${newRole}`,
        targetType: 'user',
        targetId: targetUser.uid,
        targetTitle: targetUser.displayName,
        performedBy: currentUser?.uid || '',
        performedByName: userProfile?.displayName || 'Admin',
        timestamp: new Date().toISOString()
      });
      showToast('success', `เปลี่ยนบทบาทของ ${targetUser.displayName} เป็น ${newRole} เรียบร้อย`);
    } catch (err: any) {
      showToast('error', err?.message || 'ไม่สามารถเปลี่ยนบทบาทได้');
    }
  };

  // User Suspend Toggle
  const handleToggleSuspend = async (targetUser: UserProfile) => {
    if (!isAdmin) return;
    try {
      const next = await toggleUserStatus(targetUser.uid, targetUser.status);
      setUsers(users.map(u => u.uid === targetUser.uid ? { ...u, status: next } : u));
      await logModerationAction({
        action: next === 'suspended' ? 'ระงับบัญชีผู้ใช้' : 'ปลดระงับบัญชีผู้ใช้',
        targetType: 'user',
        targetId: targetUser.uid,
        targetTitle: targetUser.displayName,
        performedBy: currentUser?.uid || '',
        performedByName: userProfile?.displayName || 'Admin',
        timestamp: new Date().toISOString()
      });
      showToast('success', next === 'suspended' ? `ระงับบัญชี ${targetUser.displayName} แล้ว` : `ปลดระงับบัญชี ${targetUser.displayName} เรียบร้อย`);
    } catch (err: any) {
      showToast('error', err?.message || 'ไม่สามารถเปลี่ยนสถานะบัญชีได้');
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !currentUser) return;
    setSettingsSaving(true);
    try {
      await updateSiteSettings(formData, currentUser.uid);
      await updateCustomCategories(categoryList, currentUser.uid);
      onSettingsUpdated(formData);
      onCategoriesUpdated(categoryList);
      showToast('success', 'บันทึกการตั้งค่าเว็บไซต์และหมวดหมู่วิชาสำเร็จ!');
    } catch (err: any) {
      showToast('error', err?.message || 'ไม่สามารถบันทึกการตั้งค่าได้');
    } finally {
      setSettingsSaving(false);
    }
  };

  // Add Category
  const handleAddCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    if (categoryList.includes(trimmed)) {
      showToast('error', 'มีหมวดหมู่วิชานี้อยู่แล้ว');
      return;
    }
    setCategoryList([...categoryList, trimmed]);
    setNewCategoryName('');
  };

  // Remove Category
  const handleRemoveCategory = (catName: string) => {
    if (categoryList.length <= 1) {
      showToast('error', 'ต้องมีหมวดหมู่อย่างน้อย 1 หมวดหมู่');
      return;
    }
    setCategoryList(categoryList.filter(c => c !== catName));
  };

  const filteredUsers = users.filter(u => 
    u.displayName?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Toast Alert */}
      {toastMessage && (
        <div className={`fixed top-20 right-6 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-right duration-200 border ${
          toastMessage.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
            : 'bg-rose-50 text-rose-900 border-rose-200'
        }`}>
          {toastMessage.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="text-sm font-medium">{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-3xl p-6 md:p-8 mb-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
              <ShieldCheck className="w-8 h-8 text-sky-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">ศูนย์ควบคุมและดูแลระบบ (Admin Dashboard)</h2>
              <p className="text-sm text-slate-300">
                จัดการรายงานความเหมาะสม ตรวจสอบสมาชิก และปรับแต่งการตั้งค่าเว็บไซต์แบบ Real-time
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-sky-500/20 text-sky-300 rounded-full text-xs font-semibold border border-sky-400/30">
              {isAdmin ? 'สิทธิ์สูงสุด (Administrator)' : 'ผู้ตรวจสอบ (Moderator)'}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-white/10">
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-white text-slate-900 shadow-md font-bold'
                : 'text-slate-300 hover:bg-white/10'
            }`}
          >
            <Flag className="w-4 h-4 text-rose-400" />
            <span>รายงานเนื้อหา ({reports.filter(r => r.status === 'pending').length})</span>
          </button>

          {isAdmin && (
            <>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'users'
                    ? 'bg-white text-slate-900 shadow-md font-bold'
                    : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                <Users className="w-4 h-4 text-blue-400" />
                <span>จัดการสมาชิก ({users.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-white text-slate-900 shadow-md font-bold'
                    : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                <Settings className="w-4 h-4 text-amber-400" />
                <span>ตั้งค่าเว็บไซต์ & หมวดหมู่</span>
              </button>

              <button
                onClick={() => setActiveTab('logs')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'logs'
                    ? 'bg-white text-slate-900 shadow-md font-bold'
                    : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                <History className="w-4 h-4 text-emerald-400" />
                <span>ประวัติการดูแลระบบ</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tab 1: Reports Management */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Flag className="w-5 h-5 text-rose-600" />
              <span>รายการแจ้งเตือนและรายงานจากผู้ใช้</span>
            </h3>
            <button
              onClick={loadReports}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>รีเฟรชข้อมูล</span>
            </button>
          </div>

          {reportsLoading ? (
            <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
              กำลังโหลดข้อมูลรายงาน...
            </div>
          ) : reports.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <p className="text-base font-bold text-slate-800">ไม่มีรายงานปัญหาในขณะนี้</p>
              <p className="text-xs text-slate-500 mt-1">คลังสื่อทั้งหมดผ่านการตรวจสอบเรียบร้อย</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className={`bg-white rounded-2xl p-5 border shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    report.status === 'pending'
                      ? 'border-rose-200 hover:border-rose-300'
                      : 'border-slate-200 opacity-75'
                  }`}
                >
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                        report.status === 'pending' 
                          ? 'bg-rose-100 text-rose-800'
                          : report.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {report.status === 'pending' ? 'รอดำเนินการ' : report.status === 'resolved' ? 'แก้ไขแล้ว' : 'ยกเลิกคำขอ'}
                      </span>
                      <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                        {report.reason}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900">
                      {report.resourceTitle}
                    </h4>

                    {report.details && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        "{report.details}"
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>ผู้รายงาน: {report.reporterEmail}</span>
                      <span>•</span>
                      <span>{new Date(report.createdAt).toLocaleString('th-TH')}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    <button
                      onClick={async () => {
                        const r = await fetchResourceById(report.resourceId);
                        if (r) onSelectResource(r);
                        else showToast('error', 'ไม่พบสื่อ หรือสื่อนี้อาจถูกลบไปแล้ว');
                      }}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-medium rounded-xl transition-colors cursor-pointer"
                    >
                      เปิดดูสื่อ
                    </button>

                    <button
                      onClick={() => handleToggleHide(report.resourceId, report.resourceTitle)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                      title="ซ่อนสื่อนี้จากการค้นหาสาธารณะ"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>ซ่อนสื่อ</span>
                    </button>

                    <button
                      onClick={() => setDeleteModal({
                        isOpen: true,
                        report,
                        resourceId: report.resourceId,
                        title: report.resourceTitle
                      })}
                      className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-medium rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                      title="ลบสื่อนี้ออกจากฐานข้อมูลถาวร"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ลบถาวร</span>
                    </button>

                    {report.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleResolveReport(report, 'resolved')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                        >
                          ปิดงาน (แก้ไขแล้ว)
                        </button>
                        <button
                          onClick={() => handleResolveReport(report, 'dismissed')}
                          className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium rounded-xl transition-colors cursor-pointer"
                        >
                          ยกเลิกรายงาน
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: User Management */}
      {activeTab === 'users' && isAdmin && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>รายชื่อสมาชิกในระบบและการจัดการสิทธิ์</span>
            </h3>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="ค้นหาชื่อ หรืออีเมล..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="px-5 py-3">สมาชิก</th>
                    <th className="px-5 py-3">อีเมล</th>
                    <th className="px-5 py-3">บทบาท (Role)</th>
                    <th className="px-5 py-3">สถานะบัญชี</th>
                    <th className="px-5 py-3 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersLoading ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        กำลังโหลดข้อมูลสมาชิก...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        ไม่พบสมาชิกที่ตรงกับการค้นหา
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.uid} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs">
                              {u.displayName?.[0] || 'U'}
                            </div>
                            <span className="font-bold text-slate-800">{u.displayName}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">{u.email}</td>
                        <td className="px-5 py-3.5">
                          <select
                            value={u.role}
                            onChange={(e) => handleChangeRole(u, e.target.value as UserRole)}
                            className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-medium cursor-pointer"
                          >
                            <option value="member">สมาชิกทั่วไป (Member)</option>
                            <option value="moderator">ผู้ตรวจสอบ (Moderator)</option>
                            <option value="admin">ผู้ดูแลระบบ (Admin)</option>
                          </select>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            u.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {u.status === 'active' ? 'ปกติ (Active)' : 'ถูกระงับ (Suspended)'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => handleToggleSuspend(u)}
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                              u.status === 'active'
                                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            {u.status === 'active' ? (
                              <>
                                <Lock className="w-3.5 h-3.5" />
                                <span>ระงับบัญชี</span>
                              </>
                            ) : (
                              <>
                                <Unlock className="w-3.5 h-3.5" />
                                <span>ปลดระงับ</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Site Settings & Category Manager */}
      {activeTab === 'settings' && isAdmin && (
        <form onSubmit={handleSaveSettings} className="space-y-8">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Settings className="w-5 h-5 text-amber-500" />
              <span>ข้อมูลทั่วไปและการแสดงผลหน้าเว็บ</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  ชื่อเว็บไซต์
                </label>
                <input
                  type="text"
                  required
                  value={formData.siteName}
                  onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  ข้อความแบนเนอร์หลัก
                </label>
                <input
                  type="text"
                  value={formData.bannerText}
                  onChange={(e) => setFormData({ ...formData, bannerText: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                คำอธิบายเว็บไซต์ (SEO & Hero Section)
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                ข้อความประกาศสำคัญ (Announcement Bar)
              </label>
              <textarea
                rows={2}
                value={formData.announcement}
                onChange={(e) => setFormData({ ...formData, announcement: e.target.value })}
                placeholder="ประกาศข่าวสาร กิจกรรม หรือการปรับปรุงระบบ..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm leading-relaxed"
              />
            </div>
          </div>

          {/* Category Management */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  จัดการหมวดหมู่วิชาและคลังความรู้
                </h3>
                <p className="text-xs text-slate-500">
                  เพิ่มหรือลบหมวดหมู่วิชาได้ทันทีโดยไม่ต้องแก้ไขโค้ด ข้อมูลจะอัปเดตตรงกันทั่วทั้งเว็บ
                </p>
              </div>
            </div>

            {/* Add category input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="ชื่อหมวดหมู่วิชาใหม่ เช่น ปรัชญาและจิตวิทยา, หุ่นยนต์และ AI..."
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มหมวดหมู่</span>
              </button>
            </div>

            {/* List of categories */}
            <div className="flex flex-wrap gap-2 pt-2">
              {categoryList.map((cat) => (
                <div
                  key={cat}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-800 text-xs font-semibold rounded-xl border border-slate-200"
                >
                  <span>{cat}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCategory(cat)}
                    className="text-slate-400 hover:text-rose-600 cursor-pointer"
                    title="ลบหมวดหมู่นี้"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={settingsSaving}
              className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-700 to-sky-600 hover:from-blue-800 hover:to-sky-700 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{settingsSaving ? 'กำลังบันทึกลง Firestore...' : 'บันทึกการตั้งค่าทั้งหมด'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 4: Moderation Audit Logs */}
      {activeTab === 'logs' && isAdmin && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-600" />
              <span>ประวัติและบันทึกการกระทำของผู้ดูแล (Audit Log)</span>
            </h3>
            <button
              onClick={loadLogs}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>รีเฟรชประวัติ</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
            {logs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                ยังไม่มีประวัติการดูแลระบบในขณะนี้
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {log.action}
                      </span>
                      <span className="text-slate-600 font-medium">เป้าหมาย: {log.targetTitle}</span>
                    </div>
                    <p className="text-slate-400">
                      ดำเนินการโดย: <strong className="text-slate-700 font-semibold">{log.performedByName}</strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400 shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(log.timestamp).toLocaleString('th-TH')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal Confirm Delete */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <AlertTriangle className="w-8 h-8" />
              <div>
                <h4 className="text-lg font-bold text-slate-900">ยืนยันการลบสื่อถาวร</h4>
                <p className="text-xs text-rose-600">การกระทำนี้จะลบข้อมูลออกจาก Firestore ทันที</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-6 bg-slate-50 p-3 rounded-xl border border-slate-200">
              คุณกำลังจะลบสื่อ: <strong className="text-slate-900">"{deleteModal.title}"</strong>
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteModal({ isOpen: false })}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleExecuteDeleteResource}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm rounded-xl shadow-md cursor-pointer"
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
