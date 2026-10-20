import React, { useState } from 'react';
import { 
  GraduationCap, 
  Plus, 
  Bookmark, 
  FolderGit2, 
  ShieldCheck, 
  User as UserIcon, 
  LogOut, 
  Menu, 
  X, 
  Search,
  Sparkles,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SiteSettings } from '../types';

interface NavbarProps {
  currentView: 'home' | 'browse' | 'favorites' | 'my-posts' | 'admin';
  setCurrentView: (view: 'home' | 'browse' | 'favorites' | 'my-posts' | 'admin') => void;
  onOpenPostModal: () => void;
  onOpenAuthModal: () => void;
  settings?: SiteSettings;
  favoriteCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  onOpenPostModal,
  onOpenAuthModal,
  settings,
  favoriteCount = 0
}) => {
  const { currentUser, userProfile, isAdmin, isModerator, logOut, sendVerificationEmail } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const handleSendVerification = async () => {
    try {
      await sendVerificationEmail();
      setVerificationSent(true);
      setTimeout(() => setVerificationSent(false), 5000);
    } catch (err) {
      console.error(err);
    }
  };

  const getRoleBadge = () => {
    if (isAdmin) {
      return (
        <span className="px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700 border border-red-200 rounded-full flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" /> ผู้ดูแลระบบ
        </span>
      );
    }
    if (isModerator) {
      return (
        <span className="px-2 py-0.5 text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200 rounded-full flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" /> ผู้ตรวจสอบ
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 text-xs font-medium bg-sky-100 text-sky-800 border border-sky-200 rounded-full">
        สมาชิก
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Email verification reminder banner */}
      {currentUser && !currentUser.emailVerified && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs md:text-sm text-amber-800 flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-4xl mx-auto w-full">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              อีเมลของคุณ (<strong className="font-semibold">{currentUser.email}</strong>) ยังไม่ได้รับการยืนยัน
            </span>
            <button
              onClick={handleSendVerification}
              disabled={verificationSent}
              className="ml-auto underline font-medium hover:text-amber-950 cursor-pointer text-xs"
            >
              {verificationSent ? 'ส่งลิงก์ยืนยันแล้ว กรุณาเช็กกล่องจดหมาย' : 'ส่งอีเมลยืนยันอีกครั้ง'}
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => { setCurrentView('home'); setMobileMenuOpen(false); }}
              className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-hidden"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-900 via-blue-700 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-900/20 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <span className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                  {settings?.siteName || 'EduShare Thai'}
                  <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-sans">
                    PRO
                  </span>
                </span>
                <p className="text-[11px] text-slate-500 hidden sm:block">คลังปัญญาและสื่อการเรียนรู้แบ่งปัน</p>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <button
              onClick={() => setCurrentView('home')}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                currentView === 'home'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              หน้าหลัก
            </button>
            <button
              onClick={() => setCurrentView('browse')}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                currentView === 'browse'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              คลังความรู้
            </button>
            {currentUser && (
              <>
                <button
                  onClick={() => setCurrentView('favorites')}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                    currentView === 'favorites'
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Bookmark className="w-4 h-4 text-amber-500" />
                  <span>รายการโปรด</span>
                  {favoriteCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-xs rounded-full font-bold">
                      {favoriteCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setCurrentView('my-posts')}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                    currentView === 'my-posts'
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <FolderGit2 className="w-4 h-4 text-blue-500" />
                  <span>สื่อของฉัน</span>
                </button>
              </>
            )}
            {(isAdmin || isModerator) && (
              <button
                onClick={() => setCurrentView('admin')}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  currentView === 'admin'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-indigo-600 hover:bg-indigo-50'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>แผงควบคุมผู้ดูแล</span>
              </button>
            )}
          </nav>

          {/* Action & Auth Section */}
          <div className="flex items-center gap-3">
            {/* Share Knowledge Button */}
            <button
              onClick={() => {
                if (!currentUser) {
                  onOpenAuthModal();
                } else {
                  onOpenPostModal();
                }
              }}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-700 to-sky-600 hover:from-blue-800 hover:to-sky-700 active:scale-95 text-white text-sm font-medium rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>แบ่งปันความรู้</span>
            </button>

            {/* Auth Dropdown or Login Button */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-white transition-all cursor-pointer focus:outline-hidden"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 font-bold flex items-center justify-center overflow-hidden">
                    {userProfile?.photoURL ? (
                      <img src={userProfile.photoURL} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span>{(userProfile?.displayName || currentUser.email || 'U')[0].toUpperCase()}</span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-slate-800 hidden md:block max-w-[120px] truncate">
                    {userProfile?.displayName || currentUser.email?.split('@')[0]}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {userProfile?.displayName || 'ผู้ใช้งาน'}
                      </p>
                      <p className="text-xs text-slate-500 truncate mb-2">{currentUser.email}</p>
                      <div className="flex items-center gap-2">
                        {getRoleBadge()}
                        {currentUser.emailVerified && (
                          <span className="text-[11px] text-emerald-600 flex items-center gap-0.5">
                            <CheckCircle className="w-3 h-3" /> ยืนยันแล้ว
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => { setCurrentView('favorites'); setUserMenuOpen(false); }}
                        className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                      >
                        <Bookmark className="w-4 h-4 text-amber-500" />
                        <span>รายการโปรดของฉัน</span>
                      </button>
                      <button
                        onClick={() => { setCurrentView('my-posts'); setUserMenuOpen(false); }}
                        className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                      >
                        <FolderGit2 className="w-4 h-4 text-blue-500" />
                        <span>สื่อที่ฉันแบ่งปัน</span>
                      </button>
                      {(isAdmin || isModerator) && (
                        <button
                          onClick={() => { setCurrentView('admin'); setUserMenuOpen(false); }}
                          className="w-full px-4 py-2 text-left text-sm text-indigo-700 hover:bg-indigo-50 font-medium flex items-center gap-2 cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4 text-indigo-600" />
                          <span>จัดการระบบ (Admin Dashboard)</span>
                        </button>
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={async () => {
                          setUserMenuOpen(false);
                          await logOut();
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>ออกจากระบบ</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <UserIcon className="w-4 h-4" />
                <span>เข้าสู่ระบบ / สมัคร</span>
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 focus:outline-hidden cursor-pointer"
              aria-label="เมนู"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg">
          <div className="space-y-1">
            <button
              onClick={() => { setCurrentView('home'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium ${
                currentView === 'home' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700'
              }`}
            >
              หน้าหลัก
            </button>
            <button
              onClick={() => { setCurrentView('browse'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium ${
                currentView === 'browse' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700'
              }`}
            >
              คลังความรู้
            </button>
            {currentUser && (
              <>
                <button
                  onClick={() => { setCurrentView('favorites'); setMobileMenuOpen(false); }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium flex items-center justify-between ${
                    currentView === 'favorites' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-amber-500" />
                    รายการโปรด
                  </span>
                  {favoriteCount > 0 && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full font-bold">
                      {favoriteCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => { setCurrentView('my-posts'); setMobileMenuOpen(false); }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 ${
                    currentView === 'my-posts' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700'
                  }`}
                >
                  <FolderGit2 className="w-4 h-4 text-blue-500" />
                  สื่อของฉัน
                </button>
              </>
            )}
            {(isAdmin || isModerator) && (
              <button
                onClick={() => { setCurrentView('admin'); setMobileMenuOpen(false); }}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-indigo-700 bg-indigo-50 flex items-center gap-2`}
              >
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                แผงควบคุมผู้ดูแล
              </button>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (!currentUser) onOpenAuthModal();
                else onOpenPostModal();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>แบ่งปันความรู้</span>
            </button>
            {currentUser && (
              <button
                onClick={async () => {
                  setMobileMenuOpen(false);
                  await logOut();
                }}
                className="w-full py-2 text-center text-sm text-red-600 font-medium"
              >
                ออกจากระบบ
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
