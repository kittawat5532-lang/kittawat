import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  active?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <nav className="flex items-center text-sm text-slate-500 overflow-x-auto whitespace-nowrap py-2">
      <button
        onClick={items[0]?.onClick}
        className="flex items-center gap-1.5 hover:text-blue-600 transition-colors cursor-pointer text-slate-600 font-medium"
      >
        <Home className="w-4 h-4 text-slate-400" />
        <span>หน้าหลัก</span>
      </button>

      {items.slice(1).map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="w-4 h-4 text-slate-400 mx-1.5 shrink-0" />
          {item.active ? (
            <span className="font-semibold text-blue-900 max-w-xs truncate">
              {item.label}
            </span>
          ) : (
            <button
              onClick={item.onClick}
              className="hover:text-blue-600 transition-colors cursor-pointer max-w-xs truncate"
            >
              {item.label}
            </button>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
