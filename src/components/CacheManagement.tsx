import { useState } from 'react';
import { useToast } from '../contexts/ToastContext';
import { Trash2, Database, HardDrive, RefreshCw, AlertCircle } from 'lucide-react';

export function CacheManagement() {
  const { success, error: showError } = useToast();
  const [clearing, setClearing] = useState(false);
  const [cacheStats, setCacheStats] = useState({
    localStorage: 0,
    sessionStorage: 0,
    indexedDB: 0,
  });

  const calculateCacheSize = () => {
    let localStorageSize = 0;
    let sessionStorageSize = 0;

    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        localStorageSize += localStorage[key].length + key.length;
      }
    }

    for (const key in sessionStorage) {
      if (sessionStorage.hasOwnProperty(key)) {
        sessionStorageSize += sessionStorage[key].length + key.length;
      }
    }

    setCacheStats({
      localStorage: Math.round(localStorageSize / 1024),
      sessionStorage: Math.round(sessionStorageSize / 1024),
      indexedDB: 0,
    });
  };

  const clearLocalStorage = () => {
    try {
      const supabaseKeys = Object.keys(localStorage).filter(
        key => key.startsWith('sb-') || key.includes('supabase')
      );

      localStorage.clear();

      supabaseKeys.forEach(key => {
        if (localStorage.getItem(key)) {
          localStorage.setItem(key, localStorage.getItem(key)!);
        }
      });

      success('Local storage cleared successfully');
      calculateCacheSize();
    } catch (err) {
      console.error('Error clearing local storage:', err);
      showError('Failed to clear local storage');
    }
  };

  const clearSessionStorage = () => {
    try {
      sessionStorage.clear();
      success('Session storage cleared successfully');
      calculateCacheSize();
    } catch (err) {
      console.error('Error clearing session storage:', err);
      showError('Failed to clear session storage');
    }
  };

  const clearBrowserCache = async () => {
    setClearing(true);
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        success(`Cleared ${cacheNames.length} cache(s)`);
      }

      calculateCacheSize();
    } catch (err) {
      console.error('Error clearing browser cache:', err);
      showError('Failed to clear browser cache');
    } finally {
      setClearing(false);
    }
  };

  const clearIndexedDB = async () => {
    setClearing(true);
    try {
      if ('indexedDB' in window) {
        const databases = await indexedDB.databases();
        const deletePromises = databases
          .filter(db => db.name && !db.name.includes('supabase'))
          .map(db => {
            return new Promise((resolve, reject) => {
              if (db.name) {
                const request = indexedDB.deleteDatabase(db.name);
                request.onsuccess = () => resolve(true);
                request.onerror = () => reject(request.error);
              } else {
                resolve(true);
              }
            });
          });

        await Promise.all(deletePromises);
        success('IndexedDB cleared successfully');
      }
      calculateCacheSize();
    } catch (err) {
      console.error('Error clearing IndexedDB:', err);
      showError('Failed to clear IndexedDB');
    } finally {
      setClearing(false);
    }
  };

  const clearAll = async () => {
    if (!confirm('Are you sure you want to clear all cache? This action cannot be undone.')) {
      return;
    }

    setClearing(true);
    try {
      clearLocalStorage();
      clearSessionStorage();
      await clearBrowserCache();
      await clearIndexedDB();

      success('All cache cleared successfully');

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error('Error clearing all cache:', err);
      showError('Failed to clear all cache');
    } finally {
      setClearing(false);
    }
  };

  useState(() => {
    calculateCacheSize();
  });

  const formatSize = (kb: number) => {
    if (kb < 1024) return `${kb} KB`;
    return `${(kb / 1024).toFixed(2)} MB`;
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Cache Management</h1>
        <p className="text-slate-600">Clear browser cache and storage to improve performance</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-900 mb-1">Important Notice</p>
            <p className="text-sm text-amber-800">
              Clearing cache will log you out and remove temporary data. Authentication tokens will be preserved.
              The page will automatically reload after clearing all cache.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Database className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Local Storage</h3>
                <p className="text-sm text-slate-600">{formatSize(cacheStats.localStorage)}</p>
              </div>
            </div>
          </div>
          <p className="text-sm text-slate-600 mb-4">
            Stores user preferences and application settings
          </p>
          <button
            onClick={clearLocalStorage}
            disabled={clearing}
            className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            Clear Local Storage
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Session Storage</h3>
                <p className="text-sm text-slate-600">{formatSize(cacheStats.sessionStorage)}</p>
              </div>
            </div>
          </div>
          <p className="text-sm text-slate-600 mb-4">
            Temporary data for the current browser session
          </p>
          <button
            onClick={clearSessionStorage}
            disabled={clearing}
            className="w-full px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            Clear Session Storage
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <HardDrive className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Browser Cache</h3>
                <p className="text-sm text-slate-600">Cached files</p>
              </div>
            </div>
          </div>
          <p className="text-sm text-slate-600 mb-4">
            Cached files and resources from the application
          </p>
          <button
            onClick={clearBrowserCache}
            disabled={clearing}
            className="w-full px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            {clearing ? 'Clearing...' : 'Clear Browser Cache'}
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Database className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">IndexedDB</h3>
                <p className="text-sm text-slate-600">Database storage</p>
              </div>
            </div>
          </div>
          <p className="text-sm text-slate-600 mb-4">
            Structured data storage in the browser
          </p>
          <button
            onClick={clearIndexedDB}
            disabled={clearing}
            className="w-full px-4 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            {clearing ? 'Clearing...' : 'Clear IndexedDB'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-red-200 p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-800 mb-2">Clear All Cache</h3>
            <p className="text-sm text-slate-600 mb-4">
              This will clear all browser cache, local storage, session storage, and IndexedDB.
              The page will reload automatically after clearing.
            </p>
            <button
              onClick={clearAll}
              disabled={clearing}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
            >
              <Trash2 className="w-5 h-5" />
              {clearing ? 'Clearing All Cache...' : 'Clear All Cache'}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-slate-50 rounded-lg p-4">
        <h3 className="font-semibold text-slate-800 mb-3">When to Clear Cache</h3>
        <ul className="space-y-2 text-sm text-slate-700">
          <li className="flex items-start gap-2">
            <span className="text-[#bb2738] mt-1">•</span>
            <span>After deploying new updates to see the latest changes</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#bb2738] mt-1">•</span>
            <span>When experiencing slow performance or loading issues</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#bb2738] mt-1">•</span>
            <span>If you see outdated content or styling issues</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#bb2738] mt-1">•</span>
            <span>To free up browser storage space</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
