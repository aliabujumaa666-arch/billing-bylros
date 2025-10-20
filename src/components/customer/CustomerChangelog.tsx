import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Package, Clock, Sparkles, Wrench, Bug, AlertTriangle } from 'lucide-react';

export function CustomerChangelog() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChangelog();
  }, []);

  const fetchChangelog = async () => {
    const { data } = await supabase
      .from('changelog_entries')
      .select('*')
      .eq('is_published', true)
      .order('release_date', { ascending: false });

    if (data) setEntries(data);
    setLoading(false);
  };

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'feature':
        return <Sparkles className="w-4 h-4 text-green-600" />;
      case 'improvement':
        return <Wrench className="w-4 h-4 text-blue-600" />;
      case 'fix':
        return <Bug className="w-4 h-4 text-orange-600" />;
      case 'breaking':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Package className="w-4 h-4 text-slate-600" />;
    }
  };

  const getChangeBadge = (type: string) => {
    const badges = {
      feature: 'bg-green-100 text-green-700',
      improvement: 'bg-blue-100 text-blue-700',
      fix: 'bg-orange-100 text-orange-700',
      breaking: 'bg-red-100 text-red-700'
    };
    return badges[type as keyof typeof badges] || 'bg-slate-100 text-slate-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bb2738]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">What's New</h1>
        <p className="text-slate-600">Stay up to date with the latest features and improvements</p>
      </div>

      <div className="space-y-8">
        {entries.map((entry) => (
          <div key={entry.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-[#bb2738] to-[#a01f2f] p-6 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                      Version {entry.version}
                    </span>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4" />
                      {new Date(entry.release_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold">{entry.title}</h2>
                  {entry.description && (
                    <p className="mt-2 text-white/90">{entry.description}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6">
              {entry.changes && entry.changes.length > 0 && (
                <div className="space-y-4">
                  {entry.changes.map((change: any, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex-shrink-0 mt-0.5">
                        {getChangeIcon(change.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getChangeBadge(change.type)}`}>
                            {change.type}
                          </span>
                        </div>
                        <p className="text-slate-800">{change.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {entries.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 mb-2">No Updates Yet</h3>
            <p className="text-slate-600">Check back soon for the latest updates and improvements</p>
          </div>
        )}
      </div>
    </div>
  );
}
