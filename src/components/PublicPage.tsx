import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useBrand } from '../contexts/BrandContext';
import { FileText, AlertCircle, ArrowLeft } from 'lucide-react';
import DOMPurify from 'dompurify';

interface PublicPageProps {
  slug: string;
}

export function PublicPage({ slug }: PublicPageProps) {
  const { brand } = useBrand();
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPage();
  }, [slug]);

  const fetchPage = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('pages')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!data) {
        setError('Page not found');
        return;
      }

      setPage(data);

      if (data.meta_description) {
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
          metaDescription.setAttribute('content', data.meta_description);
        } else {
          const meta = document.createElement('meta');
          meta.name = 'description';
          meta.content = data.meta_description;
          document.head.appendChild(meta);
        }
      }

      if (data.meta_keywords) {
        const metaKeywords = document.querySelector('meta[name="keywords"]');
        if (metaKeywords) {
          metaKeywords.setAttribute('content', data.meta_keywords);
        } else {
          const meta = document.createElement('meta');
          meta.name = 'keywords';
          meta.content = data.meta_keywords;
          document.head.appendChild(meta);
        }
      }

      document.title = `${data.title} - ${brand?.company.name || 'BYLROS'}`;
    } catch (err: any) {
      console.error('Error fetching page:', err);
      setError('Failed to load page');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bb2738]"></div>
          <p className="text-slate-600">Loading page...</p>
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Page Not Found</h1>
            <p className="text-slate-600 mb-6">
              {error || 'The page you are looking for does not exist or has been removed.'}
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#bb2738] text-white rounded-lg hover:bg-[#a01f2f] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  const sanitizedContent = DOMPurify.sanitize(page.content, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre',
      'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'span', 'hr'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel', 'class', 'id']
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <img
              src={brand?.logos.primary || '/Untitled-design-3.png'}
              alt={`${brand?.company.name || 'BYLROS'} Logo`}
              className="h-10 w-auto"
            />
          </a>
          <a
            href="/"
            className="text-slate-600 hover:text-[#bb2738] transition-colors text-sm font-medium"
          >
            Back to Home
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <article className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="border-b border-slate-200 p-8 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-3 text-slate-600 text-sm mb-4">
              <FileText className="w-4 h-4" />
              <span className="capitalize">{page.page_type} Page</span>
              {page.published_at && (
                <>
                  <span className="text-slate-300">•</span>
                  <span>Published on {new Date(page.published_at).toLocaleDateString()}</span>
                </>
              )}
            </div>
            <h1 className="text-4xl font-bold text-slate-800 mb-2">{page.title}</h1>
            {page.meta_description && (
              <p className="text-lg text-slate-600">{page.meta_description}</p>
            )}
          </div>

          <div className="p-8">
            <div
              className="prose prose-slate max-w-none
                prose-headings:text-slate-800 prose-headings:font-bold
                prose-h1:text-3xl prose-h1:mb-6 prose-h1:mt-8
                prose-h2:text-2xl prose-h2:mb-4 prose-h2:mt-6
                prose-h3:text-xl prose-h3:mb-3 prose-h3:mt-5
                prose-p:text-slate-700 prose-p:leading-relaxed prose-p:mb-4
                prose-a:text-[#bb2738] prose-a:no-underline hover:prose-a:underline
                prose-strong:text-slate-900 prose-strong:font-semibold
                prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-4
                prose-ol:list-decimal prose-ol:pl-6 prose-ol:mb-4
                prose-li:text-slate-700 prose-li:mb-2
                prose-blockquote:border-l-4 prose-blockquote:border-[#bb2738] prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-slate-600
                prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:text-slate-800
                prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto
                prose-img:rounded-lg prose-img:shadow-md
                prose-hr:border-slate-200 prose-hr:my-8
                prose-table:w-full prose-table:border-collapse
                prose-th:bg-slate-100 prose-th:p-3 prose-th:text-left prose-th:font-semibold prose-th:border prose-th:border-slate-200
                prose-td:p-3 prose-td:border prose-td:border-slate-200"
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            />
          </div>

          {page.updated_at && page.updated_at !== page.created_at && (
            <div className="border-t border-slate-200 px-8 py-4 bg-slate-50">
              <p className="text-sm text-slate-500">
                Last updated: {new Date(page.updated_at).toLocaleDateString()}
              </p>
            </div>
          )}
        </article>
      </main>

      <footer className="bg-white border-t border-slate-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center text-slate-600 text-sm">
          <p>&copy; {new Date().getFullYear()} {brand?.company.name || 'BYLROS'}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
