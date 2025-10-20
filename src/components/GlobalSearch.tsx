import { useState, useEffect, useCallback } from 'react';
import { Search, X, FileText, User, Package, DollarSign, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SearchResult {
  id: string;
  type: 'customer' | 'quote' | 'order' | 'invoice';
  title: string;
  subtitle: string;
  metadata?: string;
}

interface GlobalSearchProps {
  onSelect?: (result: SearchResult) => void;
  onNavigate?: (page: string, id?: string) => void;
}

export function GlobalSearch({ onSelect, onNavigate }: GlobalSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    const searchResults: SearchResult[] = [];

    try {
      const searchTerm = `%${searchQuery}%`;

      const [customersRes, quotesRes, ordersRes, invoicesRes] = await Promise.all([
        supabase
          .from('customers')
          .select('id, name, phone, email, company')
          .or(`name.ilike.${searchTerm},phone.ilike.${searchTerm},email.ilike.${searchTerm},company.ilike.${searchTerm}`)
          .limit(5),
        supabase
          .from('quotes')
          .select('id, quote_number, customer:customers(name), total_amount, status')
          .or(`quote_number.ilike.${searchTerm}`)
          .limit(5),
        supabase
          .from('orders')
          .select('id, order_number, customer:customers(name), status')
          .or(`order_number.ilike.${searchTerm}`)
          .limit(5),
        supabase
          .from('invoices')
          .select('id, invoice_number, customer:customers(name), total_amount, status')
          .or(`invoice_number.ilike.${searchTerm}`)
          .limit(5)
      ]);

      if (customersRes.data) {
        customersRes.data.forEach(customer => {
          searchResults.push({
            id: customer.id,
            type: 'customer',
            title: customer.name,
            subtitle: customer.phone,
            metadata: customer.email || customer.company || ''
          });
        });
      }

      if (quotesRes.data) {
        quotesRes.data.forEach((quote: any) => {
          searchResults.push({
            id: quote.id,
            type: 'quote',
            title: quote.quote_number,
            subtitle: quote.customer?.name || 'Unknown Customer',
            metadata: `AED ${Number(quote.total_amount).toLocaleString()} - ${quote.status}`
          });
        });
      }

      if (ordersRes.data) {
        ordersRes.data.forEach((order: any) => {
          searchResults.push({
            id: order.id,
            type: 'order',
            title: order.order_number,
            subtitle: order.customer?.name || 'Unknown Customer',
            metadata: order.status
          });
        });
      }

      if (invoicesRes.data) {
        invoicesRes.data.forEach((invoice: any) => {
          searchResults.push({
            id: invoice.id,
            type: 'invoice',
            title: invoice.invoice_number,
            subtitle: invoice.customer?.name || 'Unknown Customer',
            metadata: `AED ${Number(invoice.total_amount).toLocaleString()} - ${invoice.status}`
          });
        });
      }

      setResults(searchResults);
      setSelectedIndex(0);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query) {
        performSearch(query);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, performSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    }
  };

  const handleSelect = (result: SearchResult) => {
    if (onSelect) {
      onSelect(result);
    }
    if (onNavigate) {
      const pageMap: Record<string, string> = {
        customer: 'customers',
        quote: 'quotes',
        order: 'orders',
        invoice: 'invoices'
      };
      onNavigate(pageMap[result.type], result.id);
    }
    setIsOpen(false);
    setQuery('');
    setResults([]);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'customer':
        return <User className="w-5 h-5 text-blue-500" />;
      case 'quote':
        return <FileText className="w-5 h-5 text-amber-500" />;
      case 'order':
        return <Package className="w-5 h-5 text-green-500" />;
      case 'invoice':
        return <DollarSign className="w-5 h-5 text-emerald-500" />;
      default:
        return <Search className="w-5 h-5 text-slate-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
        title="Search (Ctrl+K)"
      >
        <Search className="w-4 h-4 text-slate-600" />
        <span className="text-sm text-slate-600">Search...</span>
        <kbd className="hidden md:inline-block px-2 py-0.5 bg-white border border-slate-300 rounded text-xs font-mono text-slate-500">
          Ctrl K
        </kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-20">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[70vh] flex flex-col animate-in slide-in-from-top duration-200">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search customers, quotes, orders, invoices..."
            className="flex-1 outline-none text-slate-800 placeholder-slate-400"
            autoFocus
          />
          {loading && <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />}
          <button
            onClick={() => {
              setIsOpen(false);
              setQuery('');
              setResults([]);
            }}
            className="p-1 hover:bg-slate-100 rounded transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {query.length < 2 ? (
            <div className="p-8 text-center text-slate-500">
              <Search className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>Type at least 2 characters to search</p>
            </div>
          ) : results.length === 0 && !loading ? (
            <div className="p-8 text-center text-slate-500">
              <p>No results found for "{query}"</p>
            </div>
          ) : (
            <div className="p-2">
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSelect(result)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-left ${
                    index === selectedIndex
                      ? 'bg-slate-100'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  {getIcon(result.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-slate-800">{result.title}</span>
                      <span className="text-xs px-2 py-0.5 bg-slate-200 text-slate-600 rounded">
                        {getTypeLabel(result.type)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 truncate">{result.subtitle}</p>
                    {result.metadata && (
                      <p className="text-xs text-slate-500 mt-1">{result.metadata}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 px-4 py-3 flex items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <kbd className="px-2 py-1 bg-slate-100 border border-slate-300 rounded">↑</kbd>
            <kbd className="px-2 py-1 bg-slate-100 border border-slate-300 rounded">↓</kbd>
            <span>Navigate</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-2 py-1 bg-slate-100 border border-slate-300 rounded">Enter</kbd>
            <span>Select</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-2 py-1 bg-slate-100 border border-slate-300 rounded">Esc</kbd>
            <span>Close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
