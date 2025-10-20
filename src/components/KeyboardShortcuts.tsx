import { useEffect, useState } from 'react';
import { X, Command } from 'lucide-react';

interface Shortcut {
  key: string;
  description: string;
  action: () => void;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
}

interface KeyboardShortcutsProps {
  shortcuts: Shortcut[];
}

export function KeyboardShortcuts({ shortcuts }: KeyboardShortcutsProps) {
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && e.shiftKey) {
        e.preventDefault();
        setShowHelp(prev => !prev);
        return;
      }

      if (e.key === 'Escape') {
        setShowHelp(false);
        return;
      }

      const matchedShortcut = shortcuts.find(shortcut => {
        const keyMatch = shortcut.key.toLowerCase() === e.key.toLowerCase();
        const ctrlMatch = shortcut.ctrlKey ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
        const shiftMatch = shortcut.shiftKey ? e.shiftKey : !e.shiftKey;
        const altMatch = shortcut.altKey ? e.altKey : !e.altKey;

        return keyMatch && ctrlMatch && shiftMatch && altMatch;
      });

      if (matchedShortcut) {
        e.preventDefault();
        matchedShortcut.action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);

  const formatShortcut = (shortcut: Shortcut) => {
    const keys = [];
    if (shortcut.ctrlKey) keys.push('Ctrl');
    if (shortcut.shiftKey) keys.push('Shift');
    if (shortcut.altKey) keys.push('Alt');
    keys.push(shortcut.key.toUpperCase());
    return keys.join(' + ');
  };

  if (!showHelp) {
    return (
      <button
        onClick={() => setShowHelp(true)}
        className="fixed bottom-4 right-4 p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-full shadow-lg transition-colors z-40"
        title="Keyboard Shortcuts (Shift + ?)"
      >
        <Command className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Command className="w-6 h-6" />
            <h2 className="text-xl font-bold">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={() => setShowHelp(false)}
            className="p-1 hover:bg-slate-700 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-3">
            {shortcuts.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <span className="text-slate-700">{shortcut.description}</span>
                <kbd className="px-3 py-1 bg-white border border-slate-300 rounded text-sm font-mono text-slate-800 shadow-sm">
                  {formatShortcut(shortcut)}
                </kbd>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Tip:</span> Press <kbd className="px-2 py-1 bg-white border border-blue-300 rounded text-xs font-mono">Shift + ?</kbd> to toggle this help menu
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  return <KeyboardShortcuts shortcuts={shortcuts} />;
}
