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
  // Navigation - Main
  'nav.dashboard': { en: 'Dashboard', ar: 'لوحة التحكم', zh: '仪表板' },
  'nav.customerRequests': { en: 'Customer Requests', ar: 'طلبات العملاء', zh: '客户请求' },
  'nav.customers': { en: 'Customers', ar: 'العملاء', zh: '客户' },
  'nav.quotes': { en: 'Quotes', ar: 'عروض الأسعار', zh: '报价' },
  'nav.visits': { en: 'Site Visits', ar: 'الزيارات الميدانية', zh: '现场访问' },
  'nav.orders': { en: 'Orders', ar: 'الطلبات', zh: '订单' },
  'nav.invoices': { en: 'Invoices', ar: 'الفواتير', zh: '发票' },
  'nav.receipts': { en: 'Receipts', ar: 'الإيصالات', zh: '收据' },
  'nav.paymentVerification': { en: 'Payment Verification', ar: 'التحقق من الدفع', zh: '付款验证' },
  'nav.tracker': { en: 'Order Tracker', ar: 'تتبع الطلبات', zh: '订单跟踪' },
  'nav.productionWorkflow': { en: 'Production Workflow', ar: 'سير العمل الإنتاجي', zh: '生产流程' },
  'nav.inventory': { en: 'Inventory Management', ar: 'إدارة المخزون', zh: '库存管理' },
  'nav.calendar': { en: 'Calendar View', ar: 'عرض التقويم', zh: '日历视图' },
  'nav.installationTasks': { en: 'Installation Tasks', ar: 'مهام التركيب', zh: '安装任务' },
  'nav.warrantyFeedback': { en: 'Warranty & Feedback', ar: 'الضمان والتعليقات', zh: '保修和反馈' },
  'nav.portalSettings': { en: 'Portal Settings', ar: 'إعدادات البوابة', zh: '门户设置' },
  'nav.cacheManagement': { en: 'Clear Cache', ar: 'مسح ذاكرة التخزين المؤقت', zh: '清除缓存' },

  // Navigation - WhatsApp
  'nav.whatsappInbox': { en: 'WhatsApp Inbox', ar: 'صندوق الوارد واتساب', zh: 'WhatsApp收件箱' },
  'nav.whatsappMessaging': { en: 'Bulk Messaging', ar: 'الرسائل الجماعية', zh: '批量消息' },
  'nav.whatsappMarketing': { en: 'Marketing', ar: 'التسويق', zh: '营销' },
  'nav.whatsappAISettings': { en: 'AI Settings', ar: 'إعدادات الذكاء الاصطناعي', zh: 'AI设置' },
  'nav.whatsappMarketing.header': { en: 'WhatsApp Marketing', ar: 'التسويق عبر واتساب', zh: 'WhatsApp营销' },

  // Navigation - Support
  'nav.knowledgeBase': { en: 'Knowledge Base', ar: 'قاعدة المعرفة', zh: '知识库' },
  'nav.faq': { en: 'FAQs', ar: 'الأسئلة الشائعة', zh: '常见问题' },
  'nav.videoTutorials': { en: 'Video Tutorials', ar: 'دروس الفيديو', zh: '视频教程' },
  'nav.supportTickets': { en: 'Support Tickets', ar: 'تذاكر الدعم', zh: '支持工单' },
  'nav.messages': { en: 'Messages', ar: 'الرسائل', zh: '消息' },
  'nav.feedbackManagement': { en: 'Feedback', ar: 'التعليقات', zh: '反馈' },
  'nav.changelogManagement': { en: 'Changelog', ar: 'سجل التغييرات', zh: '更新日志' },
  'nav.emailTemplates': { en: 'Email Templates', ar: 'قوالب البريد الإلكتروني', zh: '电子邮件模板' },
  'nav.emailMarketing': { en: 'Email Marketing', ar: 'التسويق عبر البريد الإلكتروني', zh: '电子邮件营销' },
  'nav.pageManagement': { en: 'Pages', ar: 'الصفحات', zh: '页面' },
  'nav.documentationSupport': { en: 'Documentation & Support', ar: 'التوثيق والدعم', zh: '文档和支持' },

  // Auth
  'auth.signIn': { en: 'Sign In', ar: 'تسجيل الدخول', zh: '登录' },
  'auth.signOut': { en: 'Sign Out', ar: 'تسجيل الخروج', zh: '登出' },
  'auth.signUp': { en: 'Sign Up', ar: 'إنشاء حساب', zh: '注册' },
  'auth.email': { en: 'Email', ar: 'البريد الإلكتروني', zh: '电子邮件' },
  'auth.password': { en: 'Password', ar: 'كلمة المرور', zh: '密码' },
  'auth.confirmPassword': { en: 'Confirm Password', ar: 'تأكيد كلمة المرور', zh: '确认密码' },
  'auth.forgotPassword': { en: 'Forgot Password?', ar: 'نسيت كلمة المرور؟', zh: '忘记密码？' },
  'auth.adminPortal': { en: 'Admin Portal', ar: 'بوابة المسؤول', zh: '管理门户' },
  'auth.customerPortal': { en: 'Customer Portal', ar: 'بوابة العملاء', zh: '客户门户' },
  'auth.createAccount': { en: 'Create Account', ar: 'إنشاء حساب', zh: '创建帐户' },
  'auth.alreadyHaveAccount': { en: 'Already have an account? Sign in', ar: 'هل لديك حساب بالفعل؟ تسجيل الدخول', zh: '已有帐户？登录' },
  'auth.dontHaveAccount': { en: "Don't have an account? Create one", ar: 'ليس لديك حساب؟ أنشئ واحدًا', zh: '没有帐户？创建一个' },

  // Common Actions
  'common.save': { en: 'Save', ar: 'حفظ', zh: '保存' },
  'common.cancel': { en: 'Cancel', ar: 'إلغاء', zh: '取消' },
  'common.edit': { en: 'Edit', ar: 'تعديل', zh: '编辑' },
  'common.delete': { en: 'Delete', ar: 'حذف', zh: '删除' },
  'common.add': { en: 'Add', ar: 'إضافة', zh: '添加' },
  'common.search': { en: 'Search', ar: 'بحث', zh: '搜索' },
  'common.export': { en: 'Export', ar: 'تصدير', zh: '导出' },
  'common.import': { en: 'Import', ar: 'استيراد', zh: '导入' },
  'common.download': { en: 'Download', ar: 'تحميل', zh: '下载' },
  'common.upload': { en: 'Upload', ar: 'رفع', zh: '上传' },
  'common.status': { en: 'Status', ar: 'الحالة', zh: '状态' },
  'common.actions': { en: 'Actions', ar: 'الإجراءات', zh: '操作' },
  'common.view': { en: 'View', ar: 'عرض', zh: '查看' },
  'common.close': { en: 'Close', ar: 'إغلاق', zh: '关闭' },
  'common.submit': { en: 'Submit', ar: 'إرسال', zh: '提交' },
  'common.refresh': { en: 'Refresh', ar: 'تحديث', zh: '刷新' },
  'common.refreshData': { en: 'Refresh Data', ar: 'تحديث البيانات', zh: '刷新数据' },
  'common.loading': { en: 'Loading...', ar: 'جار التحميل...', zh: '加载中...' },
  'common.confirm': { en: 'Confirm', ar: 'تأكيد', zh: '确认' },
  'common.yes': { en: 'Yes', ar: 'نعم', zh: '是' },
  'common.no': { en: 'No', ar: 'لا', zh: '否' },
  'common.all': { en: 'All', ar: 'الكل', zh: '全部' },
  'common.filter': { en: 'Filter', ar: 'تصفية', zh: '筛选' },
  'common.sort': { en: 'Sort', ar: 'ترتيب', zh: '排序' },
  'common.send': { en: 'Send', ar: 'إرسال', zh: '发送' },
  'common.back': { en: 'Back', ar: 'رجوع', zh: '返回' },
  'common.next': { en: 'Next', ar: 'التالي', zh: '下一步' },
  'common.previous': { en: 'Previous', ar: 'السابق', zh: '上一步' },
  'common.select': { en: 'Select', ar: 'اختيار', zh: '选择' },
  'common.print': { en: 'Print', ar: 'طباعة', zh: '打印' },
  'common.duplicate': { en: 'Duplicate', ar: 'تكرار', zh: '复制' },
  'common.copy': { en: 'Copy', ar: 'نسخ', zh: '复制' },
  'common.paste': { en: 'Paste', ar: 'لصق', zh: '粘贴' },
  'common.preview': { en: 'Preview', ar: 'معاينة', zh: '预览' },

  // Dashboard
  'dashboard.title': { en: 'Dashboard', ar: 'لوحة التحكم', zh: '仪表板' },
  'dashboard.subtitle': { en: 'Business Performance Overview', ar: 'نظرة عامة على أداء الأعمال', zh: '业务绩效概览' },
  'dashboard.welcomeBack': { en: 'Welcome back', ar: 'مرحبًا بعودتك', zh: '欢迎回来' },
  'dashboard.totalRevenue': { en: 'Total Revenue', ar: 'إجمالي الإيرادات', zh: '总收入' },
  'dashboard.monthlyRevenue': { en: 'Monthly Revenue', ar: 'الإيرادات الشهرية', zh: '月收入' },
  'dashboard.outstandingInvoices': { en: 'Outstanding Invoices', ar: 'الفواتير المستحقة', zh: '未付发票' },
  'dashboard.quoteConversion': { en: 'Quote Conversion', ar: 'معدل تحويل العروض', zh: '报价转化率' },
  'dashboard.allTimePaidInvoices': { en: 'All time paid invoices', ar: 'جميع الفواتير المدفوعة', zh: '所有已付发票' },
  'dashboard.last30Days': { en: 'Last 30 days', ar: 'آخر 30 يومًا', zh: '过去30天' },
  'dashboard.pendingOverdue': { en: 'Pending & overdue payments', ar: 'المدفوعات المعلقة والمتأخرة', zh: '待付款和逾期付款' },
  'dashboard.acceptanceRate': { en: 'Acceptance rate', ar: 'معدل القبول', zh: '接受率' },
  'dashboard.recentActivity': { en: 'Recent Activity', ar: 'النشاط الأخير', zh: '最近活动' },
  'dashboard.insights': { en: 'Insights', ar: 'رؤى', zh: '洞察' },
  'dashboard.quickActions': { en: 'Quick Actions', ar: 'إجراءات سريعة', zh: '快速操作' },
  'dashboard.createQuote': { en: 'Create Quote', ar: 'إنشاء عرض سعر', zh: '创建报价' },
  'dashboard.scheduleVisit': { en: 'Schedule Visit', ar: 'جدولة زيارة', zh: '安排访问' },
  'dashboard.createInvoice': { en: 'Create Invoice', ar: 'إنشاء فاتورة', zh: '创建发票' },
  'dashboard.newQuotation': { en: 'New quotation', ar: 'عرض سعر جديد', zh: '新报价' },
  'dashboard.bookSiteVisit': { en: 'Book site visit', ar: 'حجز زيارة ميدانية', zh: '预约现场访问' },
  'dashboard.generateInvoice': { en: 'Generate invoice', ar: 'إنشاء فاتورة', zh: '生成发票' },
  'dashboard.quotesOverview': { en: 'Quotes Overview', ar: 'نظرة عامة على العروض', zh: '报价概览' },
  'dashboard.ordersOverview': { en: 'Orders Overview', ar: 'نظرة عامة على الطلبات', zh: '订单概览' },
  'dashboard.invoicesOverview': { en: 'Invoices Overview', ar: 'نظرة عامة على الفواتير', zh: '发票概览' },
  'dashboard.siteVisits': { en: 'Site Visits', ar: 'الزيارات الميدانية', zh: '现场访问' },
  'dashboard.supportMessages': { en: 'Support & Messages', ar: 'الدعم والرسائل', zh: '支持和消息' },
  'dashboard.totalQuotes': { en: 'Total Quotes', ar: 'إجمالي العروض', zh: '总报价' },
  'dashboard.pendingQuotes': { en: 'Pending Quotes', ar: 'العروض المعلقة', zh: '待处理报价' },
  'dashboard.acceptedQuotes': { en: 'Accepted Quotes', ar: 'العروض المقبولة', zh: '已接受报价' },
  'dashboard.draftQuotes': { en: 'Draft Quotes', ar: 'مسودات العروض', zh: '草稿报价' },
  'dashboard.totalOrders': { en: 'Total Orders', ar: 'إجمالي الطلبات', zh: '总订单' },
  'dashboard.inProgress': { en: 'In Progress', ar: 'قيد التنفيذ', zh: '进行中' },
  'dashboard.inProduction': { en: 'In Production', ar: 'قيد الإنتاج', zh: '生产中' },
  'dashboard.completed': { en: 'Completed', ar: 'مكتمل', zh: '已完成' },
  'dashboard.totalInvoices': { en: 'Total Invoices', ar: 'إجمالي الفواتير', zh: '总发票' },
  'dashboard.pending': { en: 'Pending', ar: 'معلق', zh: '待处理' },
  'dashboard.overdue': { en: 'Overdue', ar: 'متأخر', zh: '逾期' },
  'dashboard.paid': { en: 'Paid', ar: 'مدفوع', zh: '已付' },
  'dashboard.totalVisits': { en: 'Total Visits', ar: 'إجمالي الزيارات', zh: '总访问次数' },
  'dashboard.scheduled': { en: 'Scheduled', ar: 'مجدول', zh: '已安排' },
  'dashboard.today': { en: 'Today', ar: 'اليوم', zh: '今天' },
  'dashboard.totalTickets': { en: 'Total Tickets', ar: 'إجمالي التذاكر', zh: '总工单' },
  'dashboard.openTickets': { en: 'Open Tickets', ar: 'التذاكر المفتوحة', zh: '待处理工单' },
  'dashboard.unreadMessages': { en: 'Unread Messages', ar: 'الرسائل غير المقروءة', zh: '未读消息' },
  'dashboard.closedTickets': { en: 'Closed Tickets', ar: 'التذاكر المغلقة', zh: '已关闭工单' },
  'dashboard.allClear': { en: 'All Clear', ar: 'كل شيء على ما يرام', zh: '一切正常' },
  'dashboard.everythingRunning': { en: 'Everything is running smoothly', ar: 'كل شيء يعمل بسلاسة', zh: '一切运行正常' },
  'dashboard.overdueInvoices': { en: 'Overdue Invoices', ar: 'الفواتير المتأخرة', zh: '逾期发票' },
  'dashboard.supportBacklog': { en: 'Support Backlog', ar: 'تراكم الدعم', zh: '支持积压' },
  'dashboard.active': { en: 'Active', ar: 'نشط', zh: '活跃' },
  'dashboard.manufacturing': { en: 'Manufacturing', ar: 'التصنيع', zh: '制造中' },
  'dashboard.done': { en: 'Done', ar: 'تم', zh: '完成' },
  'dashboard.allTime': { en: 'All time', ar: 'كل الوقت', zh: '所有时间' },
  'dashboard.upcoming': { en: 'upcoming', ar: 'القادمة', zh: '即将进行' },
  'dashboard.highPriority': { en: 'high priority', ar: 'أولوية عالية', zh: '高优先级' },
  'dashboard.fromCustomers': { en: 'From customers', ar: 'من العملاء', zh: '来自客户' },
  'dashboard.resolved': { en: 'Resolved', ar: 'تم الحل', zh: '已解决' },
  'dashboard.inDraft': { en: 'In draft', ar: 'في المسودة', zh: '草稿中' },
  'dashboard.thisMonth': { en: 'this month', ar: 'هذا الشهر', zh: '本月' },
  'dashboard.ofTotal': { en: 'of total', ar: 'من الإجمالي', zh: '占总数' },
  'dashboard.invoices': { en: 'invoices', ar: 'الفواتير', zh: '发票' },
  'dashboard.accepted': { en: 'accepted', ar: 'مقبول', zh: '已接受' },
  'dashboard.noActivityFound': { en: 'No activity found', ar: 'لم يتم العثور على نشاط', zh: '未找到活动' },
  'dashboard.failedToLoad': { en: 'Failed to Load Dashboard', ar: 'فشل تحميل لوحة التحكم', zh: '加载仪表板失败' },
  'dashboard.tryAgain': { en: 'Try Again', ar: 'حاول مرة أخرى', zh: '重试' },

  // Customer
  'customer.name': { en: 'Name', ar: 'الاسم', zh: '姓名' },
  'customer.email': { en: 'Email', ar: 'البريد الإلكتروني', zh: '电子邮件' },
  'customer.phone': { en: 'Phone', ar: 'الهاتف', zh: '电话' },
  'customer.location': { en: 'Location', ar: 'الموقع', zh: '地址' },
  'customer.notes': { en: 'Notes', ar: 'ملاحظات', zh: '备注' },
  'customer.addCustomer': { en: 'Add Customer', ar: 'إضافة عميل', zh: '添加客户' },
  'customer.editCustomer': { en: 'Edit Customer', ar: 'تعديل العميل', zh: '编辑客户' },
  'customer.deleteCustomer': { en: 'Delete Customer', ar: 'حذف العميل', zh: '删除客户' },
  'customer.bulkImport': { en: 'Bulk Import', ar: 'استيراد جماعي', zh: '批量导入' },
  'customer.exportPDF': { en: 'Export PDF', ar: 'تصدير PDF', zh: '导出PDF' },
  'customer.exportExcel': { en: 'Export Excel', ar: 'تصدير Excel', zh: '导出Excel' },
  'customer.attachments': { en: 'Attachments', ar: 'المرفقات', zh: '附件' },
  'customer.sendWhatsApp': { en: 'Send WhatsApp', ar: 'إرسال واتساب', zh: '发送WhatsApp' },
  'customer.sendEmail': { en: 'Send Email', ar: 'إرسال بريد إلكتروني', zh: '发送电子邮件' },
  'customer.loginAsCustomer': { en: 'Login as Customer', ar: 'تسجيل الدخول كعميل', zh: '以客户身份登录' },
  'customer.createdAt': { en: 'Created', ar: 'تاريخ الإنشاء', zh: '创建时间' },

  // Status
  'status.lead': { en: 'Lead', ar: 'عميل محتمل', zh: '潜在客户' },
  'status.quoted': { en: 'Quoted', ar: 'تم تقديم العرض', zh: '已报价' },
  'status.ordered': { en: 'Ordered', ar: 'تم الطلب', zh: '已下单' },
  'status.delivered': { en: 'Delivered', ar: 'تم التسليم', zh: '已交付' },
  'status.installed': { en: 'Installed', ar: 'تم التركيب', zh: '已安装' },
  'status.draft': { en: 'Draft', ar: 'مسودة', zh: '草稿' },
  'status.pending': { en: 'Pending', ar: 'معلق', zh: '待处理' },
  'status.approved': { en: 'Approved', ar: 'موافق عليه', zh: '已批准' },
  'status.rejected': { en: 'Rejected', ar: 'مرفوض', zh: '已拒绝' },
  'status.inProgress': { en: 'In Progress', ar: 'قيد التنفيذ', zh: '进行中' },
  'status.completed': { en: 'Completed', ar: 'مكتمل', zh: '已完成' },
  'status.cancelled': { en: 'Cancelled', ar: 'ملغى', zh: '已取消' },
  'status.active': { en: 'Active', ar: 'نشط', zh: '活跃' },
  'status.inactive': { en: 'Inactive', ar: 'غير نشط', zh: '非活跃' },
  'status.paid': { en: 'Paid', ar: 'مدفوع', zh: '已付' },
  'status.unpaid': { en: 'Unpaid', ar: 'غير مدفوع', zh: '未付' },
  'status.overdue': { en: 'Overdue', ar: 'متأخر', zh: '逾期' },
  'status.partial': { en: 'Partial', ar: 'جزئي', zh: '部分' },
  'status.scheduled': { en: 'Scheduled', ar: 'مجدول', zh: '已安排' },
  'status.open': { en: 'Open', ar: 'مفتوح', zh: '待处理' },
  'status.closed': { en: 'Closed', ar: 'مغلق', zh: '已关闭' },

  // Quote Management
  'quote.quotes': { en: 'Quotes', ar: 'عروض الأسعار', zh: '报价' },
  'quote.addQuote': { en: 'Add Quote', ar: 'إضافة عرض سعر', zh: '添加报价' },
  'quote.editQuote': { en: 'Edit Quote', ar: 'تعديل العرض', zh: '编辑报价' },
  'quote.quoteNumber': { en: 'Quote Number', ar: 'رقم العرض', zh: '报价编号' },
  'quote.customer': { en: 'Customer', ar: 'العميل', zh: '客户' },
  'quote.selectCustomer': { en: 'Select Customer', ar: 'اختر العميل', zh: '选择客户' },
  'quote.items': { en: 'Items', ar: 'العناصر', zh: '项目' },
  'quote.addItem': { en: 'Add Item', ar: 'إضافة عنصر', zh: '添加项目' },
  'quote.location': { en: 'Location', ar: 'الموقع', zh: '位置' },
  'quote.type': { en: 'Type', ar: 'النوع', zh: '类型' },
  'quote.height': { en: 'Height (mm)', ar: 'الارتفاع (مم)', zh: '高度（毫米）' },
  'quote.width': { en: 'Width (mm)', ar: 'العرض (مم)', zh: '宽度（毫米）' },
  'quote.qty': { en: 'Qty', ar: 'الكمية', zh: '数量' },
  'quote.area': { en: 'Area (m²)', ar: 'المساحة (م²)', zh: '面积（平方米）' },
  'quote.chargeableArea': { en: 'Chargeable Area', ar: 'المساحة المحتسبة', zh: '计费面积' },
  'quote.unitPrice': { en: 'Unit Price', ar: 'سعر الوحدة', zh: '单价' },
  'quote.total': { en: 'Total', ar: 'الإجمالي', zh: '总计' },
  'quote.subtotal': { en: 'Subtotal', ar: 'المجموع الفرعي', zh: '小计' },
  'quote.discount': { en: 'Discount', ar: 'الخصم', zh: '折扣' },
  'quote.vat': { en: 'VAT (5%)', ar: 'ضريبة القيمة المضافة (5%)', zh: '增值税（5%）' },
  'quote.shipping': { en: 'Shipping', ar: 'الشحن', zh: '运费' },
  'quote.grandTotal': { en: 'Grand Total', ar: 'الإجمالي الكلي', zh: '总计' },
  'quote.remarks': { en: 'Remarks', ar: 'ملاحظات', zh: '备注' },
  'quote.validUntil': { en: 'Valid Until', ar: 'صالح حتى', zh: '有效期至' },
  'quote.minimumChargeableArea': { en: 'Minimum Chargeable Area', ar: 'الحد الأدنى للمساحة المحتسبة', zh: '最小计费面积' },
  'quote.convertToOrder': { en: 'Convert to Order', ar: 'تحويل إلى طلب', zh: '转换为订单' },
  'quote.generateInvoice': { en: 'Generate Invoice', ar: 'إنشاء فاتورة', zh: '生成发票' },

  // Order Management
  'order.orders': { en: 'Orders', ar: 'الطلبات', zh: '订单' },
  'order.orderNumber': { en: 'Order Number', ar: 'رقم الطلب', zh: '订单编号' },
  'order.addOrder': { en: 'Add Order', ar: 'إضافة طلب', zh: '添加订单' },
  'order.trackOrder': { en: 'Track Order', ar: 'تتبع الطلب', zh: '跟踪订单' },

  // Invoice Management
  'invoice.invoices': { en: 'Invoices', ar: 'الفواتير', zh: '发票' },
  'invoice.invoiceNumber': { en: 'Invoice Number', ar: 'رقم الفاتورة', zh: '发票编号' },
  'invoice.dueDate': { en: 'Due Date', ar: 'تاريخ الاستحقاق', zh: '到期日' },
  'invoice.amount': { en: 'Amount', ar: 'المبلغ', zh: '金额' },
  'invoice.paidAmount': { en: 'Paid Amount', ar: 'المبلغ المدفوع', zh: '已付金额' },
  'invoice.balance': { en: 'Balance', ar: 'الرصيد', zh: '余额' },

  // Messages & Communication
  'message.subject': { en: 'Subject', ar: 'الموضوع', zh: '主题' },
  'message.message': { en: 'Message', ar: 'الرسالة', zh: '消息' },
  'message.sendMessage': { en: 'Send Message', ar: 'إرسال رسالة', zh: '发送消息' },
  'message.reply': { en: 'Reply', ar: 'رد', zh: '回复' },

  // Settings
  'settings.settings': { en: 'Settings', ar: 'الإعدادات', zh: '设置' },
  'settings.language': { en: 'Language', ar: 'اللغة', zh: '语言' },
  'settings.notifications': { en: 'Notifications', ar: 'الإشعارات', zh: '通知' },
  'settings.profile': { en: 'Profile', ar: 'الملف الشخصي', zh: '个人资料' },

  // Errors & Validation
  'error.required': { en: 'This field is required', ar: 'هذا الحقل مطلوب', zh: '此字段为必填项' },
  'error.invalidEmail': { en: 'Please enter a valid email address', ar: 'يرجى إدخال عنوان بريد إلكتروني صالح', zh: '请输入有效的电子邮件地址' },
  'error.passwordsDontMatch': { en: 'Passwords do not match', ar: 'كلمات المرور غير متطابقة', zh: '密码不匹配' },
  'error.failed': { en: 'Operation failed', ar: 'فشلت العملية', zh: '操作失败' },

  // Success Messages
  'success.saved': { en: 'Saved successfully', ar: 'تم الحفظ بنجاح', zh: '保存成功' },
  'success.deleted': { en: 'Deleted successfully', ar: 'تم الحذف بنجاح', zh: '删除成功' },
  'success.updated': { en: 'Updated successfully', ar: 'تم التحديث بنجاح', zh: '更新成功' },
  'success.created': { en: 'Created successfully', ar: 'تم الإنشاء بنجاح', zh: '创建成功' },
  'success.sent': { en: 'Sent successfully', ar: 'تم الإرسال بنجاح', zh: '发送成功' },
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
