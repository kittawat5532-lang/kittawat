/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  AuthProvider, 
  useAuth 
} from './context/AuthContext';
import { 
  testConnection 
} from './lib/firebase';
import { 
  Resource, 
  SiteSettings, 
  ResourceFilterState, 
  DEFAULT_CATEGORIES 
} from './types';
import { 
  fetchResources, 
  incrementResourceView, 
  toggleHideResource, 
  deleteResource 
} from './services/resourceService';
import { 
  fetchUserFavorites, 
  toggleFavorite 
} from './services/favoriteService';
import { 
  fetchSiteSettings, 
  fetchCustomCategories 
} from './services/adminService';

import { Navbar } from './components/Navbar';
import { Breadcrumb, BreadcrumbItem } from './components/Breadcrumb';
import { SearchBar } from './components/SearchBar';
import { CategoryChips } from './components/CategoryChips';
import { ResourceCard } from './components/ResourceCard';
import { ResourceDetailModal } from './components/ResourceDetailModal';
import { PostResourceModal } from './components/PostResourceModal';
import { AuthModal } from './components/AuthModal';
import { ReportModal } from './components/ReportModal';
import { AdminDashboard } from './components/AdminDashboard';
import { FavoritesView } from './components/FavoritesView';
import { MyResourcesView } from './components/MyResourcesView';
import { EmptyState, LoadingSkeletonGrid } from './components/EmptyState';

import { 
  Sparkles, 
  BookOpen, 
  Users, 
  Share2, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Award,
  Layers,
  GraduationCap
} from 'lucide-react';

function MainApp() {
  const { currentUser, userProfile, isAdmin, isModerator } = useAuth();

  // Navigation state
  const [currentView, setCurrentView] = useState<'home' | 'browse' | 'favorites' | 'my-posts' | 'admin'>('home');

  // Data states
  const [resources, setResources] = useState<Resource[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    siteName: 'EduShare Thai',
    description: 'ศูนย์กลางรวบรวมและแบ่งปันสื่อการเรียนรู้ แหล่งค้นคว้าความรู้ และบทเรียนคุณภาพสำหรับคนไทยทุกคน',
    announcement: 'ยินดีต้อนรับสู่อาณาจักรแห่งการเรียนรู้ร่วมกัน! ร่วมแบ่งปันชีทสรุป คลิป หรือลิงก์การเรียนรู้ที่เป็นประโยชน์ได้ทันที',
    bannerText: 'ร่วมสร้างสังคมแห่งการแบ่งปันความรู้เพื่อเด็กไทยและคุณครูทุกคน'
  });
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  // Filter state
  const [filters, setFilters] = useState<ResourceFilterState>({
    searchQuery: '',
    category: 'all',
    gradeLevel: 'all',
    mediaType: 'all',
    sortBy: 'latest'
  });

  // Modals state
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [editTargetResource, setEditTargetResource] = useState<Resource | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [reportTargetResource, setReportTargetResource] = useState<Resource | null>(null);

  // Toast feedback
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast(type === 'success' ? { type: 'success', message } : { type: 'error', message });
    setTimeout(() => setToast(null), 3500);
  };

  // Test connection and load initial metadata
  useEffect(() => {
    testConnection();
    loadSettings();
    loadResources();
  }, []);

  // Sync user favorites
  useEffect(() => {
    if (currentUser) {
      loadUserFavorites();
    } else {
      setFavoriteIds(new Set());
    }
  }, [currentUser]);

  const loadSettings = async () => {
    try {
      const [settings, cats] = await Promise.all([
        fetchSiteSettings(),
        fetchCustomCategories()
      ]);
      if (settings) setSiteSettings(settings);
      if (cats && cats.length) setCategories(cats);
    } catch (e) {
      console.warn('Using default settings:', e);
    }
  };

  const loadResources = async () => {
    setResourcesLoading(true);
    try {
      const data = await fetchResources();
      setResources(data);
    } catch (e) {
      console.error(e);
      showToast('error', 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setResourcesLoading(false);
    }
  };

  const loadUserFavorites = async () => {
    if (!currentUser) return;
    try {
      const favs = await fetchUserFavorites(currentUser.uid);
      setFavoriteIds(new Set(favs.map(f => f.resourceId)));
    } catch (e) {
      console.warn('Could not load favorites:', e);
    }
  };

  // Handle Favorite Toggle
  const handleToggleFavorite = async (resource: Resource) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    const wasFav = favoriteIds.has(resource.id);
    const nextSet = new Set(favoriteIds);
    if (wasFav) {
      nextSet.delete(resource.id);
    } else {
      nextSet.add(resource.id);
    }
    setFavoriteIds(nextSet);

    try {
      const res = await toggleFavorite(currentUser.uid, resource);
      showToast(
        'success', 
        res.isFavorited ? 'บันทึกเข้าสู่รายการโปรดเรียบร้อย' : 'นำออกจากรายการโปรดแล้ว'
      );
      // Update local count
      setResources(prev => prev.map(r => {
        if (r.id === resource.id) {
          return {
            ...r,
            favoriteCount: Math.max(0, (r.favoriteCount || 0) + (res.isFavorited ? 1 : -1))
          };
        }
        return r;
      }));
    } catch (err: any) {
      // Revert optimistic state
      setFavoriteIds(favoriteIds);
      showToast('error', err?.message || 'ไม่สามารถบันทึกรายการโปรดได้');
    }
  };

  // Open Resource Details
  const handleSelectResource = (resource: Resource) => {
    setSelectedResource(resource);
    incrementResourceView(resource.id);
    setResources(prev => prev.map(r => r.id === resource.id ? { ...r, viewCount: (r.viewCount || 0) + 1 } : r));
  };

  // Delete Resource
  const handleDeleteResource = async (resource: Resource) => {
    try {
      await deleteResource(resource.id);
      setResources(prev => prev.filter(r => r.id !== resource.id));
      setSelectedResource(null);
      showToast('success', 'ลบสื่อการเรียนรู้เรียบร้อยแล้ว');
    } catch (err: any) {
      showToast('error', err?.message || 'ไม่สามารถลบสื่อนี้ได้');
    }
  };

  // Toggle Hide Resource
  const handleToggleHideResource = async (resource: Resource) => {
    try {
      await toggleHideResource(resource.id, resource.isHidden);
      setResources(prev => prev.map(r => r.id === resource.id ? { ...r, isHidden: !resource.isHidden } : r));
      setSelectedResource(prev => prev ? { ...prev, isHidden: !resource.isHidden } : null);
      showToast('success', resource.isHidden ? 'เปิดการแสดงผลสู่สาธารณะแล้ว' : 'ซ่อนสื่อจากสาธารณะเรียบร้อย');
    } catch (err: any) {
      showToast('error', err?.message || 'ไม่สามารถเปลี่ยนสถานะได้');
    }
  };

  // Filter and Sort Resources
  const filteredResources = useMemo(() => {
    let result = resources.filter(r => {
      // If hidden, only author, moderator, or admin can see
      if (r.isHidden && currentUser?.uid !== r.authorId && !isModerator && !isAdmin) {
        return false;
      }

      // Keyword Search
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const matchTitle = r.title.toLowerCase().includes(query);
        const matchDesc = (r.description || '').toLowerCase().includes(query);
        const matchAuthor = (r.authorName || '').toLowerCase().includes(query);
        if (!matchTitle && !matchDesc && !matchAuthor) return false;
      }

      // Category
      if (filters.category !== 'all' && r.category !== filters.category) {
        return false;
      }

      // Grade Level
      if (filters.gradeLevel !== 'all' && r.gradeLevel !== filters.gradeLevel) {
        return false;
      }

      // Media Type
      if (filters.mediaType !== 'all' && r.mediaType !== filters.mediaType) {
        return false;
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (filters.sortBy === 'popular') {
        return (b.favoriteCount || 0) - (a.favoriteCount || 0);
      }
      if (filters.sortBy === 'views') {
        return (b.viewCount || 0) - (a.viewCount || 0);
      }
      // latest
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [resources, filters, currentUser, isModerator, isAdmin]);

  // Breadcrumbs Generator
  const breadcrumbItems: BreadcrumbItem[] = useMemo(() => {
    if (currentView === 'home') {
      return [{ label: 'หน้าหลัก', active: true }];
    }
    if (currentView === 'browse') {
      const items: BreadcrumbItem[] = [{ label: 'หน้าหลัก', onClick: () => setCurrentView('home') }];
      if (filters.category !== 'all') {
        items.push({ 
          label: filters.category, 
          onClick: () => setFilters(f => ({ ...f, category: 'all' })) 
        });
      }
      items.push({ label: 'คลังความรู้ทั้งหมด', active: true });
      return items;
    }
    if (currentView === 'favorites') {
      return [
        { label: 'หน้าหลัก', onClick: () => setCurrentView('home') },
        { label: 'รายการโปรดของฉัน', active: true }
      ];
    }
    if (currentView === 'my-posts') {
      return [
        { label: 'หน้าหลัก', onClick: () => setCurrentView('home') },
        { label: 'สื่อที่ฉันแบ่งปัน', active: true }
      ];
    }
    if (currentView === 'admin') {
      return [
        { label: 'หน้าหลัก', onClick: () => setCurrentView('home') },
        { label: 'แผงควบคุมผู้ดูแลระบบ', active: true }
      ];
    }
    return [{ label: 'หน้าหลัก', active: true }];
  }, [currentView, filters.category]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Prompt',sans-serif] text-slate-800">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-20 right-6 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-right duration-200 border ${
          toast.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
            : 'bg-rose-50 text-rose-900 border-rose-200'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Navbar */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onOpenPostModal={() => {
          setEditTargetResource(null);
          setIsPostModalOpen(true);
        }}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        settings={siteSettings}
        favoriteCount={favoriteIds.size}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Breadcrumb row (except home hero) */}
        {currentView !== 'home' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
            <Breadcrumb items={breadcrumbItems} />
          </div>
        )}

        {/* HOME VIEW */}
        {currentView === 'home' && (
          <div>
            {/* Hero Section */}
            <div className="bg-gradient-to-b from-blue-900 via-blue-800 to-indigo-900 text-white relative overflow-hidden py-14 sm:py-20 px-4">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>
              
              <div className="relative max-w-4xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-sky-200 text-xs font-semibold mb-6 border border-white/15">
                  <Sparkles className="w-4 h-4 text-sky-400" />
                  <span>{siteSettings.bannerText || 'สังคมแห่งการแบ่งปันความรู้เพื่อการศึกษาไทย'}</span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight sm:leading-tight mb-4">
                  {siteSettings.siteName}
                </h1>

                <p className="text-base sm:text-lg text-blue-100 max-w-2xl mx-auto mb-8 font-normal leading-relaxed">
                  {siteSettings.description}
                </p>

                {/* Hero Quick Search Bar */}
                <div className="max-w-2xl mx-auto">
                  <div className="relative flex items-center shadow-2xl rounded-2xl">
                    <input
                      type="text"
                      value={filters.searchQuery}
                      onChange={(e) => setFilters(f => ({ ...f, searchQuery: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setCurrentView('browse');
                      }}
                      placeholder="พิมพ์ชื่อวิชา, ชีทสรุป, เนื้อหาที่ต้องการค้นหา..."
                      className="w-full pl-5 pr-32 py-4 bg-white rounded-2xl text-slate-800 placeholder:text-slate-400 text-sm sm:text-base focus:outline-hidden focus:ring-4 focus:ring-sky-400/30"
                    />
                    <button
                      onClick={() => setCurrentView('browse')}
                      className="absolute right-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-sm rounded-xl shadow-md transition-all cursor-pointer"
                    >
                      ค้นหา
                    </button>
                  </div>
                </div>

                {/* Stats Counter */}
                <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto mt-12 pt-8 border-t border-white/15 text-center">
                  <div>
                    <p className="text-2xl sm:text-3xl font-extrabold text-white">{resources.length}</p>
                    <p className="text-xs text-blue-200 mt-0.5">สื่อการเรียนรู้</p>
                  </div>
                  <div>
                    <p className="text-2xl sm:text-3xl font-extrabold text-white">{categories.length}</p>
                    <p className="text-xs text-blue-200 mt-0.5">หมวดหมู่วิชา</p>
                  </div>
                  <div>
                    <p className="text-2xl sm:text-3xl font-extrabold text-white">100%</p>
                    <p className="text-xs text-blue-200 mt-0.5">เปิดกว้างเพื่อทุกคน</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Announcement Banner */}
            {siteSettings.announcement && (
              <div className="bg-sky-50 border-y border-sky-100 py-3 px-4">
                <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-xs sm:text-sm text-sky-900 text-center">
                  <Sparkles className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>{siteSettings.announcement}</span>
                </div>
              </div>
            )}

            {/* Catalog Section in Home */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
              {/* Category Chips */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-blue-600" />
                    <span>สำรวจตามหมวดหมู่วิชา</span>
                  </h3>
                  <button
                    onClick={() => setCurrentView('browse')}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                  >
                    ดูคลังทั้งหมด &rarr;
                  </button>
                </div>
                <CategoryChips
                  categories={categories}
                  selectedCategory={filters.category}
                  onSelectCategory={(cat) => {
                    setFilters(f => ({ ...f, category: cat }));
                    setCurrentView('browse');
                  }}
                />
              </div>

              {/* Recent Resources Grid */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      <span>สื่อการเรียนรู้ล่าสุด</span>
                    </h3>
                    <p className="text-xs text-slate-500">ชีทสรุป วิดีโอ และแหล่งเรียนรู้ที่เพิ่งอัปเดตใหม่</p>
                  </div>
                  <button
                    onClick={() => {
                      if (!currentUser) setIsAuthModalOpen(true);
                      else {
                        setEditTargetResource(null);
                        setIsPostModalOpen(true);
                      }
                    }}
                    className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-3.5 py-1.5 rounded-xl border border-blue-200 cursor-pointer"
                  >
                    + ร่วมแบ่งปันความรู้
                  </button>
                </div>

                {resourcesLoading ? (
                  <LoadingSkeletonGrid count={6} />
                ) : filteredResources.length === 0 ? (
                  <EmptyState
                    type="resources"
                    title="ยังไม่มีสื่อการเรียนรู้ในระบบ"
                    description="ร่วมเป็นคนแรกที่โพสต์แบ่งปันชีทสรุป เอกสาร หรือลิงก์เพื่อการศึกษาไทยกันครับ"
                    actionText="เริ่มแบ่งปันสื่อแรก"
                    onAction={() => {
                      if (!currentUser) setIsAuthModalOpen(true);
                      else setIsPostModalOpen(true);
                    }}
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredResources.slice(0, 6).map((res) => (
                      <ResourceCard
                        key={res.id}
                        resource={res}
                        isFavorite={favoriteIds.has(res.id)}
                        onToggleFavorite={handleToggleFavorite}
                        onSelect={handleSelectResource}
                        isOwner={currentUser?.uid === res.authorId}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* BROWSE VIEW */}
        {currentView === 'browse' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                คลังความรู้และสื่อการศึกษาทั้งหมด
              </h2>
              <p className="text-sm text-slate-500">
                ค้นคว้า คัดกรอง และเข้าถึงแหล่งความรู้คุณภาพได้ทุกที่ทุกเวลา
              </p>
            </div>

            {/* Filter & Search Bar */}
            <SearchBar
              filters={filters}
              onFilterChange={(newF) => setFilters(f => ({ ...f, ...newF }))}
              categories={categories}
              totalResults={filteredResources.length}
            />

            {/* Category Chips quick select */}
            <CategoryChips
              categories={categories}
              selectedCategory={filters.category}
              onSelectCategory={(cat) => setFilters(f => ({ ...f, category: cat }))}
            />

            {/* Grid */}
            {resourcesLoading ? (
              <LoadingSkeletonGrid count={6} />
            ) : filteredResources.length === 0 ? (
              <EmptyState
                type="search"
                title="ไม่พบสื่อที่ตรงกับเงื่อนไขการค้นหา"
                description="ลองเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่อื่นๆ ดูนะครับ"
                actionText="ล้างตัวกรองทั้งหมด"
                onAction={() => setFilters({
                  searchQuery: '',
                  category: 'all',
                  gradeLevel: 'all',
                  mediaType: 'all',
                  sortBy: 'latest'
                })}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredResources.map((res) => (
                  <ResourceCard
                    key={res.id}
                    resource={res}
                    isFavorite={favoriteIds.has(res.id)}
                    onToggleFavorite={handleToggleFavorite}
                    onSelect={handleSelectResource}
                    isOwner={currentUser?.uid === res.authorId}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* FAVORITES VIEW */}
        {currentView === 'favorites' && (
          <FavoritesView
            onSelectResource={handleSelectResource}
            onToggleFavorite={handleToggleFavorite}
            favoriteIds={favoriteIds}
            onExplore={() => setCurrentView('browse')}
          />
        )}

        {/* MY POSTS VIEW */}
        {currentView === 'my-posts' && (
          <MyResourcesView
            onSelectResource={handleSelectResource}
            onEditResource={(res) => {
              setEditTargetResource(res);
              setIsPostModalOpen(true);
            }}
            onOpenCreate={() => {
              setEditTargetResource(null);
              setIsPostModalOpen(true);
            }}
          />
        )}

        {/* ADMIN VIEW */}
        {currentView === 'admin' && (isAdmin || isModerator) && (
          <AdminDashboard
            siteSettings={siteSettings}
            categories={categories}
            onSettingsUpdated={(newSettings) => setSiteSettings(newSettings)}
            onCategoriesUpdated={(newCats) => setCategories(newCats)}
            onSelectResource={handleSelectResource}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-10 mt-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <GraduationCap className="w-5 h-5 text-sky-400" />
            <span>{siteSettings.siteName}</span>
            <span className="text-slate-500 font-normal">| แพลตฟอร์มแบ่งปันความรู้เพื่อการศึกษาไทย</span>
          </div>
          <div className="flex items-center gap-6">
            <span>เชื่อมต่อฐานข้อมูล Cloud Firestore จริง</span>
            <span>ความปลอดภัยระดับ RBAC</span>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {/* 1. Post/Edit Resource Modal */}
      <PostResourceModal
        isOpen={isPostModalOpen}
        onClose={() => {
          setIsPostModalOpen(false);
          setEditTargetResource(null);
        }}
        categories={categories}
        initialResource={editTargetResource}
        onSuccess={(id, isEdit) => {
          showToast('success', isEdit ? 'แก้ไขสื่อการเรียนรู้สำเร็จ' : 'โพสต์สื่อการเรียนรู้สำเร็จ');
          loadResources();
        }}
      />

      {/* 2. Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* 3. Resource Detail Modal */}
      <ResourceDetailModal
        resource={selectedResource}
        onClose={() => setSelectedResource(null)}
        isFavorite={selectedResource ? favoriteIds.has(selectedResource.id) : false}
        onToggleFavorite={handleToggleFavorite}
        onReport={(res) => setReportTargetResource(res)}
        onEdit={(res) => {
          setSelectedResource(null);
          setEditTargetResource(res);
          setIsPostModalOpen(true);
        }}
        onDelete={handleDeleteResource}
        onToggleHide={handleToggleHideResource}
      />

      {/* 4. Report Modal */}
      <ReportModal
        isOpen={Boolean(reportTargetResource)}
        onClose={() => setReportTargetResource(null)}
        resource={reportTargetResource}
        onReportSubmitted={() => {
          showToast('success', 'ส่งรายงานความเหมาะสมเรียบร้อยแล้ว');
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
