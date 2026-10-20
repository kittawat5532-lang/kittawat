import React from 'react';
import { 
  Sparkles, 
  Laptop, 
  Calculator, 
  Atom, 
  BookA, 
  Languages, 
  Globe2, 
  HeartPulse, 
  Palette, 
  Briefcase, 
  GraduationCap,
  Layers
} from 'lucide-react';

interface CategoryChipsProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export const CategoryChips: React.FC<CategoryChipsProps> = ({
  categories,
  selectedCategory,
  onSelectCategory
}) => {
  const getCategoryIcon = (cat: string) => {
    if (cat.includes('คอมพิวเตอร์') || cat.includes('เทคโนโลยี')) return <Laptop className="w-4 h-4" />;
    if (cat.includes('คณิตศาสตร์')) return <Calculator className="w-4 h-4" />;
    if (cat.includes('วิทยาศาสตร์') || cat.includes('ฟิสิกส์')) return <Atom className="w-4 h-4" />;
    if (cat.includes('ภาษาไทย')) return <BookA className="w-4 h-4" />;
    if (cat.includes('ภาษาอังกฤษ') || cat.includes('ต่างประเทศ')) return <Languages className="w-4 h-4" />;
    if (cat.includes('สังคม') || cat.includes('ประวัติศาสตร์')) return <Globe2 className="w-4 h-4" />;
    if (cat.includes('สุขศึกษา') || cat.includes('พลศึกษา')) return <HeartPulse className="w-4 h-4" />;
    if (cat.includes('ศิลปะ') || cat.includes('ดนตรี')) return <Palette className="w-4 h-4" />;
    if (cat.includes('ธุรกิจ') || cat.includes('อาชีพ')) return <Briefcase className="w-4 h-4" />;
    if (cat.includes('สอบ') || cat.includes('แนะแนว')) return <GraduationCap className="w-4 h-4" />;
    return <Layers className="w-4 h-4" />;
  };

  return (
    <div className="w-full mb-6 overflow-x-auto pb-2 scrollbar-thin">
      <div className="flex items-center gap-2 min-w-max">
        <button
          onClick={() => onSelectCategory('all')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-blue-900 text-white shadow-md shadow-blue-900/20 ring-2 ring-blue-900/30'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-xs'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>ทั้งหมด</span>
        </button>

        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(isSelected ? 'all' : cat)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 ring-2 ring-blue-600/30'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-xs hover:border-slate-300'
              }`}
            >
              {getCategoryIcon(cat)}
              <span>{cat}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
