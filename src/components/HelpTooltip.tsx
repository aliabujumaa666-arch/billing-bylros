import { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

interface HelpTooltipProps {
  content: string;
  title?: string;
}

export function HelpTooltip({ content, title }: HelpTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 hover:bg-slate-100 rounded-full transition-colors"
        type="button"
      >
        <HelpCircle className="w-4 h-4 text-slate-500" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-full right-0 mb-2 w-72 bg-white rounded-lg shadow-xl border border-slate-200 p-4 z-50">
            <div className="flex items-start justify-between mb-2">
              {title && <h4 className="font-semibold text-slate-800">{title}</h4>}
              <button onClick={() => setIsOpen(false)} className="p-0.5 hover:bg-slate-100 rounded">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <p className="text-sm text-slate-600">{content}</p>
          </div>
        </>
      )}
    </div>
  );
}
