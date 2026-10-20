import React, { useState } from 'react';
import { Search, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { ResourceFilterState, GRADE_LEVELS, MEDIA_TYPES } from '../types';

interface SearchBarProps {
  filters: ResourceFilterState;
  onFilterChange: (newFilters: Partial<ResourceFilterState>) => void;
  categories: string[];
  totalResults?: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  filters,
  onFilterChange,
  categories,
  totalResults
}) => {
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  const hasActiveFilters = 
    Boolean(filters.searchQuery) || 
    filters.category !== 'all' || 
    filters.gradeLevel !== 'all' || 
    filters.mediaType !== 'all';

  const resetFilters = () => {
    onFilterChange({
      searchQuery: '',
      category: 'all',
      gradeLevel: 'all',
      mediaType: 'all',
      sortBy: 'latest'
    });
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-6 mb-6">
      {/* Large Input Bar */}
      <div className="relative flex items-center">
        <Search className="w-6 h-6 text-slate-400 absolute left-4 pointer-events-none" />
        <input
          type="text"
          value={filters.searchQuery}
          onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
          placeholder="ค้นหาชื่อสื่อการเรียนรู้, คำอธิบาย, ชีทสรุป, บทเรียน, เนื้อหาวิชา..."
          className="w-full pl-13 pr-24 py-3.5 text-base md:text-lg bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-slate-800 placeholder:text-slate-400"
        />
        {filters.searchQuery && (
          <button
            onClick={() => onFilterChange({ searchQuery: '' })}
            className="absolute right-12 p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
            aria-label="ล้างคำค้น"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        <button
          onClick={() => setShowFilterDrawer(!showFilterDrawer)}
          className={`absolute right-2 p-2.5 rounded-lg border transition-all cursor-pointer ${
            showFilterDrawer || hasActiveFilters
              ? 'bg-blue-50 border-blue-200 text-blue-700'
              : 'border-slate-200 hover:bg-slate-100 text-slate-600'
          }`}
          title="ตัวกรองขั้นสูง"
        >
          <SlidersHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Filter Controls Row */}
      <div className={`mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 ${
        showFilterDrawer ? 'block' : 'hidden md:grid'
      }`}>
        {/* Category select */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            หมวดหมู่วิชา
          </label>
          <select
            value={filters.category}
            onChange={(e) => onFilterChange({ category: e.target.value })}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-700 cursor-pointer"
          >
            <option value="all">ทุกหมวดหมู่วิชา</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Grade level select */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            ระดับชั้น
          </label>
          <select
            value={filters.gradeLevel}
            onChange={(e) => onFilterChange({ gradeLevel: e.target.value })}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-700 cursor-pointer"
          >
            <option value="all">ทุกระดับชั้น</option>
            {GRADE_LEVELS.filter((g) => g !== 'ทั้งหมด').map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        {/* Media Type select */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            ประเภทสื่อ
          </label>
          <select
            value={filters.mediaType}
            onChange={(e) => onFilterChange({ mediaType: e.target.value })}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-700 cursor-pointer"
          >
            <option value="all">ทุกประเภทสื่อ</option>
            {MEDIA_TYPES.map((m) => (
              <option key={m.type} value={m.type}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort by */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5" />
            เรียงตาม
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) => onFilterChange({ sortBy: e.target.value as any })}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-700 cursor-pointer"
          >
            <option value="latest">ล่าสุด (ใหม่ไปเก่า)</option>
            <option value="popular">ยอดนิยม (บันทึกมากสุด)</option>
            <option value="views">การเข้าชม (เปิดดูมากสุด)</option>
          </select>
        </div>
      </div>

      {/* Filter Status & Reset */}
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <div>
          {totalResults !== undefined && (
            <span>
              พบทั้งหมด <strong className="text-slate-800 font-semibold">{totalResults}</strong> รายการ
            </span>
          )}
        </div>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="text-blue-600 hover:text-blue-800 font-medium underline cursor-pointer"
          >
            ล้างตัวกรองทั้งหมด
          </button>
        )}
      </div>
    </div>
  );
};
