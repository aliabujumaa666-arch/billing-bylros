import { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ar' | 'zh';

interface Translations {
  [key: string]: {
    en: string;
    ar: string;
    zh: string;
  };
}

const translations: Translations = {
  // Navigation
  'nav.dashboard': { en: 'Dashboard', ar: 'لوحة التحكم', zh: '仪表板' },
  'nav.customers': { en: 'Customers', ar: 'العملاء', zh: '客户' },
  'nav.quotes': { en: 'Quotes', ar: 'عروض الأسعار', zh: '报价' },
  'nav.visits': { en: 'Site Visits', ar: 'الزيارات الميدانية', zh: '现场访问' },
  'nav.orders': { en: 'Orders', ar: 'الطلبات', zh: '订单' },
  'nav.invoices': { en: 'Invoices', ar: 'الفواتير', zh: '发票' },
  'nav.tracker': { en: 'Order Tracker', ar: 'تتبع الطلبات', zh: '订单跟踪' },

  // Auth
  'auth.signIn': { en: 'Sign In', ar: 'تسجيل الدخول', zh: '登录' },
  'auth.signOut': { en: 'Sign Out', ar: 'تسجيل الخروج', zh: '登出' },
  'auth.email': { en: 'Email', ar: 'البريد الإلكتروني', zh: '电子邮件' },
  'auth.password': { en: 'Password', ar: 'كلمة المرور', zh: '密码' },

  // Common
  'common.save': { en: 'Save', ar: 'حفظ', zh: '保存' },
  'common.cancel': { en: 'Cancel', ar: 'إلغاء', zh: '取消' },
  'common.edit': { en: 'Edit', ar: 'تعديل', zh: '编辑' },
  'common.delete': { en: 'Delete', ar: 'حذف', zh: '删除' },
  'common.add': { en: 'Add', ar: 'إضافة', zh: '添加' },
  'common.search': { en: 'Search', ar: 'بحث', zh: '搜索' },
  'common.export': { en: 'Export', ar: 'تصدير', zh: '导出' },
  'common.status': { en: 'Status', ar: 'الحالة', zh: '状态' },
  'common.actions': { en: 'Actions', ar: 'الإجراءات', zh: '操作' },

  // Customer
  'customer.name': { en: 'Name', ar: 'الاسم', zh: '姓名' },
  'customer.email': { en: 'Email', ar: 'البريد الإلكتروني', zh: '电子邮件' },
  'customer.phone': { en: 'Phone', ar: 'الهاتف', zh: '电话' },
  'customer.location': { en: 'Location', ar: 'الموقع', zh: '地址' },
  'customer.notes': { en: 'Notes', ar: 'ملاحظات', zh: '备注' },

  // Status
  'status.lead': { en: 'Lead', ar: 'عميل محتمل', zh: '潜在客户' },
  'status.quoted': { en: 'Quoted', ar: 'تم تقديم العرض', zh: '已报价' },
  'status.ordered': { en: 'Ordered', ar: 'تم الطلب', zh: '已下单' },
  'status.delivered': { en: 'Delivered', ar: 'تم التسليم', zh: '已交付' },
  'status.installed': { en: 'Installed', ar: 'تم التركيب', zh: '已安装' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('language') as Language;
    if (saved && ['en', 'ar', 'zh'].includes(saved)) {
      setLanguageState(saved);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  const isRTL = language === 'ar';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
