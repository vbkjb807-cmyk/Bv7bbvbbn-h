import { createContext, useContext, useState, useEffect, useCallback } from "react";

type Language = "en" | "ar";
type Direction = "ltr" | "rtl";

interface I18nContextType {
  language: Language;
  direction: Direction;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Landing page
    "landing.title": "Build Software with AI Agents & Expert Developers",
    "landing.subtitle": "Create complete programming projects without deep technical knowledge. Our AI agents generate high-quality code while human experts ensure perfection.",
    "landing.getStarted": "Get Started",
    "landing.startProject": "Start Your Project",
    "landing.learnMore": "Learn More",
    "landing.aiPowered": "AI-Powered Development Platform",
    "landing.ourAgents": "Our AI Agents",
    "landing.whyChoose": "Why Choose CodeMaster AI?",
    "landing.whyChooseDesc": "The perfect blend of artificial intelligence and human expertise for your software projects.",
    "landing.pricing": "Simple, Transparent Pricing",
    "landing.pricingDesc": "Choose the plan that fits your needs. Pay only for what you use.",
    "landing.ready": "Ready to Build Something Amazing?",
    "landing.readyDesc": "Join thousands of creators who are building their dreams with CodeMaster AI.",
    "landing.startBuilding": "Start Building Now",
    
    // Features
    "feature.aiAgents": "5 AI Agents",
    "feature.aiAgentsDesc": "Parallel AI agents for UI/UX, Backend, Database, QA, and DevOps working together on your project.",
    "feature.humanExperts": "Human Experts",
    "feature.humanExpertsDesc": "Professional developers ready to step in when AI needs human expertise or review.",
    "feature.payPerUse": "Pay Per Use",
    "feature.payPerUseDesc": "Only pay for what you use. Track every line, file, and task with transparent pricing.",
    "feature.lightningFast": "Lightning Fast",
    "feature.lightningFastDesc": "Get your project done in hours, not weeks. AI agents work 24/7 on your code.",
    "feature.secure": "Secure & Protected",
    "feature.secureDesc": "Your code is encrypted and protected. Only you and assigned developers can access it.",
    "feature.quality": "Quality Code",
    "feature.qualityDesc": "Production-ready code with tests, documentation, and best practices built-in.",
    
    // Navigation
    "nav.dashboard": "Dashboard",
    "nav.myProjects": "My Projects",
    "nav.newProject": "New Project",
    "nav.balance": "Balance",
    "nav.settings": "Settings",
    "nav.logout": "Logout",
    "nav.programmerDashboard": "Programmer Dashboard",
    "nav.availableTasks": "Available Tasks",
    "nav.myEarnings": "My Earnings",
    
    // Dashboard
    "dashboard.welcome": "Welcome back",
    "dashboard.welcomeDesc": "Here's what's happening with your projects",
    "dashboard.totalProjects": "Total Projects",
    "dashboard.activeProjects": "Active Projects",
    "dashboard.completed": "Completed",
    "dashboard.totalSpent": "Total Spent",
    "dashboard.allTime": "All time",
    "dashboard.inProgress": "In progress",
    "dashboard.successfullyDelivered": "Successfully delivered",
    "dashboard.agentStatus": "AI Agents Status",
    "dashboard.recentProjects": "Recent Projects",
    "dashboard.viewAll": "View All",
    "dashboard.noProjects": "No projects yet",
    "dashboard.createFirst": "Create Your First Project",
    "dashboard.quickActions": "Quick Actions",
    "dashboard.createNew": "Create New Project",
    "dashboard.topUpBalance": "Top Up Balance",
    "dashboard.viewAllProjects": "View All Projects",
    "dashboard.needHelp": "Need Help?",
    "dashboard.aiFailed": "AI Agent Failed?",
    "dashboard.aiFailedDesc": "Request a human programmer to complete your project with professional quality.",
    
    // Projects
    "projects.title": "My Projects",
    "projects.titleDesc": "Manage and track all your projects",
    "projects.searchPlaceholder": "Search projects...",
    "projects.filterStatus": "Filter by status",
    "projects.allStatus": "All Status",
    "projects.noProjectsFound": "No Projects Found",
    "projects.adjustSearch": "Try adjusting your search or filter",
    "projects.createNewProject": "Create New Project",
    
    // New Project
    "newProject.title": "Create New Project",
    "newProject.titleDesc": "Describe your project and let our AI agents build it for you",
    "newProject.projectDetails": "Project Details",
    "newProject.provideDetails": "Provide as much detail as possible for better results",
    "newProject.projectTitle": "Project Title",
    "newProject.projectTitlePlaceholder": "My Awesome App",
    "newProject.shortName": "A short, descriptive name for your project",
    "newProject.projectType": "Project Type",
    "newProject.selectType": "Select project type",
    "newProject.description": "Project Description",
    "newProject.descriptionPlaceholder": "Describe what you want to build. Include features, functionality, and any specific requirements...",
    "newProject.moreDetail": "The more detail you provide, the better the results",
    "newProject.technicalReqs": "Technical Requirements (Optional)",
    "newProject.technicalReqsPlaceholder": "Any specific technologies, APIs, or integrations you need...",
    "newProject.budget": "Budget (USD)",
    "newProject.budgetDesc": "Set a budget limit. You'll only be charged for actual usage.",
    "newProject.aiPowered": "AI-Powered Development",
    "newProject.aiPoweredDesc": "Once you submit, our 5 AI agents will start working on your project simultaneously. You can track progress in real-time and request a human developer if needed.",
    "newProject.cancel": "Cancel",
    "newProject.create": "Create Project",
    "newProject.creating": "Creating...",
    
    // Project Detail
    "projectDetail.back": "Back",
    "projectDetail.description": "Project Description",
    "projectDetail.technicalReqs": "Technical Requirements",
    "projectDetail.agentStatus": "AI Agents Status",
    "projectDetail.generatedFiles": "Generated Files",
    "projectDetail.filesGenerated": "files generated",
    "projectDetail.budget": "Budget",
    "projectDetail.used": "Used",
    "projectDetail.remaining": "Remaining",
    "projectDetail.chatWithProgrammer": "Chat with Programmer",
    "projectDetail.startAI": "Start AI Agents",
    "projectDetail.requestProgrammer": "Request Programmer",
    "projectDetail.notFound": "Project Not Found",
    "projectDetail.notFoundDesc": "The project you're looking for doesn't exist or you don't have access.",
    "projectDetail.backToProjects": "Back to Projects",
    
    // Balance
    "balance.title": "Balance & Payments",
    "balance.titleDesc": "Manage your account balance and view transaction history",
    "balance.topUp": "Top Up Balance",
    "balance.currentBalance": "Current Balance",
    "balance.availableToSpend": "Available to spend",
    "balance.totalTopUps": "Total Top-Ups",
    "balance.totalSpent": "Total Spent",
    "balance.onProjects": "On projects",
    "balance.lowBalance": "Low Balance Warning",
    "balance.lowBalanceDesc": "Your balance is running low. Top up to continue using AI agents and programmer services.",
    "balance.topUpNow": "Top Up Now",
    "balance.transactionHistory": "Transaction History",
    "balance.transactionHistoryDesc": "Your recent transactions and balance changes",
    "balance.addFunds": "Add funds to your account to use AI agents and hire programmers.",
    "balance.enterCustom": "Or enter custom amount",
    "balance.securePayment": "Secure Payment",
    "balance.securePaymentDesc": "Your payment information is encrypted and secure.",
    "balance.add": "Add",
    
    // Programmer Dashboard
    "programmer.title": "Programmer Dashboard",
    "programmer.titleDesc": "Manage your tasks and track your earnings",
    "programmer.availableForWork": "Available for work",
    "programmer.totalEarnings": "Total Earnings",
    "programmer.hourlyRate": "Hourly Rate",
    "programmer.completedTasks": "Completed Tasks",
    "programmer.totalCompleted": "Total completed",
    "programmer.rating": "Rating",
    "programmer.averageRating": "Average rating",
    "programmer.workTimer": "Work Timer",
    "programmer.workTimerDesc": "Track your work time for accurate billing",
    "programmer.assignedProjects": "Assigned Projects",
    "programmer.noAssignedProjects": "No assigned projects",
    "programmer.enableAvailability": "Enable availability to receive new projects",
    "programmer.newProjectsAppear": "New projects will appear here when assigned",
    "programmer.viewAndChat": "View & Chat",
    "programmer.availableTasks": "Available Tasks",
    "programmer.waitingForProgrammer": "Tasks waiting for a programmer",
    "programmer.noAvailableTasks": "No available tasks",
    "programmer.acceptTask": "Accept Task",
    "programmer.yourSkills": "Your Skills",
    "programmer.workSession": "Work Session",
    "programmer.earnings": "Earnings",
    "programmer.startWork": "Start Work",
    "programmer.pause": "Pause",
    "programmer.endSession": "End Session",
    
    // Settings
    "settings.title": "Settings",
    "settings.titleDesc": "Manage your account settings and preferences",
    "settings.profileInfo": "Profile Information",
    "settings.updatePersonal": "Update your personal information",
    "settings.firstName": "First Name",
    "settings.lastName": "Last Name",
    "settings.email": "Email",
    "settings.emailCantChange": "Email cannot be changed",
    "settings.saveChanges": "Save Changes",
    "settings.appearance": "Appearance",
    "settings.customizeLook": "Customize how the app looks",
    "settings.darkMode": "Dark Mode",
    "settings.darkModeDesc": "Use dark theme for the interface",
    "settings.language": "Language",
    "settings.languageDesc": "Choose your preferred language",
    "settings.notifications": "Notifications",
    "settings.notificationsDesc": "Configure your notification preferences",
    "settings.emailNotifications": "Email Notifications",
    "settings.emailNotificationsDesc": "Receive updates via email",
    "settings.projectAlerts": "Project Alerts",
    "settings.projectAlertsDesc": "Get notified about project status changes",
    "settings.balanceAlerts": "Balance Alerts",
    "settings.balanceAlertsDesc": "Get notified when balance is low",
    "settings.security": "Security",
    "settings.securityDesc": "Manage your account security",
    "settings.authProvider": "Authentication Provider",
    "settings.authProviderDesc": "Your account is protected with enterprise-grade security. Password is encrypted with bcrypt.",
    "settings.signOut": "Sign Out",
    
    // Agents
    "agent.uiux": "UI/UX Agent",
    "agent.backend": "Backend Agent",
    "agent.database": "Database Agent",
    "agent.qa": "QA Agent",
    "agent.devops": "DevOps Agent",
    "agent.waiting": "Waiting",
    "agent.running": "Running",
    "agent.done": "Done",
    "agent.failed": "Failed",
    
    // Status
    "status.pending": "Pending",
    "status.aiProcessing": "AI Processing",
    "status.aiCompleted": "AI Completed",
    "status.aiFailed": "AI Failed",
    "status.humanAssigned": "Programmer Assigned",
    "status.inProgress": "In Progress",
    "status.completed": "Completed",
    
    // Common
    "common.cancel": "Cancel",
    "common.confirm": "Confirm",
    "common.save": "Save",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.view": "View",
    "common.viewDetails": "View Details",
    "common.loading": "Loading...",
    "common.noData": "No data available",
    "common.error": "Error",
    "common.success": "Success",
    "common.created": "Created",
  },
  ar: {
    // Landing page
    "landing.title": "ابنِ برمجياتك مع وكلاء الذكاء الاصطناعي والمطورين الخبراء",
    "landing.subtitle": "أنشئ مشاريع برمجية كاملة دون الحاجة لمعرفة تقنية عميقة. وكلاء الذكاء الاصطناعي لدينا يولدون كودًا عالي الجودة بينما يضمن الخبراء البشريون الكمال.",
    "landing.getStarted": "ابدأ الآن",
    "landing.startProject": "ابدأ مشروعك",
    "landing.learnMore": "اعرف المزيد",
    "landing.aiPowered": "منصة تطوير مدعومة بالذكاء الاصطناعي",
    "landing.ourAgents": "وكلاء الذكاء الاصطناعي لدينا",
    "landing.whyChoose": "لماذا تختار CodeMaster AI؟",
    "landing.whyChooseDesc": "المزيج المثالي من الذكاء الاصطناعي والخبرة البشرية لمشاريعك البرمجية.",
    "landing.pricing": "تسعير بسيط وشفاف",
    "landing.pricingDesc": "اختر الخطة التي تناسب احتياجاتك. ادفع فقط مقابل ما تستخدمه.",
    "landing.ready": "جاهز لبناء شيء رائع؟",
    "landing.readyDesc": "انضم لآلاف المبدعين الذين يبنون أحلامهم مع CodeMaster AI.",
    "landing.startBuilding": "ابدأ البناء الآن",
    
    // Features
    "feature.aiAgents": "5 وكلاء ذكاء اصطناعي",
    "feature.aiAgentsDesc": "وكلاء ذكاء اصطناعي متوازيون للواجهات، الخوادم، قواعد البيانات، الاختبارات، والنشر يعملون معًا على مشروعك.",
    "feature.humanExperts": "خبراء بشريون",
    "feature.humanExpertsDesc": "مطورون محترفون جاهزون للتدخل عندما يحتاج الذكاء الاصطناعي لخبرة بشرية أو مراجعة.",
    "feature.payPerUse": "ادفع حسب الاستخدام",
    "feature.payPerUseDesc": "ادفع فقط مقابل ما تستخدمه. تتبع كل سطر وملف ومهمة بتسعير شفاف.",
    "feature.lightningFast": "سريع كالبرق",
    "feature.lightningFastDesc": "أنجز مشروعك في ساعات وليس أسابيع. وكلاء الذكاء الاصطناعي يعملون على مدار الساعة.",
    "feature.secure": "آمن ومحمي",
    "feature.secureDesc": "كودك مشفر ومحمي. أنت والمطورون المعينون فقط يمكنهم الوصول إليه.",
    "feature.quality": "كود عالي الجودة",
    "feature.qualityDesc": "كود جاهز للإنتاج مع اختبارات وتوثيق وأفضل الممارسات مدمجة.",
    
    // Navigation
    "nav.dashboard": "لوحة التحكم",
    "nav.myProjects": "مشاريعي",
    "nav.newProject": "مشروع جديد",
    "nav.balance": "الرصيد",
    "nav.settings": "الإعدادات",
    "nav.logout": "تسجيل الخروج",
    "nav.programmerDashboard": "لوحة تحكم المبرمج",
    "nav.availableTasks": "المهام المتاحة",
    "nav.myEarnings": "أرباحي",
    
    // Dashboard
    "dashboard.welcome": "مرحبًا بعودتك",
    "dashboard.welcomeDesc": "إليك ما يحدث مع مشاريعك",
    "dashboard.totalProjects": "إجمالي المشاريع",
    "dashboard.activeProjects": "المشاريع النشطة",
    "dashboard.completed": "المكتملة",
    "dashboard.totalSpent": "إجمالي الإنفاق",
    "dashboard.allTime": "كل الوقت",
    "dashboard.inProgress": "قيد التنفيذ",
    "dashboard.successfullyDelivered": "تم التسليم بنجاح",
    "dashboard.agentStatus": "حالة وكلاء الذكاء الاصطناعي",
    "dashboard.recentProjects": "المشاريع الأخيرة",
    "dashboard.viewAll": "عرض الكل",
    "dashboard.noProjects": "لا توجد مشاريع بعد",
    "dashboard.createFirst": "أنشئ مشروعك الأول",
    "dashboard.quickActions": "إجراءات سريعة",
    "dashboard.createNew": "إنشاء مشروع جديد",
    "dashboard.topUpBalance": "شحن الرصيد",
    "dashboard.viewAllProjects": "عرض كل المشاريع",
    "dashboard.needHelp": "تحتاج مساعدة؟",
    "dashboard.aiFailed": "فشل وكيل الذكاء الاصطناعي؟",
    "dashboard.aiFailedDesc": "اطلب مبرمجًا بشريًا لإكمال مشروعك بجودة احترافية.",
    
    // Projects
    "projects.title": "مشاريعي",
    "projects.titleDesc": "إدارة وتتبع جميع مشاريعك",
    "projects.searchPlaceholder": "البحث في المشاريع...",
    "projects.filterStatus": "تصفية حسب الحالة",
    "projects.allStatus": "جميع الحالات",
    "projects.noProjectsFound": "لم يتم العثور على مشاريع",
    "projects.adjustSearch": "حاول تعديل البحث أو الفلتر",
    "projects.createNewProject": "إنشاء مشروع جديد",
    
    // New Project
    "newProject.title": "إنشاء مشروع جديد",
    "newProject.titleDesc": "صف مشروعك ودع وكلاء الذكاء الاصطناعي يبنونه لك",
    "newProject.projectDetails": "تفاصيل المشروع",
    "newProject.provideDetails": "قدم أكبر قدر ممكن من التفاصيل للحصول على نتائج أفضل",
    "newProject.projectTitle": "عنوان المشروع",
    "newProject.projectTitlePlaceholder": "تطبيقي الرائع",
    "newProject.shortName": "اسم قصير ووصفي لمشروعك",
    "newProject.projectType": "نوع المشروع",
    "newProject.selectType": "اختر نوع المشروع",
    "newProject.description": "وصف المشروع",
    "newProject.descriptionPlaceholder": "صف ما تريد بناءه. اذكر الميزات والوظائف وأي متطلبات محددة...",
    "newProject.moreDetail": "كلما قدمت تفاصيل أكثر، كانت النتائج أفضل",
    "newProject.technicalReqs": "المتطلبات التقنية (اختياري)",
    "newProject.technicalReqsPlaceholder": "أي تقنيات أو واجهات برمجة أو تكاملات محددة تحتاجها...",
    "newProject.budget": "الميزانية (دولار أمريكي)",
    "newProject.budgetDesc": "حدد حدًا للميزانية. ستُخصم منك الاستخدام الفعلي فقط.",
    "newProject.aiPowered": "تطوير مدعوم بالذكاء الاصطناعي",
    "newProject.aiPoweredDesc": "بمجرد الإرسال، سيبدأ 5 وكلاء ذكاء اصطناعي العمل على مشروعك في وقت واحد. يمكنك تتبع التقدم في الوقت الفعلي وطلب مطور بشري إذا لزم الأمر.",
    "newProject.cancel": "إلغاء",
    "newProject.create": "إنشاء المشروع",
    "newProject.creating": "جارٍ الإنشاء...",
    
    // Project Detail
    "projectDetail.back": "رجوع",
    "projectDetail.description": "وصف المشروع",
    "projectDetail.technicalReqs": "المتطلبات التقنية",
    "projectDetail.agentStatus": "حالة وكلاء الذكاء الاصطناعي",
    "projectDetail.generatedFiles": "الملفات المولدة",
    "projectDetail.filesGenerated": "ملفات تم توليدها",
    "projectDetail.budget": "الميزانية",
    "projectDetail.used": "المستخدم",
    "projectDetail.remaining": "المتبقي",
    "projectDetail.chatWithProgrammer": "الدردشة مع المبرمج",
    "projectDetail.startAI": "بدء وكلاء الذكاء الاصطناعي",
    "projectDetail.requestProgrammer": "طلب مبرمج",
    "projectDetail.notFound": "المشروع غير موجود",
    "projectDetail.notFoundDesc": "المشروع الذي تبحث عنه غير موجود أو ليس لديك صلاحية الوصول.",
    "projectDetail.backToProjects": "العودة للمشاريع",
    
    // Balance
    "balance.title": "الرصيد والمدفوعات",
    "balance.titleDesc": "إدارة رصيد حسابك وعرض سجل المعاملات",
    "balance.topUp": "شحن الرصيد",
    "balance.currentBalance": "الرصيد الحالي",
    "balance.availableToSpend": "متاح للإنفاق",
    "balance.totalTopUps": "إجمالي الشحن",
    "balance.totalSpent": "إجمالي الإنفاق",
    "balance.onProjects": "على المشاريع",
    "balance.lowBalance": "تحذير انخفاض الرصيد",
    "balance.lowBalanceDesc": "رصيدك ينفد. اشحن لمواصلة استخدام وكلاء الذكاء الاصطناعي وخدمات المبرمجين.",
    "balance.topUpNow": "اشحن الآن",
    "balance.transactionHistory": "سجل المعاملات",
    "balance.transactionHistoryDesc": "معاملاتك الأخيرة وتغييرات الرصيد",
    "balance.addFunds": "أضف رصيدًا لحسابك لاستخدام وكلاء الذكاء الاصطناعي وتوظيف المبرمجين.",
    "balance.enterCustom": "أو أدخل مبلغًا مخصصًا",
    "balance.securePayment": "دفع آمن",
    "balance.securePaymentDesc": "معلومات الدفع الخاصة بك مشفرة وآمنة.",
    "balance.add": "إضافة",
    
    // Programmer Dashboard
    "programmer.title": "لوحة تحكم المبرمج",
    "programmer.titleDesc": "إدارة مهامك وتتبع أرباحك",
    "programmer.availableForWork": "متاح للعمل",
    "programmer.totalEarnings": "إجمالي الأرباح",
    "programmer.hourlyRate": "السعر بالساعة",
    "programmer.completedTasks": "المهام المكتملة",
    "programmer.totalCompleted": "إجمالي المكتملة",
    "programmer.rating": "التقييم",
    "programmer.averageRating": "متوسط التقييم",
    "programmer.workTimer": "مؤقت العمل",
    "programmer.workTimerDesc": "تتبع وقت عملك للفوترة الدقيقة",
    "programmer.assignedProjects": "المشاريع المعينة",
    "programmer.noAssignedProjects": "لا توجد مشاريع معينة",
    "programmer.enableAvailability": "فعّل التوفر لاستلام مشاريع جديدة",
    "programmer.newProjectsAppear": "ستظهر المشاريع الجديدة هنا عند التعيين",
    "programmer.viewAndChat": "عرض والدردشة",
    "programmer.availableTasks": "المهام المتاحة",
    "programmer.waitingForProgrammer": "مهام بانتظار مبرمج",
    "programmer.noAvailableTasks": "لا توجد مهام متاحة",
    "programmer.acceptTask": "قبول المهمة",
    "programmer.yourSkills": "مهاراتك",
    "programmer.workSession": "جلسة العمل",
    "programmer.earnings": "الأرباح",
    "programmer.startWork": "بدء العمل",
    "programmer.pause": "إيقاف مؤقت",
    "programmer.endSession": "إنهاء الجلسة",
    
    // Settings
    "settings.title": "الإعدادات",
    "settings.titleDesc": "إدارة إعدادات حسابك وتفضيلاتك",
    "settings.profileInfo": "معلومات الملف الشخصي",
    "settings.updatePersonal": "تحديث معلوماتك الشخصية",
    "settings.firstName": "الاسم الأول",
    "settings.lastName": "الاسم الأخير",
    "settings.email": "البريد الإلكتروني",
    "settings.emailCantChange": "لا يمكن تغيير البريد الإلكتروني",
    "settings.saveChanges": "حفظ التغييرات",
    "settings.appearance": "المظهر",
    "settings.customizeLook": "تخصيص مظهر التطبيق",
    "settings.darkMode": "الوضع الداكن",
    "settings.darkModeDesc": "استخدم السمة الداكنة للواجهة",
    "settings.language": "اللغة",
    "settings.languageDesc": "اختر لغتك المفضلة",
    "settings.notifications": "الإشعارات",
    "settings.notificationsDesc": "تكوين تفضيلات الإشعارات",
    "settings.emailNotifications": "إشعارات البريد الإلكتروني",
    "settings.emailNotificationsDesc": "استلام التحديثات عبر البريد الإلكتروني",
    "settings.projectAlerts": "تنبيهات المشروع",
    "settings.projectAlertsDesc": "الإشعار بتغييرات حالة المشروع",
    "settings.balanceAlerts": "تنبيهات الرصيد",
    "settings.balanceAlertsDesc": "الإشعار عند انخفاض الرصيد",
    "settings.security": "الأمان",
    "settings.securityDesc": "إدارة أمان حسابك",
    "settings.authProvider": "مزود المصادقة",
    "settings.authProviderDesc": "حسابك محمي بأمان على مستوى المؤسسات باستخدام تشفير bcrypt.",
    "settings.signOut": "تسجيل الخروج",
    
    // Agents
    "agent.uiux": "وكيل الواجهات",
    "agent.backend": "وكيل الخوادم",
    "agent.database": "وكيل قواعد البيانات",
    "agent.qa": "وكيل الاختبارات",
    "agent.devops": "وكيل النشر",
    "agent.waiting": "في الانتظار",
    "agent.running": "قيد التشغيل",
    "agent.done": "مكتمل",
    "agent.failed": "فشل",
    
    // Status
    "status.pending": "قيد الانتظار",
    "status.aiProcessing": "معالجة الذكاء الاصطناعي",
    "status.aiCompleted": "اكتمل الذكاء الاصطناعي",
    "status.aiFailed": "فشل الذكاء الاصطناعي",
    "status.humanAssigned": "تم تعيين مبرمج",
    "status.inProgress": "قيد التنفيذ",
    "status.completed": "مكتمل",
    
    // Common
    "common.cancel": "إلغاء",
    "common.confirm": "تأكيد",
    "common.save": "حفظ",
    "common.delete": "حذف",
    "common.edit": "تعديل",
    "common.view": "عرض",
    "common.viewDetails": "عرض التفاصيل",
    "common.loading": "جارٍ التحميل...",
    "common.noData": "لا توجد بيانات",
    "common.error": "خطأ",
    "common.success": "نجاح",
    "common.created": "تم الإنشاء",
  },
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("language") as Language;
      return stored || "en";
    }
    return "en";
  });

  const direction: Direction = language === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    const root = document.documentElement;
    root.dir = direction;
    root.lang = language;
    localStorage.setItem("language", language);
  }, [language, direction]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  const t = useCallback(
    (key: string): string => {
      return translations[language][key] || translations["en"][key] || key;
    },
    [language]
  );

  return (
    <I18nContext.Provider value={{ language, direction, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
