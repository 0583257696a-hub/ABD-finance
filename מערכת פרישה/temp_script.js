
  const BRAND_LOGO_SRC = "assets/abd-finance-logo.png";

  const XLSX_SOURCES = [
    "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js",
    "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"
  ];

  const JSZIP_SOURCES = [
    "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js",
    "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"
  ];
  const PORTAL_DB_KEY = "prisha-hub-db-v3";
  const PORTAL_DB_KEYS = ["prisha-hub-db-v3", "prisha-hub-db-v2", "prisha-hub-db"];
  const PORTAL_SESSION_KEY = "prisha-hub-session-v3";
  const PORTAL_SESSION_KEYS = ["prisha-hub-session-v3", "prisha-hub-session-v2", "prisha-hub-session"];
  const PORTAL_APP_ID = "app_retirement";
  const WORKSPACE_DIRECT_AUTH_KEY = "prisha-retirement-direct-auth";
  const MEETING_SUMMARY_ENDPOINT = window.location.protocol === "file:"
    ? "http://localhost:8091/api/send-meeting-summary"
    : "/api/send-meeting-summary";

  const TRACK_PRESETS = [
    { id: "none", label: "ללא הבטחה", multiplier: 1, guaranteeMonths: 0, spouseShare: 0, note: "מסלול בסיס" },
    { id: "guarantee60", label: "הבטחה ל-60 גמלאות", multiplier: 1.016, guaranteeMonths: 60, spouseShare: 0, note: "5 שנים" },
    { id: "guarantee120", label: "הבטחה ל-120 גמלאות", multiplier: 1.064, guaranteeMonths: 120, spouseShare: 0, note: "10 שנים" },
    { id: "guarantee240", label: "הבטחה ל-240 גמלאות", multiplier: 1.208, guaranteeMonths: 240, spouseShare: 0, note: "20 שנים" },
    { id: "spouse60", label: "60% לבן/בת זוג", multiplier: 1.12, guaranteeMonths: 0, spouseShare: 0.6, note: "קצבת שאירים" },
    { id: "spouse100", label: "100% לבן/בת זוג", multiplier: 1.18, guaranteeMonths: 0, spouseShare: 1, note: "קצבת שאירים מלאה" }
  ];

  const SETTINGS_STORAGE_KEY = "abd-finance-settings-v1";
  const WORKSPACE_STATE_KEY = "abd-finance-workspace-state-v1";
  const SMART_ANALYSIS_CACHE_KEY = "abd-smart-analysis-cache-v1";
  const SMART_ANALYSIS_RETURNS_TTL_MS = 24 * 60 * 60 * 1000;
  const SMART_ANALYSIS_MATCH_TTL_MS = 7 * 24 * 60 * 60 * 1000;
  const MY_GEMEL_WIDGET_CONTAINER_ID = "sharing_mygemel_net_ugD36A";
  const MY_GEMEL_WIDGET_VERSION = "0.0.16";
  const MY_GEMEL_WIDGET_GROUPS = ["9","27","170","35","160","186","190","162","194","187","224","182","204","214","16","215","220","168","218","197","56","48","7","59","212","34","17","2","185","203","208","223","189","222","188","219","123","127","134","173","129","243","245","118","133","244","159","126","130","124","131","246","252","253","84","226","231","232","233","228","234","236","88","172","85","229","235","230","180","227","238","241","239","92","91","94","60","61","169","70","191","161","193","199","192","225","200","163","166","216","221","237","75","74","202","209","201","213","128"];
  const MY_GEMEL_WIDGET_PERIODS = ["month","year","3years","5years"];
  const MY_GEMEL_NET_CONFIG = {
    scriptUrl: "https://aff.mygemel.net/dist/assets/js/app.js?ver=0.0.16",
    defaultGroups: ["9", "27"],
    defaultPeriods: ["month", "year", "3years", "5years"],
    productGroups: {
      pension: ["123", "124", "126", "127", "128", "129", "130", "131", "133", "134", "159", "173", "118", "243", "244", "245", "246", "252", "253"],
      provident: ["7", "59", "212", "34", "17", "2", "185", "203", "208", "223", "189", "222", "188", "219", "213"],
      hishtalmut: ["9", "27", "170", "35", "160", "186", "190", "162", "194", "187", "224", "182", "204", "214", "16", "215", "220", "168", "218", "197", "56", "48"],
      providentinvest: ["60", "61", "169", "70", "191", "161", "193", "199", "192", "225", "200", "163", "166", "216", "221", "237", "75", "74"],
      financialsavings: ["84", "226", "231", "232", "233", "228", "234", "236", "88", "172", "85", "229", "235", "230"]
    }
  };
  const MY_GEMEL_GROUP_LABELS = {
    "9": "השתלמות - כללי",
    "27": "השתלמות - מניות",
    "170": "השתלמות - S&P 500",
    "35": "השתלמות - אג\"ח",
    "160": "השתלמות - חו\"ל",
    "186": "השתלמות - מדדי מניות",
    "190": "השתלמות - מחקה מדד",
    "162": "השתלמות - עד 10% מניות",
    "194": "השתלמות - עד 15% מניות",
    "187": "השתלמות - עד 20% מניות",
    "224": "השתלמות - הלכה",
    "182": "השתלמות - שקלי",
    "204": "השתלמות - אג\"ח עד 25% מניות",
    "214": "השתלמות - מסלול מניות חו\"ל",
    "16": "השתלמות - כללי ב'",
    "215": "השתלמות - מדדי חו\"ל",
    "220": "השתלמות - פסיבי",
    "168": "השתלמות - אג\"ח ממשלתי",
    "218": "השתלמות - אג\"ח קונצרני",
    "197": "השתלמות - שריעה",
    "56": "השתלמות - כספי",
    "48": "השתלמות - אחר",
    "123": "פנסיה מקיפה - כללי",
    "124": "פנסיה מקיפה - מניות",
    "126": "פנסיה מקיפה - S&P 500",
    "127": "פנסיה מקיפה - אג\"ח",
    "128": "פנסיה מקיפה - הלכה",
    "129": "פנסיה מקיפה - גילאי 50 ומטה",
    "130": "פנסיה מקיפה - גילאי 50-60",
    "131": "פנסיה מקיפה - גילאי 60 ומעלה",
    "133": "פנסיה מקיפה - מחקה מדדים",
    "134": "פנסיה מקיפה - אג\"ח עד 25% מניות",
    "159": "פנסיה מקיפה - חו\"ל",
    "173": "פנסיה מקיפה - מדדי חו\"ל",
    "118": "פנסיה מקיפה - שקלי",
    "243": "פנסיה משלימה - כללי",
    "244": "פנסיה משלימה - מניות",
    "245": "פנסיה משלימה - S&P 500",
    "246": "פנסיה משלימה - אג\"ח",
    "252": "פנסיה משלימה - גילאי 50-60",
    "253": "פנסיה משלימה - גילאי 60 ומעלה",
    "7": "גמל - כללי",
    "59": "גמל - מניות",
    "212": "גמל - S&P 500",
    "34": "גמל - אג\"ח",
    "17": "גמל - הלכה",
    "2": "גמל - שקלי",
    "185": "גמל - עד 10% מניות",
    "203": "גמל - עד 15% מניות",
    "208": "גמל - עד 20% מניות",
    "223": "גמל - מחקה מדדים",
    "189": "גמל - מדדי חו\"ל",
    "222": "גמל - פסיבי",
    "188": "גמל - אג\"ח ממשלתי",
    "219": "גמל - אג\"ח קונצרני",
    "213": "גמל - אחר",
    "60": "גמל להשקעה - כללי",
    "61": "גמל להשקעה - מניות",
    "169": "גמל להשקעה - S&P 500",
    "70": "גמל להשקעה - אג\"ח",
    "191": "גמל להשקעה - מדדי חו\"ל",
    "161": "גמל להשקעה - עד 10% מניות",
    "193": "גמל להשקעה - עד 20% מניות",
    "199": "גמל להשקעה - הלכה",
    "192": "גמל להשקעה - שקלי",
    "225": "גמל להשקעה - מחקה מדדים",
    "200": "גמל להשקעה - פסיבי",
    "163": "גמל להשקעה - אג\"ח ממשלתי",
    "166": "גמל להשקעה - אג\"ח קונצרני",
    "216": "גמל להשקעה - שריעה",
    "221": "גמל להשקעה - חו\"ל",
    "237": "גמל להשקעה - אחר",
    "75": "גמל להשקעה - כספי",
    "74": "גמל להשקעה - מסלול סולידי",
    "84": "חיסכון פיננסי - כללי",
    "226": "חיסכון פיננסי - מניות",
    "231": "חיסכון פיננסי - S&P 500",
    "232": "חיסכון פיננסי - אג\"ח",
    "233": "חיסכון פיננסי - שקלי",
    "228": "חיסכון פיננסי - הלכה",
    "234": "חיסכון פיננסי - מדדי חו\"ל",
    "236": "חיסכון פיננסי - מחקה מדדים",
    "88": "חיסכון פיננסי - עד 20% מניות",
    "172": "חיסכון פיננסי - אג\"ח ממשלתי",
    "85": "חיסכון פיננסי - אג\"ח קונצרני",
    "229": "חיסכון פיננסי - פסיבי",
    "235": "חיסכון פיננסי - חו\"ל",
    "230": "חיסכון פיננסי - אחר"
  };

  const FUND_TEXT_TEMPLATES = {
    recommendation: [
      { id: "move_new_product", label: "ניוד למוצר חדש", text: "הוחלט לקדם ניוד של {fundLabel} למוצר חדש בהתאם לתכנון ולבחירת הלקוח." },
      { id: "leave_as_complement", label: "השארה כקופה משלימה", text: "הוחלט להשאיר את {fundLabel} כקופה משלימה, ללא שינוי מהותי בשלב זה." },
      { id: "start_annuity", label: "התחלת קצבה", text: "הוחלט לבחון או לקדם מימוש קצבה מתוך {fundLabel}, בהתאם לסימולציה ולבחירת המסלול הסופי." },
      { id: "redeem_funds", label: "פדיון כספים", text: "הוחלט לבחון פדיון או משיכה של כספים מתוך {fundLabel}, בכפוף לאישור סופי ולבדיקת השלכות התהליך." },
      { id: "appointment_change", label: "מינוי סוכן / טיפול שוטף", text: "הוחלט לעדכן טיפול שוטף / מינוי סוכן עבור {fundLabel}, כולל המשך ליווי בתהליך מול הגוף המנהל." }
    ],
    notes: [
      { id: "docs_needed", label: "נדרש מסמך / השלמה", text: "נדרשת השלמת מסמכים או חתימות לצורך קידום הטיפול ב{fundLabel}." },
      { id: "client_followup", label: "המשך מול הלקוח", text: "נדרש המשך תיאום עם הלקוח לצורך החלטה סופית ועדכון פרטי הביצוע עבור {fundLabel}." },
      { id: "waiting_provider", label: "ממתין לטיפול יצרן", text: "המשך הטיפול ב{fundLabel} תלוי בקבלת מידע או אישור מהגוף המנהל." },
      { id: "manual_product", label: "מוצר ידני / נוסף", text: "המוצר נבדק גם במסגרת נתון ידני או השלמה חיצונית, ויש לוודא שכל הפרטים עודכנו לפני סיכום סופי." }
    ]
  };

  const MIGRATION_RULES = {
    "קרן פנסיה": ["קרן פנסיה", "קופת גמל", "ביטוח מנהלים"],
    "קופת גמל": ["קרן פנסיה", "קופת גמל", "ביטוח מנהלים"],
    "קרן השתלמות": ["קרן השתלמות"],
    "קופת גמל להשקעה": ["קופת גמל להשקעה"],
    "פוליסה פיננסית": ["פוליסה פיננסית"],
    "ביטוח מנהלים": ["ביטוח מנהלים", "קרן פנסיה", "קופת גמל"]
  };

  const MIGRATION_TARGET_COMPANIES = {
    "קרן פנסיה": ["הפניקס", "הראל", "מגדל", "כלל", "מנורה מבטחים", "מיטב", "אלטשולר שחם", "מור"],
    "קופת גמל": ["הפניקס", "הראל", "מגדל", "כלל", "מנורה מבטחים", "מיטב", "אלטשולר שחם", "מור", "אנליסט", "ילין לפידות"],
    "קרן השתלמות": ["הפניקס", "הראל", "מגדל", "כלל", "מנורה מבטחים", "מיטב", "אלטשולר שחם", "מור", "אנליסט", "ילין לפידות"],
    "קופת גמל להשקעה": ["הפניקס", "הראל", "מגדל", "כלל", "מנורה מבטחים", "מיטב", "אלטשולר שחם", "מור", "אנליסט", "ילין לפידות"],
    "פוליסה פיננסית": ["הפניקס", "הראל", "מגדל", "כלל", "מנורה מבטחים", "הכשרה", "איילון"],
    "ביטוח מנהלים": ["הפניקס", "הראל", "מגדל", "כלל", "מנורה מבטחים", "הכשרה", "איילון"]
  };

  const MIGRATION_TRACK_OPTIONS = ["S&P500", "מנייתי", "מחקה מדד", "הלכה", "אג\"ח", "כללי", "תלוי גיל"];

  const BENEFICIARY_MATRIX_TRACKS = [
    {
      id: "none",
      title: "מסלול 1",
      subtitle: "גמלא במסלול ללא הבטחה",
      description: "קבלת קצבה לכל החיים ובמקרה פטירה יופסקו התשלומים",
      spouseColumn: false
    },
    {
      id: "guarantee60",
      title: "מסלול 2",
      subtitle: "גמלא עם הבטחה ל-5 שנים",
      description: "קבלת קצבה לכל החיים ובמקרה פטירה השלמה עד 60 תשלומים למוטבים מיום קבלת הקצבה",
      spouseColumn: false
    },
    {
      id: "guarantee120",
      title: "מסלול 3",
      subtitle: "גמלא עם הבטחה ל-10 שנים",
      description: "קבלת קצבה לכל החיים ובמקרה פטירה השלמה עד 120 תשלומים למוטבים מיום קבלת הקצבה",
      spouseColumn: false
    },
    {
      id: "spouse60",
      title: "מסלול 4",
      subtitle: "גמלא עם הבטחת 60% לבן/בת זוג",
      description: "קבלת קצבה לכל החיים ובמקרה פטירה תשלום 60% מהקצבה לבן/בת הזוג לכל ימי חייו/ה",
      spouseColumn: true
    },
    {
      id: "spouse100",
      title: "מסלול 5",
      subtitle: "גמלא עם הבטחת 100% לבן/בת זוג",
      description: "קבלת קצבה לכל החיים ובמקרה פטירה תשלום 100% מהקצבה לבן/בת הזוג לכל ימי חייו/ה",
      spouseColumn: true
    }
  ];

  const state = {
    workbookName: "",
    client: null,
    funds: [],
    insurancePolicies: [],
    selectedInsurancePolicyIds: new Set(),
    needs: {
      incomeWorkPrimary: 0,
      incomeBituachPrimary: 0,
      incomePensionPrimary: 0,
      incomeRentPrimary: 0,
      incomeOtherPrimary: 0,
      incomeWorkSpouse: 0,
      incomeBituachSpouse: 0,
      incomePensionSpouse: 0,
      incomeRentSpouse: 0,
      incomeOtherSpouse: 0,
      fixedExpenses: 0,
      variableExpenses: 0,
      fixedNotes: "",
      variableNotes: "",
      assetBank: 0,
      assetPortfolio: 0,
      assetPolicies: 0,
      assetProvident: 0,
      assetStudyFunds: 0,
      assetInheritance: 0,
      assetRealEstate: 0,
      assetOther: 0,
      completed: false
    },
    needsBaseline: null,
    meetingSummary: {
      documentDate: "",
      adviceType: "pension",
      brandName: "ABD-finance",
      documentTitle: "",
      clientLine: "",
      introText: "",
      showFundsSummaryTable: true,
      showNeedsSection: true,
      showFactsTable: true,
      showPensionSnapshotTable: true,
      showInfrastructureTable: true,
      showMigrationTable: true,
      facts: [],
      hiddenAutoFacts: [],
      recommendations: [],
      manualFollowUps: [],
      recommendationsAuto: true,
      screenshots: []
    },
    settings: {
      templates: cloneFundTemplates(FUND_TEXT_TEMPLATES),
      settingsModalOpen: false
    },
    selectedIds: new Set(),
    infrastructureSelectedIds: new Set(),
    filters: {
      search: "",
      manufacturer: "all",
      productType: "all",
      status: "all",
      sort: "manufacturer-asc"
    },
    calc: {
      manualCapital: "",
      fallbackFactor: 140,
      spouseAge: "",
      activeTrack: "none",
      customTrackFactors: {},
      factorCapital: "",
      factorValue: 140,
      factorAssignments: {},
      factorSelectedIds: new Set(),
      guaranteeMonths: 120,
      spouseShare: 0,
      planningYears: 20,
      beneficiaryBasePension: ""
    },
    smartAnalysis: {
      status: "idle",
      statusNote: "",
      lastAnalyzedAt: "",
      returnsSourceStatus: "idle",
      returnsByFundId: {},
      trackMatchCache: {},
      lastSnapshotKey: "",
      matchWarnings: [],
      manualOverrides: {},
      mygemelProductType: "",
      mygemelGroups: [],
      mygemelPeriods: MY_GEMEL_NET_CONFIG.defaultPeriods.slice()
    },
    simulations: {
      activeView: "compound",
      compound: {
        initialAmount: 250000,
        monthlyDeposit: 2500,
        annualReturn: 6,
        years: 20,
        annualFee: 0.7,
        depositFee: 0,
        inflation: 2,
        taxType: "real",
        linked: false,
        scenario: "base",
        advOpen: false
      },
      returns: {
        search: "",
        manufacturer: "all",
        productType: "all",
        period: "trailing12m",
        favorites: {}
      },
      mygemel: {
        groups: [],
        periods: MY_GEMEL_NET_CONFIG.defaultPeriods.slice(),
        productType: "",
        status: "idle",
        note: "",
        loadedAt: ""
      }
    },
    ui: {
      stage: "welcome",
      activeTab: "funds",
      activeFundId: null,
      fundModalOpen: false,
      fundActivityModalOpen: false,
      fundActivityView: "deposits",
      tableLayouts: {},
      tableResize: null
    },
    auth: {
      mode: "login",
      pendingUserId: ""
    }
  };

  const dom = {};
  let xlsxLoaderPromise = null;
  let jsZipLoaderPromise = null;
  let myGemelLoaderPromise = null;
  let toastTimer = null;
  let simulationsInputRenderTimer = null;
  let simulationsInputVersion = 0;
  let compoundChartInstance = null;
  let compoundChartCurrentTab = "nominal";
  let lastCompoundResult = null;

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    dom.mainShell = document.getElementById("mainShell");
    dom.authGate = document.getElementById("authGate");
    dom.authForm = document.getElementById("authForm");
    dom.authTitle = document.getElementById("authTitle");
    dom.authCopy = document.getElementById("authCopy");
    dom.authLoginFields = document.getElementById("authLoginFields");
    dom.authPasswordChangeFields = document.getElementById("authPasswordChangeFields");
    dom.authEmailInput = document.getElementById("authEmailInput");
    dom.authPasswordInput = document.getElementById("authPasswordInput");
    dom.authNewPasswordInput = document.getElementById("authNewPasswordInput");
    dom.authConfirmPasswordInput = document.getElementById("authConfirmPasswordInput");
    dom.authMessage = document.getElementById("authMessage");
    dom.authSubmitButton = document.getElementById("authSubmitButton");
    dom.authFootnote = document.getElementById("authFootnote");
    dom.welcomeLogoutButton = document.getElementById("welcomeLogoutButton");
    dom.authGate.hidden = true;
    dom.mainShell.hidden = false;
    dom.welcomeLogoutButton.hidden = true;
    dom.welcomeScreen = document.getElementById("welcomeScreen");
    dom.needsStage = document.getElementById("needsStage");
    dom.appShell = document.getElementById("appShell");
    dom.dropzone = document.getElementById("dropzone");
    dom.fileInput = document.getElementById("fileInput");
    dom.brandSubtitle = document.getElementById("brandSubtitle");
    dom.needsSubtitle = document.getElementById("needsSubtitle");
    dom.summaryGrid = document.getElementById("summaryGrid");
    dom.needsSummaryGrid = document.getElementById("needsSummaryGrid");
    dom.needsDecisionGrid = document.getElementById("needsDecisionGrid");
    dom.tabButtons = Array.from(document.querySelectorAll("#tabButtons .tab"));
    dom.panels = Array.from(document.querySelectorAll(".tab-panel"));
    dom.searchInput = document.getElementById("searchInput");
    dom.manufacturerFilter = document.getElementById("manufacturerFilter");
    dom.productFilter = document.getElementById("productFilter");
    dom.statusFilter = document.getElementById("statusFilter");
    dom.sortSelect = document.getElementById("sortSelect");
    dom.fundInlineStats = document.getElementById("fundInlineStats");
    dom.fundsContainer = document.getElementById("fundsContainer");
    dom.insuranceSummaryGrid = document.getElementById("insuranceSummaryGrid");
    dom.insuranceTableHost = document.getElementById("insuranceTableHost");
    dom.fundModalBackdrop = document.getElementById("fundModalBackdrop");
    dom.fundDetails = document.getElementById("fundDetails");
    dom.fundActivityModal = document.getElementById("fundActivityModal");
    dom.openNeedsButton = document.getElementById("openNeedsButton");
    dom.openSettingsButton = document.getElementById("openSettingsButton");
    dom.closeSettingsButton = document.getElementById("closeSettingsButton");
    dom.settingsModal = document.getElementById("settingsModal");
    dom.settingsBackdrop = document.getElementById("settingsBackdrop");
    dom.settingsTemplatesHost = document.getElementById("settingsTemplatesHost");
    dom.reloadFileButton = document.getElementById("reloadFileButton");
    dom.addFilesButton = document.getElementById("addFilesButton");
    dom.backToWelcomeButton = document.getElementById("backToWelcomeButton");
    dom.backToWelcomeFromNeedsButton = document.getElementById("backToWelcomeFromNeedsButton");
    dom.addFilesFromNeedsButton = document.getElementById("addFilesFromNeedsButton");
    dom.continueToDashboardButton = document.getElementById("continueToDashboardButton");
    dom.manualCapitalInput = document.getElementById("manualCapitalInput");
    dom.fallbackFactorInput = document.getElementById("fallbackFactorInput");
    dom.mainTrackSelect = document.getElementById("mainTrackSelect");
    dom.spouseAgeInput = document.getElementById("spouseAgeInput");
    dom.trackCards = document.getElementById("trackCards");
    dom.mainResultGrid = document.getElementById("mainResultGrid");
    dom.pensionBreakdown = document.getElementById("pensionBreakdown");
    dom.infrastructureSummaryGrid = document.getElementById("infrastructureSummaryGrid");
    dom.infrastructurePillStrip = document.getElementById("infrastructurePillStrip");
    dom.infrastructureTableHost = document.getElementById("infrastructureTableHost");
    dom.infrastructureLegend = document.getElementById("infrastructureLegend");
    dom.simulationsRoot = document.getElementById("simulationsRoot");
    dom.meetingSummaryDateInput = document.getElementById("meetingSummaryDateInput");
    dom.meetingSummaryAdviceTypeInput = document.getElementById("meetingSummaryAdviceTypeInput");
    dom.meetingSummaryBrandInput = document.getElementById("meetingSummaryBrandInput");
    dom.meetingSummaryTitleInput = document.getElementById("meetingSummaryTitleInput");
    dom.meetingSummaryClientLineInput = document.getElementById("meetingSummaryClientLineInput");
    dom.meetingSummaryIntroInput = document.getElementById("meetingSummaryIntroInput");
    dom.meetingShowFundsSummaryToggle = document.getElementById("meetingShowFundsSummaryToggle");
    dom.meetingShowNeedsToggle = document.getElementById("meetingShowNeedsToggle");
    dom.meetingShowFactsToggle = document.getElementById("meetingShowFactsToggle");
    dom.meetingShowPensionSnapshotToggle = document.getElementById("meetingShowPensionSnapshotToggle");
    dom.meetingShowInfrastructureToggle = document.getElementById("meetingShowInfrastructureToggle");
    dom.meetingShowMigrationToggle = document.getElementById("meetingShowMigrationToggle");
    dom.addMeetingFactButton = document.getElementById("addMeetingFactButton");
    dom.addMeetingRecommendationButton = document.getElementById("addMeetingRecommendationButton");
    dom.addMeetingFollowUpButton = document.getElementById("addMeetingFollowUpButton");
    dom.addMeetingScreenshotButton = document.getElementById("addMeetingScreenshotButton");
    dom.refreshMeetingSummaryButton = document.getElementById("refreshMeetingSummaryButton");
    dom.toggleMeetingInfrastructureButton = document.getElementById("toggleMeetingInfrastructureButton");
    dom.printMeetingSummaryButton = document.getElementById("printMeetingSummaryButton");
    dom.sendMeetingSummaryButton = document.getElementById("sendMeetingSummaryButton");
    dom.meetingSummaryFacts = document.getElementById("meetingSummaryFacts");
    dom.meetingSummaryRecommendations = document.getElementById("meetingSummaryRecommendations");
    dom.meetingSummaryFollowUps = document.getElementById("meetingSummaryFollowUps");
    dom.meetingSummaryScreenshots = document.getElementById("meetingSummaryScreenshots");
    dom.meetingSummaryPreview = document.getElementById("meetingSummaryPreview");
    dom.meetingInlineAddFactButton = document.getElementById("meetingInlineAddFactButton");
    dom.meetingInlineAddRecommendationButton = document.getElementById("meetingInlineAddRecommendationButton");
    dom.meetingInlineAddFollowUpButton = document.getElementById("meetingInlineAddFollowUpButton");
    dom.meetingInlineAddScreenshotButton = document.getElementById("meetingInlineAddScreenshotButton");
    dom.toast = document.getElementById("toast");
    dom.loadingOverlay = document.getElementById("loadingOverlay");
    dom.loadingMessage = document.getElementById("loadingMessage");

    TRACK_PRESETS.forEach((track) => {
      dom.mainTrackSelect.insertAdjacentHTML("beforeend", `<option value="${track.id}">${track.label}</option>`);
    });

    dom.dropzone.addEventListener("click", () => dom.fileInput.click());
    dom.dropzone.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        dom.fileInput.click();
      }
    });
    ["dragenter", "dragover"].forEach((eventName) => {
      dom.dropzone.addEventListener(eventName, (event) => {
        event.preventDefault();
        dom.dropzone.classList.add("is-dragover");
      });
    });
    ["dragleave", "drop"].forEach((eventName) => {
      dom.dropzone.addEventListener(eventName, (event) => {
        event.preventDefault();
        dom.dropzone.classList.remove("is-dragover");
      });
    });
    dom.dropzone.addEventListener("drop", (event) => {
      if (!event.dataTransfer || !event.dataTransfer.files || !event.dataTransfer.files.length) return;
      handleFileSelect({ target: { files: event.dataTransfer.files, value: "" } });
    });
    ["dragover", "drop"].forEach((eventName) => {
      window.addEventListener(eventName, (event) => event.preventDefault());
    });
    dom.fileInput.addEventListener("change", handleFileSelect);

    dom.reloadFileButton.addEventListener("click", () => dom.fileInput.click());
    dom.addFilesButton.addEventListener("click", () => dom.fileInput.click());
    dom.addFilesFromNeedsButton.addEventListener("click", () => dom.fileInput.click());
    dom.openSettingsButton.addEventListener("click", openSettingsModal);
    dom.closeSettingsButton.addEventListener("click", closeSettingsModal);
    dom.settingsBackdrop.addEventListener("click", closeSettingsModal);
    dom.settingsTemplatesHost.addEventListener("input", handleSettingsTemplatesInput);
    dom.settingsTemplatesHost.addEventListener("click", handleSettingsTemplatesClick);
    dom.openNeedsButton.addEventListener("click", () => {
      showStage("needs");
      renderNeedsStage();
    });
    dom.backToWelcomeButton.addEventListener("click", () => {
      resetWorkspaceSession("המערכת נוקתה. אפשר לטעון לקוח חדש.");
    });
    dom.backToWelcomeFromNeedsButton.addEventListener("click", () => {
      resetWorkspaceSession("המערכת נוקתה. אפשר לטעון לקוח חדש.");
    });
    dom.continueToDashboardButton.addEventListener("click", () => {
      syncNeedsFromInputs();
      state.needs.completed = true;
      showStage("workspace");
      renderAll();
    });

    dom.tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        state.ui.activeTab = button.dataset.tab;
        renderTabs();
        if (state.ui.activeTab === "simulations") {
          renderSimulationsTab();
        }
      });
    });

    document.querySelectorAll("[data-sidebar-tab]").forEach((button) => {
      button.addEventListener("click", () => {
        state.ui.activeTab = button.dataset.sidebarTab;
        renderTabs();
        if (state.ui.activeTab === "simulations") {
          renderSimulationsTab();
        }
      });
    });

    if (dom.searchInput) {
      dom.searchInput.addEventListener("input", (event) => {
        state.filters.search = event.target.value;
        renderFundsTab();
      });
    }
    if (dom.manufacturerFilter) {
      dom.manufacturerFilter.addEventListener("change", (event) => {
        state.filters.manufacturer = event.target.value;
        renderFundsTab();
      });
    }
    if (dom.productFilter) {
      dom.productFilter.addEventListener("change", (event) => {
        state.filters.productType = event.target.value;
        renderFundsTab();
      });
    }
    if (dom.statusFilter) {
      dom.statusFilter.addEventListener("change", (event) => {
        state.filters.status = event.target.value;
        renderFundsTab();
      });
    }
    if (dom.sortSelect) {
      dom.sortSelect.addEventListener("change", (event) => {
        state.filters.sort = event.target.value;
        renderFundsTab();
      });
    }

    dom.fundsContainer.addEventListener("click", handleFundsClick);
    dom.fundsContainer.addEventListener("change", handleFundsChange);
    dom.fundsContainer.addEventListener("click", handleManagedTableClick);
    dom.fundsContainer.addEventListener("input", handleManagedTableInput);
    dom.fundsContainer.addEventListener("mousedown", startManagedTableResize);
    dom.fundDetails.addEventListener("input", handleFundDetailsInput);
    dom.fundDetails.addEventListener("change", handleFundsChange);
    dom.fundDetails.addEventListener("change", handleFundDetailsInput);
    dom.fundDetails.addEventListener("click", handleFundsClick);
    dom.fundActivityModal.addEventListener("click", handleFundsClick);
    dom.fundModalBackdrop.addEventListener("click", closeFundModal);
    dom.insuranceTableHost.addEventListener("change", handleInsuranceTableChange);
    dom.insuranceTableHost.addEventListener("click", handleManagedTableClick);
    dom.insuranceTableHost.addEventListener("input", handleManagedTableInput);
    dom.insuranceTableHost.addEventListener("mousedown", startManagedTableResize);
    dom.infrastructureTableHost.addEventListener("click", handleManagedTableClick);
    dom.infrastructureTableHost.addEventListener("input", handleManagedTableInput);
    dom.infrastructureTableHost.addEventListener("mousedown", startManagedTableResize);
    dom.simulationsRoot.addEventListener("click", handleSimulationsClick);
    dom.simulationsRoot.addEventListener("input", handleSimulationsInput);
    dom.simulationsRoot.addEventListener("change", handleSimulationsChange);
    document.addEventListener("mousemove", handleManagedTableResizeMove);
    document.addEventListener("mouseup", stopManagedTableResize);
    dom.trackCards.addEventListener("input", handleTrackFactorInput);
    dom.trackCards.addEventListener("click", handleTrackSelectClick);

    dom.manualCapitalInput.addEventListener("input", (event) => {
      state.calc.manualCapital = event.target.value;
      renderAll();
    });
    dom.fallbackFactorInput.addEventListener("input", (event) => {
      state.calc.fallbackFactor = toNumber(event.target.value) || 140;
      renderAll();
    });
    dom.mainTrackSelect.addEventListener("change", (event) => {
      state.calc.activeTrack = event.target.value;
      syncBeneficiaryTrackControls();
      renderAll();
    });
    dom.spouseAgeInput.addEventListener("input", (event) => {
      state.calc.spouseAge = event.target.value;
      renderAll();
    });

    dom.meetingSummaryDateInput.addEventListener("input", (event) => {
      state.meetingSummary.documentDate = event.target.value;
      renderMeetingSummaryPreviewOnly();
    });
    dom.meetingSummaryAdviceTypeInput.addEventListener("change", (event) => {
      const currentTitle = state.meetingSummary.documentTitle || "";
      const currentIntro = state.meetingSummary.introText || "";
      const defaultTitles = [
        "הנדון: תכנון פרישה - מסמך מרכז",
        "הנדון: תכנון פנסיוני - מסמך מרכז"
      ];
      const defaultIntros = [
        "מסמך זה מרכז את עיקרי הנתונים, הניתוח המקצועי והמלצות הפעולה כפי שסוכמו בפגישתנו, לטובת ניהול מיטבי של עתידך הפנסיוני.",
        "מסמך זה מרכז את עיקרי הנתונים, הניתוח המקצועי והמלצות הפעולה כפי שסוכמו בפגישתנו, לטובת קבלת החלטות מושכלת וניהול מיטבי של החיסכון הפנסיוני."
      ];
      state.meetingSummary.adviceType = event.target.value;
      if (!currentTitle || defaultTitles.includes(currentTitle)) {
        state.meetingSummary.documentTitle = getMeetingSummaryDefaultTitle();
      }
      if (!currentIntro || defaultIntros.includes(currentIntro)) {
        state.meetingSummary.introText = getMeetingSummaryDefaultIntro();
      }
      renderMeetingSummaryTab();
      renderMeetingSummaryPreviewOnly();
    });
    dom.meetingSummaryBrandInput.addEventListener("input", (event) => {
      state.meetingSummary.brandName = event.target.value;
      renderMeetingSummaryPreviewOnly();
    });
    dom.meetingSummaryTitleInput.addEventListener("input", (event) => {
      state.meetingSummary.documentTitle = event.target.value;
      renderMeetingSummaryPreviewOnly();
    });
    dom.meetingSummaryClientLineInput.addEventListener("input", (event) => {
      state.meetingSummary.clientLine = event.target.value;
      renderMeetingSummaryPreviewOnly();
    });
    dom.meetingSummaryIntroInput.addEventListener("input", (event) => {
      state.meetingSummary.introText = event.target.value;
      renderMeetingSummaryPreviewOnly();
    });
    dom.meetingShowFundsSummaryToggle.addEventListener("change", (event) => {
      state.meetingSummary.showFundsSummaryTable = event.target.checked;
      renderMeetingSummaryPreviewOnly();
    });
    dom.meetingShowNeedsToggle.addEventListener("change", (event) => {
      state.meetingSummary.showNeedsSection = event.target.checked;
      renderMeetingSummaryPreviewOnly();
    });
    dom.meetingShowFactsToggle.addEventListener("change", (event) => {
      state.meetingSummary.showFactsTable = event.target.checked;
      renderMeetingSummaryPreviewOnly();
    });
    dom.meetingShowPensionSnapshotToggle.addEventListener("change", (event) => {
      state.meetingSummary.showPensionSnapshotTable = event.target.checked;
      renderMeetingSummaryPreviewOnly();
    });
    dom.meetingShowInfrastructureToggle.addEventListener("change", (event) => {
      state.meetingSummary.showInfrastructureTable = event.target.checked;
      renderMeetingSummaryPreviewOnly();
      updateMeetingInfrastructureButton();
    });
    dom.meetingShowMigrationToggle.addEventListener("change", (event) => {
      state.meetingSummary.showMigrationTable = event.target.checked;
      renderMeetingSummaryPreviewOnly();
      saveWorkspaceSnapshot();
    });
    dom.meetingSummaryPreview.addEventListener("input", handleMeetingSummaryPreviewInput);
    dom.meetingSummaryPreview.addEventListener("change", handleMeetingSummaryPreviewChange);
    dom.meetingSummaryPreview.addEventListener("click", handleMeetingSummaryPreviewClick);
    dom.meetingSummaryPreview.addEventListener("paste", handleMeetingSummaryPreviewPaste);
    if (dom.meetingInlineAddFactButton) dom.meetingInlineAddFactButton.addEventListener("click", addMeetingSummaryFact);
    if (dom.meetingInlineAddRecommendationButton) dom.meetingInlineAddRecommendationButton.addEventListener("click", addMeetingSummaryRecommendation);
    if (dom.meetingInlineAddFollowUpButton) dom.meetingInlineAddFollowUpButton.addEventListener("click", addMeetingSummaryFollowUp);
    if (dom.meetingInlineAddScreenshotButton) dom.meetingInlineAddScreenshotButton.addEventListener("click", addMeetingSummaryScreenshot);
    if (dom.addMeetingFactButton) dom.addMeetingFactButton.addEventListener("click", addMeetingSummaryFact);
    if (dom.addMeetingRecommendationButton) dom.addMeetingRecommendationButton.addEventListener("click", addMeetingSummaryRecommendation);
    if (dom.addMeetingFollowUpButton) dom.addMeetingFollowUpButton.addEventListener("click", addMeetingSummaryFollowUp);
    if (dom.addMeetingScreenshotButton) dom.addMeetingScreenshotButton.addEventListener("click", addMeetingSummaryScreenshot);
    if (dom.refreshMeetingSummaryButton) dom.refreshMeetingSummaryButton.addEventListener("click", refreshMeetingSummaryFromCurrentData);
    if (dom.toggleMeetingInfrastructureButton) dom.toggleMeetingInfrastructureButton.addEventListener("click", toggleMeetingInfrastructureSection);
    dom.printMeetingSummaryButton.addEventListener("click", printMeetingSummary);
    dom.sendMeetingSummaryButton.addEventListener("click", sendMeetingSummaryToClient);
    dom.meetingSummaryFacts.addEventListener("input", handleMeetingSummaryFactsInput);
    dom.meetingSummaryFacts.addEventListener("click", handleMeetingSummaryFactsClick);
    dom.meetingSummaryRecommendations.addEventListener("input", handleMeetingSummaryRecommendationsInput);
    dom.meetingSummaryRecommendations.addEventListener("click", handleMeetingSummaryRecommendationsClick);
    dom.meetingSummaryRecommendations.addEventListener("change", handleMeetingSummaryRecommendationsChange);
    dom.meetingSummaryRecommendations.addEventListener("paste", handleMeetingSummaryRecommendationsPaste);
    dom.meetingSummaryFollowUps.addEventListener("input", handleMeetingSummaryFollowUpsInput);
    dom.meetingSummaryFollowUps.addEventListener("click", handleMeetingSummaryFollowUpsClick);
    dom.meetingSummaryScreenshots.addEventListener("input", handleMeetingSummaryScreenshotsInput);
    dom.meetingSummaryScreenshots.addEventListener("change", handleMeetingSummaryScreenshotsChange);
    dom.meetingSummaryScreenshots.addEventListener("click", handleMeetingSummaryScreenshotsClick);
    dom.meetingSummaryScreenshots.addEventListener("paste", handleMeetingSummaryScreenshotsPaste);

    document.querySelectorAll("[data-needs-number]").forEach((input) => {
      input.addEventListener("input", (event) => {
        state.needs[event.target.dataset.needsNumber] = toNumber(event.target.value) || 0;
        renderNeedsStage();
        renderMeetingSummaryPreviewOnly();
      });
    });

    document.querySelectorAll("[data-needs-text]").forEach((input) => {
      input.addEventListener("input", (event) => {
        state.needs[event.target.dataset.needsText] = event.target.value;
        renderNeedsStage();
        renderMeetingSummaryPreviewOnly();
      });
    });

    loadSettingsState();
    renderSettingsModal();
    window.addEventListener("beforeunload", saveWorkspaceSnapshot);
    if (!restoreWorkspaceSnapshot()) {
      renderEmptyState();
    }
  }

  function serializeWorkspaceState() {
    return {
      version: 1,
      savedAt: Date.now(),
      workbookName: state.workbookName || "",
      client: state.client,
      funds: state.funds || [],
      insurancePolicies: state.insurancePolicies || [],
      selectedIds: Array.from(state.selectedIds || []),
      infrastructureSelectedIds: Array.from(state.infrastructureSelectedIds || []),
      selectedInsurancePolicyIds: Array.from(state.selectedInsurancePolicyIds || []),
      needs: state.needs,
      needsBaseline: state.needsBaseline,
      meetingSummary: state.meetingSummary,
      filters: state.filters,
      insuranceFilters: state.insuranceFilters,
      calc: {
        ...state.calc,
        factorSelectedIds: Array.from(state.calc.factorSelectedIds || [])
      },
      smartAnalysis: {
        ...state.smartAnalysis,
        status: state.smartAnalysis.status === "ready" ? "ready" : "idle",
        returnsSourceStatus: state.smartAnalysis.returnsSourceStatus === "ready" ? "ready" : "idle"
      },
      simulations: state.simulations,
      ui: {
        ...state.ui,
        fundModalOpen: false,
        fundActivityModalOpen: false,
        tableResize: null
      }
    };
  }

  function saveWorkspaceSnapshot() {
    if (!state.client && !state.funds.length && !state.insurancePolicies.length) {
      return;
    }
    try {
      localStorage.setItem(WORKSPACE_STATE_KEY, JSON.stringify(serializeWorkspaceState()));
    } catch (error) {
      console.warn("[ABD-finance][saveWorkspaceSnapshot]", error);
    }
  }

  function restoreWorkspaceSnapshot() {
    try {
      const raw = localStorage.getItem(WORKSPACE_STATE_KEY);
      if (!raw) return false;
      const snapshot = JSON.parse(raw);
      if (!snapshot || snapshot.version !== 1) return false;
      const funds = Array.isArray(snapshot.funds) ? snapshot.funds : [];
      const policies = (Array.isArray(snapshot.insurancePolicies) ? snapshot.insurancePolicies : []).filter(isHarHabituachPolicy);
      if (!snapshot.client && !funds.length && !policies.length) return false;

      state.workbookName = snapshot.workbookName || "";
      state.client = snapshot.client || null;
      state.funds = normalizeFundManufacturers(funds);
      state.insurancePolicies = policies;
      state.selectedIds = new Set(Array.isArray(snapshot.selectedIds) ? snapshot.selectedIds : []);
      state.infrastructureSelectedIds = new Set(Array.isArray(snapshot.infrastructureSelectedIds) ? snapshot.infrastructureSelectedIds : []);
      state.selectedInsurancePolicyIds = new Set(Array.isArray(snapshot.selectedInsurancePolicyIds) ? snapshot.selectedInsurancePolicyIds : []);
      state.needs = { ...state.needs, ...(snapshot.needs || {}) };
      state.needsBaseline = snapshot.needsBaseline || null;
      state.meetingSummary = { ...state.meetingSummary, ...(snapshot.meetingSummary || {}) };
      state.filters = { ...state.filters, ...(snapshot.filters || {}) };
      state.insuranceFilters = { ...state.insuranceFilters, ...(snapshot.insuranceFilters || {}) };
      state.calc = {
        ...state.calc,
        ...(snapshot.calc || {}),
        factorSelectedIds: new Set(Array.isArray(snapshot.calc && snapshot.calc.factorSelectedIds) ? snapshot.calc.factorSelectedIds : [])
      };
      state.smartAnalysis = {
        ...state.smartAnalysis,
        ...(snapshot.smartAnalysis || {}),
        status: snapshot.smartAnalysis && snapshot.smartAnalysis.status === "ready" ? "ready" : "idle",
        returnsSourceStatus: snapshot.smartAnalysis && snapshot.smartAnalysis.returnsSourceStatus === "ready" ? "ready" : "idle"
      };
      state.simulations = { ...state.simulations, ...(snapshot.simulations || {}) };
      state.ui = {
        ...state.ui,
        ...(snapshot.ui || {}),
        stage: ["needs", "workspace"].includes(snapshot.ui && snapshot.ui.stage) ? snapshot.ui.stage : "workspace",
        fundModalOpen: false,
        fundActivityModalOpen: false,
        tableResize: null
      };

      syncRestoredControls();
      showStage(state.ui.stage);
      if (state.ui.stage === "needs") {
        renderNeedsStage();
      }
      renderAll();
      return true;
    } catch (error) {
      console.warn("[ABD-finance][restoreWorkspaceSnapshot]", error);
      return false;
    }
  }

  function syncRestoredControls() {
    if (dom.searchInput) dom.searchInput.value = state.filters.search || "";
    if (dom.manufacturerFilter) dom.manufacturerFilter.value = state.filters.manufacturer || "all";
    if (dom.productFilter) dom.productFilter.value = state.filters.productType || "all";
    if (dom.statusFilter) dom.statusFilter.value = state.filters.status || "all";
    if (dom.sortSelect) dom.sortSelect.value = state.filters.sort || "manufacturer-asc";
    if (dom.manualCapitalInput) dom.manualCapitalInput.value = state.calc.manualCapital || "";
    if (dom.fallbackFactorInput) dom.fallbackFactorInput.value = String(roundNumber(state.calc.fallbackFactor || 140, 2));
    if (dom.mainTrackSelect) dom.mainTrackSelect.value = state.calc.activeTrack || "none";
    if (dom.spouseAgeInput) dom.spouseAgeInput.value = state.calc.spouseAge || "";
  }

  function resetWorkspaceSession(message) {
    const settings = state.settings;
    state.workbookName = "";
    state.client = null;
    state.funds = [];
    state.insurancePolicies = [];
    state.selectedIds = new Set();
    state.infrastructureSelectedIds = new Set();
    state.selectedInsurancePolicyIds = new Set();
    state.needs = {
      incomeWorkPrimary: 0,
      incomeBituachPrimary: 0,
      incomePensionPrimary: 0,
      incomeRentPrimary: 0,
      incomeOtherPrimary: 0,
      incomeWorkSpouse: 0,
      incomeBituachSpouse: 0,
      incomePensionSpouse: 0,
      incomeRentSpouse: 0,
      incomeOtherSpouse: 0,
      fixedExpenses: 0,
      variableExpenses: 0,
      fixedNotes: "",
      variableNotes: "",
      assetBank: 0,
      assetPortfolio: 0,
      assetPolicies: 0,
      assetProvident: 0,
      assetStudyFunds: 0,
      assetInheritance: 0,
      assetRealEstate: 0,
      assetOther: 0,
      completed: false
    };
    state.needsBaseline = null;
    state.meetingSummary = buildMeetingSummaryDefaults();
    state.settings = settings;
    state.filters = { search: "", manufacturer: "all", productType: "all", status: "all", sort: "manufacturer-asc" };
    state.insuranceFilters = { search: "", category: "all", status: "all", sort: "category-asc" };
    state.calc = {
      manualCapital: "",
      fallbackFactor: 140,
      spouseAge: "",
      activeTrack: "none",
      customTrackFactors: {},
      factorCapital: "",
      factorValue: 140,
      factorAssignments: {},
      factorSelectedIds: new Set(),
      guaranteeMonths: 120,
      spouseShare: 0,
      planningYears: 20,
      beneficiaryBasePension: ""
    };
    state.smartAnalysis = {
      status: "idle",
      statusNote: "",
      lastAnalyzedAt: "",
      returnsSourceStatus: "idle",
      returnsByFundId: {},
      trackMatchCache: {},
      lastSnapshotKey: "",
      matchWarnings: [],
      manualOverrides: {},
      mygemelProductType: "",
      mygemelGroups: [],
      mygemelPeriods: MY_GEMEL_NET_CONFIG.defaultPeriods.slice()
    };
    state.simulations = {
      activeView: "compound",
      compound: {
        initialAmount: 250000,
        monthlyDeposit: 2500,
        annualReturn: 6,
        years: 20,
        annualFee: 0.7,
        depositFee: 0,
        inflation: 2,
        taxType: "real",
        linked: false,
        scenario: "base",
        advOpen: false
      },
      returns: {
        search: "",
        manufacturer: "all",
        productType: "all",
        period: "trailing12m",
        favorites: {}
      },
      mygemel: {
        groups: [],
        periods: MY_GEMEL_NET_CONFIG.defaultPeriods.slice(),
        productType: "",
        status: "idle",
        note: "",
        loadedAt: ""
      }
    };
    state.ui = {
      stage: "welcome",
      activeTab: "funds",
      activeFundId: null,
      fundModalOpen: false,
      fundActivityModalOpen: false,
      fundActivityView: "deposits",
      tableLayouts: {},
      tableResize: null
    };
    try {
      localStorage.removeItem(WORKSPACE_STATE_KEY);
    } catch (error) {
      console.warn("[ABD-finance][resetWorkspaceSession]", error);
    }
    if (dom.fileInput) {
      dom.fileInput.value = "";
    }
    syncRestoredControls();
    renderSettingsModal();
    renderEmptyState();
    if (message) {
      showToast(message);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleFileSelect(event) {
    const files = Array.from((event.target.files && event.target.files.length ? event.target.files : []));
    if (!files.length) {
      return;
    }

    try {
      const previousStage = state.ui.stage;
      let importedRetirementData = false;
      let importedInsuranceData = false;
      let importedCount = 0;
      const pendingImports = [];
      let comparisonClient = state.client ? { ...state.client } : null;

      for (const file of files) {
        setLoading(true, `מנתח את ${file.name}...`);
        const imported = await importUploadedFile(file);
        if (comparisonClient && imported.client) {
          const currentId = normalizeDigits(comparisonClient.idNumber);
          const nextId = normalizeDigits(imported.client.idNumber);
          if ((currentId && nextId && currentId !== nextId) || !shouldMergeClientAgainstBase(comparisonClient, imported.client)) {
            throw new Error("לא ניתן להעלות קבצים של לקוחות שונים");
          }
        }
        comparisonClient = mergeClientRecords(comparisonClient, imported.client);
        pendingImports.push({ file, imported });
      }

      for (const { file, imported } of pendingImports) {
        const outcome = applyImportedDataset(imported, file.name);
        importedRetirementData = importedRetirementData || Boolean(outcome && outcome.hasFunds);
        importedInsuranceData = importedInsuranceData || Boolean(outcome && outcome.hasInsurance);
        importedCount += 1;
      }
      state.ui.activeTab = "funds";
      if (state.funds.length) {
        if (previousStage === "welcome") {
          const needsDefaults = buildNeedsDefaults(state.funds);
          state.needs = needsDefaults;
          state.needsBaseline = { ...needsDefaults };
          state.needs.completed = false;
          state.calc.fallbackFactor = getWeightedBaseFactor(state.funds, state.calc.fallbackFactor || 140);
          state.calc.factorValue = state.calc.fallbackFactor;
          dom.fallbackFactorInput.value = String(roundNumber(state.calc.fallbackFactor, 2));
          showStage("needs");
          renderNeedsStage();
        } else if (previousStage === "needs" || importedRetirementData && previousStage !== "workspace") {
          showStage("needs");
          renderNeedsStage();
        } else {
          showStage("workspace");
        }
        renderAll();
      } else if (state.insurancePolicies.length || importedInsuranceData) {
        showStage(previousStage === "welcome" ? "workspace" : previousStage);
        renderAll();
      }
      showToast(importedCount === 1 ? `הקובץ ${files[0].name} נטען בהצלחה` : `נטענו ${importedCount} קבצים בהצלחה`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error(error);
      showToast(error.message || "טעינת הקובץ נכשלה", true);
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  }

  function renderEmptyState() {
    state.ui.fundModalOpen = false;
    state.selectedInsurancePolicyIds = new Set();
    showStage("welcome");
    renderTabs();
    dom.summaryGrid.innerHTML = [
      createSummaryCard("לקוח", "—", "עדיין לא נטען דוח"),
      createSummaryCard("קופות", "0", "ממתין לייבוא"),
      createSummaryCard("פוליסות ביטוח", "0", "ממתין לייבוא"),
      createSummaryCard("הון לקצבה", fmtCurrency(0), "ממתין לייבוא"),
      createSummaryCard("קצבה משוערת", fmtCurrency(0), "ממתין לייבוא")
    ].join("");
    dom.brandSubtitle.textContent = "לא נטען עדיין דוח. טען קובץ כדי לפתוח את סביבת העבודה.";
    dom.fundInlineStats.innerHTML = "";
    dom.fundsContainer.innerHTML = `<div class="empty-state">טען דוח לקוח כדי לפתוח את טבלת הקופות.</div>`;
    if (dom.insuranceSummaryGrid) {
      dom.insuranceSummaryGrid.innerHTML = "";
    }
    if (dom.insuranceTableHost) {
      dom.insuranceTableHost.innerHTML = `<div class="empty-state">טען קובץ הר הביטוח או מסלקה כדי לראות פוליסות וכיסויי ביטוח.</div>`;
    }
    dom.fundDetails.innerHTML = "";
    dom.fundDetails.hidden = true;
    dom.fundDetails.classList.remove("is-open");
    if (dom.fundModalBackdrop) {
      dom.fundModalBackdrop.hidden = true;
    }
    dom.trackCards.innerHTML = `<div class="empty-state">אין נתונים לחישוב.</div>`;
    dom.mainResultGrid.innerHTML = "";
    dom.pensionBreakdown.innerHTML = `<div class="empty-state">אין קופות שנבחרו.</div>`;
    dom.infrastructureSummaryGrid.innerHTML = "";
    dom.infrastructureTableHost.innerHTML = `<div class="empty-state">טען דוח לקוח כדי לראות תשתיות לקצבה.</div>`;
    dom.infrastructureLegend.innerHTML = "";
    dom.simulationsRoot.innerHTML = `<div class="panel"><div class="empty-state">טען דוח לקוח כדי לפתוח סימולציות.</div></div>`;
    dom.meetingSummaryFacts.innerHTML = "";
    dom.meetingSummaryRecommendations.innerHTML = "";
    dom.meetingSummaryFollowUps.innerHTML = "";
    dom.meetingSummaryScreenshots.innerHTML = "";
    dom.meetingSummaryPreview.innerHTML = `<div class="summary-empty-preview">טען דוח לקוח כדי להתחיל לבנות סיכום פגישה.</div>`;
  }

  function renderAll() {
    if (!state.funds.length && !state.insurancePolicies.length) {
      renderEmptyState();
      return;
    }
    if (state.meetingSummary && state.meetingSummary.recommendationsAuto) {
      state.meetingSummary.recommendations = buildMeetingSummaryRecommendations();
    }
    syncMeetingSummaryLiveData();
    renderSettingsModal();
    renderHeader();
    renderTabs();
    renderSummary();
    renderFundsTab();
    renderInsuranceTab();
    renderPensionTab();
    renderInfrastructureTab();
    renderSimulationsTab();
    renderMeetingSummaryTab();
    saveWorkspaceSnapshot();
  }

  function renderHeader() {
    const clientName = state.client && state.client.fullName ? state.client.fullName : "לקוח";
    const ageLabel = state.client && state.client.age ? `, גיל ${state.client.age}` : "";
    dom.brandSubtitle.textContent = `דוח פעיל: ${state.workbookName} | לקוח: ${clientName}${ageLabel}`;
  }

  function renderTabs() {
    const availableTabs = new Set(dom.tabButtons.map((button) => button.dataset.tab));
    if (state.ui.activeTab === "pension") {
      state.ui.activeTab = "simulations";
      state.simulations.activeView = "phoenix";
    }
    if (!availableTabs.has(state.ui.activeTab)) {
      state.ui.activeTab = "funds";
    }
    dom.tabButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.tab === state.ui.activeTab);
    });
    document.querySelectorAll("[data-sidebar-tab]").forEach((button) => {
      button.classList.toggle("active", button.dataset.sidebarTab === state.ui.activeTab);
    });
    dom.panels.forEach((panel) => {
      panel.hidden = panel.dataset.panel !== state.ui.activeTab;
    });
  }

  function renderSummary() {
    const selectedFunds = getSelectedFunds();
    const totalCapital = sumBy(selectedFunds, (fund) => getFundCapital(fund));
    const importedPension = sumBy(selectedFunds, (fund) => fund.importedPension);
    const calculated = buildTrackResult(state.calc.activeTrack);
    dom.summaryGrid.innerHTML = [
      createSummaryCard("לקוח", state.client && state.client.fullName ? state.client.fullName : "ללא שם", state.client && state.client.idNumber ? `ת.ז ${state.client.idNumber}` : "פרטי לקוח מהדוח"),
      createSummaryCard("קופות", String(state.funds.length), "קופות בסביבת העבודה"),
      createSummaryCard("פוליסות ביטוח", String(state.insurancePolicies.length), "פריטים שנטענו מהר הביטוח"),
      createSummaryCard("הון לקצבה", fmtCurrency(totalCapital), `${selectedFunds.length} קופות שסומנו לחישוב`),
      createSummaryCard("קצבה משוערת", fmtCurrency(calculated.monthlyPension), importedPension > 0 ? `קצבה מיובאת: ${fmtCurrency(importedPension)}` : "ללא קצבה מיובאת")
    ].join("");
  }

  function renderFundInlineStats() {
    const dashboardFunds = getDashboardSelectedFunds();
    if (!dashboardFunds.length) {
      dom.fundInlineStats.innerHTML = "";
      return;
    }
    dom.fundInlineStats.innerHTML = renderInfrastructurePillStrip(buildInfrastructureRows(dashboardFunds));
  }

  function showStage(stage) {
    state.ui.stage = stage;
    if (stage !== "workspace") {
      closeFundModal();
    }
    dom.welcomeScreen.hidden = stage !== "welcome";
    dom.needsStage.hidden = stage !== "needs";
    dom.appShell.hidden = stage !== "workspace";
  }

  function renderNeedsStage() {
    if (!state.funds.length) {
      return;
    }

    const clientName = state.client && state.client.fullName ? state.client.fullName : "לקוח";
    dom.needsSubtitle.textContent = `שלב ביניים אחרי טעינת ${state.workbookName} עבור ${clientName}, לפני הכניסה לדשבורד הראשי.`;

    document.querySelectorAll("[data-needs-number]").forEach((input) => {
      const key = input.dataset.needsNumber;
      input.value = numberInputValue(state.needs[key]);
    });

    document.querySelectorAll("[data-needs-text]").forEach((input) => {
      const key = input.dataset.needsText;
      input.value = state.needs[key] || "";
    });

    const totals = getNeedsTotals();
    dom.needsSummaryGrid.innerHTML = [
      createSummaryCard("מבוטח/ת", clientName, state.client && state.client.idNumber ? `ת.ז ${state.client.idNumber}` : "פרטי לקוח מהדוח"),
      createSummaryCard("הכנסות נטו", fmtCurrency(totals.totalIncome), "סה\"כ מבוטח/ת + בן/בת זוג"),
      createSummaryCard("הוצאות", fmtCurrency(totals.totalExpenses), "קבועות + משתנות"),
      createSummaryCard("פער חודשי", fmtCurrency(totals.balance), totals.balance >= 0 ? "עודף חודשי" : "גרעון חודשי"),
      createSummaryCard("נכסים", fmtCurrency(totals.totalAssets), "נכסים קיימים משוערים")
    ].join("");

    dom.needsDecisionGrid.innerHTML = [
      createSummaryCard("סה\"כ הכנסות", fmtCurrency(totals.totalIncome), "לפי טופס בירור צרכים"),
      createSummaryCard("סה\"כ הוצאות", fmtCurrency(totals.totalExpenses), "לפי טופס בירור צרכים"),
      createSummaryCard("עודף / גרעון", fmtCurrency(totals.balance), totals.balance >= 0 ? "נשאר חודשי" : "חסר חודשי"),
      createSummaryCard("נכסים זמינים", fmtCurrency(totals.totalAssets), "לצורך תכנון כולל"),
      createSummaryCard("פנסיה עתידית", fmtCurrency((state.needs.incomePensionPrimary || 0) + (state.needs.incomePensionSpouse || 0)), "הוזנה או הוצעה מהדוח")
    ].join("");

    document.getElementById("needsIncomePrimaryTotal").textContent = fmtCurrency(totals.primaryIncome);
    document.getElementById("needsIncomeSpouseTotal").textContent = fmtCurrency(totals.spouseIncome);
    document.getElementById("needsExpensesTotal").textContent = fmtCurrency(totals.totalExpenses);
    document.getElementById("needsAssetsTotal").textContent = fmtCurrency(totals.totalAssets);
  }

  function syncNeedsFromInputs() {
    document.querySelectorAll("[data-needs-number]").forEach((input) => {
      const key = input.dataset.needsNumber;
      state.needs[key] = toNumber(input.value) || 0;
    });
    document.querySelectorAll("[data-needs-text]").forEach((input) => {
      const key = input.dataset.needsText;
      state.needs[key] = String(input.value || "").trim();
    });
  }

  function renderFilters() {
    if (!dom.manufacturerFilter || !dom.productFilter || !dom.statusFilter || !dom.sortSelect) {
      return;
    }
    const manufacturers = uniqueValues(state.funds.map((fund) => fund.manufacturer).filter(Boolean));
    const productTypes = uniqueValues(state.funds.map((fund) => fund.productType).filter(Boolean));
    const statuses = uniqueValues(state.funds.map((fund) => fund.status).filter(Boolean));
    renderSelectOptions(dom.manufacturerFilter, manufacturers, "כל היצרנים", state.filters.manufacturer);
    renderSelectOptions(dom.productFilter, productTypes, "כל סוגי המוצרים", state.filters.productType);
    renderSelectOptions(dom.statusFilter, statuses, "כל הסטטוסים", state.filters.status);
    dom.sortSelect.value = state.filters.sort;
  }

  function renderFundsTab() {
    renderFilters();
    renderFundInlineStats();
    const funds = getFilteredFunds();
    if (!funds.length) {
      dom.fundsContainer.innerHTML = `<div class="empty-state">לא נמצאו קופות לפי הסינון הנוכחי.</div>`;
      dom.fundDetails.innerHTML = `<div class="empty-state">לא נבחרה קופה להצגה.</div>`;
      return;
    }

    dom.fundsContainer.innerHTML = renderFundsTable(funds);
    renderFundDetails();
  }

  function renderInsuranceTab() {
    if (!dom.insuranceSummaryGrid || !dom.insuranceTableHost) {
      return;
    }
    if (!state.insurancePolicies.length) {
      dom.insuranceSummaryGrid.innerHTML = "";
      dom.insuranceTableHost.innerHTML = `<div class="empty-state">טען קובץ הר הביטוח או מסלקה כדי לראות פוליסות ביטוח של הלקוח.</div>`;
      return;
    }

    const totalPremium = sumBy(state.insurancePolicies, (policy) => policy.premium || 0);
    const totalCoverage = sumBy(state.insurancePolicies, (policy) => policy.coverageAmount || 0);
    const selectedForSummary = state.insurancePolicies.filter((policy) => state.selectedInsurancePolicyIds.has(policy.id)).length;
    dom.insuranceSummaryGrid.innerHTML = [
      createSummaryCard("פוליסות", String(state.insurancePolicies.length), "רשומות ביטוח שנטענו"),
      createSummaryCard("נבחרו לסיכום", String(selectedForSummary), "פוליסות שיופיעו בסיכום הפגישה"),
      createSummaryCard("פרמיה", fmtCurrency(totalPremium), "סה\"כ פרמיה מזוהה"),
      createSummaryCard("סכומי ביטוח", fmtCurrency(totalCoverage), "סה\"כ סכומי כיסוי מזוהים")
    ].join("");

    const columns = [
      { id: "includeInMeeting", label: "", width: 78 },
      { id: "itemClass", label: "סיווג", width: 150 },
      { id: "manufacturer", label: "חברה" },
      { id: "mainBranch", label: "ענף ראשי" },
      { id: "secondaryBranch", label: "ענף משני / כיסוי" },
      { id: "productType", label: "סוג מוצר" },
      { id: "planName", label: "תוכנית / כיסוי" },
      { id: "policyNumber", label: "מס' פוליסה" },
      { id: "periodText", label: "תקופת ביטוח" },
      { id: "premiumType", label: "סוג פרמיה" },
      { id: "premiumText", label: "פרמיה" },
      { id: "coverageAmountText", label: "סכום ביטוח" },
      { id: "moreDetails", label: "פרטים נוספים" }
    ];

    const insuranceLayout = state.ui.tableLayouts && state.ui.tableLayouts.insurance;
    if (insuranceLayout) {
      const hiddenColumns = new Set(insuranceLayout.hidden || []);
      const visibleColumnsCount = columns.filter((column) => !hiddenColumns.has(column.id)).length;
      if (visibleColumnsCount < Math.min(4, columns.length)) {
        delete state.ui.tableLayouts.insurance;
      }
    }

    const rows = state.insurancePolicies.map((policy, index) => ({
      cells: {
        includeInMeeting: `<label class="table-check" style="justify-content:center;"><input class="checkbox" type="checkbox" data-insurance-summary-check="${escapeAttribute(policy.id)}" ${state.selectedInsurancePolicyIds.has(policy.id) ? "checked" : ""}><span style="font-size:11px;">לסיכום</span></label>`,
        itemClass: escapeHtml(policy.itemClass || "פוליסת ביטוח"),
        manufacturer: escapeHtml(policy.manufacturer || "—"),
        mainBranch: escapeHtml(policy.mainBranch || "—"),
        secondaryBranch: escapeHtml(policy.secondaryBranch || "—"),
        productType: escapeHtml(policy.productType || "—"),
        planName: escapeHtml(policy.planName || "—"),
        policyNumber: escapeHtml(policy.policyNumber || "—"),
        periodText: escapeHtml(policy.periodText || "—"),
        premiumType: escapeHtml(policy.premiumType || "—"),
        premiumText: policy.premium ? fmtCurrency(policy.premium) : "—",
        coverageAmountText: policy.coverageAmount ? fmtCurrency(policy.coverageAmount) : "—",
        moreDetails: escapeHtml(policy.moreDetails || "—")
      },
      className: index % 2 ? "is-alt-row" : ""
    }));

    dom.insuranceTableHost.innerHTML = renderManagedTable("insurance", columns, rows, {
      tableClass: "funds-table",
      emptyMessage: "אין פוליסות ביטוח להצגה."
    });
  }

  function renderFundBeneficiariesTable(beneficiaries) {
    if (!beneficiaries.length) {
      return `<div class="empty-state">לא זוהו מוטבים בקופה זו.</div>`;
    }

    return `
      <div class="table-wrap">
        <table class="compact-table">
          <thead>
            <tr>
              <th>מוטב</th>
              <th>זיקה</th>
              <th>חלק יחסי</th>
            </tr>
          </thead>
          <tbody>
            ${beneficiaries.map((beneficiary) => `
              <tr>
                <td>${escapeHtml(beneficiary.name || "מוטב")}</td>
                <td>${escapeHtml(beneficiary.relationship || "ללא זיקה")}</td>
                <td>${fmtPercent((beneficiary.share || 0) / 100)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderSelectedBeneficiariesTable(beneficiaries, monthlyPension, spouseMonthly, schedule) {
    if (!beneficiaries.length) {
      return `<div class="empty-state">לא זוהו מוטבים בקופות המסומנות. אפשר עדיין להשתמש בסימולטור עם אחוז שאירים וחודשי הבטחה.</div>`;
    }

    return `
      <p class="compact-beneficiary-note">רשימת המוטבים מוצגת כעת בשורות קומפקטיות כדי להקל על קריאה והשוואה מול הלקוח.</p>
      <div class="table-wrap">
        <table class="compact-table">
          <thead>
            <tr>
              <th>מוטב</th>
              <th>זיקה</th>
              <th>חלק יחסי</th>
              <th>אומדן חודשי</th>
              <th>חשיפה בשנה 1</th>
              <th>קופות קשורות</th>
            </tr>
          </thead>
          <tbody>
            ${beneficiaries.map((beneficiary) => {
              const ratio = (beneficiary.share || 0) / 100;
              const monthlyEstimate = state.calc.spouseShare > 0 ? spouseMonthly * ratio : monthlyPension * ratio;
              const yearOneExposure = schedule.length ? schedule[0].exposure * ratio : 0;
              return `
                <tr>
                  <td>${escapeHtml(beneficiary.name || "מוטב")}</td>
                  <td>${escapeHtml(beneficiary.relationship || "ללא זיקה")}</td>
                  <td>${fmtPercent(ratio)}</td>
                  <td>${fmtCurrency(monthlyEstimate)}</td>
                  <td>${fmtCurrency(yearOneExposure)}</td>
                  <td>${beneficiary.accounts.length}</td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderFundActivityButtons(fund) {
    const depositCount = Array.isArray(fund.depositRows) ? fund.depositRows.length : 0;
    const employerCount = Array.isArray(fund.employers) ? fund.employers.length : 0;
    if (!depositCount && !employerCount) {
      return "";
    }
    return `
      <div class="fund-action-board" aria-label="פעולות נוספות לקופה">
        ${depositCount ? `<button class="fund-action-tile" type="button" data-open-fund-activity="deposits">הפקדות<span>${depositCount} שורות מהדוח</span></button>` : ""}
        ${employerCount ? `<button class="fund-action-tile" type="button" data-open-fund-activity="employers">מעסיקים<span>${employerCount} מעסיקים</span></button>` : ""}
      </div>
    `;
  }

  function renderFundActivityModal() {
    const fund = state.funds.find((item) => item.id === state.ui.activeFundId);
    if (!dom.fundActivityModal) return;
    if (!fund || !state.ui.fundActivityModalOpen) {
      dom.fundActivityModal.hidden = true;
      dom.fundActivityModal.innerHTML = "";
      document.body.classList.remove("is-fund-activity-open");
      return;
    }
    const view = state.ui.fundActivityView === "employers" ? "employers" : "deposits";
    dom.fundActivityModal.hidden = false;
    document.body.classList.add("is-fund-activity-open");
    dom.fundActivityModal.innerHTML = `
      <div class="panel-head">
        <div>
          <h2>${view === "employers" ? "מעסיקים בקופה" : "הפקדות בקופה"}</h2>
          <p>${escapeHtml(fund.planName || fund.productName || fund.accountNumber || "קופה")}</p>
        </div>
        <button class="modal-close" type="button" data-close-fund-activity="true" aria-label="סגירה">×</button>
      </div>
      <div class="fund-activity-panel">
        ${view === "employers" ? renderFundEmployers(fund) : renderFundDeposits(fund)}
      </div>
    `;
  }

  function renderFundDeposits(fund) {
    const rows = Array.isArray(fund.depositRows) ? fund.depositRows : [];
    if (!rows.length) {
      return `<div class="empty-state">לא נמצאו נתוני הפקדות בקופה זו.</div>`;
    }
    return `
      <div class="table-wrap">
        <table class="fund-activity-table">
          <thead>
            <tr>
              <th>מעסיק</th>
              <th>חודש</th>
              <th>תג' עובד</th>
              <th>תג' מעסיק</th>
              <th>פיצויים</th>
              <th>סה"כ</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((row) => `
              <tr>
                <td>${escapeHtml(row.employerName || "—")}</td>
                <td>${escapeHtml(row.month || "—")}</td>
                <td>${fmtCurrency(row.employeeContribution || 0)}</td>
                <td>${fmtCurrency(row.employerContribution || 0)}</td>
                <td>${fmtCurrency(row.compensation || 0)}</td>
                <td>${fmtCurrency(row.total || 0)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderFundEmployers(fund) {
    const employers = Array.isArray(fund.employers) ? fund.employers : [];
    if (!employers.length) {
      return `<div class="empty-state">לא זוהו מעסיקים בקופה זו.</div>`;
    }
    return `
      <div class="fund-employer-list">
        ${employers.map((employer) => `
          <div class="fund-employer-item ${employer.isCurrent ? "is-current" : ""}">
            <span>${escapeHtml(employer.name || "מעסיק ללא שם")}</span>
            <span class="fund-employer-id">ח.פ ${escapeHtml(employer.idNumber || "—")}</span>
          </div>
        `).join("")}
      </div>
    `;
  }

  function normalizeMigrationProductType(fund) {
    const text = [fund?.productType, fund?.planName, fund?.productName].filter(Boolean).join(" ");
    if (/ביטוח\s*מנהלים|מנהלים/i.test(text)) return "ביטוח מנהלים";
    if (/גמל\s*להשקעה/i.test(text)) return "קופת גמל להשקעה";
    if (/השתלמות/i.test(text)) return "קרן השתלמות";
    if (/פוליסה\s*פיננסית|חיסכון\s*פיננסי/i.test(text)) return "פוליסה פיננסית";
    if (/פנסיה/i.test(text)) return "קרן פנסיה";
    if (/גמל/i.test(text)) return "קופת גמל";
    if (/ביטוח/i.test(text)) return "ביטוח מנהלים";
    return "קופת גמל";
  }

  function getFundMigrationOptions(fund) {
    return MIGRATION_RULES[normalizeMigrationProductType(fund)] || [];
  }

  function getFundMigrationPlan(fund) {
    if (!fund.migrationPlan || typeof fund.migrationPlan !== "object") {
      fund.migrationPlan = {};
    }
    return fund.migrationPlan;
  }

  function isFundMigrationActive(fund) {
    return fund?.recommendationTemplateId === "move_new_product";
  }

  function renderFundMigrationDrawer(fund) {
    if (!isFundMigrationActive(fund)) {
      return "";
    }
    const sourceProduct = normalizeMigrationProductType(fund);
    const options = getFundMigrationOptions(fund);
    const plan = getFundMigrationPlan(fund);
    const companies = plan.targetProduct ? (MIGRATION_TARGET_COMPANIES[plan.targetProduct] || []) : [];
    return `
      <aside class="fund-migration-drawer" aria-label="המלצת ניוד">
        <div class="migration-drawer-head">
          <span class="migration-step-badge">ניוד</span>
          <h3>לנייד לאיזה מוצר?</h3>
          <p>מוצר מקור: ${escapeHtml(sourceProduct)}. מוצגים רק יעדים אפשריים לפי חוקי הניוד.</p>
        </div>

        <div class="migration-option-grid">
          ${options.map((product) => `
            <button class="migration-choice-card ${plan.targetProduct === product ? "is-selected" : ""}" type="button" data-migration-target-product="${escapeAttribute(product)}" aria-pressed="${plan.targetProduct === product ? "true" : "false"}">
              <span class="migration-choice-icon" aria-hidden="true">${escapeHtml(getMigrationProductIcon(product))}</span>
              <span>${escapeHtml(product)}</span>
            </button>
          `).join("")}
        </div>

        ${sourceProduct === "קרן פנסיה" ? `
          <div class="migration-warning-box">
            <strong>בדיקה נדרשת לפני ניוד פנסיה</strong>
            <span>יש לוודא מקדם קצבה, כיסויים ביטוחיים, תקופת אכשרה ואובדן זכויות אפשרי.</span>
          </div>
        ` : ""}

        ${plan.targetProduct ? `
          <div class="migration-section">
            <h4>באיזה יצרן לפתוח?</h4>
            <div class="migration-company-grid">
              ${companies.map((company) => `
                <button class="migration-company-card ${plan.targetCompany === company ? "is-selected" : ""}" type="button" data-migration-target-company="${escapeAttribute(company)}" aria-pressed="${plan.targetCompany === company ? "true" : "false"}">
                  ${renderManufacturerLogo(company)}
                  <span>${escapeHtml(company)}</span>
                  <small>Smart Score בהכנה</small>
                </button>
              `).join("")}
            </div>
          </div>
        ` : ""}

        ${plan.targetCompany ? `
          <div class="migration-section">
            <h4>פרטי ההמלצה</h4>
            <div class="migration-form-grid">
              <label>
                <span>דמי ניהול מצבירה</span>
                <input class="input" type="number" min="0" step="0.01" data-migration-field="managementFeeBalance" value="${escapeAttribute(plan.managementFeeBalance || "")}" placeholder="%">
              </label>
              <label>
                <span>דמי ניהול מהפקדה</span>
                <input class="input" type="number" min="0" step="0.01" data-migration-field="managementFeeDeposit" value="${escapeAttribute(plan.managementFeeDeposit || "")}" placeholder="%">
              </label>
              <label class="is-wide">
                <span>מסלול השקעה</span>
                <select class="select" data-migration-field="investmentTrack">
                  <option value="">בחר מסלול</option>
                  ${MIGRATION_TRACK_OPTIONS.map((track) => `<option value="${escapeAttribute(track)}"${plan.investmentTrack === track ? " selected" : ""}>${escapeHtml(track)}</option>`).join("")}
                </select>
              </label>
              <label class="is-wide">
                <span>סיבת המלצה</span>
                <textarea class="input" data-migration-field="reason" placeholder="למשל: שיפור דמי ניהול, התאמת מסלול, ריכוז כספים">${escapeHtml(plan.reason || "")}</textarea>
              </label>
              <label class="is-wide">
                <span>הערות מקצועיות</span>
                <textarea class="input" data-migration-field="professionalNotes" placeholder="הערות לביצוע ולמעקב">${escapeHtml(plan.professionalNotes || "")}</textarea>
              </label>
            </div>
          </div>
        ` : ""}
      </aside>
    `;
  }

  function getMigrationProductIcon(product) {
    if (product.includes("פנסיה")) return "◎";
    if (product.includes("השתלמות")) return "◈";
    if (product.includes("ביטוח")) return "▣";
    if (product.includes("פוליסה")) return "▤";
    return "₪";
  }

  function renderFundDetails() {
    const fund = state.funds.find((item) => item.id === state.ui.activeFundId);
    if (!fund || !state.ui.fundModalOpen) {
      dom.fundDetails.hidden = true;
      dom.fundDetails.classList.remove("is-open");
      dom.fundDetails.classList.remove("has-migration-drawer");
      dom.fundModalBackdrop.hidden = true;
      dom.fundDetails.innerHTML = "";
      state.ui.fundActivityModalOpen = false;
      renderFundActivityModal();
      return;
    }

    dom.fundDetails.hidden = false;
    dom.fundDetails.classList.add("is-open");
    dom.fundDetails.classList.toggle("has-migration-drawer", isFundMigrationActive(fund));
    dom.fundModalBackdrop.hidden = false;
    state.ui.activeFundId = fund.id;
    const periodRows = Array.isArray(fund.periodRows) ? fund.periodRows : [];
    const compensationTotal = sumBy(
      periodRows.filter((row) => isCompensationComponent(row.componentLabel)),
      (row) => row.amount || 0
    );
    const contributionTotal = sumBy(
      periodRows.filter((row) => !isCompensationComponent(row.componentLabel)),
      (row) => row.amount || 0
    );
    const compactTotalBalance = firstPositive(
      fund.currentBalance,
      compensationTotal + contributionTotal,
      fund.retirementCapital,
      0
    );

    dom.fundDetails.innerHTML = `
      <div class="panel-head">
        <div>
          <h2>${escapeHtml(fund.manufacturer || "ללא יצרן")}</h2>
          <p>${escapeHtml(fund.productType || "ללא סוג מוצר")} | ${escapeHtml(fund.accountNumber || "ללא מספר חשבון")}</p>
        </div>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
          <button class="modal-close" type="button" data-close-fund-modal="true" aria-label="סגירה">×</button>
        </div>
      </div>

      <div class="fund-drawer-layout ${isFundMigrationActive(fund) ? "has-migration" : ""}">
        ${renderFundMigrationDrawer(fund)}
        <div class="fund-drawer-main">
      <div class="fund-compact-card">
        <div class="fund-compact-row is-four">
          <div class="fund-compact-cell">
            <span class="fund-compact-label">תוכנית</span>
            <div class="fund-compact-value">${escapeHtml(fund.planName || fund.productName || "לא זוהה")}</div>
          </div>
          <div class="fund-compact-cell">
            <span class="fund-compact-label">מספר קופה</span>
            <div class="fund-compact-value">${escapeHtml(fund.accountNumber || fund.policyNumber || "—")}</div>
          </div>
          <div class="fund-compact-cell">
            <span class="fund-compact-label">מועד הצטרפות</span>
            <div class="fund-compact-value">${escapeHtml(fund.startDate || "—")}</div>
          </div>
          <div class="fund-compact-cell">
            <label>תאריך נזילות</label>
            <input class="input" data-fund-field="liquidityDate" type="text" value="${escapeAttribute(fund.liquidityDate || "")}" placeholder="—">
          </div>
        </div>
        <div class="fund-compact-row">
          <div class="fund-compact-cell">
            <span class="fund-compact-label">יצרן</span>
            <div class="fund-compact-value">${escapeHtml(fund.manufacturer || "—")}</div>
          </div>
          <div class="fund-compact-cell">
            <span class="fund-compact-label">סוג מוצר</span>
            <div class="fund-compact-value">${escapeHtml(fund.productType || "—")}</div>
          </div>
          <div class="fund-compact-cell">
            <span class="fund-compact-label">סטטוס</span>
            <input class="input fund-status-input ${getStatusVisualClass(fund.status)}" data-fund-field="status" type="text" value="${escapeAttribute(fund.status || "")}">
          </div>
        </div>
        <div class="fund-compact-row">
          <div class="fund-compact-cell">
            <label>סה"כ צבירה</label>
            <input class="input" data-fund-field="currentBalance" type="number" min="0" step="1000" value="${numberInputValue(fund.currentBalance)}">
            <div class="fund-compact-note">${fmtCurrency(compactTotalBalance)}</div>
          </div>
          <div class="fund-compact-cell">
            <span class="fund-compact-label">תגמולים</span>
            <div class="fund-compact-value">${fmtCurrency(contributionTotal)}</div>
            <div class="fund-compact-note">מתוך פירוט שכבות</div>
          </div>
          <div class="fund-compact-cell">
            <span class="fund-compact-label">פיצויים</span>
            <div class="fund-compact-value">${fmtCurrency(compensationTotal)}</div>
            <div class="fund-compact-note">מתוך פירוט שכבות</div>
          </div>
        </div>
        <div class="fund-compact-row">
          <div class="fund-compact-cell">
            <span class="fund-compact-label">דמי ניהול מהפקדה</span>
            <div class="fund-compact-value">${Number.isFinite(fund.depositFee) ? `${fmtNumber(fund.depositFee, 2)}%` : "—"}</div>
          </div>
          <div class="fund-compact-cell">
            <span class="fund-compact-label">דמי ניהול מצבירה</span>
            <div class="fund-compact-value">${Number.isFinite(fund.balanceFee) ? `${fmtNumber(fund.balanceFee, 2)}%` : "—"}</div>
          </div>
          <div class="fund-compact-cell">
            <label>${fund.guaranteedCoefficient > 0 ? "מקדם מיובא / בסיס" : "מקדם בסיס"}</label>
            <input class="input" data-fund-field="guaranteedCoefficient" type="number" min="0" step="0.01" value="${numberInputValue(fund.guaranteedCoefficient)}">
          </div>
        </div>
        <div class="fund-compact-row">
          <div class="fund-compact-cell is-wide">
            <span class="fund-compact-label">מסלול השקעה</span>
            <div class="fund-compact-value">${escapeHtml(getInfrastructureYieldMode(fund) || fund.investmentTrack || fund.retirementTrackName || "—")}</div>
          </div>
          <div class="fund-compact-cell">
          <label class="retirement-toggle ${state.infrastructureSelectedIds.has(fund.id) ? "is-active" : ""}">
            <span class="retirement-toggle-label">
              <span>${state.infrastructureSelectedIds.has(fund.id) ? "מיועד לקצבה" : "משוך קצבה"}</span>
            </span>
            <input class="checkbox" type="checkbox" data-fund-retirement-check="${fund.id}" ${state.infrastructureSelectedIds.has(fund.id) ? "checked" : ""} hidden>
          </label>
        </div>
      </div>
      </div>

      ${renderFundActivityButtons(fund)}

      <div class="field" style="margin-bottom:16px;">
        <div class="template-picker-row">
          <select class="input template-picker-select" data-fund-template-field="recommendation" tabindex="-1" aria-hidden="true">
            ${renderFundTemplateOptions("recommendation")}
          </select>
          ${renderFundTemplateCards("recommendation", fund)}
        </div>
        <textarea class="input summary-textarea" data-fund-field="recommendation" placeholder="למשל: ניוד למוצר חדש, השארה כקופה משלימה או כל ניסוח שצריך להיכנס לסיכום">${escapeHtml(fund.recommendation || "")}</textarea>
      </div>
        </div>
      </div>

    `;
    renderFundActivityModal();
  }

  function renderPensionTab() {
    const selectedFunds = getSelectedFunds();
    const result = buildTrackResult(state.calc.activeTrack);
    const comparison = TRACK_PRESETS.map((track) => buildTrackResult(track.id));

    dom.manualCapitalInput.value = state.calc.manualCapital;
    dom.fallbackFactorInput.value = roundNumber(state.calc.fallbackFactor, 2);
    dom.mainTrackSelect.value = state.calc.activeTrack;
    dom.spouseAgeInput.value = state.calc.spouseAge;

    dom.trackCards.innerHTML = comparison.length ? comparison.map((track) => `
      <div class="track-card ${track.id === state.calc.activeTrack ? "is-selected" : ""}">
        <div class="row-between">
          <div>
            <h4>${escapeHtml(track.label)}</h4>
            <div class="muted">${escapeHtml(track.note)}</div>
          </div>
          <button class="button button-secondary" type="button" data-select-track="${track.id}">בחר</button>
        </div>
        <div class="track-value">${fmtCurrency(track.monthlyPension)}</div>
        <div class="muted">מקדם: ${fmtNumber(track.coefficient, 2)}</div>
        <div class="field">
          <label>מקדם למסלול</label>
          <input class="input" type="number" min="0" step="0.01" data-track-id="${track.id}" value="${numberInputValue(track.coefficient)}">
        </div>
        <div class="inline-stats">
          <span class="badge">${track.guaranteeMonths ? `${track.guaranteeMonths / 12} שנים` : "ללא תקופה"}</span>
          <span class="badge">${track.spouseShare > 0 ? `שאיר ${fmtPercent(track.spouseShare)}` : "ללא שאירים"}</span>
        </div>
      </div>
    `).join("") : `<div class="empty-state">אין מסלולים לחישוב.</div>`;

    dom.mainResultGrid.innerHTML = [
      renderResultCard("קצבה חודשית", fmtCurrency(result.monthlyPension), "ברוטו משוער במסלול הנבחר"),
      renderResultCard("מקדם משוקלל", fmtNumber(result.coefficient, 2), "על בסיס קופות שיועדו לקצבה או מקדם ידני"),
      renderResultCard("הון לחישוב", fmtCurrency(result.capital), `${selectedFunds.length} קופות שיועדו לקצבה`),
      renderResultCard("פער מול הדוח", fmtCurrency(result.monthlyPension - result.importedPension), result.importedPension > 0 ? `קצבה מיובאת: ${fmtCurrency(result.importedPension)}` : "אין קצבה מיובאת בדוח")
    ].join("");

    if (!selectedFunds.length) {
      dom.pensionBreakdown.innerHTML = `<div class="empty-state">בחר קופה בטבלה הראשית, פתח את חלון הקופה וסמן אותה כמיועדת לקצבה כדי לראות פירוט לחישוב.</div>`;
      return;
    }

    dom.pensionBreakdown.innerHTML = `
      <div class="table-wrap">
        <table class="funds-table">
          <thead>
            <tr>
              <th>יצרן</th>
              <th>חשבון</th>
              <th>הון לקצבה</th>
              <th>מקדם בסיס</th>
              <th>קצבה מיובאת</th>
              <th>קצבה במסלול נבחר</th>
              <th>מסלול פרישה</th>
            </tr>
          </thead>
          <tbody>
            ${selectedFunds.map((fund) => {
              const capital = getFundCapital(fund);
              const baseFactor = getFundBaseFactor(fund, state.calc.fallbackFactor);
              const appliedFactor = getTrackCoefficient(state.calc.activeTrack, baseFactor);
              const pension = appliedFactor > 0 ? capital / appliedFactor : 0;
              return `
                <tr>
                  <td>${escapeHtml(fund.manufacturer || "—")}</td>
                  <td>${escapeHtml(fund.accountNumber || "—")}</td>
                  <td>${fmtCurrency(capital)}</td>
                  <td>${fmtNumber(baseFactor, 2)}</td>
                  <td>${fmtCurrency(fund.importedPension)}</td>
                  <td>${fmtCurrency(pension)}</td>
                  <td>${escapeHtml(fund.retirementTrackName || "לא הוגדר")}</td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderFactorTab() {
    if (!state.funds.length) {
      return;
    }
    const requiredNodes = [
      dom.factorCapitalInput,
      dom.factorValueInput,
      dom.factorRangeInput,
      dom.factorNote,
      dom.factorResultGrid,
      dom.factorPolicyTable,
      dom.factorAssignmentSummary,
      dom.sensitivityGrid
    ];
    if (requiredNodes.some((node) => !node)) {
      return;
    }

    const selectedFunds = getSelectedFunds();
    const fallbackFactor = Math.max(1, toNumber(state.calc.factorValue) || state.calc.fallbackFactor);
    const scenario = buildFactorScenario(fallbackFactor);
    const baseFactor = getWeightedBaseFactor(selectedFunds, state.calc.fallbackFactor);

    dom.factorCapitalInput.value = state.calc.factorCapital;
    dom.factorValueInput.value = roundNumber(fallbackFactor, 2);
    dom.factorRangeInput.value = clamp(fallbackFactor, 80, 260);
    dom.factorNote.textContent = scenario.hasAssignments
      ? `המקדם האפקטיבי חושב לפי הקצאות הפוליסות שביצעת. פוליסות ללא הקצאה משתמשות במקדם ברירת המחדל ${fmtNumber(fallbackFactor, 2)}.`
      : `עדיין לא בוצעה הקצאה לפי פוליסות. כרגע כל הפוליסות משתמשות במקדם ברירת המחדל ${fmtNumber(fallbackFactor, 2)}.`;

    dom.factorResultGrid.innerHTML = [
      renderResultCard("קצבה משוקללת", fmtCurrency(scenario.monthlyPension), `מקדם אפקטיבי ${fmtNumber(scenario.effectiveFactor, 2)}`),
      renderResultCard("הון לחישוב", fmtCurrency(scenario.capital), scenario.usesManualCapital ? "הון ידני" : "לפי קופות שיועדו לקצבה"),
      renderResultCard("פוליסות עם הקצאה", `${scenario.assignedFunds}/${scenario.totalFunds}`, scenario.hasAssignments ? "קיבלו מקדם ייעודי" : "ללא הקצאה ייעודית"),
      renderResultCard("פער מול בסיס", fmtCurrency((scenario.capital / baseFactor) - scenario.monthlyPension), `מקדם בסיס משוקלל ${fmtNumber(baseFactor, 2)}`)
    ].join("");

    dom.factorAssignmentSummary.innerHTML = renderFactorAssignmentSummary(scenario.details, fallbackFactor);
    dom.factorPolicyTable.innerHTML = renderFactorPolicyTable(scenario.details, fallbackFactor);

    dom.sensitivityGrid.innerHTML = [-10, -5, 0, 5, 10].map((delta) => {
      const candidate = Math.max(1, scenario.effectiveFactor + delta);
      const candidatePension = scenario.capital > 0 ? scenario.capital / candidate : 0;
      return `
        <div class="sensitivity-item">
          <span>${delta > 0 ? "+" : ""}${delta} נק'</span>
          <strong>${fmtCurrency(candidatePension)}</strong>
          <div class="muted">מקדם ${fmtNumber(candidate, 2)}</div>
        </div>
      `;
    }).join("");

    if (dom.factorQuickTracks) {
      dom.factorQuickTracks.innerHTML = "";
    }
    return;

    dom.factorQuickTracks.innerHTML = TRACK_PRESETS.map((track) => {
      const result = buildTrackResult(track.id);
      return `
        <div class="track-card ${track.id === state.calc.activeTrack ? "is-selected" : ""}">
          <h4>${escapeHtml(track.label)}</h4>
          <div class="track-value">${fmtCurrency(result.monthlyPension)}</div>
          <div class="muted">מקדם ${fmtNumber(result.coefficient, 2)}</div>
          <button class="button button-secondary" type="button" data-track-factor="${result.coefficient}">העבר לסימולטור</button>
        </div>
      `;
    }).join("");
  }

  function buildFactorScenario(fallbackFactor) {
    const selectedFunds = getSelectedFunds();
    const manualCapital = toNumber(state.calc.factorCapital);
    const hasAssignments = Object.keys(state.calc.factorAssignments || {}).length > 0;
    const usesManualCapital = !hasAssignments && manualCapital > 0;

    if (!selectedFunds.length && usesManualCapital) {
      return {
        capital: manualCapital,
        monthlyPension: manualCapital / fallbackFactor,
        effectiveFactor: fallbackFactor,
        assignedFunds: 0,
        totalFunds: 0,
        details: [],
        hasAssignments: false,
        usesManualCapital: true
      };
    }

    const details = selectedFunds.map((fund) => {
      const capital = getFundCapital(fund);
      const baseFactor = getFundBaseFactor(fund, state.calc.fallbackFactor);
      const assignedFactor = toNumber(state.calc.factorAssignments[fund.id]);
      const appliedFactor = assignedFactor > 0 ? assignedFactor : fallbackFactor;
      const pension = capital > 0 && appliedFactor > 0 ? capital / appliedFactor : 0;
      return {
        id: fund.id,
        manufacturer: fund.manufacturer,
        accountNumber: fund.accountNumber,
        productType: fund.productType,
        capital,
        baseFactor,
        assignedFactor,
        appliedFactor,
        pension
      };
    });

    const capital = usesManualCapital ? manualCapital : sumBy(details, (item) => item.capital);
    const monthlyPension = usesManualCapital
      ? (fallbackFactor > 0 ? manualCapital / fallbackFactor : 0)
      : sumBy(details, (item) => item.pension);
    const effectiveFactor = capital > 0 && monthlyPension > 0 ? capital / monthlyPension : fallbackFactor;

    return {
      capital,
      monthlyPension,
      effectiveFactor,
      assignedFunds: details.filter((item) => item.assignedFactor > 0).length,
      totalFunds: details.length,
      details,
      hasAssignments,
      usesManualCapital
    };
  }

  function renderFactorAssignmentSummary(details, fallbackFactor) {
    if (!details.length) {
      return `<span class="badge">אין קופות שיועדו לקצבה כרגע</span>`;
    }
    const groups = new Map();
    details.forEach((item) => {
      const key = item.assignedFactor > 0 ? roundNumber(item.assignedFactor, 2) : `default-${roundNumber(fallbackFactor, 2)}`;
      const label = item.assignedFactor > 0 ? `מקדם ${fmtNumber(item.assignedFactor, 2)}` : `ברירת מחדל ${fmtNumber(fallbackFactor, 2)}`;
      const existing = groups.get(key) || { label, count: 0, capital: 0, assigned: item.assignedFactor > 0 };
      existing.count += 1;
      existing.capital += item.capital;
      groups.set(key, existing);
    });
    return Array.from(groups.values()).map((group) => `
      <span class="badge ${group.assigned ? "gold" : ""}">${group.label} | ${group.count} פוליסות | ${fmtCurrency(group.capital)}</span>
    `).join("");
  }

  function renderFactorPolicyTable(details, fallbackFactor) {
    if (!details.length) {
      return `<div class="empty-state">סמן קופות כמיועדות לקצבה מתוך חלון הקופה כדי לבצע הקצאה לפי פוליסות.</div>`;
    }
    return `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th></th>
              <th>יצרן</th>
              <th>סוג מוצר</th>
              <th>מס' פוליסה</th>
              <th>הון</th>
              <th>מקדם בסיס</th>
              <th>מקדם שהוקצה</th>
              <th>מקדם בפועל</th>
            </tr>
          </thead>
          <tbody>
            ${details.map((item) => `
              <tr>
                <td><input class="checkbox" type="checkbox" data-factor-select="${item.id}" ${state.calc.factorSelectedIds.has(item.id) ? "checked" : ""}></td>
                <td>${escapeHtml(item.manufacturer || "—")}</td>
                <td>${escapeHtml(item.productType || "—")}</td>
                <td>${escapeHtml(item.accountNumber || "—")}</td>
                <td>${fmtCurrency(item.capital)}</td>
                <td>${fmtNumber(item.baseFactor, 2)}</td>
                <td><input class="input" style="min-width:110px;" type="number" min="1" step="0.01" data-factor-row="${item.id}" value="${numberInputValue(item.assignedFactor)}" placeholder="ריק"></td>
                <td>${fmtNumber(item.appliedFactor || fallbackFactor, 2)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderBeneficiariesTab() {
    if (!state.funds.length) {
      return;
    }

    dom.beneficiaryTrackSelect.value = state.calc.activeTrack;
    dom.guaranteeMonthsInput.value = numberInputValue(state.calc.guaranteeMonths);
    dom.spouseShareInput.value = numberInputValue(state.calc.spouseShare * 100);
    dom.planningYearsInput.value = String(state.calc.planningYears);
    dom.beneficiaryBasePensionInput.value = state.calc.beneficiaryBasePension;

    const selectedTrackResult = buildTrackResult(state.calc.activeTrack);
    const monthlyPension = toNumber(state.calc.beneficiaryBasePension) || selectedTrackResult.monthlyPension;
    const schedule = buildBeneficiarySchedule(monthlyPension);
    const selectedBeneficiaries = getSelectedBeneficiaries();
    const maxExposure = schedule.length ? Math.max(...schedule.map((row) => row.exposure)) : 0;
    const spouseMonthly = monthlyPension * state.calc.spouseShare;
    const comparisonRows = buildBeneficiaryComparisonRows();

    dom.beneficiaryResultGrid.innerHTML = [
      renderResultCard("קצבה חודשית", fmtCurrency(monthlyPension), "הבסיס למסלול ההבטחה"),
      renderResultCard("חודשי הבטחה", String(state.calc.guaranteeMonths), "0 = אין תקופה, רק מסלול שאירים"),
      renderResultCard("קצבה לשאיר", fmtCurrency(spouseMonthly), `אחוז שאיר ${fmtPercent(state.calc.spouseShare)}`),
      renderResultCard("חשיפה מקסימלית", fmtCurrency(maxExposure), "אם פטירה בתחילת השנה")
    ].join("");

    if (!selectedBeneficiaries.length) {
      dom.beneficiaryCards.innerHTML = `<div class="empty-state">לא זוהו מוטבים בקופות המסומנות. אפשר עדיין להשתמש בסימולטור עם אחוז שאירים וחודשי הבטחה.</div>`;
    } else {
      dom.beneficiaryCards.innerHTML = `<div class="cards-grid">${selectedBeneficiaries.map((beneficiary) => {
        const ratio = beneficiary.share / 100;
        const monthlyEstimate = state.calc.spouseShare > 0 ? spouseMonthly * ratio : monthlyPension * ratio;
        const yearOneExposure = schedule.length ? schedule[0].exposure * ratio : 0;
        return `
          <div class="fund-card">
            <div>
              <h4>${escapeHtml(beneficiary.name || "מוטב")}</h4>
              <div class="fund-meta">${escapeHtml(beneficiary.relationship || "ללא זיקה")} | ${fmtPercent(ratio)}</div>
            </div>
            <div class="metric-grid">
              <div class="metric">
                <span>אמידת תזרים חודשי</span>
                <strong>${fmtCurrency(monthlyEstimate)}</strong>
              </div>
              <div class="metric">
                <span>חשיפה בשנה 1</span>
                <strong>${fmtCurrency(yearOneExposure)}</strong>
              </div>
            </div>
            <div class="fund-meta">קופות קשורות: ${beneficiary.accounts.length}</div>
          </div>
        `;
      }).join("")}</div>`;
    }

    dom.beneficiaryCards.innerHTML = renderSelectedBeneficiariesTable(selectedBeneficiaries, monthlyPension, spouseMonthly, schedule);
    dom.beneficiarySchedule.innerHTML = comparisonRows.length
      ? renderBeneficiaryComparisonTable(comparisonRows)
      : `<div class="empty-state">בחר לפחות קופה אחת בדשבורד כדי לבנות את טבלת מימוש הכספים לקצבה.</div>`;
  }

  function renderMeetingSummaryTab() {
    if (!state.funds.length) {
      return;
    }

    if (!state.meetingSummary || !Array.isArray(state.meetingSummary.facts)) {
      state.meetingSummary = buildMeetingSummaryDefaults();
    }
    if (!Array.isArray(state.meetingSummary.manualFollowUps)) {
      state.meetingSummary.manualFollowUps = [];
    }
    if (!Array.isArray(state.meetingSummary.hiddenAutoFollowUps)) {
      state.meetingSummary.hiddenAutoFollowUps = [];
    }
    if (!Array.isArray(state.meetingSummary.hiddenAutoFacts)) {
      state.meetingSummary.hiddenAutoFacts = [];
    }
    if (typeof state.meetingSummary.showFundsSummaryTable !== "boolean") {
      state.meetingSummary.showFundsSummaryTable = true;
    }
    if (typeof state.meetingSummary.showNeedsSection !== "boolean") {
      state.meetingSummary.showNeedsSection = true;
    }
    if (typeof state.meetingSummary.showFactsTable !== "boolean") {
      state.meetingSummary.showFactsTable = true;
    }
    if (typeof state.meetingSummary.showPensionSnapshotTable !== "boolean") {
      state.meetingSummary.showPensionSnapshotTable = true;
    }
    if (typeof state.meetingSummary.showInfrastructureTable !== "boolean") {
      state.meetingSummary.showInfrastructureTable = true;
    }
    if (typeof state.meetingSummary.showMigrationTable !== "boolean") {
      state.meetingSummary.showMigrationTable = true;
    }
    refreshMeetingSummaryDynamicData();

    dom.meetingSummaryDateInput.value = state.meetingSummary.documentDate || "";
    dom.meetingSummaryAdviceTypeInput.value = state.meetingSummary.adviceType || "pension";
    dom.meetingSummaryBrandInput.value = state.meetingSummary.brandName || "ABD-finance";
    dom.meetingSummaryTitleInput.value = state.meetingSummary.documentTitle || "";
    dom.meetingSummaryClientLineInput.value = state.meetingSummary.clientLine || "";
    dom.meetingSummaryIntroInput.value = state.meetingSummary.introText || "";
    dom.meetingShowFundsSummaryToggle.checked = state.meetingSummary.showFundsSummaryTable !== false;
    dom.meetingShowNeedsToggle.checked = state.meetingSummary.showNeedsSection !== false;
    dom.meetingShowFactsToggle.checked = state.meetingSummary.showFactsTable !== false;
    dom.meetingShowPensionSnapshotToggle.checked = state.meetingSummary.showPensionSnapshotTable !== false;
    dom.meetingShowInfrastructureToggle.checked = state.meetingSummary.showInfrastructureTable !== false;
    dom.meetingShowMigrationToggle.checked = state.meetingSummary.showMigrationTable !== false;
    updateMeetingInfrastructureButton();

    dom.meetingSummaryFacts.innerHTML = state.meetingSummary.facts.length
      ? state.meetingSummary.facts.map((item) => `
        <div class="summary-item-editor">
          <div class="grid-2">
            <div class="field">
              <label>כותרת</label>
              <input class="input" type="text" value="${escapeAttribute(item.label || "")}" data-meeting-fact-id="${item.id}" data-meeting-fact-field="label">
            </div>
            <div class="field">
              <label>ערך</label>
              <input class="input" type="text" value="${escapeAttribute(item.value || "")}" data-meeting-fact-id="${item.id}" data-meeting-fact-field="value">
            </div>
          </div>
          <div class="summary-item-editor-actions">
            <span class="muted">השורה תופיע בטבלת "נתונים כלליים"</span>
            <button class="button button-secondary" type="button" data-remove-meeting-fact="${item.id}">הסר</button>
          </div>
        </div>
      `).join("")
      : `<div class="empty-state">אין עדיין שורות בנתונים הכלליים.</div>`;

    dom.meetingSummaryRecommendations.innerHTML = state.meetingSummary.recommendations.length
      ? state.meetingSummary.recommendations.map((item, index) => `
        <div class="summary-item-editor">
          <div class="field">
            <label>המלצה ${index + 1}</label>
            <textarea class="input summary-textarea" data-meeting-recommendation-id="${item.id}" data-meeting-recommendation-field="text">${escapeHtml(item.text || "")}</textarea>
          </div>
          <div class="summary-item-editor-actions">
            <span class="muted">הסעיף יוצג ברשימה ממוספרת במסמך</span>
            <button class="button button-secondary" type="button" data-remove-meeting-recommendation="${item.id}">הסר</button>
          </div>
        </div>
      `).join("")
      : `<div class="empty-state">אין עדיין המלצות. אפשר להוסיף ידנית או לרענן מהנתונים.</div>`;

    dom.meetingSummaryFollowUps.innerHTML = (state.meetingSummary.manualFollowUps || []).length
      ? state.meetingSummary.manualFollowUps.map((item, index) => `
        <div class="summary-item-editor">
          <div class="field">
            <label>משימה / הערה ${index + 1}</label>
            <textarea class="input summary-textarea" data-meeting-followup-id="${item.id}" data-meeting-followup-field="text">${escapeHtml(item.text || "")}</textarea>
          </div>
          <div class="summary-item-editor-actions">
            <span class="muted">הסעיף יופיע ברשימת ההמשך בסיכום הפגישה.</span>
            <button class="button button-secondary" type="button" data-remove-meeting-followup="${item.id}">הסר</button>
          </div>
        </div>
      `).join("")
      : `<div class="empty-state">אין עדיין משימות או הערות המשך. אפשר להוסיף כאן ידנית.</div>`;

    dom.meetingSummaryScreenshots.innerHTML = state.meetingSummary.screenshots.length
      ? state.meetingSummary.screenshots.map((item, index) => `
        <div class="summary-screenshot-editor">
          <div class="grid-2">
            <div class="field">
              <label>כותרת תמונה ${index + 1}</label>
              <input class="input" type="text" value="${escapeAttribute(item.title || "")}" data-meeting-screenshot-id="${item.id}" data-meeting-screenshot-field="title">
            </div>
            <div class="field">
              <label>קובץ תמונה</label>
              <input class="input" type="file" accept="image/*" data-meeting-screenshot-file="${item.id}">
            </div>
            <div class="field">
              <label>הערה / כיתוב</label>
              <textarea class="input summary-textarea" data-meeting-screenshot-id="${item.id}" data-meeting-screenshot-field="caption">${escapeHtml(item.caption || "")}</textarea>
            </div>
            <div class="field">
              <label>תצוגה מהירה</label>
              ${item.imageData
                ? `<img class="summary-upload-preview" src="${item.imageData}" alt="${escapeAttribute(item.title || "צילום מסך")}">`
                : `<div class="summary-empty-preview">עדיין לא הועלתה תמונה</div>`}
            </div>
          </div>
          <div class="summary-item-editor-actions">
            <span class="muted">${escapeHtml(item.fileName || "אפשר להעלות PNG, JPG או כל צילום מסך מקומי")}</span>
            <button class="button button-secondary" type="button" data-remove-meeting-screenshot="${item.id}">הסר</button>
          </div>
        </div>
      `).join("")
      : `<div class="empty-state">עדיין לא נוספו צילומי מסך.</div>`;

    enhanceMeetingSummaryEditors();
    renderMeetingSummaryPreviewOnly();
  }

  function updateMeetingInfrastructureButton() {
    if (!dom.toggleMeetingInfrastructureButton) return;
    const rows = buildInfrastructureRows();
    const isVisible = (state.meetingSummary.adviceType || "pension") === "retirement" && state.meetingSummary.showInfrastructureTable !== false;
    dom.toggleMeetingInfrastructureButton.textContent = isVisible ? "הסר תשתיות לקצבה" : "הוסף תשתיות לקצבה";
    dom.toggleMeetingInfrastructureButton.disabled = !rows.length;
    dom.toggleMeetingInfrastructureButton.title = rows.length ? "" : "אין קופות שמיועדות לקצבה";
  }

  function toggleMeetingInfrastructureSection() {
    const rows = buildInfrastructureRows();
    if (!rows.length) {
      showToast("אין כרגע קופות שמיועדות לקצבה. סמן קופות כ'משוך קצבה' לפני ההוספה לסיכום.", true);
      return;
    }
    const isVisible = (state.meetingSummary.adviceType || "pension") === "retirement" && state.meetingSummary.showInfrastructureTable !== false;
    state.meetingSummary.adviceType = "retirement";
    state.meetingSummary.showInfrastructureTable = !isVisible;
    if (state.meetingSummary.showInfrastructureTable) {
      state.meetingSummary.showPensionSnapshotTable = true;
    }
    renderMeetingSummaryTab();
    showToast(state.meetingSummary.showInfrastructureTable ? "טבלת התשתיות נוספה לסיכום הפגישה" : "טבלת התשתיות הוסרה מסיכום הפגישה");
  }

  function renderMeetingSummaryPreviewOnly() {
    if (!dom.meetingSummaryPreview) {
      return;
    }
    refreshMeetingSummaryDynamicData();
    dom.meetingSummaryPreview.innerHTML = renderMeetingSummaryPreview();
  }

  function enhanceMeetingSummaryEditors() {
    enhanceMeetingRecommendationEditors();
    enhanceMeetingScreenshotEditors();
  }

  function enhanceMeetingRecommendationEditors() {
    if (!dom.meetingSummaryRecommendations) {
      return;
    }
    const editors = Array.from(dom.meetingSummaryRecommendations.querySelectorAll(".summary-item-editor"));
    editors.forEach((editor, index) => {
      if (editor.querySelector("[data-extra-recommendation-media]")) {
        return;
      }
      const item = state.meetingSummary.recommendations[index];
      if (!item) {
        return;
      }
      const textareaField = editor.querySelector(".field");
      const actions = editor.querySelector(".summary-item-editor-actions");
      if (!textareaField || !actions) {
        return;
      }
      const wrapper = document.createElement("div");
      wrapper.setAttribute("data-extra-recommendation-media", item.id);
      wrapper.className = "grid-2";
      wrapper.innerHTML = `
        <div class="field">
          <label>כיתוב לצילום (אופציונלי)</label>
          <textarea class="input summary-textarea" data-meeting-recommendation-id="${item.id}" data-meeting-recommendation-field="caption">${escapeHtml(item.caption || "")}</textarea>
        </div>
        <div class="field">
          <label>קובץ צילום</label>
          <input class="input" type="file" accept="image/*" data-meeting-recommendation-file="${item.id}">
        </div>
        <div class="field" style="grid-column: 1 / -1;">
          <label>הדבקת צילום מסך</label>
          <div class="summary-paste-box" tabindex="0" data-meeting-recommendation-paste="${item.id}">
            <strong>Ctrl+V / הדבק כאן צילום מסך</strong>
            <span>אפשר להדביק ישירות מהלוח בלי לשמור קובץ.</span>
          </div>
        </div>
        <div class="field" style="grid-column: 1 / -1;">
          <label>תצוגה מהירה</label>
          ${item.imageData
            ? `<img class="summary-upload-preview" src="${item.imageData}" alt="${escapeAttribute(item.fileName || "צילום מסך")}">`
            : `<div class="summary-empty-preview">עדיין לא נוסף צילום להמלצה.</div>`}
        </div>
      `;
      textareaField.insertAdjacentElement("afterend", wrapper);
      const status = actions.querySelector(".muted");
      if (status) {
        status.textContent = item.fileName || "הסעיף יוצג ברשימה ממוספרת במסמך, ואפשר לצרף לו צילום מסך.";
      }
    });
  }

  function enhanceMeetingScreenshotEditors() {
    if (!dom.meetingSummaryScreenshots) {
      return;
    }
    const editors = Array.from(dom.meetingSummaryScreenshots.querySelectorAll(".summary-screenshot-editor"));
    editors.forEach((editor, index) => {
      if (editor.querySelector("[data-extra-screenshot-paste]")) {
        return;
      }
      const item = state.meetingSummary.screenshots[index];
      if (!item) {
        return;
      }
      const grid = editor.querySelector(".grid-2");
      if (!grid) {
        return;
      }
      const pasteField = document.createElement("div");
      pasteField.className = "field";
      pasteField.setAttribute("data-extra-screenshot-paste", item.id);
      pasteField.innerHTML = `
        <label>הדבקת צילום מסך</label>
        <div class="summary-paste-box" tabindex="0" data-meeting-screenshot-paste="${item.id}">
          <strong>Ctrl+V / הדבק כאן צילום מסך</strong>
          <span>אין צורך לשמור תמונה בנפרד לפני ההוספה.</span>
        </div>
      `;
      grid.insertBefore(pasteField, grid.children[2] || null);
    });
  }

  function renderMeetingSummaryPreview() {
    syncMeetingSummaryLiveData();
    syncNeedsFromInputs();
    const funds = state.funds || [];
    const selectedFunds = getSelectedFunds();
    const needsSections = buildMeetingSummaryNeedsSections();
    const pensionResult = buildTrackResult(state.calc.activeTrack);
    const screenshots = (state.meetingSummary.screenshots || []).filter((item) => item.imageData);
    const visibleFacts = (state.meetingSummary.facts || []).filter((item) => hasMeaningfulText(item.label) || hasMeaningfulText(item.value));
    const visibleRecommendations = (state.meetingSummary.recommendations || []).filter((item) => hasMeaningfulText(item.text));
    const followUpEntries = buildMeetingSummaryFollowUps();
    const infrastructurePreview = renderInfrastructureSummaryPreview();
    const insurancePreview = renderInsuranceSummaryPreview();
    const migrationPreview = renderMigrationSummaryTable();
    const adviceType = state.meetingSummary.adviceType || "pension";
    const isRetirementAdvice = adviceType === "retirement";
    const showFundsSummaryTable = state.meetingSummary.showFundsSummaryTable !== false;
    const showNeedsSection = state.meetingSummary.showNeedsSection !== false;
    const showFactsTable = state.meetingSummary.showFactsTable !== false;
    const showPensionSnapshotTable = isRetirementAdvice && state.meetingSummary.showPensionSnapshotTable !== false;
    const showInfrastructureTable = isRetirementAdvice && state.meetingSummary.showInfrastructureTable !== false;
    const showMigrationTable = state.meetingSummary.showMigrationTable !== false;
    const firstRecommendation = visibleRecommendations[0] || null;
    const remainingRecommendations = firstRecommendation ? visibleRecommendations.slice(1) : [];
    return `
      <div class="summary-inline-controls" aria-label="עריכה ישירה">
        <label class="inline-control">
          <span>תאריך מסמך</span>
          <input class="input" type="date" value="${escapeAttribute(state.meetingSummary.documentDate || "")}" data-meeting-summary-field="documentDate">
        </label>
        <label class="inline-control">
          <span>סוג ייעוץ</span>
          <select class="select" data-meeting-summary-field="adviceType">
            <option value="retirement"${adviceType === "retirement" ? " selected" : ""}>ייעוץ פרישה</option>
            <option value="pension"${adviceType === "pension" ? " selected" : ""}>ייעוץ פנסיוני</option>
          </select>
        </label>
      </div>

      <article class="summary-paper">
        <div class="summary-paper-top">
          <span>בס"ד</span>
          <span>${escapeHtml(formatMeetingSummaryDate(state.meetingSummary.documentDate))}</span>
        </div>

        <div class="summary-paper-brand">
          <strong class="summary-inline-edit summary-inline-heading" contenteditable="true" spellcheck="false" data-meeting-summary-field="brandName">${escapeHtml(state.meetingSummary.brandName || "ABD-finance")}</strong>
        </div>

        <h1 class="summary-inline-edit summary-inline-heading" contenteditable="true" spellcheck="false" data-meeting-summary-field="documentTitle">${escapeHtml(state.meetingSummary.documentTitle || getMeetingSummaryDefaultTitle())}</h1>
        <h2 class="summary-inline-edit summary-inline-heading" contenteditable="true" spellcheck="false" data-meeting-summary-field="clientLine">${escapeHtml(state.meetingSummary.clientLine || "עבור הלקוח")}</h2>
        <p class="summary-inline-edit summary-inline-paragraph" contenteditable="true" spellcheck="false" style="white-space: pre-line;" data-meeting-summary-field="introText">${escapeHtml(state.meetingSummary.introText || getMeetingSummaryDefaultIntro())}</p>
        <div class="summary-inline-pill-note">לחץ על הכותרת, שורת הלקוח או הטקסט כדי לערוך ישירות בתוך הדף.</div>

        ${showFundsSummaryTable ? `
          <section>
            <div class="summary-paper-title">
              <h3>תמצית הכספים הפנסיוניים שהתקבלו מהמסלקה</h3>
            </div>
            <div class="summary-preview-table-wrap">
              <table class="summary-preview-table">
                <thead>
                  <tr>
                    <th>יצרן</th>
                    <th>סוג מוצר</th>
                    <th>מס' פוליסה</th>
                    <th>מסלול השקעה</th>
                    <th>דמי ניהול</th>
                    <th>צבירה נוכחית</th>
                    <th>הון לקצבה</th>
                    <th>קצבה מיובאת</th>
                  </tr>
                </thead>
                <tbody>
                  ${funds.map((fund) => `
                    <tr>
                      <td>${escapeHtml(fund.manufacturer || "—")}</td>
                      <td>${escapeHtml(fund.productType || "—")}</td>
                      <td>${escapeHtml(fund.accountNumber || "—")}</td>
                      <td>${escapeHtml(getInfrastructureYieldMode(fund))}</td>
                      <td>${escapeHtml(fund.managementFeeText || "—")}</td>
                      <td>${fmtCurrency(fund.currentBalance)}</td>
                      <td>${fmtCurrency(getFundCapital(fund))}</td>
                      <td>${fmtCurrency(fund.importedPension)}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          </section>
        ` : ""}

        ${showNeedsSection && needsSections.hasData ? `
          <section>
            <div class="summary-paper-title">
              <h3>בירור צרכים</h3>
            </div>
            <div class="summary-needs-grid">
              ${needsSections.incomeRows.length ? `
                <div class="summary-needs-card">
                  <h4>הכנסות נטו</h4>
                  <div class="summary-needs-list">
                    <div class="summary-needs-head summary-needs-head-income">
                      <span></span>
                      <span>מבוטח/ת</span>
                      <span>בן/בת זוג</span>
                    </div>
                    ${needsSections.incomeRows.map((row) => `
                      <div class="summary-needs-item ${row.isTotal ? "summary-total-row" : ""}">
                        <span>${escapeHtml(row.label)}</span>
                        <span>${formatOptionalCurrency(row.primary, row.isTotal)}</span>
                        <span>${formatOptionalCurrency(row.spouse, row.isTotal)}</span>
                      </div>
                    `).join("")}
                  </div>
                </div>
              ` : ""}
              ${needsSections.expenseRows.length ? `
                <div class="summary-needs-card">
                  <h4>הוצאות</h4>
                  <div class="summary-needs-list">
                    <div class="summary-needs-head ${needsSections.hasExpenseNotes ? "summary-needs-head-expenses-notes" : "summary-needs-head-expenses"}">
                      <span></span>
                      <span>סכום</span>
                      ${needsSections.hasExpenseNotes ? `<span>הערה</span>` : ""}
                    </div>
                    ${needsSections.expenseRows.map((row) => `
                      <div class="summary-needs-item ${row.isTotal ? "summary-total-row" : ""} ${needsSections.hasExpenseNotes ? "summary-needs-item-expenses-notes" : "summary-needs-item-expenses"}">
                        <span>${escapeHtml(row.label)}</span>
                        <span>${formatOptionalCurrency(row.amount, row.isTotal)}</span>
                        ${needsSections.hasExpenseNotes ? `<span>${escapeHtml(row.note || "—")}</span>` : ""}
                      </div>
                    `).join("")}
                  </div>
                </div>
              ` : ""}
              ${needsSections.assetRows.length ? `
                <div class="summary-needs-card">
                  <h4>נכסים קיימים</h4>
                  <div class="summary-needs-list">
                    ${needsSections.assetRows.map((row) => `
                      <div class="summary-needs-item summary-needs-item-assets ${row.isTotal ? "summary-total-row" : ""}">
                        <span>${escapeHtml(row.label)}</span>
                        <span>${formatOptionalCurrency(row.amount, row.isTotal)}</span>
                      </div>
                    `).join("")}
                  </div>
                </div>
              ` : ""}
            </div>
          </section>
        ` : ""}

        ${showFactsTable ? `
          <section>
            <div class="summary-paper-title">
              <h3>נתונים כלליים</h3>
              <div class="summary-section-actions">
                <button class="summary-row-add" type="button" data-add-meeting-summary-fact="true" aria-label="הוסף שורה">+</button>
              </div>
            </div>
            <div class="summary-preview-table-wrap">
              <table class="summary-preview-table summary-facts-table">
                <tbody>
                  ${visibleFacts.length ? visibleFacts.map((item) => `
                    <tr class="summary-fact-row ${item.isTotal ? "summary-total-row" : ""}">
                      <td class="${item.isTotal ? "" : "summary-fact-label-cell"}">${item.isTotal ? escapeHtml(item.label || "—") : `<button class="summary-row-remove" type="button" contenteditable="false" data-remove-meeting-summary-fact="${item.id}" aria-label="הסר שורה">-</button><span contenteditable="true" spellcheck="false" class="summary-inline-cell" data-meeting-summary-fact-id="${item.id}" data-meeting-summary-fact-field="label">${escapeHtml(item.label || "—")}</span>`}</td>
                      <td ${item.isTotal ? "" : `contenteditable="true" spellcheck="false" class="summary-inline-cell" data-meeting-summary-fact-id="${item.id}" data-meeting-summary-fact-field="value"`}>${escapeHtml(item.value || "—")}</td>
                    </tr>
                  `).join("") : `
                    <tr>
                      <td colspan="2" class="muted">אין שורות כרגע. לחץ על + כדי להוסיף.</td>
                    </tr>
                  `}
                </tbody>
              </table>
            </div>
          </section>
        ` : ""}

        ${showMigrationTable && migrationPreview ? `
          <section>
            <div class="summary-paper-title">
              <h3>המלצות ניוד</h3>
            </div>
            ${migrationPreview}
          </section>
        ` : ""}

        ${insurancePreview ? `
          <section>
            <div class="summary-paper-title">
              <h3>פוליסות ביטוח שנבחרו לסיכום</h3>
            </div>
            ${insurancePreview}
          </section>
        ` : ""}

        ${isRetirementAdvice && firstRecommendation ? `
          <section>
            <div class="summary-paper-title">
              <h3>המלצה לקצבה</h3>
              <div class="summary-section-actions">
                <button class="summary-row-add" type="button" data-add-meeting-summary-recommendation="true" aria-label="הוסף המלצה">+</button>
              </div>
            </div>
            <ol class="summary-recommendations">
              <li class="summary-recommendation-block">
                <button class="summary-row-remove" type="button" data-remove-meeting-summary-recommendation="${firstRecommendation.id}" aria-label="הסר המלצה">-</button>
                <div class="summary-inline-edit summary-inline-paragraph" contenteditable="true" spellcheck="false" data-meeting-summary-recommendation-id="${firstRecommendation.id}" data-meeting-summary-recommendation-field="text">${escapeHtml(firstRecommendation.text || "")}</div>
                <div class="summary-recommendation-paste${firstRecommendation.imageData ? " has-image" : ""}" tabindex="0" data-meeting-summary-recommendation-paste="${firstRecommendation.id}">
                  ${firstRecommendation.imageData ? `
                    <figure class="summary-recommendation-media">
                      <img src="${firstRecommendation.imageData}" alt="${escapeAttribute(firstRecommendation.fileName || "צילום מסך")}">
                      <figcaption class="summary-inline-edit summary-inline-paragraph" contenteditable="true" spellcheck="false" data-meeting-summary-recommendation-id="${firstRecommendation.id}" data-meeting-summary-recommendation-field="caption">${escapeHtml(firstRecommendation.caption || "")}</figcaption>
                    </figure>
                  ` : ``}
                </div>
              </li>
            </ol>
          </section>
        ` : ""}

        ${showInfrastructureTable && infrastructurePreview ? `
          <section>
            ${showInfrastructureTable && infrastructurePreview ? `
              <div class="summary-inline-table-block">
                <div class="summary-paper-title">
                  <h3>תשתיות לקצבה</h3>
                </div>
                ${infrastructurePreview}
              </div>
            ` : ""}
          </section>
        ` : ""}

        ${(isRetirementAdvice ? remainingRecommendations : visibleRecommendations).length ? `
          <section>
            <div class="summary-paper-title">
              <h3>סיכום המלצות לשינויים</h3>
              <div class="summary-section-actions">
                <button class="summary-row-add" type="button" data-add-meeting-summary-recommendation="true" aria-label="הוסף המלצה">+</button>
              </div>
            </div>
            <ol class="summary-recommendations" ${isRetirementAdvice ? 'start="2"' : ""}>
              ${(isRetirementAdvice ? remainingRecommendations : visibleRecommendations).map((item) => `
                <li class="summary-recommendation-block">
                  <button class="summary-row-remove" type="button" data-remove-meeting-summary-recommendation="${item.id}" aria-label="הסר המלצה">-</button>
                  <div class="summary-inline-edit summary-inline-paragraph" contenteditable="true" spellcheck="false" data-meeting-summary-recommendation-id="${item.id}" data-meeting-summary-recommendation-field="text">${escapeHtml(item.text || "")}</div>
                  <div class="summary-recommendation-paste${item.imageData ? " has-image" : ""}" tabindex="0" data-meeting-summary-recommendation-paste="${item.id}">
                    ${item.imageData ? `
                      <figure class="summary-recommendation-media">
                        <img src="${item.imageData}" alt="${escapeAttribute(item.fileName || "צילום מסך")}">
                        <figcaption class="summary-inline-edit summary-inline-paragraph" contenteditable="true" spellcheck="false" data-meeting-summary-recommendation-id="${item.id}" data-meeting-summary-recommendation-field="caption">${escapeHtml(item.caption || "")}</figcaption>
                      </figure>
                    ` : ``}
                  </div>
                </li>
              `).join("")}
            </ol>
          </section>
        ` : ""}

        <section>
          <div class="summary-paper-title">
            <h3>הערות / הנחיות להמשך</h3>
            <div class="summary-section-actions">
              <button class="summary-row-add" type="button" data-add-meeting-summary-followup="true" aria-label="הוסף הנחיה">+</button>
            </div>
          </div>
          ${followUpEntries.length ? `
            <ol class="summary-followups">
              ${followUpEntries.map((item) => `
                <li class="summary-followup-row">
                  <div class="summary-inline-edit summary-inline-paragraph" contenteditable="true" spellcheck="false" data-meeting-summary-followup-id="${item.id}" data-meeting-summary-followup-field="text"${item.isAuto ? ` data-meeting-summary-followup-auto-text="${escapeAttribute(item.sourceText || item.text)}"` : ""}>${escapeHtml(item.text || "")}</div>
                  <button class="summary-row-remove" type="button" data-remove-meeting-summary-followup="${item.id}"${item.isAuto ? ` data-remove-meeting-summary-auto-text="${escapeAttribute(item.sourceText || item.text)}"` : ""} aria-label="הסר שורה">-</button>
                </li>
              `).join("")}
            </ol>
          ` : `
            <div class="muted">אין שורות כרגע. לחץ על + כדי להוסיף.</div>
          `}
        </section>

        ${showPensionSnapshotTable && (selectedFunds.length || pensionResult.capital > 0) ? `
          <section>
            <div class="summary-paper-title">
              <h3>תמונת קצבה נוכחית</h3>
            </div>
            <div class="summary-preview-table-wrap">
              <table class="summary-preview-table">
                <tbody>
                  <tr>
                    <td>קופות שסומנו לחישוב</td>
                    <td>${selectedFunds.length}</td>
                  </tr>
                  <tr>
                    <td>הון לחישוב</td>
                    <td>${fmtCurrency(pensionResult.capital)}</td>
                  </tr>
                  <tr>
                    <td>קצבה חודשית משוערת</td>
                    <td>${fmtCurrency(pensionResult.monthlyPension)}</td>
                  </tr>
                  <tr>
                    <td>מסלול הבטחה גלובלי</td>
                    <td>${escapeHtml(describeMeetingGuaranteeTrack())}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        ` : ""}

        ${screenshots.length ? `
          <section>
            <div class="summary-paper-title">
              <h3>צילומי מסך ומסמכים תומכים</h3>
            </div>
            <div class="summary-screenshot-grid">
              ${screenshots.map((item) => `
                <figure class="summary-screenshot-preview">
                  <img src="${item.imageData}" alt="${escapeAttribute(item.title || "צילום מסך")}">
                  <figcaption>
                    <strong class="summary-inline-edit summary-inline-cell" contenteditable="true" spellcheck="false" data-meeting-summary-screenshot-id="${item.id}" data-meeting-summary-screenshot-field="title">${escapeHtml(item.title || "צילום מסך")}</strong><br>
                    <span class="summary-inline-edit summary-inline-paragraph" contenteditable="true" spellcheck="false" style="white-space: pre-line;" data-meeting-summary-screenshot-id="${item.id}" data-meeting-summary-screenshot-field="caption">${escapeHtml(item.caption || "")}</span>
                  </figcaption>
                </figure>
              `).join("")}
            </div>
          </section>
        ` : ""}
      </article>
    `;
  }

  function addMeetingSummaryFact() {
    state.meetingSummary.facts.push({
      id: createClientSideId("fact"),
      label: "שורה חדשה",
      value: ""
    });
    renderMeetingSummaryTab();
  }

  function addMeetingSummaryRecommendation() {
    state.meetingSummary.recommendationsAuto = false;
    state.meetingSummary.recommendations.push({
      id: createClientSideId("recommendation"),
      text: "המלצה חדשה",
      caption: "",
      imageData: "",
      fileName: ""
    });
    renderMeetingSummaryTab();
  }

  function addMeetingSummaryFollowUp() {
    state.meetingSummary.manualFollowUps = state.meetingSummary.manualFollowUps || [];
    state.meetingSummary.manualFollowUps.push({
      id: createClientSideId("followup"),
      text: "הנחיה חדשה"
    });
    renderMeetingSummaryTab();
  }

  function addMeetingSummaryScreenshot() {
    state.meetingSummary.screenshots.push({
      id: createClientSideId("screenshot"),
      title: "",
      caption: "",
      imageData: "",
      fileName: ""
    });
    renderMeetingSummaryTab();
  }

  function syncMeetingSummaryLiveData() {
    if (!state.meetingSummary || !Array.isArray(state.meetingSummary.facts)) {
      return;
    }
    syncMeetingSummaryFactsFromLiveData();
    if (state.meetingSummary.recommendationsAuto) {
      state.meetingSummary.recommendations = buildMeetingSummaryRecommendations();
    } else {
      syncFundRecommendationsIntoManualSummary();
    }
  }

  function syncMeetingSummaryFactsFromLiveData() {
    const liveFacts = buildMeetingSummaryFacts();
    const hiddenAutoFacts = new Set((state.meetingSummary.hiddenAutoFacts || []).filter(Boolean));
    const liveById = new Map(liveFacts.map((item) => [item.id, item]));
    const liveByLabel = new Map(liveFacts.map((item) => [normalizeMeetingText(item.label), item]));
    const usedIds = new Set();
    const usedLabels = new Set();
    const existingFacts = Array.isArray(state.meetingSummary.facts) ? state.meetingSummary.facts : [];
    const mergedFacts = existingFacts.filter((item) => !hiddenAutoFacts.has(item.id)).map((item) => {
      const liveBySameId = liveById.get(item.id);
      if (liveBySameId) {
        usedIds.add(liveBySameId.id);
        usedLabels.add(normalizeMeetingText(liveBySameId.label));
        return { ...item, value: liveBySameId.value, isAuto: true };
      }
      const key = normalizeMeetingText(item.label);
      const live = liveByLabel.get(key);
      if (!live) {
        return item;
      }
      usedIds.add(live.id);
      usedLabels.add(key);
      return { ...item, id: live.id, value: live.value, isAuto: true };
    });
    liveFacts.forEach((item) => {
      const key = normalizeMeetingText(item.label);
      if (!usedIds.has(item.id) && !usedLabels.has(key) && !hiddenAutoFacts.has(item.id)) {
        mergedFacts.push(item);
      }
    });
    state.meetingSummary.facts = mergedFacts;
  }

  function syncFundRecommendationsIntoManualSummary() {
    const fundsWithRecommendations = getFundsWithMeetingRecommendations();
    const fundRecommendationIds = new Set(fundsWithRecommendations.map((fund) => fund.id));
    const recommendations = Array.isArray(state.meetingSummary.recommendations)
      ? [...state.meetingSummary.recommendations]
      : [];
    const byFundId = new Map();
    recommendations.forEach((item, index) => {
      if (item.sourceFundId) {
        byFundId.set(item.sourceFundId, { item, index });
      }
    });

    const removeFundRecommendationIds = new Set();
    fundsWithRecommendations.forEach((fund) => {
      const itemText = buildFundMeetingRecommendationText(fund);
      const existing = byFundId.get(fund.id);
      if (!itemText) {
        if (existing) {
          removeFundRecommendationIds.add(fund.id);
        }
        return;
      }
      if (existing) {
        existing.item.text = itemText;
        return;
      }
      recommendations.push({
        id: createClientSideId("recommendation"),
        sourceFundId: fund.id,
        text: itemText,
        caption: "",
        imageData: "",
        fileName: ""
      });
    });

    state.meetingSummary.recommendations = recommendations.filter((item) => (
      !item.sourceFundId || fundRecommendationIds.has(item.sourceFundId) && !removeFundRecommendationIds.has(item.sourceFundId)
    ));
  }

  function handleMeetingSummaryFactsInput(event) {
    const input = event.target.closest("[data-meeting-fact-field]");
    if (!input) {
      return;
    }
    const item = state.meetingSummary.facts.find((entry) => entry.id === input.dataset.meetingFactId);
    if (!item) {
      return;
    }
    item[input.dataset.meetingFactField] = input.value;
    renderMeetingSummaryPreviewOnly();
  }

  function handleMeetingSummaryFactsClick(event) {
    const button = event.target.closest("[data-remove-meeting-fact]");
    if (!button) {
      return;
    }
    state.meetingSummary.facts = state.meetingSummary.facts.filter((item) => item.id !== button.dataset.removeMeetingFact);
    renderMeetingSummaryTab();
  }

  function handleMeetingSummaryRecommendationsInput(event) {
    const input = event.target.closest("[data-meeting-recommendation-field]");
    if (!input) {
      return;
    }
    state.meetingSummary.recommendationsAuto = false;
    const item = state.meetingSummary.recommendations.find((entry) => entry.id === input.dataset.meetingRecommendationId);
    if (!item) {
      return;
    }
    item[input.dataset.meetingRecommendationField] = input.value;
    renderMeetingSummaryPreviewOnly();
  }

  function handleMeetingSummaryRecommendationsChange(event) {
    const input = event.target.closest("[data-meeting-recommendation-file]");
    if (!input || !input.files || !input.files[0]) {
      return;
    }
    const item = state.meetingSummary.recommendations.find((entry) => entry.id === input.dataset.meetingRecommendationFile);
    if (!item) {
      return;
    }
    applyImageFileToTarget(input.files[0], item, "recommendation");
  }

  function handleMeetingSummaryRecommendationsClick(event) {
    const button = event.target.closest("[data-remove-meeting-recommendation]");
    if (!button) {
      return;
    }
    state.meetingSummary.recommendationsAuto = false;
    state.meetingSummary.recommendations = state.meetingSummary.recommendations.filter((item) => item.id !== button.dataset.removeMeetingRecommendation);
    renderMeetingSummaryTab();
  }

  function handleMeetingSummaryRecommendationsPaste(event) {
    const box = event.target.closest("[data-meeting-recommendation-paste]");
    if (!box) {
      return;
    }
    const item = state.meetingSummary.recommendations.find((entry) => entry.id === box.dataset.meetingRecommendationPaste);
    if (!item) {
      return;
    }
    const file = getImageFileFromClipboard(event);
    if (!file) {
      return;
    }
    event.preventDefault();
    applyImageFileToTarget(file, item, "recommendation", "clipboard.png");
  }

  function handleMeetingSummaryPreviewPaste(event) {
    const box = event.target.closest("[data-meeting-summary-recommendation-paste]");
    if (!box) {
      return;
    }
    const item = state.meetingSummary.recommendations.find((entry) => entry.id === box.dataset.meetingSummaryRecommendationPaste);
    if (!item) {
      return;
    }
    const file = getImageFileFromClipboard(event);
    if (!file) {
      return;
    }
    event.preventDefault();
    state.meetingSummary.recommendationsAuto = false;
    applyImageFileToTarget(file, item, "recommendation", "clipboard.png");
  }

  function handleMeetingSummaryFollowUpsInput(event) {
    const input = event.target.closest("[data-meeting-followup-field]");
    if (!input) {
      return;
    }
    const item = (state.meetingSummary.manualFollowUps || []).find((entry) => entry.id === input.dataset.meetingFollowupId);
    if (!item) {
      return;
    }
    item[input.dataset.meetingFollowupField] = input.value;
    renderMeetingSummaryPreviewOnly();
  }

  function handleMeetingSummaryFollowUpsClick(event) {
    const button = event.target.closest("[data-remove-meeting-followup]");
    if (!button) {
      return;
    }
    state.meetingSummary.manualFollowUps = (state.meetingSummary.manualFollowUps || []).filter((item) => item.id !== button.dataset.removeMeetingFollowup);
    renderMeetingSummaryTab();
  }

  function handleMeetingSummaryScreenshotsInput(event) {
    const input = event.target.closest("[data-meeting-screenshot-field]");
    if (!input) {
      return;
    }
    const item = state.meetingSummary.screenshots.find((entry) => entry.id === input.dataset.meetingScreenshotId);
    if (!item) {
      return;
    }
    item[input.dataset.meetingScreenshotField] = input.value;
    renderMeetingSummaryPreviewOnly();
  }

  function handleMeetingSummaryScreenshotsChange(event) {
    const input = event.target.closest("[data-meeting-screenshot-file]");
    if (!input || !input.files || !input.files[0]) {
      return;
    }
    const item = state.meetingSummary.screenshots.find((entry) => entry.id === input.dataset.meetingScreenshotFile);
    if (!item) {
      return;
    }
    const file = input.files[0];
    if (!file.type.startsWith("image/")) {
      showToast("אפשר להעלות רק קובצי תמונה", true);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      item.imageData = String(reader.result || "");
      item.fileName = file.name;
      if (!item.title) {
        item.title = file.name.replace(/\.[^.]+$/, "");
      }
      renderMeetingSummaryTab();
    };
    reader.readAsDataURL(file);
  }

  function handleMeetingSummaryScreenshotsClick(event) {
    const button = event.target.closest("[data-remove-meeting-screenshot]");
    if (!button) {
      return;
    }
    state.meetingSummary.screenshots = state.meetingSummary.screenshots.filter((item) => item.id !== button.dataset.removeMeetingScreenshot);
    renderMeetingSummaryTab();
  }

  function handleMeetingSummaryScreenshotsPaste(event) {
    const box = event.target.closest("[data-meeting-screenshot-paste]");
    if (!box) {
      return;
    }
    const item = state.meetingSummary.screenshots.find((entry) => entry.id === box.dataset.meetingScreenshotPaste);
    if (!item) {
      return;
    }
    const file = getImageFileFromClipboard(event);
    if (!file) {
      return;
    }
    event.preventDefault();
    applyImageFileToTarget(file, item, "screenshot", "clipboard.png");
  }

  function handleMeetingSummaryPreviewInput(event) {
    const field = event.target.closest("[data-meeting-summary-field]");
    if (field) {
      const key = field.dataset.meetingSummaryField;
      const value = field.tagName === "INPUT" || field.tagName === "SELECT" ? field.value : field.textContent;
      if (key === "documentDate") {
        state.meetingSummary.documentDate = value;
        return;
      }
      if (key === "adviceType") {
        const currentTitle = state.meetingSummary.documentTitle || "";
        const currentIntro = state.meetingSummary.introText || "";
        const defaultTitles = [
          "הנדון: תכנון פרישה - מסמך מרכז",
          "הנדון: תכנון פנסיוני - מסמך מרכז"
        ];
        const defaultIntros = [
          "מסמך זה מרכז את עיקרי הנתונים, הניתוח המקצועי והמלצות הפעולה כפי שסוכמו בפגישתנו, לטובת ניהול מיטבי של עתידך הפנסיוני.",
          "מסמך זה מרכז את עיקרי הנתונים, הניתוח המקצועי והמלצות הפעולה כפי שסוכמו בפגישתנו, לטובת קבלת החלטות מושכלת וניהול מיטבי של החיסכון הפנסיוני."
        ];
        state.meetingSummary.adviceType = value;
        if (!currentTitle || defaultTitles.includes(currentTitle)) {
          state.meetingSummary.documentTitle = getMeetingSummaryDefaultTitle();
        }
        if (!currentIntro || defaultIntros.includes(currentIntro)) {
          state.meetingSummary.introText = getMeetingSummaryDefaultIntro();
        }
        renderMeetingSummaryPreviewOnly();
        return;
      }
      state.meetingSummary[key] = value;
      return;
    }

    const fact = event.target.closest("[data-meeting-summary-fact-field]");
    if (fact) {
      const item = state.meetingSummary.facts.find((entry) => entry.id === fact.dataset.meetingSummaryFactId);
      if (item) {
        item[fact.dataset.meetingSummaryFactField] = fact.textContent;
      }
      return;
    }

    const recommendation = event.target.closest("[data-meeting-summary-recommendation-field]");
    if (recommendation) {
      state.meetingSummary.recommendationsAuto = false;
      const item = state.meetingSummary.recommendations.find((entry) => entry.id === recommendation.dataset.meetingSummaryRecommendationId);
      if (item) {
        item[recommendation.dataset.meetingSummaryRecommendationField] = recommendation.textContent;
      }
      return;
    }

    const followUp = event.target.closest("[data-meeting-summary-followup-field]");
    if (followUp) {
      const followUps = state.meetingSummary.manualFollowUps || [];
      let item = followUps.find((entry) => entry.id === followUp.dataset.meetingSummaryFollowupId);
      if (!item) {
        const sourceText = decodeURIComponent(followUp.dataset.meetingSummaryFollowupAutoText || "");
        const normalizedSource = normalizeMeetingText(sourceText);
        if (normalizedSource) {
          state.meetingSummary.hiddenAutoFollowUps = state.meetingSummary.hiddenAutoFollowUps || [];
          if (!state.meetingSummary.hiddenAutoFollowUps.includes(normalizedSource)) {
            state.meetingSummary.hiddenAutoFollowUps.push(normalizedSource);
          }
        }
        item = { id: createClientSideId("followup"), text: followUp.textContent || "" };
        followUps.push(item);
        state.meetingSummary.manualFollowUps = followUps;
        followUp.dataset.meetingSummaryFollowupId = item.id;
        delete followUp.dataset.meetingSummaryFollowupAutoText;
      }
      item[followUp.dataset.meetingSummaryFollowupField] = followUp.textContent;
      return;
    }

    const screenshot = event.target.closest("[data-meeting-summary-screenshot-field]");
    if (screenshot) {
      const item = state.meetingSummary.screenshots.find((entry) => entry.id === screenshot.dataset.meetingSummaryScreenshotId);
      if (item) {
        item[screenshot.dataset.meetingSummaryScreenshotField] = screenshot.textContent;
      }
    }
  }

  function handleMeetingSummaryPreviewChange(event) {
    const field = event.target.closest("[data-meeting-summary-field]");
    if (field && field.dataset.meetingSummaryField === "documentDate") {
      state.meetingSummary.documentDate = field.value;
      renderMeetingSummaryPreviewOnly();
    }
  }

  function handleMeetingSummaryPreviewClick(event) {
    const addFact = event.target.closest("[data-add-meeting-summary-fact]");
    if (addFact) {
      addMeetingSummaryFact();
      return;
    }

    const addRecommendation = event.target.closest("[data-add-meeting-summary-recommendation]");
    if (addRecommendation) {
      addMeetingSummaryRecommendation();
      return;
    }

    const addFollowUp = event.target.closest("[data-add-meeting-summary-followup]");
    if (addFollowUp) {
      addMeetingSummaryFollowUp();
      return;
    }

    const removeFact = event.target.closest("[data-remove-meeting-summary-fact]");
    if (removeFact) {
      event.preventDefault();
      event.stopPropagation();
      const factId = removeFact.dataset.removeMeetingSummaryFact;
      const fact = (state.meetingSummary.facts || []).find((item) => item.id === factId);
      if (fact && fact.isAuto) {
        state.meetingSummary.hiddenAutoFacts = state.meetingSummary.hiddenAutoFacts || [];
        if (!state.meetingSummary.hiddenAutoFacts.includes(fact.id)) {
          state.meetingSummary.hiddenAutoFacts.push(fact.id);
        }
      }
      state.meetingSummary.facts = (state.meetingSummary.facts || []).filter((item) => item.id !== factId);
      renderMeetingSummaryTab();
      saveWorkspaceSnapshot();
      return;
    }

    const removeRecommendation = event.target.closest("[data-remove-meeting-summary-recommendation]");
    if (removeRecommendation) {
      state.meetingSummary.recommendationsAuto = false;
      state.meetingSummary.recommendations = state.meetingSummary.recommendations.filter((item) => item.id !== removeRecommendation.dataset.removeMeetingSummaryRecommendation);
      renderMeetingSummaryTab();
      saveWorkspaceSnapshot();
      return;
    }

    const removeFollowUp = event.target.closest("[data-remove-meeting-summary-followup]");
    if (removeFollowUp) {
      const followUpId = removeFollowUp.dataset.removeMeetingSummaryFollowup;
      state.meetingSummary.manualFollowUps = (state.meetingSummary.manualFollowUps || []).filter((item) => item.id !== followUpId);
      const autoText = normalizeMeetingText(decodeURIComponent(removeFollowUp.dataset.removeMeetingSummaryAutoText || ""));
      if (autoText) {
        state.meetingSummary.hiddenAutoFollowUps = state.meetingSummary.hiddenAutoFollowUps || [];
        if (!state.meetingSummary.hiddenAutoFollowUps.includes(autoText)) {
          state.meetingSummary.hiddenAutoFollowUps.push(autoText);
        }
      }
      renderMeetingSummaryTab();
      saveWorkspaceSnapshot();
    }
  }

  function getImageFileFromClipboard(event) {
    const items = Array.from((event.clipboardData && event.clipboardData.items) || []);
    const imageItem = items.find((entry) => entry.type && entry.type.startsWith("image/"));
    return imageItem ? imageItem.getAsFile() : null;
  }

  function applyImageFileToTarget(file, item, kind, fallbackName) {
    if (!file || !file.type.startsWith("image/")) {
      showToast("אפשר להעלות או להדביק רק קובצי תמונה", true);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      item.imageData = String(reader.result || "");
      item.fileName = file.name || fallbackName || "image.png";
      if (kind === "screenshot" && !item.title) {
        item.title = item.fileName.replace(/\.[^.]+$/, "");
      }
      renderMeetingSummaryTab();
      showToast("הצילום נוסף לסיכום הפגישה");
    };
    reader.readAsDataURL(file);
  }

  function refreshMeetingSummaryFromCurrentData() {
    const screenshots = [...(state.meetingSummary.screenshots || [])];
    const recommendationMedia = (state.meetingSummary.recommendations || []).some((item) => item.imageData || item.caption);
    const manualFollowUps = [...(state.meetingSummary.manualFollowUps || [])];
    const showFundsSummaryTable = state.meetingSummary.showFundsSummaryTable !== false;
    const showNeedsSection = state.meetingSummary.showNeedsSection !== false;
    const showFactsTable = state.meetingSummary.showFactsTable !== false;
    const showPensionSnapshotTable = state.meetingSummary.showPensionSnapshotTable !== false;
    const showInfrastructureTable = state.meetingSummary.showInfrastructureTable !== false;
    const showMigrationTable = state.meetingSummary.showMigrationTable !== false;
    state.meetingSummary = {
      ...buildMeetingSummaryDefaults(),
      screenshots,
      manualFollowUps,
      showFundsSummaryTable,
      showNeedsSection,
      showFactsTable,
      showPensionSnapshotTable,
      showInfrastructureTable,
      showMigrationTable,
      recommendations: recommendationMedia ? [...(state.meetingSummary.recommendations || [])] : buildMeetingSummaryRecommendations(),
      recommendationsAuto: !recommendationMedia
    };
    renderMeetingSummaryTab();
    showToast("סיכום הפגישה מולא מחדש לפי הנתונים הקיימים במערכת");
  }

  function printMeetingSummary() {
    const previewHtml = renderMeetingSummaryPreview();
    const printWindow = window.open("", "_blank", "width=1100,height=900");
    if (!printWindow) {
      showToast("הדפדפן חסם פתיחת חלון הדפסה", true);
      return;
    }
    printWindow.document.write(`
      <!doctype html>
      <html lang="he" dir="rtl">
      <head>
        <meta charset="utf-8">
        <title>סיכום פגישה</title>
        <style>
          body { margin: 0; background: #f3efe6; font-family: "Heebo", "Segoe UI", Arial, sans-serif; }
          .summary-paper { width: min(100%, 920px); margin: 18px auto; padding: 26px 28px 30px; border-radius: 22px; background: #fff; color: #22314a; box-shadow: 0 30px 70px rgba(37,32,24,0.12); border: 1px solid rgba(186,143,56,0.18); }
          .summary-paper-top { display: flex; justify-content: space-between; gap: 12px; font-size: 13px; color: #5f6a7c; margin-bottom: 12px; }
          .summary-paper-brand { text-align: center; margin-bottom: 12px; }
          .summary-brand-logo { display:block; width:190px; max-height:76px; object-fit:contain; margin:0 auto 8px; }
          .summary-paper-brand strong { display: inline-block; padding-bottom: 6px; border-bottom: 2px solid rgba(186,143,56,0.32); font-size: 27px; color: #1e3f6f; font-weight: 800; }
          .summary-paper h1, .summary-paper h2, .summary-paper h3 { margin: 0; color: #1e3f6f; }
          .summary-paper h1 { text-align: center; font-size: 27px; margin-bottom: 6px; text-decoration: underline; }
          .summary-paper h2 { text-align: center; font-size: 21px; margin-bottom: 10px; }
          .summary-paper p, .summary-paper li { color: #2f3a4c; line-height: 1.48; }
          .summary-paper section + section { margin-top: 14px; }
          .summary-paper section { break-inside: auto; page-break-inside: auto; }
          .summary-paper-title { margin-bottom: 7px; border-bottom: 2px solid rgba(30,63,111,0.14); padding-bottom: 5px; }
          .summary-paper-title h3 { font-weight: 800; }
          .summary-preview-table { width: 100%; border-collapse: collapse; font-size: 13px; table-layout: fixed; }
          .summary-preview-table th, .summary-preview-table td { border: 1px solid #d8dfeb; padding: 5px 6px; text-align: right; vertical-align: top; word-break: break-word; overflow-wrap: anywhere; white-space: normal; line-height: 1.3; }
          .summary-preview-table th { background: #edf2fa; color: #1e3f6f; }
          .summary-preview-table tbody tr:nth-child(odd) td { background: #ffffff; }
          .summary-preview-table tbody tr:nth-child(even) td { background: #f1f9ff; }
          .summary-needs-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 9px; }
          .summary-needs-card { border: 1px solid rgba(186,143,56,0.22); border-radius: 14px; overflow: hidden; background: linear-gradient(180deg, #fffdf8 0%, #faf4e8 100%); }
          .summary-needs-card h4 { margin: 0; padding: 8px 10px; background: linear-gradient(180deg, #f6ead2 0%, #efdfbc 100%); color: #7d5d22; font-size: 14px; }
          .summary-needs-card table { width: 100%; border-collapse: collapse; }
          .summary-needs-list { display: grid; }
          .summary-needs-head, .summary-needs-item { display: grid; align-items: center; gap: 6px; padding: 6px 8px; font-size: 11px; border-top: 1px solid rgba(186,143,56,0.16); }
          .summary-needs-head { font-weight: 700; color: #7d5d22; background: rgba(246,234,210,0.42); }
          .summary-needs-head span, .summary-needs-item span { min-width: 0; }
          .summary-needs-head span { white-space: nowrap; font-size: 12px; }
          .summary-needs-head-income, .summary-needs-item { grid-template-columns: minmax(104px,1.08fr) minmax(86px,0.88fr) minmax(122px,1.18fr); }
          .summary-needs-head-expenses, .summary-needs-item-expenses { grid-template-columns: minmax(120px,1.3fr) minmax(90px,1fr); }
          .summary-needs-head-expenses-notes, .summary-needs-item-expenses-notes { grid-template-columns: minmax(120px,1.1fr) minmax(90px,0.8fr) minmax(140px,1.4fr); }
          .summary-needs-item-assets { grid-template-columns: minmax(120px,1.4fr) minmax(90px,1fr); }
          .summary-needs-card td, .summary-needs-card th { border-top: 1px solid rgba(186,143,56,0.16); padding: 5px 7px; font-size: 11px; text-align: right; }
          .summary-total-row td, .summary-total-row th { font-weight: 700; background: rgba(239,223,188,0.62); }
          .summary-recommendations { margin: 0; padding-inline-start: 20px; display: grid; gap: 5px; }
          .summary-recommendation-media { margin-top: 10px; border: 1px solid rgba(186,143,56,0.18); border-radius: 14px; overflow: hidden; background: linear-gradient(180deg, #fffdf8 0%, #f8f0df 100%); max-width: 420px; }
          .summary-recommendation-media img { display: block; width: 100%; max-height: 260px; object-fit: contain; background: #fff; }
          .summary-recommendation-media figcaption { padding: 8px 12px 12px; color: #5e6471; font-size: 12px; }
          .summary-followups { margin: 0; padding-inline-start: 20px; display: grid; gap: 4px; color: #2f3a4c; }
          .summary-compact-table { min-width: 0; font-size: 12px; }
          .summary-compact-table th, .summary-compact-table td { padding: 6px 7px; }
          .summary-inline-table-block { margin-top: 10px; break-inside: auto; page-break-inside: auto; }
          .summary-inline-table-block .summary-preview-table-wrap, .summary-inline-table-block .table-wrap { overflow: hidden; }
          .summary-inline-table-block .summary-preview-table, .summary-inline-table-block .beneficiary-compare, .summary-inline-table-block .track-legend-table { width: 100%; table-layout: fixed; }
          .summary-inline-table-block .summary-preview-table, .summary-inline-table-block .beneficiary-compare { font-size: 10.2px; }
          .summary-inline-table-block .summary-preview-table th, .summary-inline-table-block .summary-preview-table td, .summary-inline-table-block .beneficiary-compare th, .summary-inline-table-block .beneficiary-compare td, .summary-inline-table-block .track-legend-table th, .summary-inline-table-block .track-legend-table td { padding: 4px 3px; word-break: break-word; overflow-wrap: anywhere; white-space: normal; line-height: 1.35; }
          .summary-inline-table-block .track-legend-table { font-size: 9.8px; }
          .summary-inline-table-block .panel { margin-top: 10px !important; }
          .beneficiary-compare, .track-legend-table { width: 100%; border-collapse: collapse; min-width: 0 !important; }
          .beneficiary-compare thead { display: table-header-group; }
          .beneficiary-compare tr, .track-legend-table tr { break-inside: avoid; page-break-inside: avoid; }
          .beneficiary-compare th, .beneficiary-compare td, .track-legend-table th, .track-legend-table td { border: 1px solid #ccb788; }
          .beneficiary-compare th, .track-legend-table th { background: #f3e5c7 !important; color: #7d5d22; font-weight: 800; }
          .beneficiary-compare thead tr:first-child th,
          .beneficiary-compare thead tr:nth-child(2) th { background: #ead2a0 !important; color: #6f4f15; font-weight: 900; }
          .beneficiary-compare .matrix-active { background: #f0dfb8 !important; font-weight: 800; }
          .beneficiary-compare tbody tr:nth-child(odd) td, .track-legend-table tbody tr:nth-child(odd) td { background: #ffffff; }
          .beneficiary-compare tbody tr:nth-child(even) td, .track-legend-table tbody tr:nth-child(even) td { background: #f1f9ff; }
          .beneficiary-total-row td, .summary-total-row td, .summary-total-row span, .summary-total-row th { background: #eaf3ff !important; font-weight: 700; }
          .summary-screenshot-grid { display: grid; gap: 18px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
          .summary-screenshot-preview { border: 1px solid rgba(186,143,56,0.16); border-radius: 16px; overflow: hidden; background: #fff; }
          .summary-screenshot-preview img { width: 100%; display: block; }
          .summary-screenshot-preview figcaption { padding: 10px 12px 14px; font-size: 13px; color: #41506b; line-height: 1.7; }
          @media print {
            @page { size: A4 portrait; margin: 10mm 8mm 10mm 8mm; }
            body { background: #fff; }
            * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .summary-inline-controls, .summary-inline-pill-note, .summary-row-remove, .summary-row-add { display: none !important; }
            .summary-recommendation-block, .summary-followup-row, .summary-fact-label-cell { padding-inline-start: 0 !important; }
            .summary-paper, .summary-paper * { box-sizing: border-box; max-width: 100%; }
            .summary-paper { margin: 0; box-shadow: none; border: 0; width: 100%; max-width: none; padding: 7mm 6mm 9mm; border-radius: 0; overflow: visible !important; }
            .summary-paper, .summary-paper * { font-family: "Heebo", "Segoe UI", Arial, sans-serif !important; }
            .summary-paper h1 { font-size: 22px; line-height: 1.2; margin-bottom: 4px; }
            .summary-paper h2 { font-size: 17px; line-height: 1.25; margin-bottom: 7px; }
            .summary-paper h3 { font-size: 15px; line-height: 1.25; }
            .summary-paper p, .summary-paper li { font-size: 12px; line-height: 1.38; margin: 2px 0; }
            .summary-paper section { break-inside: auto !important; page-break-inside: auto !important; }
            .summary-needs-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; }
            .summary-needs-head, .summary-needs-item { padding: 4px 6px; font-size: 9.8px; gap: 5px; }
            .summary-needs-card h4 { padding: 6px 8px; font-size: 12px; }
            .summary-paper section + section { margin-top: 9px; }
            .summary-preview-table-wrap, .table-wrap, .summary-inline-table-block .summary-preview-table-wrap, .summary-inline-table-block .table-wrap { overflow: visible !important; }
            .summary-preview-table, .beneficiary-compare, .track-legend-table { width: 100% !important; max-width: 100% !important; table-layout: auto !important; }
            .summary-inline-table-block .summary-preview-table,
            .summary-inline-table-block .beneficiary-compare { font-size: 9.2px; }
            .summary-inline-table-block .track-legend-table { font-size: 8.9px; }
            .summary-inline-table-block .summary-preview-table th,
            .summary-inline-table-block .summary-preview-table td,
            .summary-inline-table-block .beneficiary-compare th,
            .summary-inline-table-block .beneficiary-compare td,
            .summary-inline-table-block .track-legend-table th,
            .summary-inline-table-block .track-legend-table td { padding: 3px 2px; white-space: normal !important; word-break: break-word !important; overflow-wrap: anywhere !important; vertical-align: top; }
            .summary-preview-table { font-size: 9.6px; min-width: 0 !important; }
            .summary-preview-table th, .summary-preview-table td, .beneficiary-compare th, .beneficiary-compare td, .track-legend-table th, .track-legend-table td { padding: 3px 3px; line-height: 1.22; white-space: normal !important; word-break: break-word !important; overflow-wrap: anywhere !important; vertical-align: top; }
            .summary-recommendation-paste:empty { display: none !important; }
            .summary-paper-title, .summary-inline-table-block, .summary-preview-table-wrap, .table-wrap, .beneficiary-compare, .track-legend-table { break-inside: auto !important; page-break-inside: auto !important; }
            .summary-preview-table th, .summary-preview-table td, .beneficiary-compare th, .beneficiary-compare td, .track-legend-table th, .track-legend-table td { border: 1px solid #bba06a !important; }
          }
        </style>
      </head>
      <body>${previewHtml}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
  }

  async function sendMeetingSummaryToClient() {
    const clientEmail = String(state.client?.email || "").trim();
    const clientName = String(state.client?.fullName || state.client?.firstName || "").trim();
    const clientIdNumber = String(state.client?.idNumber || "").trim();
    const adviceType = state.meetingSummary.adviceType || "pension";
    if (!clientEmail) {
      showToast("לא נמצאה כתובת מייל ללקוח בדוח. אפשר לעדכן מייל בדוח או לשלוח ידנית.", true);
      return;
    }

    const typeLabel = adviceType === "retirement" ? "תכנון פרישה" : "תכנון פנסיוני";
    const greetingName = clientName || "לקוח";
    const subject = `סיכום פגישה - ${typeLabel}${clientName ? ` ${clientName}` : ""}${clientIdNumber ? ` ת.ז ${clientIdNumber}` : ""}`;
    const bodyLines = [
      `שלום ${greetingName},`,
      "",
      adviceType === "retirement"
        ? "שמחתי ללוות אותך בתהליך תכנון הפרישה שלך."
        : "שמחתי ללוות אותך בתהליך התכנון הפנסיוני שלך.",
      "",
      adviceType === "retirement"
        ? "מצורף מסמך המרכז את המלצותיי המקצועיות כפי שסיכמנו, במטרה להבטיח ניצול אופטימלי של זכויותיך והיערכות כלכלית נכונה."
        : "מצורף מסמך המרכז את המלצותיי המקצועיות כפי שסיכמנו, במטרה לאפשר קבלת החלטות מושכלת והיערכות כלכלית נכונה.",
      "",
      "אנא השב למייל זה עם האישור הבא:",
      adviceType === "retirement"
        ? "\"מאשר את המתווה המצורף ואת ביצוע התהליכים בתיק הפרישה.\""
        : "\"מאשר את המתווה המצורף ואת ביצוע התהליכים בתיק הפנסיוני.\"",
      "",
      "עם קבלת האישור, אפעל מול הגופים הרלוונטיים למימוש התוכנית.",
      "",
      "בברכה,",
      (state.meetingSummary.brandName || "ABD-finance")
    ];
    const rtlMark = "\u200F";
    const mailtoBody = bodyLines.map((line) => `${rtlMark}${line}`).join("\r\n");
    const bodyHtml = `
      <div dir="rtl" style="direction:rtl;text-align:right;font-family:Arial,'Heebo',sans-serif;line-height:1.9;color:#1f3554;">
        <p>שלום ${escapeHtml(greetingName)},</p>
        <p>${escapeHtml(adviceType === "retirement" ? "שמחתי ללוות אותך בתהליך תכנון הפרישה שלך." : "שמחתי ללוות אותך בתהליך התכנון הפנסיוני שלך.")}</p>
        <p>${escapeHtml(adviceType === "retirement" ? "מצורף מסמך המרכז את המלצותיי המקצועיות כפי שסיכמנו, במטרה להבטיח ניצול אופטימלי של זכויותיך והיערכות כלכלית נכונה." : "מצורף מסמך המרכז את המלצותיי המקצועיות כפי שסיכמנו, במטרה לאפשר קבלת החלטות מושכלת והיערכות כלכלית נכונה.")}</p>
        <p>אנא השב למייל זה עם האישור הבא:<br><strong>${escapeHtml(adviceType === "retirement" ? "מאשר את המתווה המצורף ואת ביצוע התהליכים בתיק הפרישה." : "מאשר את המתווה המצורף ואת ביצוע התהליכים בתיק הפנסיוני.")}</strong></p>
        <p>עם קבלת האישור, אפעל מול הגופים הרלוונטיים למימוש התוכנית.</p>
        <p>בברכה,<br>${escapeHtml(state.meetingSummary.brandName || "ABD-finance")}</p>
      </div>
    `;
    const previewHtml = renderMeetingSummaryPreview();
    const payload = {
      to: clientEmail,
      cc: "save@m.surense.com",
      subjectBase64: btoa(unescape(encodeURIComponent(subject))),
      bodyTextBase64: btoa(unescape(encodeURIComponent(bodyLines.join("\n")))),
      bodyHtmlBase64: btoa(unescape(encodeURIComponent(bodyHtml))),
      previewHtmlBase64: btoa(unescape(encodeURIComponent(previewHtml))),
      clientName,
      fileBaseNameBase64: btoa(unescape(encodeURIComponent(`סיכום פגישה ${clientName || "לקוח"}`)))
    };

    try {
      showToast("מכין PDF ושולח ללקוח...");
      const response = await fetch(MEETING_SUMMARY_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "שליחת המייל נכשלה");
      }
      showToast("סיכום הפגישה נשלח ללקוח בהצלחה");
      return;
    } catch (error) {
      const mailtoUrl = `mailto:${encodeURIComponent(clientEmail)}?cc=${encodeURIComponent("save@m.surense.com")}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(mailtoBody + "\r\n\r\n" + rtlMark + "יש לצרף את קובץ ה-PDF של סיכום הפגישה לפני השליחה.")}`;
      window.location.href = mailtoUrl;
      showToast("שירות השליחה לא זמין כרגע. נפתחה טיוטת מייל רגילה כגיבוי, ויש לצרף PDF ידנית.", true);
    }
  }

  function getFundMaamad(fund) {
    if (!fund.employers || fund.employers.length === 0) {
      return "עצמאי";
    }
    const clientIdStr = String(state.client && state.client.idNumber ? state.client.idNumber : "").trim();
    const clientIdNum = parseInt(clientIdStr, 10);
    
    let hasSelf = false;
    let hasOther = false;
    
    for (const emp of fund.employers) {
      const empIdStr = String(emp.id || "").trim();
      const empIdNum = parseInt(empIdStr, 10);
      if (!isNaN(empIdNum) && !isNaN(clientIdNum) && empIdNum === clientIdNum) {
        hasSelf = true;
      } else {
        hasOther = true;
      }
    }
    
    if (hasSelf && hasOther) return "מעורב";
    if (hasSelf) return "עצמאי";
    return "שכיר";
  }

  function renderFundsTable(funds) {
    const allVisibleSelected = funds.length > 0 && funds.every((fund) => state.selectedIds.has(fund.id));
    const columns = [
      { id: "selected", label: `<label class="table-check table-check-header table-check-header-compact"><input class="checkbox" type="checkbox" data-select-all-funds="true" ${allVisibleSelected ? "checked" : ""}></label>`, width: 42, htmlLabel: true },
      { id: "retirementTarget", label: "משוך קצבה", width: 112 },
      { id: "manufacturer", label: "יצרן", width: 128 },
      { id: "productType", label: "סוג מוצר", width: 144 },
      { id: "accountNumber", label: "מס' פוליסה/חשבון", width: 156 },
      { id: "maamad", label: "מעמד", width: 80 },
      { id: "investmentTrack", label: "מסלול השקעה", width: 162 },
      { id: "managementFees", label: "דמי ניהול", width: 138 },
      { id: "status", label: "סטטוס", width: 120 },
      { id: "currentBalance", label: "צבירה נוכחית", width: 128 }
    ];

    const rows = funds.map((fund) => ({
      className: fund.id === state.ui.activeFundId ? "is-active" : "",
      attrs: `data-focus-fund="${fund.id}"`,
      cells: {
        selected: `<label class="table-check"><input class="checkbox" type="checkbox" data-fund-check="${fund.id}" ${state.selectedIds.has(fund.id) ? "checked" : ""}></label>`,
        retirementTarget: `<button class="fund-retirement-shortcut ${state.infrastructureSelectedIds.has(fund.id) ? "is-active" : ""}" type="button" data-fund-retirement-shortcut="${fund.id}">${state.infrastructureSelectedIds.has(fund.id) ? "מיועד" : "יעד"}</button>`,
        manufacturer: renderManufacturerLogo(fund),
        productType: escapeHtml(fund.productType || "—"),
        accountNumber: escapeHtml(fund.accountNumber || "—"),
        maamad: `<span style="font-size:13px; font-weight:500; color:var(--text-soft);">${getFundMaamad(fund)}</span>`,
        investmentTrack: escapeHtml(getInfrastructureYieldMode(fund)),
        managementFees: escapeHtml(fund.managementFeeText || "—"),
        status: renderStatusBadge(fund.status),
        currentBalance: fmtCurrency(fund.currentBalance)
      }
    }));

    return renderManagedTable("funds", columns, rows, {
      tableClass: "funds-table",
      emptyMessage: "לא נמצאו קופות להצגה."
    });
  }

  function syncMeetingRecommendationsFromFunds() {
    if (state.meetingSummary && state.meetingSummary.recommendationsAuto) {
      state.meetingSummary.recommendations = buildMeetingSummaryRecommendations();
    } else if (state.meetingSummary) {
      syncFundRecommendationsIntoManualSummary();
    }
  }

  function handleFundsClick(event) {
    const closeButton = event.target.closest("[data-close-fund-modal]");
    if (closeButton) {
      closeFundModal();
      return;
    }
    const closeActivityButton = event.target.closest("[data-close-fund-activity]");
    if (closeActivityButton) {
      state.ui.fundActivityModalOpen = false;
      renderFundActivityModal();
      return;
    }
    const activityButton = event.target.closest("[data-open-fund-activity]");
    if (activityButton) {
      state.ui.fundActivityView = activityButton.dataset.openFundActivity === "employers" ? "employers" : "deposits";
      state.ui.fundActivityModalOpen = true;
      renderFundActivityModal();
      return;
    }
    const migrationProductButton = event.target.closest("[data-migration-target-product]");
    if (migrationProductButton) {
      const fund = state.funds.find((item) => item.id === state.ui.activeFundId);
      if (!fund) return;
      const plan = getFundMigrationPlan(fund);
      const product = migrationProductButton.dataset.migrationTargetProduct || "";
      if (plan.targetProduct !== product) {
        plan.targetProduct = product;
        plan.targetCompany = "";
        plan.managementFeeBalance = "";
        plan.managementFeeDeposit = "";
        plan.investmentTrack = "";
      }
      syncMeetingRecommendationsFromFunds();
      renderFundDetails();
      renderMeetingSummaryPreviewOnly();
      return;
    }
    const migrationCompanyButton = event.target.closest("[data-migration-target-company]");
    if (migrationCompanyButton) {
      const fund = state.funds.find((item) => item.id === state.ui.activeFundId);
      if (!fund) return;
      const plan = getFundMigrationPlan(fund);
      plan.targetCompany = migrationCompanyButton.dataset.migrationTargetCompany || "";
      syncMeetingRecommendationsFromFunds();
      renderFundDetails();
      renderMeetingSummaryPreviewOnly();
      return;
    }
    const templateButton = event.target.closest("[data-fund-template-card]");
    if (templateButton) {
      const fund = state.funds.find((item) => item.id === state.ui.activeFundId);
      if (!fund) {
        return;
      }
      const templateField = templateButton.dataset.fundTemplateCard;
      const templateId = templateButton.dataset.templateId;
      if (!templateField || !templateId) {
        return;
      }
      const selectedKey = `${templateField}TemplateId`;
      const templateText = buildFundTemplateText(templateField, templateId, fund);
      const isSameTemplate = fund[selectedKey] === templateId || Boolean(templateText && fund[templateField] === templateText);
      if (isSameTemplate) {
        fund[selectedKey] = "";
        if (fund[templateField] === templateText) {
          fund[templateField] = "";
        }
      } else {
        fund[selectedKey] = templateId;
        fund[templateField] = templateText;
      }
      if (state.meetingSummary && state.meetingSummary.recommendationsAuto) {
        state.meetingSummary.recommendations = buildMeetingSummaryRecommendations();
      } else if (state.meetingSummary) {
        syncFundRecommendationsIntoManualSummary();
      }
      renderAll();
      return;
    }
    const retirementShortcut = event.target.closest("[data-fund-retirement-shortcut]");
    if (retirementShortcut) {
      const fundId = retirementShortcut.dataset.fundRetirementShortcut;
      if (state.infrastructureSelectedIds.has(fundId)) {
        state.infrastructureSelectedIds.delete(fundId);
      } else {
        state.infrastructureSelectedIds.add(fundId);
      }
      renderAll();
      return;
    }
    const focusTarget = event.target.closest("[data-focus-fund]");
    const clickedInteractive = event.target.closest(
      "[data-fund-check], [data-fund-retirement-shortcut], button, input, select, textarea, a, [contenteditable='true']"
    );
    if (focusTarget && !clickedInteractive) {
      state.ui.activeFundId = focusTarget.dataset.focusFund;
      state.ui.fundModalOpen = true;
      renderFundsTab();
    }
  }

  function handleFundsChange(event) {
    const retirementCheckbox = event.target.closest("[data-fund-retirement-check]");
    if (retirementCheckbox) {
      const fundId = retirementCheckbox.dataset.fundRetirementCheck;
      if (retirementCheckbox.checked) {
        state.infrastructureSelectedIds.add(fundId);
      } else {
        state.infrastructureSelectedIds.delete(fundId);
      }
      renderAll();
      return;
    }
    const checkbox = event.target.closest("[data-fund-check]");
    const selectAll = event.target.closest("[data-select-all-funds]");
    if (selectAll) {
      const funds = getFilteredFunds();
      if (selectAll.checked) {
        funds.forEach((fund) => state.selectedIds.add(fund.id));
      } else {
        funds.forEach((fund) => {
          state.selectedIds.delete(fund.id);
        });
      }
      renderAll();
      return;
    }
    if (!checkbox) {
      return;
    }
    const fundId = checkbox.dataset.fundCheck;
    if (checkbox.checked) {
      state.selectedIds.add(fundId);
    } else {
      state.selectedIds.delete(fundId);
    }
    renderAll();
  }

  function closeFundModal() {
    state.ui.fundModalOpen = false;
    state.ui.fundActivityModalOpen = false;
    dom.fundDetails.hidden = true;
    dom.fundDetails.classList.remove("is-open");
    dom.fundDetails.classList.remove("has-migration-drawer");
    if (dom.fundActivityModal) {
      dom.fundActivityModal.hidden = true;
      dom.fundActivityModal.innerHTML = "";
    }
    document.body.classList.remove("is-fund-activity-open");
    dom.fundModalBackdrop.hidden = true;
  }

  function handleFundDetailsInput(event) {
    const migrationField = event.target.dataset.migrationField;
    if (migrationField) {
      const fund = state.funds.find((item) => item.id === state.ui.activeFundId);
      if (!fund) return;
      const plan = getFundMigrationPlan(fund);
      plan[migrationField] = event.target.value;
      syncMeetingRecommendationsFromFunds();
      if (event.type === "change" && migrationField === "investmentTrack") {
        renderFundDetails();
      } else {
        renderMeetingSummaryPreviewOnly();
      }
      return;
    }
    const templateField = event.target.dataset.fundTemplateField;
    if (templateField) {
      const fund = state.funds.find((item) => item.id === state.ui.activeFundId);
      if (!fund) {
        return;
      }
      const templateId = event.target.value;
      if (!templateId) {
        return;
      }
      fund[`${templateField}TemplateId`] = templateId;
      fund[templateField] = buildFundTemplateText(templateField, templateId, fund);
      event.target.value = "";
      if (state.meetingSummary && state.meetingSummary.recommendationsAuto) {
        state.meetingSummary.recommendations = buildMeetingSummaryRecommendations();
      } else if (state.meetingSummary) {
        syncFundRecommendationsIntoManualSummary();
      }
      renderAll();
      return;
    }
    const field = event.target.dataset.fundField;
    if (!field) {
      return;
    }
    const fund = state.funds.find((item) => item.id === state.ui.activeFundId);
    if (!fund) {
      return;
    }
    if (field === "status") {
      fund.status = event.target.value;
      renderAll();
      return;
    }
    if (field === "liquidityDate") {
      fund.liquidityDate = event.target.value;
      if (event.type === "change") {
        renderAll();
      }
      return;
    }
    if (field === "notes" || field === "recommendation") {
      fund[field] = event.target.value;
      if (state.meetingSummary && state.meetingSummary.recommendationsAuto) {
        state.meetingSummary.recommendations = buildMeetingSummaryRecommendations();
      } else if (state.meetingSummary) {
        syncFundRecommendationsIntoManualSummary();
      }
      if (event.type === "change") {
        renderAll();
      } else {
        renderMeetingSummaryPreviewOnly();
      }
      return;
    }
    fund[field] = toNumber(event.target.value) || 0;
    renderAll();
  }

  function handleInsuranceTableChange(event) {
    const checkbox = event.target.closest("[data-insurance-summary-check]");
    if (!checkbox) {
      return;
    }
    const policyId = checkbox.dataset.insuranceSummaryCheck;
    if (!policyId) {
      return;
    }
    if (checkbox.checked) {
      state.selectedInsurancePolicyIds.add(policyId);
    } else {
      state.selectedInsurancePolicyIds.delete(policyId);
    }
    state.meetingSummary.facts = buildMeetingSummaryFacts();
    renderInsuranceTab();
    renderMeetingSummaryPreviewOnly();
  }

  function handleTrackFactorInput(event) {
    const trackId = event.target.dataset.trackId;
    if (!trackId) {
      return;
    }
    const value = toNumber(event.target.value) || 0;
    if (value > 0) {
      state.calc.customTrackFactors[trackId] = value;
    } else {
      delete state.calc.customTrackFactors[trackId];
    }
    renderAll();
  }

  function cloneFundTemplates(source) {
    return {
      recommendation: (source.recommendation || []).map((item) => ({ ...item })),
      notes: (source.notes || []).map((item) => ({ ...item }))
    };
  }

  function getFundTemplates(field) {
    return state.settings?.templates?.[field] || FUND_TEXT_TEMPLATES[field] || [];
  }

  function saveSettingsState() {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({
        templates: state.settings.templates
      }));
    } catch (error) {
      console.warn("Unable to persist settings", error);
    }
  }

  function loadSettingsState() {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw);
      if (parsed && parsed.templates) {
        state.settings.templates = cloneFundTemplates({
          recommendation: parsed.templates.recommendation || FUND_TEXT_TEMPLATES.recommendation,
          notes: parsed.templates.notes || FUND_TEXT_TEMPLATES.notes
        });
      }
    } catch (error) {
      console.warn("Unable to load settings", error);
    }
  }

  function openSettingsModal() {
    state.settings.settingsModalOpen = true;
    renderSettingsModal();
  }

  function closeSettingsModal() {
    state.settings.settingsModalOpen = false;
    renderSettingsModal();
  }

  function renderSettingsModal() {
    if (!dom.settingsModal || !dom.settingsBackdrop || !dom.settingsTemplatesHost) {
      return;
    }
    dom.settingsModal.hidden = !state.settings.settingsModalOpen;
    dom.settingsBackdrop.hidden = !state.settings.settingsModalOpen;
    const templateSections = [
      { key: "recommendation", title: "תבניות המלצה", description: "אלו התבניות שמופיעות בבחירה של המלצות על קופות ומוצרים." },
      { key: "notes", title: "תבניות הערות", description: "אלו התבניות שמופיעות בבחירה של הערות והשלמות." }
    ];
    dom.settingsTemplatesHost.innerHTML = templateSections.map((section) => `
      <div class="settings-template-group">
        <div class="panel-head" style="margin:0;">
          <div>
            <h3>${escapeHtml(section.title)}</h3>
            <p>${escapeHtml(section.description)}</p>
          </div>
          <div class="top-actions">
            <button class="button button-secondary" type="button" data-settings-add-template="${section.key}">הוסף תבנית</button>
            <button class="button button-secondary" type="button" data-settings-reset-template="${section.key}">איפוס לברירת מחדל</button>
          </div>
        </div>
        <div class="summary-list-editor">
          ${getFundTemplates(section.key).map((template) => `
            <div class="settings-template-card">
              <div class="field">
                <label>שם תבנית</label>
                <input class="input" type="text" data-settings-template-field="label" data-settings-template-type="${section.key}" data-settings-template-id="${template.id}" value="${escapeAttribute(template.label || "")}">
    const template = getFundTemplates(type).find((item) => item.id === templateId);
    if (!template) {
      return;
    }
    template[field] = event.target.value;
    saveSettingsState();
    renderFundsTab();
  }

  function handleSettingsTemplatesClick(event) {
    const addButton = event.target.closest("[data-settings-add-template]");
    if (addButton) {
      const type = addButton.dataset.settingsAddTemplate;
      getFundTemplates(type).push({
        id: createClientSideId(`template_${type}`),
        label: "תבנית חדשה",
        text: type === "recommendation"
          ? "הוחלט לקדם טיפול ב{fundLabel} בהתאם לתכנון ולבחירת הלקוח."
          : "נדרש המשך טיפול או השלמה עבור {fundLabel}."
      });
      saveSettingsState();
      renderSettingsModal();
      renderFundsTab();
      return;
    }
    const removeButton = event.target.closest("[data-settings-remove-template]");
    if (removeButton) {
      const type = removeButton.dataset.settingsRemoveTemplate;
      state.settings.templates[type] = getFundTemplates(type).filter((item) => item.id !== removeButton.dataset.settingsTemplateId);
      saveSettingsState();
      renderSettingsModal();
      renderFundsTab();
      return;
    }
    const resetButton = event.target.closest("[data-settings-reset-template]");
    if (resetButton) {
      const type = resetButton.dataset.settingsResetTemplate;
      state.settings.templates[type] = cloneFundTemplates(FUND_TEXT_TEMPLATES)[type];
      saveSettingsState();
      renderSettingsModal();
      renderFundsTab();
    }
  }

  function renderFundTemplateOptions(field) {
    const templates = getFundTemplates(field);
    return [`<option value="">בחר תבנית מוכנה</option>`]
      .concat(templates.map((template) => `<option value="${escapeAttribute(template.id)}">${escapeHtml(template.label)}</option>`))
      .join("");
  }

  function renderFundTemplateCards(field, fund) {
    const templates = getFundTemplates(field);
    const icons = {
      move_new_product: "＋",
      leave_as_complement: "↻",
      start_annuity: "₪",
      redeem_funds: "▤",
      appointment_change: "♙"
    };
    if (!templates.length) {
      return "";
    }
    return `
      <div class="template-picker-heading">
        <div class="template-picker-kicker">תנועות / השקעות / כספים</div>
        <h3 class="template-picker-title">בחר תבנית המלצה</h3>
      </div>
      <div class="template-card-grid" role="list" aria-label="תבניות המלצה">
        ${templates.map((template) => {
          const templateText = buildFundTemplateText(field, template.id, fund);
          const selectedKey = `${field}TemplateId`;
          const isActive = Boolean(fund?.[selectedKey] === template.id || (templateText && fund?.[field] === templateText));
          return `
            <button class="template-card-button ${isActive ? "is-active" : ""}" type="button" role="listitem" data-fund-template-card="${escapeAttribute(field)}" data-template-id="${escapeAttribute(template.id)}" aria-pressed="${isActive ? "true" : "false"}">
              <span class="template-card-icon" aria-hidden="true">${escapeHtml(icons[template.id] || "✦")}</span>
              <span class="template-card-label">${escapeHtml(template.label)}</span>
            </button>
          `;
        }).join("")}
      </div>
    `;
  }

  function buildFundTemplateText(field, templateId, fund) {
    const productLabel = fund.productType || fund.product || "המוצר";
    const manufacturerLabel = fund.manufacturer || "היצרן הקיים";
    const policyLabel = fund.policyNumber ? ` שמספרה ${fund.policyNumber}` : "";
    const fundLabel = `${productLabel} ב${manufacturerLabel}${policyLabel}`;
    const template = getFundTemplates(field).find((item) => item.id === templateId);
    if (!template || !template.text) {
      return "";
    }
    return String(template.text)
      .replaceAll("{fundLabel}", fundLabel)
      .replaceAll("{productLabel}", productLabel)
      .replaceAll("{manufacturerLabel}", manufacturerLabel)
      .replaceAll("{policyLabel}", policyLabel.trim() || "ללא מספר פוליסה");
  }

  function handleTrackSelectClick(event) {
    const button = event.target.closest("[data-select-track]");
    if (!button) {
      return;
    }
    state.calc.activeTrack = button.dataset.selectTrack;
    syncBeneficiaryTrackControls();
    renderAll();
  }

  function handleFactorPolicyTableChange(event) {
    const selection = event.target.closest("[data-factor-select]");
    if (selection) {
      const fundId = selection.dataset.factorSelect;
      if (selection.checked) {
        state.calc.factorSelectedIds.add(fundId);
      } else {
        state.calc.factorSelectedIds.delete(fundId);
      }
      renderFactorTab();
      return;
    }

    const rowInput = event.target.closest("[data-factor-row]");
    if (rowInput) {
      const fundId = rowInput.dataset.factorRow;
      const value = toNumber(rowInput.value);
      if (value > 0) {
        state.calc.factorAssignments[fundId] = value;
      } else {
        delete state.calc.factorAssignments[fundId];
      }
      renderFactorTab();
    }
  }

  function applyFactorToSelectedPolicies() {
    if (!dom.groupFactorAssignInput) {
      showToast("מסך המקדם אינו פעיל במבנה הנוכחי.", true);
      return;
    }
    const coefficient = toNumber(dom.groupFactorAssignInput.value);
    if (!(coefficient > 0)) {
      showToast("הזן מקדם תקין לקבוצה", true);
      return;
    }
    if (!state.calc.factorSelectedIds.size) {
      showToast("סמן לפחות פוליסה אחת להקצאה", true);
      return;
    }
    state.calc.factorSelectedIds.forEach((fundId) => {
      state.calc.factorAssignments[fundId] = coefficient;
    });
    state.calc.factorSelectedIds = new Set();
    dom.groupFactorAssignInput.value = "";
    renderFactorTab();
  }

  function clearFactorForSelectedPolicies() {
    if (!state.calc.factorSelectedIds.size) {
      showToast("לא סומנו פוליסות לניקוי", true);
      return;
    }
    state.calc.factorSelectedIds.forEach((fundId) => {
      delete state.calc.factorAssignments[fundId];
    });
    state.calc.factorSelectedIds = new Set();
    renderFactorTab();
  }

  function resetFactorAssignments() {
    state.calc.factorAssignments = {};
    state.calc.factorSelectedIds = new Set();
    if (dom.groupFactorAssignInput) {
      dom.groupFactorAssignInput.value = "";
    }
    renderFactorTab();
  }

  function syncBeneficiaryTrackControls() {
    const track = getTrackConfig(state.calc.activeTrack);
    state.calc.guaranteeMonths = track.guaranteeMonths;
    state.calc.spouseShare = track.spouseShare;
    dom.mainTrackSelect.value = state.calc.activeTrack;
  }

  function buildTrackResult(trackId) {
    const track = getTrackConfig(trackId);
    const selectedFunds = getSelectedFunds();
    const capital = getSimulationCapital(state.calc.manualCapital);
    const weightedBaseFactor = getWeightedBaseFactor(selectedFunds, state.calc.fallbackFactor);
    const coefficient = getTrackCoefficient(track.id, weightedBaseFactor);
    const monthlyPension = coefficient > 0 ? capital / coefficient : 0;
    const importedPension = sumBy(selectedFunds, (fund) => fund.importedPension);
    return {
      id: track.id,
      label: track.label,
      note: track.note,
      coefficient,
      monthlyPension,
      capital,
      importedPension,
      guaranteeMonths: track.guaranteeMonths,
      spouseShare: track.spouseShare
    };
  }

  function getTrackCoefficient(trackId, baseFactor) {
    const custom = toNumber(state.calc.customTrackFactors[trackId]);
    if (custom > 0) {
      return custom;
    }
    const track = getTrackConfig(trackId);
    return roundNumber(baseFactor * track.multiplier, 2);
  }

  function getTrackConfig(trackId) {
    return TRACK_PRESETS.find((item) => item.id === trackId) || TRACK_PRESETS[0];
  }

  function getSelectedFunds() {
    return getDashboardSelectedFunds();
  }

  function getDashboardSelectedFunds() {
    return state.funds.filter((fund) => state.selectedIds.has(fund.id));
  }

  function getInfrastructureFunds() {
    return state.funds.filter((fund) => state.infrastructureSelectedIds.has(fund.id));
  }

  function getFilteredFunds() {
    const search = state.filters.search.trim().toLowerCase();
    const funds = state.funds.filter((fund) => {
      if (state.filters.manufacturer !== "all" && fund.manufacturer !== state.filters.manufacturer) return false;
      if (state.filters.productType !== "all" && fund.productType !== state.filters.productType) return false;
      if (state.filters.status !== "all" && fund.status !== state.filters.status) return false;
      if (!search) return true;
      const haystack = [
        fund.manufacturer,
        fund.productType,
        fund.accountNumber,
        fund.status,
        fund.productName,
        fund.planName,
        fund.retirementTrackName
      ].join(" ").toLowerCase();
      return haystack.includes(search);
    });
    return funds.sort(compareFunds(state.filters.sort));
  }

  function compareFunds(sortKey) {
    return (left, right) => {
      switch (sortKey) {
        case "manufacturer-desc":
          return compareText(right.manufacturer, left.manufacturer);
        case "capital-desc":
          return getFundCapital(right) - getFundCapital(left);
        case "capital-asc":
          return getFundCapital(left) - getFundCapital(right);
        case "pension-desc":
          return right.importedPension - left.importedPension;
        case "factor-asc":
          return getFundBaseFactor(left, state.calc.fallbackFactor) - getFundBaseFactor(right, state.calc.fallbackFactor);
        case "manufacturer-asc":
        default:
          return compareText(left.manufacturer, right.manufacturer);
      }
    };
  }

  function ensureTableLayout(tableKey, columns) {
    const current = state.ui.tableLayouts[tableKey] || {};
    const validIds = columns.map((column) => column.id);
    const order = Array.isArray(current.order) ? current.order.filter((id) => validIds.includes(id)) : [];
    validIds.forEach((id) => {
      if (!order.includes(id)) {
        order.push(id);
      }
    });

    const widths = { ...(current.widths || {}) };
    columns.forEach((column) => {
      const bounds = getManagedColumnBounds(tableKey, column);
      widths[column.id] = clamp(toNumber(widths[column.id]) || column.width || bounds.defaultWidth, bounds.min, bounds.max);
    });

    const layout = {
      order,
      widths,
      hidden: Array.isArray(current.hidden) ? current.hidden.filter((id) => validIds.includes(id)) : [],
      rowHeight: clamp(toNumber(current.rowHeight) || 42, 34, 56),
      rowHeights: Object.fromEntries(
        Object.entries(current.rowHeights || {}).map(([key, value]) => [key, clamp(toNumber(value) || 42, 34, 56)])
      ),
      widthScale: 1,
      managerOpen: Boolean(current.managerOpen)
    };
    state.ui.tableLayouts[tableKey] = layout;
    return layout;
  }

  function getManagedColumnBounds(tableKey, column) {
    const wideColumns = new Set(["productType", "investmentTrack", "managementFees", "planName", "periodText", "mainBranch", "secondaryBranch"]);
    const compactColumns = new Set(["selected", "index"]);
    if (compactColumns.has(column.id)) {
      return { min: 42, max: 80, defaultWidth: column.width || 54 };
    }
    if (tableKey === "infrastructure") {
      return { min: 58, max: wideColumns.has(column.id) ? 138 : 112, defaultWidth: column.width || 92 };
    }
    return { min: 58, max: wideColumns.has(column.id) ? 164 : 132, defaultWidth: column.width || 96 };
  }

  function getVisibleManagedColumns(tableKey, columns) {
    const layout = ensureTableLayout(tableKey, columns);
    const byId = new Map(columns.map((column) => [column.id, column]));
    return layout.order
      .filter((id) => byId.has(id) && !layout.hidden.includes(id))
      .map((id) => {
        const column = byId.get(id);
        const bounds = getManagedColumnBounds(tableKey, column);
        return {
          ...column,
          width: Math.round(clamp(layout.widths[id] || column.width || bounds.defaultWidth, bounds.min, bounds.max))
        };
      });
  }

  function renderManagedTableManager(tableKey, columns) {
    const layout = ensureTableLayout(tableKey, columns);
    const byId = new Map(columns.map((column) => [column.id, column]));
    const ordered = layout.order.map((id) => byId.get(id)).filter(Boolean);

    return `
      <div class="table-manager">
        <div class="table-manager-grid">
          ${ordered.map((column) => `
            <div class="table-manager-row">
              <label>
                <input class="checkbox" type="checkbox" data-column-visible="${column.id}" data-table-key="${tableKey}" ${layout.hidden.includes(column.id) ? "" : "checked"}>
                <span>${escapeHtml(column.label)}</span>
              </label>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  function renderManagedTable(tableKey, columns, rows, options = {}) {
    state.ui.tableColumnDefs = state.ui.tableColumnDefs || {};
    state.ui.tableColumnDefs[tableKey] = columns.map((column) => ({ ...column }));
    const layout = ensureTableLayout(tableKey, columns);
    const visibleColumns = getVisibleManagedColumns(tableKey, columns);

    if (!rows.length) {
      return `<div class="empty-state">${escapeHtml(options.emptyMessage || "אין נתונים להצגה.")}</div>`;
    }

    return `
      <div class="managed-table-shell" data-managed-table-shell="${tableKey}">
        <div class="table-config-bar">
          <div class="table-config-actions">
            <button class="button button-secondary" type="button" data-table-manager-toggle="${tableKey}">סנן</button>
            <button class="button button-secondary" type="button" data-reset-table-layout="${tableKey}">איפוס</button>
          </div>
          ${layout.managerOpen ? renderManagedTableManager(tableKey, columns) : ""}
        </div>

        <div class="table-wrap">
          <table class="managed-table ${options.tableClass || ""}" style="--row-height:${layout.rowHeight}px;">
            <thead>
              <tr>
                ${visibleColumns.map((column) => `
                  <th style="width:${column.width}px;min-width:${column.width}px;">
                    <span>${column.htmlLabel ? column.label : escapeHtml(column.label)}</span>
                    <span class="managed-table-resize-col" data-column-resize="${column.id}" data-table-key="${tableKey}" aria-hidden="true"></span>
                  </th>
                `).join("")}
              </tr>
            </thead>
            <tbody>
              ${rows.map((row, rowIndex) => `
              <tr class="${row.className || ""}" ${row.attrs || ""} style="height:${clamp(toNumber(layout.rowHeights?.[rowIndex]) || layout.rowHeight, 34, 56)}px;">
                  ${visibleColumns.map((column, columnIndex) => `
                    <td style="width:${column.width}px;min-width:${column.width}px;">${row.cells[column.id] ?? ""}${columnIndex === visibleColumns.length - 1 ? `<span class="managed-table-resize-row" data-row-resize="${tableKey}" data-row-index="${rowIndex}" aria-hidden="true"></span>` : ""}</td>
                  `).join("")}
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function moveLayoutColumn(tableKey, columnId, direction) {
    const layout = state.ui.tableLayouts[tableKey];
    if (!layout) {
      return;
    }
    const index = layout.order.indexOf(columnId);
    if (index === -1) {
      return;
    }
    const targetIndex = direction === "prev" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= layout.order.length) {
      return;
    }
    const nextOrder = [...layout.order];
    [nextOrder[index], nextOrder[targetIndex]] = [nextOrder[targetIndex], nextOrder[index]];
    layout.order = nextOrder;
  }

  function rerenderManagedTable(tableKey) {
    if (tableKey === "funds") {
      renderFundsTab();
      return;
    }
    if (tableKey === "insurance") {
      renderInsuranceTab();
      return;
    }
    if (tableKey === "infrastructure") {
      renderInfrastructureTab();
      return;
    }
  }

  function handleManagedTableClick(event) {
    const toggle = event.target.closest("[data-table-manager-toggle]");
    if (toggle) {
      const tableKey = toggle.dataset.tableManagerToggle;
      const layout = state.ui.tableLayouts[tableKey];
      if (layout) {
        layout.managerOpen = !layout.managerOpen;
        rerenderManagedTable(tableKey);
      }
      return;
    }

    const reset = event.target.closest("[data-reset-table-layout]");
    if (reset) {
      state.ui.tableLayouts[reset.dataset.resetTableLayout] = {};
      rerenderManagedTable(reset.dataset.resetTableLayout);
      return;
    }

  }

  function handleManagedTableInput(event) {
    const visibleToggle = event.target.closest("[data-column-visible]");
    if (visibleToggle) {
      const tableKey = visibleToggle.dataset.tableKey;
      const layout = state.ui.tableLayouts[tableKey];
      if (layout) {
        if (visibleToggle.checked) {
          layout.hidden = layout.hidden.filter((id) => id !== visibleToggle.dataset.columnVisible);
        } else if (!layout.hidden.includes(visibleToggle.dataset.columnVisible)) {
          layout.hidden.push(visibleToggle.dataset.columnVisible);
        }
        rerenderManagedTable(tableKey);
      }
      return;
    }
  }

  function startManagedTableResize(event) {
    const columnHandle = event.target.closest("[data-column-resize]");
    if (columnHandle) {
      const tableKey = columnHandle.dataset.tableKey;
      const columnId = columnHandle.dataset.columnResize;
      const layout = state.ui.tableLayouts[tableKey];
      if (!layout) return;
      const columnDef = (state.ui.tableColumnDefs?.[tableKey] || []).find((item) => item.id === columnId) || { id: columnId, width: 150 };
      const bounds = getManagedColumnBounds(tableKey, columnDef);
      event.preventDefault();
      state.ui.tableResize = {
        type: "column",
        tableKey,
        columnId,
        startX: event.clientX,
        initialWidth: clamp(layout.widths[columnId] || columnDef.width || bounds.defaultWidth, bounds.min, bounds.max)
      };
      document.body.style.cursor = "col-resize";
      return;
    }

    const rowHandle = event.target.closest("[data-row-resize]");
    if (rowHandle) {
      const tableKey = rowHandle.dataset.rowResize;
      const rowIndex = rowHandle.dataset.rowIndex;
      const layout = state.ui.tableLayouts[tableKey];
      if (!layout) return;
      event.preventDefault();
      state.ui.tableResize = {
        type: "row",
        tableKey,
        rowIndex,
        startY: event.clientY,
        initialHeight: clamp(toNumber(layout.rowHeights?.[rowIndex]) || layout.rowHeight || 48, 24, 140)
      };
      document.body.style.cursor = "row-resize";
    }
  }

  function handleManagedTableResizeMove(event) {
    const resizeState = state.ui.tableResize;
    if (!resizeState) return;
    const layout = state.ui.tableLayouts[resizeState.tableKey];
    if (!layout) return;
    if (resizeState.type === "column") {
      const columnDef = (state.ui.tableColumnDefs?.[resizeState.tableKey] || []).find((item) => item.id === resizeState.columnId) || { id: resizeState.columnId, width: 150 };
      const bounds = getManagedColumnBounds(resizeState.tableKey, columnDef);
      const delta = event.clientX - resizeState.startX;
      layout.widths[resizeState.columnId] = clamp(resizeState.initialWidth + delta, bounds.min, bounds.max);
      rerenderManagedTable(resizeState.tableKey);
      return;
    }
    if (resizeState.type === "row") {
      const delta = event.clientY - resizeState.startY;
      layout.rowHeights[resizeState.rowIndex] = clamp(resizeState.initialHeight + delta, 24, 140);
      rerenderManagedTable(resizeState.tableKey);
    }
  }

  function stopManagedTableResize() {
    if (!state.ui.tableResize) return;
    state.ui.tableResize = null;
    document.body.style.cursor = "";
  }

  function isCapitalBalanceType(label) {
    return /הון/.test(label || "");
  }

  function isPensionBalanceType(label) {
    return /קצבה/.test(label || "");
  }

  function isCompensationComponent(label) {
    return /פיצויים/.test(label || "");
  }

  function isBefore2000Period(label) {
    return /1997 2000/.test(label || "");
  }

  function isFrom2008Period(label) {
    return /2008|2012/.test(label || "");
  }

  function getInfrastructureBalanceKind(row) {
    const code = String(row?.balanceTypeCode || "").trim();
    if (code === "1") return "capital";
    if (code === "2" || code === "3") return "pension";
    const label = row?.balanceTypeLabel || "";
    if (isCapitalBalanceType(label)) return "capital";
    if (isPensionBalanceType(label)) return "pension";
    return "other";
  }

  function getInfrastructureComponentKind(row) {
    const code = String(row?.componentCode || "").trim();
    if (code === "1") return "compensation";
    if (code === "2" || code === "3" || code === "4") return "contribution";
    const label = row?.componentLabel || "";
    if (isCompensationComponent(label)) return "compensation";
    if (/תגמולים/.test(label)) return "contribution";
    return "other";
  }

  function getInfrastructureLayerKind(row) {
    const code = String(row?.periodCode || "").trim();
    if (code === "1") return "before2000";
    if (code === "2") return "through2008";
    if (code === "3") return "from2008";
    if (code === "4" || code === "6") return "capital-through2008";
    if (code === "7") return "capital-from2008";
    if (code === "9") return "capital-route";
    const label = normalizeText(row?.periodLabel || "");
    if (/לאחר\s*חוק\s*ההסדרים|אחרי\s*חוק\s*ההסדרים/.test(label)) return "after2000";
    if (/עד\s*חוק\s*ההסדרים/.test(label)) return "before2000";
    if (/לפני\s*2000|עד\s*2000|31\/12\/1999|1999/.test(label)) return "before2000";
    if (/2000\s*ואילך|אחרי\s*2000|לאחר\s*2000|משנת\s*2000|החל\s*מ-?\s*2000/.test(label)) return "after2000";
    if (/עד\s*2008/.test(label)) return "through2008";
    if (/מ-?\s*2008|אחרי\s*2008/.test(label)) return "from2008";
    if (/קצבתי/.test(label)) return "pension-route";
    if (/הוני/.test(label)) return "capital-route";
    return "other";
  }

  function getInfrastructureBucket(row, context = {}) {
    if (row.componentKind === "compensation") {
      return row.balanceKind === "capital" ? "compensationCapital" : "compensationPension";
    }

    if (row.componentKind !== "contribution") return "";

    const layerCode = String(row?.periodCode || "").trim();
    if (layerCode === "1") {
      if (row.balanceKind === "capital") return "capitalBefore2008";
      return "pensionBefore2000";
    }
    if (layerCode === "2") {
      if (context.isCapitalProduct || row.balanceKind === "capital") return "capitalAfter2008";
      return "pensionAfter2000";
    }
    if (layerCode === "3" || layerCode === "5") return "capitalBefore2008";
    if (layerCode === "4" || layerCode === "6") return "capitalBefore2008";
    if (layerCode === "7") return context.hasCapitalLegacyRows || context.isCapitalProduct ? "capitalAfter2008" : "pensionAfter2000";
    if (layerCode === "9") return row.balanceKind === "capital" ? "capitalAfter2008" : "pensionAfter2000";

    if (row.layerKind === "before2000") {
      if (row.balanceKind === "capital") return "capitalBefore2008";
      return "pensionBefore2000";
    }
    if (row.layerKind === "after2000") return row.balanceKind === "capital" || context.isCapitalProduct ? "capitalAfter2008" : "pensionAfter2000";
    if (row.layerKind === "through2008") return row.balanceKind === "capital" || context.isCapitalProduct ? "capitalAfter2008" : "pensionAfter2000";
    if (row.layerKind === "from2008") return "capitalBefore2008";
    if (row.layerKind === "capital-through2008") return "capitalBefore2008";
    if (row.layerKind === "capital-from2008") return context.hasCapitalLegacyRows || context.isCapitalProduct ? "capitalAfter2008" : "pensionAfter2000";
    if (row.layerKind === "capital-route") return row.balanceKind === "capital" ? "capitalAfter2008" : "pensionAfter2000";
    if (row.layerKind === "pension-route") return "pensionAfter2000";

    if (row.balanceKind === "capital") return "capitalAfter2008";
    if (row.balanceKind === "pension") return "pensionAfter2000";
    return "";
  }

  function getInfrastructureBucketContext(fund, rows) {
    const fundText = normalizeText([
      fund?.productType,
      fund?.productName,
      fund?.planName,
      fund?.investmentTrack
    ].filter(Boolean).join(" "));
    const isCapitalProduct = fundText.includes("הון מנהלים") || /תכנית\s*הון/.test(fundText);
    const hasPensionContinuationLayer = rows.some((row) =>
      row.componentKind === "contribution" &&
      row.balanceKind === "pension" &&
      (String(row?.periodCode || "").trim() === "2" || row.layerKind === "after2000" || row.layerKind === "through2008")
    );
    const hasCapitalLegacyRows = rows.some((row) => {
      if (row.componentKind !== "contribution") return false;
      const code = String(row?.periodCode || "").trim();
      return row.balanceKind === "capital" && ["3", "4", "5", "6"].includes(code);
    });
    return { isCapitalProduct, hasPensionContinuationLayer, hasCapitalLegacyRows };
  }

  function normalizeInfrastructureRows(rows) {
    const seenContributionRows = new Set();
    return (rows || []).reduce((acc, row) => {
      const amount = toNumber(row?.amount);
      if (!(amount > 0)) return acc;
      const normalized = {
        ...row,
        amount,
        layerKind: getInfrastructureLayerKind(row),
        balanceKind: getInfrastructureBalanceKind(row),
        componentKind: getInfrastructureComponentKind(row)
      };
      if (normalized.componentKind === "contribution") {
        const duplicateKey = [
          normalized.layerKind,
          normalized.balanceKind,
          normalized.componentCode || "",
          normalized.componentLabel || "",
          roundNumber(amount, 2)
        ].join("|");
        if (seenContributionRows.has(duplicateKey)) {
          return acc;
        }
        seenContributionRows.add(duplicateKey);
      }
      acc.push(normalized);
      return acc;
    }, []);
  }

  function getInfrastructureYieldMode(fund) {
    if (/כן/i.test(fund.guaranteedYieldFlag || "")) {
      return "כולל אינדיקציה להבטחת תשואה";
    }
    if (fund.investmentTrack) {
      return fund.investmentTrack;
    }
    return "לפי נתוני הדוח";
  }

  function buildInfrastructureRows(sourceFunds = getInfrastructureFunds()) {
    return sourceFunds.map((fund, index) => {
      const rows = normalizeInfrastructureRows(fund.periodRows || []);
      const bucketContext = getInfrastructureBucketContext(fund, rows);
      const bucketOf = (row) => getInfrastructureBucket(row, bucketContext);
      let compensationPension = sumBy(rows.filter((row) => bucketOf(row) === "compensationPension"), (row) => row.amount);
      let compensationCapital = sumBy(rows.filter((row) => bucketOf(row) === "compensationCapital"), (row) => row.amount);
      let capitalBefore2008 = sumBy(rows.filter((row) => bucketOf(row) === "capitalBefore2008"), (row) => row.amount);
      let capitalAfter2008 = sumBy(rows.filter((row) => bucketOf(row) === "capitalAfter2008"), (row) => row.amount);
      let pensionBefore2000 = sumBy(rows.filter((row) => bucketOf(row) === "pensionBefore2000"), (row) => row.amount);
      let pensionAfter2000 = sumBy(rows.filter((row) => bucketOf(row) === "pensionAfter2000"), (row) => row.amount);
      let total = compensationPension + compensationCapital + capitalBefore2008 + capitalAfter2008 + pensionBefore2000 + pensionAfter2000;

      const referenceTotal = firstPositive(
        toNumber(fund.retirementCapital),
        toNumber(fund.currentBalance),
        total,
        0
      );

      if (referenceTotal > 0 && total <= 0) {
        const fundTypeText = `${fund.productType || ""} ${fund.productName || ""} ${fund.productCategory || ""}`;
        if (/(פנסיה|ביטוח מנהלים|קצבה)/i.test(fundTypeText)) {
          pensionAfter2000 = referenceTotal;
        } else {
          capitalAfter2008 = referenceTotal;
        }
        total = compensationPension + compensationCapital + capitalBefore2008 + capitalAfter2008 + pensionBefore2000 + pensionAfter2000;
      }

      if (!rows.length && referenceTotal > 0 && total > 0) {
        const diff = Math.abs(total - referenceTotal);
        const tolerance = Math.max(1, referenceTotal * 0.03);
        if (diff > tolerance) {
          const ratio = referenceTotal / total;
          compensationPension *= ratio;
          compensationCapital *= ratio;
          capitalBefore2008 *= ratio;
          capitalAfter2008 *= ratio;
          pensionBefore2000 *= ratio;
          pensionAfter2000 *= ratio;
          total = compensationPension + compensationCapital + capitalBefore2008 + capitalAfter2008 + pensionBefore2000 + pensionAfter2000;
        }
      }

      return {
        id: fund.id,
        index: index + 1,
        manufacturer: fund.manufacturer,
        accountNumber: fund.accountNumber,
        startDate: fund.startDate || "לא זמין",
        yieldMode: getInfrastructureYieldMode(fund),
        compensationPension,
        compensationCapital,
        capitalBefore2008,
        capitalAfter2008,
        pensionBefore2000,
        pensionAfter2000,
        importedPension: toNumber(fund.importedPension),
        total
      };
    });
  }

  function renderInfrastructurePillStrip(rows) {
    if (!rows.length) {
      return `<span class="badge">טרם סומנו קופות לייעוד קצבה</span>`;
    }
    const totals = [
      ["סך צבירה", sumBy(rows, (row) => row.total)],
      ["סך תגמולים הון", sumBy(rows, (row) => row.capitalBefore2008 + row.capitalAfter2008)],
      ["סך תגמולים לקצבה", sumBy(rows, (row) => row.pensionBefore2000 + row.pensionAfter2000)],
      ["סך פיצויים הון", sumBy(rows, (row) => row.compensationCapital)],
      ["סך פיצויים לקצבה", sumBy(rows, (row) => row.compensationPension)],
      ["סך צבירה לקצבה", sumBy(rows, (row) => row.compensationPension + row.pensionBefore2000 + row.pensionAfter2000)],
      ["קצבה חזויה (ללא הפקדות)", sumBy(rows, (row) => row.importedPension)],
      ["סך פרמיה", 0]
    ];
    return totals.map(([label, amount]) => `<span class="badge">${escapeHtml(label)} ${fmtCurrency(amount)}</span>`).join("");
  }

  function renderInfrastructureLegend() {
    const rows = [
      ["תגמולים הוניים", "נבחנים למשיכה או להיוון לפי ותק הכספים, סוג המוצר וכללי המס במועד הפרישה.", "זהו סיווג כללי בלבד. המימוש בפועל תלוי בתנאי הקופה, באירוע הפרישה ובאישורי המס."],
      ["תגמולים לקצבה", "נבחנים ככספים שמיועדים לקצבה, ולעתים גם להיוון או לפטור חלקי.", "הטיפול בפועל תלוי בין היתר בקיבוע זכויות, גיל הזכאות, סוג הקצבה והיסטוריית המשיכות."],
      ["פיצויים הוניים", "נבדקים כחלק ממענקי פרישה או כרכיב פיצויים הוני.", "נדרשת בחינה של טופס 161, רצפים קודמים, התחשבנות עבר ומעמד הכספים בקופה."],
      ["פיצויים לקצבה", "נבדקים כרכיב שניתן לייעד לקצבה או להמשך רצף.", "ההחלטה אם למשוך, לייעד לקצבה או להמשיך רצף תלויה בבחירת הלקוח ובאישור המס הרלוונטי."],
      ["הערת עבודה", "לא מוצגים כאן סכומי סף קשיחים.", "התקרות, הפטורים והחבות עשויים להשתנות לפי שנת מס, גיל, קיבוע זכויות, רצף פיצויים/קצבה ונתוני הלקוח."]
    ];

    return `
      <div class="needs-note" style="margin-bottom:12px;">
        הפירוט כאן כללי בלבד ומבוסס על הסיווג שבדוח. לא מוצגים סכומי פטור או חבות שלא אומתו ספציפית ללקוח.
      </div>
      <div class="table-wrap">
        <table class="compact-table">
          <thead>
            <tr>
              <th>רכיב</th>
              <th>אופן בחינה</th>
              <th>הסבר</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((row) => `
              <tr>
                <td>${row[0]}</td>
                <td>${row[1]}</td>
                <td>${row[2]}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
      <div class="needs-note" style="margin-top:12px;">
        מקורות רשמיים:
        <a href="https://www.gov.il/he/service/itc-request-for-fixed-rights-at-retirement-age" target="_blank" rel="noreferrer">קיבוע זכויות</a> |
        <a href="https://www.gov.il/he/service/compensation-and-annuity-sequence" target="_blank" rel="noreferrer">רצף פיצויים ורצף קצבה</a> |
        <a href="https://www.gov.il/he/service/notice-of-retirement" target="_blank" rel="noreferrer">טופס 161 החדש</a> |
        <a href="https://www.gov.il/he/service/itc-financial-compensation-without-deduction-tax" target="_blank" rel="noreferrer">משיכת תגמולים ללא ניכוי מס</a>
      </div>
    `;
  }

  function renderInfrastructureTab() {
    const rows = buildInfrastructureRows();
    const totalCapital = sumBy(rows, (row) => row.compensationCapital + row.capitalBefore2008 + row.capitalAfter2008);
    const totalPension = sumBy(rows, (row) => row.compensationPension + row.pensionBefore2000 + row.pensionAfter2000);

    dom.infrastructurePillStrip.innerHTML = "";

    dom.infrastructureSummaryGrid.innerHTML = [
      renderResultCard("קופות בטבלה", String(rows.length), "מבוסס על הקופות שיועדו לקצבה"),
      renderResultCard("רכיב הוני", fmtCurrency(totalCapital), "פיצויים הוניים ותגמולי הון"),
      renderResultCard("רכיב קצבתי", fmtCurrency(totalPension), "פיצויים קצבתיים ותגמולים לקצבה"),
      renderResultCard("סה\"כ", fmtCurrency(totalCapital + totalPension), "סכום כל הרכיבים בטבלת התשתיות")
    ].join("");

    const columns = [
      { id: "manufacturer", label: "יצרן", width: 126 },
      { id: "accountNumber", label: "מס' פוליסה", width: 140 },
      { id: "startDate", label: "תחילת ביטוח", width: 114 },
      { id: "compensationPension", label: "פיצויים למס", width: 122 },
      { id: "compensationCapital", label: "פיצויים מעסיק הון", width: 140 },
      { id: "capitalBefore2008", label: "תגמולי הון עד 2008", width: 146 },
      { id: "capitalAfter2008", label: "תגמולי הון מ-2008", width: 146 },
      { id: "pensionBefore2000", label: "תגמולים לקצבה עד 2000", width: 156 },
      { id: "pensionAfter2000", label: "תגמולים לקצבה אחרי 2000", width: 166 },
      { id: "total", label: "סה\"כ", width: 118 }
    ];

    const tableRows = rows.map((row) => ({
      cells: {
        manufacturer: escapeHtml(row.manufacturer || "—"),
        accountNumber: escapeHtml(row.accountNumber || "—"),
        startDate: escapeHtml(row.startDate || "—"),
        compensationPension: fmtCurrency(row.compensationPension),
        compensationCapital: fmtCurrency(row.compensationCapital),
        capitalBefore2008: fmtCurrency(row.capitalBefore2008),
        capitalAfter2008: fmtCurrency(row.capitalAfter2008),
        pensionBefore2000: fmtCurrency(row.pensionBefore2000),
        pensionAfter2000: fmtCurrency(row.pensionAfter2000),
        total: fmtCurrency(row.total)
      }
    }));

    if (rows.length) {
      tableRows.push({
        className: "is-summary-row",
        cells: {
          manufacturer: "סה\"כ",
          accountNumber: "",
          startDate: "",
          compensationPension: fmtCurrency(sumBy(rows, (row) => row.compensationPension)),
          compensationCapital: fmtCurrency(sumBy(rows, (row) => row.compensationCapital)),
          capitalBefore2008: fmtCurrency(sumBy(rows, (row) => row.capitalBefore2008)),
          capitalAfter2008: fmtCurrency(sumBy(rows, (row) => row.capitalAfter2008)),
          pensionBefore2000: fmtCurrency(sumBy(rows, (row) => row.pensionBefore2000)),
          pensionAfter2000: fmtCurrency(sumBy(rows, (row) => row.pensionAfter2000)),
          total: fmtCurrency(sumBy(rows, (row) => row.total))
        }
      });
    }

    dom.infrastructureTableHost.innerHTML = renderManagedTable("infrastructure", columns, tableRows, {
      tableClass: "infrastructure-table",
      emptyMessage: "בחר קופות בטבלה הראשית ליתרות, ואז סמן בתוך חלון הקופה אילו קופות מיועדות לקצבה."
    });
    dom.infrastructureLegend.innerHTML = renderInfrastructureLegend();
  }

  const ConfigManager = {
    get() {
      return {
        retirementAge: 67,
        scoreWeights: {
          fees: 0.25,
          ageFit: 0.20,
          diversification: 0.15,
          concentration: 0.10,
          statuses: 0.10,
          efficiency: 0.10,
          returns: 0.05,
          improvementPotential: 0.05
        },
        feeBands: {
          pension: {
            balance: [
              { max: 0.2, level: "מצוין", score: 100 },
              { max: 0.3, level: "טוב", score: 88 },
              { max: 0.4, level: "סביר", score: 72 },
              { max: 0.5, level: "גבוה", score: 48 },
              { max: Infinity, level: "חריג", score: 18 }
            ],
            deposit: [
              { max: 1.5, level: "מצוין", score: 100 },
              { max: 3, level: "טוב", score: 86 },
              { max: 4, level: "בינוני", score: 66 },
              { max: 6, level: "גבוה", score: 45 },
              { max: Infinity, level: "חריג", score: 15 }
            ],
            weightBalance: 0.7,
            weightDeposit: 0.3
          },
          gemel: {
            balance: [
              { max: 0.35, level: "מצוין", score: 100 },
              { max: 0.6, level: "טוב", score: 85 },
              { max: 0.75, level: "סביר", score: 68 },
              { max: 1.05, level: "גבוה", score: 42 },
              { max: Infinity, level: "חריג", score: 14 }
            ],
            deposit: [
              { max: 0.5, level: "מצוין", score: 100 },
              { max: 1.5, level: "טוב", score: 86 },
              { max: 2.5, level: "סביר", score: 68 },
              { max: 4, level: "גבוה", score: 42 },
              { max: Infinity, level: "חריג", score: 14 }
            ],
            weightBalance: 0.7,
            weightDeposit: 0.3
          },
          hishtalmut: {
            balance: [
              { max: 0.35, level: "מצוין", score: 100 },
              { max: 0.6, level: "טוב", score: 86 },
              { max: 0.8, level: "סביר", score: 70 },
              { max: 1, level: "גבוה", score: 50 },
              { max: 2, level: "גבוה מאוד", score: 34 },
              { max: Infinity, level: "חריג", score: 16 }
            ],
            deposit: [],
            weightBalance: 1,
            weightDeposit: 0
          }
        },
        trackGroups: [
          { id: "equity", label: "מנייתי", range: [80, 100], keywords: ["מניות", "מנייתי", "מניות כללי", "מניות חו\"ל", "מניות ישראל", "מניות גלובלי", "מניות מדדים", "מניות פסיבי", "מניות אקטיבי", "מניות esg", "מניות טכנולוגיה", "מניות צמיחה", "מניות ערך"] },
          { id: "index", label: "מדדי מניות", range: [90, 100], keywords: ["s&p500", "s&p 500", "מדד s&p", "מחקה s&p", "מחקה מדדים", "msci world", "msci acwi", "נאסד\"ק 100", "מדדי חו\"ל"] },
          { id: "general", label: "כללי", range: [30, 60], keywords: ["כללי", "כללי א", "כללי ב", "כללי עד 50", "כללי עד 60", "כללי עד 70", "כללי משולב", "כללי גמיש", "כללי דינמי"] },
          { id: "bond", label: "אג\"ח", range: [0, 20], keywords: ["אג\"ח", "אגח", "אג\"ח כללי", "אג\"ח ממשלתי", "אג\"ח קונצרני", "אג\"ח מדינה", "אג\"ח ללא מניות", "אג\"ח צמוד", "אג\"ח שקלי"] },
          { id: "solid", label: "סולידי", range: [0, 0], keywords: ["שקלי", "כספי", "פיקדון", "נזילות גבוהה", "ללא סיכון", "שמרני מאוד"] }
        ],
        ageFitRanges: [
          { minYears: 30, maxYears: Infinity, range: [70, 90] },
          { minYears: 20, maxYears: 30, range: [60, 80] },
          { minYears: 10, maxYears: 20, range: [40, 70] },
          { minYears: 5, maxYears: 10, range: [30, 50] },
          { minYears: 0, maxYears: 5, range: [10, 30] },
          { minYears: -Infinity, maxYears: 0, range: [0, 20] }
        ],
        returnsConfidenceThreshold: 0.72
      };
    }
  };

  const FeeAnalysisEngine = {
    analyzeFund(fund) {
      const config = ConfigManager.get();
      const family = this.detectFamily(fund.productType);
      const productConfig = config.feeBands[family] || config.feeBands.gemel;
      const balanceFee = this.extractFeeValue(fund.managementFeeBalanceText, fund.managementFeeText, "balance");
      const depositFee = this.extractFeeValue(fund.managementFeeDepositText, fund.managementFeeText, "deposit");
      const balanceBand = this.pickBand(productConfig.balance, balanceFee);
      const depositBand = productConfig.weightDeposit > 0 ? this.pickBand(productConfig.deposit, depositFee) : null;
      const score = roundNumber(
        (balanceBand.score * productConfig.weightBalance) + ((depositBand ? depositBand.score : 0) * productConfig.weightDeposit),
        1
      );
      return {
        family,
        balanceFee,
        depositFee,
        balanceLevel: balanceBand.level,
        depositLevel: depositBand ? depositBand.level : "אין נתון",
        score
      };
    },
    detectFamily(productType) {
      const text = normalizeText(productType);
      if (text.includes("השתלמות")) return "hishtalmut";
      if (text.includes("פנסיה")) return "pension";
      if (text.includes("גמל") || text.includes("מנהלים")) return "gemel";
      return "gemel";
    },
    extractFeeValue(primaryText, fallbackText, type) {
      const valueFromPrimary = this.parsePercentValue(primaryText);
      if (Number.isFinite(valueFromPrimary)) return valueFromPrimary;
      const source = String(fallbackText || "");
      if (!source.trim()) return NaN;
      const sourceNorm = normalizeText(source);
      const regex = /(\d+(?:\.\d+)?)%/g;
      const matches = [];
      let item = regex.exec(sourceNorm);
      while (item) {
        matches.push(Number(item[1]));
        item = regex.exec(sourceNorm);
      }
      if (!matches.length) return NaN;
      if (type === "deposit") {
        return matches.find((num) => num > 0.7) ?? matches[0];
      }
      return matches.find((num) => num <= 2) ?? matches[0];
    },
    parsePercentValue(value) {
      const text = String(value || "").trim().replace(/[^0-9.,-]/g, "").replace(",", ".");
      if (!text) return NaN;
      const parsed = Number(text);
      return Number.isFinite(parsed) ? normalizeFeePercentValue(parsed) : NaN;
    },
    pickBand(bands, value) {
      if (!Number.isFinite(value)) {
        return { level: "אין נתון", score: 55 };
      }
      return bands.find((band) => value <= band.max) || bands[bands.length - 1];
    }
  };

  const RiskAnalysisEngine = {
    analyzeFund(fund, client) {
      const yearsToRetirement = this.getYearsToRetirement(client);
      const equity = this.estimateEquityExposure(fund.investmentTrack || fund.retirementTrackName || fund.planName);
      const range = this.getExpectedRange(yearsToRetirement);
      const fit = this.classifyFit(equity, range);
      const suitabilityScore = this.suitabilityScore(equity, range);
      return {
        yearsToRetirement,
        equityExposureEstimated: equity,
        riskLevel: this.riskLabel(equity),
        expectedRange: range,
        fitStatus: fit,
        suitabilityScore
      };
    },
    getYearsToRetirement(client) {
      const config = ConfigManager.get();
      const age = Number(client && client.age);
      if (!Number.isFinite(age)) return null;
      return roundNumber(config.retirementAge - age, 1);
    },
    estimateEquityExposure(trackName) {
      const config = ConfigManager.get();
      const normalized = this.normalizeTrackName(trackName);
      if (!normalized) return null;
      const cappedEquity = this.extractExplicitEquityCap(normalized);
      if (Number.isFinite(cappedEquity)) {
        return cappedEquity;
      }
      for (const group of config.trackGroups) {
        if (group.keywords.some((keyword) => normalized.includes(this.normalizeTrackName(keyword)))) {
          return roundNumber((group.range[0] + group.range[1]) / 2, 0);
        }
      }
      return 45;
    },
    extractExplicitEquityCap(normalizedTrackName) {
      const text = String(normalizedTrackName || "");
      const percentMatch = text.match(/(?:עד|מקסימום|לכל היותר)\s*(\d{1,3})\s*%?\s*(?:מניות|מנייתי)/);
      if (percentMatch) {
        const cap = Number(percentMatch[1]);
        if (Number.isFinite(cap)) return Math.max(0, Math.min(100, cap));
      }
      if ((text.includes("אגח") || text.includes("אג\"ח")) && text.includes("מניות")) {
        const anyPercent = text.match(/(\d{1,3})\s*%/);
        if (anyPercent) {
          const cap = Number(anyPercent[1]);
          if (Number.isFinite(cap)) return Math.max(0, Math.min(100, cap));
        }
      }
      return NaN;
    },
    normalizeTrackName(value) {
      return normalizeText(value)
        .replace(/\s+/g, " ")
        .replace(/s&p\s*500/g, "s&p500")
        .replace(/עוקב/g, "מחקה")
        .trim();
    },
    getExpectedRange(yearsToRetirement) {
      const config = ConfigManager.get();
      if (!Number.isFinite(yearsToRetirement)) return [20, 60];
      const selected = config.ageFitRanges.find((item) => yearsToRetirement >= item.minYears && yearsToRetirement < item.maxYears);
      return selected ? selected.range : [20, 60];
    },
    classifyFit(equity, range) {
      if (!Number.isFinite(equity)) return "אין נתון";
      if (equity < range[0]) return "שמרני";
      if (equity > range[1]) return "אגרסיבי";
      return "תואם";
    },
    suitabilityScore(equity, range) {
      if (!Number.isFinite(equity)) return 55;
      const center = (range[0] + range[1]) / 2;
      const span = Math.max(1, (range[1] - range[0]) / 2);
      const distance = Math.abs(equity - center);
      return roundNumber(clamp(100 - ((distance / span) * 45), 25, 100), 1);
    },
    riskLabel(equity) {
      if (!Number.isFinite(equity)) return "אין נתון";
      if (equity >= 80) return "גבוהה";
      if (equity >= 55) return "בינונית-גבוהה";
      if (equity >= 30) return "בינונית";
      if (equity > 0) return "נמוכה";
      return "סולידית";
    }
  };

  const TrackMatcherService = {
    normalizeTrackName(value) {
      return normalizeText(value)
        .replace(/[()'"״׳\-–—]/g, " ")
        .replace(/\bs&p\s*500\b/g, "s&p500")
        .replace(/\bmsci\s*world\b/g, "msci world")
        .replace(/\bmsci\s*acwi\b/g, "msci acwi")
        .replace(/\s+/g, " ")
        .trim();
    },
    extractTrackNumber(fund) {
      const candidates = [fund.trackNumber, fund.retirementTrackName, fund.investmentTrack, fund.notes, fund.planName];
      for (const source of candidates) {
        const text = String(source || "");
        const match = text.match(/\b\d{6,12}\b/);
        if (match) return match[0];
      }
      return "";
    },
    createTrackFingerprint(fund) {
      return {
        trackNumber: this.extractTrackNumber(fund),
        normalizedTrackName: this.normalizeTrackName(fund.investmentTrack || fund.retirementTrackName || fund.planName || ""),
        manufacturer: normalizeText(fund.manufacturer),
        productType: normalizeText(fund.productType)
      };
    },
    scoreCandidate(fingerprint, candidate) {
      let score = 0;
      if (fingerprint.trackNumber && candidate.trackNumber && fingerprint.trackNumber === candidate.trackNumber) {
        score += 0.72;
      }
      if (fingerprint.manufacturer && candidate.manufacturer && fingerprint.manufacturer.includes(candidate.manufacturer)) {
        score += 0.12;
      }
      if (fingerprint.productType && candidate.productType && fingerprint.productType.includes(candidate.productType)) {
        score += 0.08;
      }
      if (fingerprint.normalizedTrackName && candidate.normalizedTrackName) {
        const nameScore = this.nameSimilarity(fingerprint.normalizedTrackName, candidate.normalizedTrackName);
        score += nameScore * 0.28;
      }
      return clamp(score, 0, 1);
    },
    nameSimilarity(a, b) {
      if (!a || !b) return 0;
      if (a === b) return 1;
      const tokensA = a.split(" ").filter(Boolean);
      const tokensB = b.split(" ").filter(Boolean);
      if (!tokensA.length || !tokensB.length) return 0;
      const setB = new Set(tokensB);
      const overlap = tokensA.filter((token) => setB.has(token)).length;
      return overlap / Math.max(tokensA.length, tokensB.length);
    },
    match(fund, catalog) {
      const config = ConfigManager.get();
      const fingerprint = this.createTrackFingerprint(fund);
      if (!catalog.length) {
        return { matched: null, confidenceScore: 0, reason: "no-catalog", fingerprint };
      }
      let best = null;
      let bestScore = 0;
      catalog.forEach((candidate) => {
        const score = this.scoreCandidate(fingerprint, candidate);
        if (score > bestScore) {
          best = candidate;
          bestScore = score;
        }
      });
      if (!best || bestScore < config.returnsConfidenceThreshold) {
        return { matched: null, confidenceScore: bestScore, reason: "low-confidence", fingerprint };
      }
      return { matched: best, confidenceScore: bestScore, reason: "matched", fingerprint };
    }
  };

  const GemelNetAdapter = {
    id: "GemelNet",
    priority: 1,
    async fetchCatalog() {
      return [];
    }
  };

  const MyGemelNetAdapter = {
    id: "MyGemelNet",
    priority: 2,
    async fetchCatalog() {
      return [];
    }
  };

  const ReturnsProvider = {
    adapters: [GemelNetAdapter, MyGemelNetAdapter],
    async resolveForFunds(funds, options = {}) {
      const now = Date.now();
      const cache = this.readCache();
      const cachedMatches = cache.matches || {};
      const catalogFromCache = cache.catalog && (now - cache.catalogFetchedAt < SMART_ANALYSIS_RETURNS_TTL_MS) ? cache.catalog : [];
      let source = "cache";
      let catalog = catalogFromCache;
      let status = "ready";
      let statusNote = "";
      if (options.forceRefresh || !catalog.length) {
        const loaded = await this.loadCatalogFromAdapters();
        catalog = loaded.catalog;
        source = loaded.source || "none";
        status = loaded.status;
        statusNote = loaded.statusNote;
        this.writeCache({
          ...cache,
          catalog,
          catalogFetchedAt: now,
          source
        });
      }
      const records = {};
      const matchWarnings = [];
      funds.forEach((fund) => {
        const fingerprint = TrackMatcherService.createTrackFingerprint(fund);
        const matchCacheKey = [fingerprint.trackNumber, fingerprint.manufacturer, fingerprint.normalizedTrackName, fingerprint.productType].join("|");
        const cached = cachedMatches[matchCacheKey];
        if (cached && !options.forceRefresh && (now - (cached.updatedAt || 0) < SMART_ANALYSIS_MATCH_TTL_MS)) {
          records[fund.id] = { ...cached.payload };
          return;
        }
        const result = TrackMatcherService.match(fund, catalog);
        const trackNumber = result.fingerprint.trackNumber || "";
        if (!result.matched) {
          const payload = {
            trackNumber,
            returns: null,
            groupAverageReturns: null,
            source: source || "none",
            sourceUrl: "",
            lastUpdated: "",
            confidenceScore: result.confidenceScore || 0,
            state: result.reason === "low-confidence" ? "manual-map-required" : "no-data",
            normalizedTrackName: result.fingerprint.normalizedTrackName
          };
          records[fund.id] = payload;
          cachedMatches[matchCacheKey] = { updatedAt: now, payload };
          if (result.reason === "low-confidence") {
            matchWarnings.push(`${fund.manufacturer || "קופה"} / ${fund.planName || fund.investmentTrack || "מסלול"}: לא זוהה בוודאות`);
          }
          return;
        }
        const payload = {
          trackNumber: result.matched.trackNumber || trackNumber,
          returns: {
            monthly: result.matched.monthly,
            ytd: result.matched.ytd,
            trailing12m: result.matched.trailing12m,
            trailing36m: result.matched.trailing36m,
            trailing60m: result.matched.trailing60m
          },
          groupAverageReturns: result.matched.groupAverageReturns || null,
          source: result.matched.source || source || "none",
          sourceUrl: result.matched.sourceUrl || "",
          lastUpdated: result.matched.lastUpdated || "",
          confidenceScore: result.confidenceScore,
          state: "ready",
          normalizedTrackName: result.matched.normalizedTrackName || result.fingerprint.normalizedTrackName
        };
        records[fund.id] = payload;
        cachedMatches[matchCacheKey] = { updatedAt: now, payload };
      });
      this.writeCache({
        ...cache,
        matches: cachedMatches
      });
      return { records, status, statusNote, source, matchWarnings };
    },
    async loadCatalogFromAdapters() {
      for (const adapter of this.adapters.sort((a, b) => a.priority - b.priority)) {
        try {
          const catalog = await adapter.fetchCatalog();
          if (Array.isArray(catalog) && catalog.length) {
            return {
              catalog: catalog.map((item) => this.normalizeCatalogRecord(item, adapter.id)),
              source: adapter.id,
              status: "ready",
              statusNote: "נתוני תשואה זמינים"
            };
          }
        } catch (error) {
          // source failed, continue to next adapter
        }
      }
      return {
        catalog: this.staticCatalog(),
        source: "Static mapping",
        status: "partial",
        statusNote: "נתונים חלקיים / דורש מיפוי ידני למסלולים מסוימים"
      };
    },
    normalizeCatalogRecord(item, source) {
      return {
        manufacturer: normalizeText(item.manufacturer),
        trackName: item.trackName || "",
        normalizedTrackName: TrackMatcherService.normalizeTrackName(item.trackName || item.normalizedTrackName || ""),
        trackNumber: String(item.trackNumber || "").trim(),
        productType: normalizeText(item.productType || ""),
        groupName: item.groupName || "",
        monthly: toNumber(item.monthly),
        ytd: toNumber(item.ytd),
        trailing12m: toNumber(item.trailing12m),
        trailing36m: toNumber(item.trailing36m),
        trailing60m: toNumber(item.trailing60m),
        groupAverageReturns: item.groupAverageReturns || null,
        source: item.source || source,
        sourceUrl: item.sourceUrl || "",
        lastUpdated: item.lastUpdated || ""
      };
    },
    staticCatalog() {
      return [];
    },
    readCache() {
      try {
        const raw = localStorage.getItem(SMART_ANALYSIS_CACHE_KEY);
        return raw ? JSON.parse(raw) : {};
      } catch (error) {
        return {};
      }
    },
    writeCache(nextValue) {
      try {
        localStorage.setItem(SMART_ANALYSIS_CACHE_KEY, JSON.stringify(nextValue));
      } catch (error) {
        // ignore quota/storage errors
      }
    }
  };

  const ScoreEngine = {
    scorePortfolio(items, concentrationInfo, returnsSummary) {
      const config = ConfigManager.get();
      if (!items.length) {
        return { total: 0, breakdown: {} };
      }
      const avgFee = average(items.map((item) => item.fee.score));
      const avgAgeFit = average(items.map((item) => item.risk.suitabilityScore));
      const activeItems = items.filter((item) => isActiveStatus(item.fund.status));
      const statusScore = items.length ? roundNumber((activeItems.length / items.length) * 100, 1) : 0;
      const efficiencyScore = average(items.map((item) => (item.tags.includes("יעיל") ? 90 : item.tags.includes("יקר") ? 40 : 65)));
      const diversificationScore = this.calculateDiversificationScore(items);
      const concentrationScore = clamp(100 - concentrationInfo.riskPenalty, 10, 100);
      const improvementScore = clamp(100 - average(items.map((item) => item.improvementGap)), 20, 100);
      const returnsScore = returnsSummary.score;
      const breakdown = {
        fees: avgFee,
        ageFit: avgAgeFit,
        diversification: diversificationScore,
        concentration: concentrationScore,
        statuses: statusScore,
        efficiency: efficiencyScore,
        returns: returnsScore,
        improvementPotential: improvementScore
      };
      const total = roundNumber(
        Object.entries(config.scoreWeights).reduce((sum, [key, weight]) => sum + ((breakdown[key] || 0) * weight), 0),
        1
      );
      return { total, breakdown };
    },
    calculateDiversificationScore(items) {
      const byProduct = groupBy(items, (item) => FeeAnalysisEngine.detectFamily(item.fund.productType));
      const distribution = Array.from(byProduct.values()).map((list) => list.length / items.length);
      if (!distribution.length) return 0;
      const entropy = -distribution.reduce((sum, p) => (p > 0 ? sum + (p * Math.log2(p)) : sum), 0);
      const maxEntropy = Math.log2(Math.max(1, distribution.length));
      return maxEntropy > 0 ? roundNumber((entropy / maxEntropy) * 100, 1) : 65;
    }
  };

  const InsightEngine = {
    buildInsights(context) {
      const insights = [];
      if (context.concentration.maxFundShare > 50) {
        insights.push(this.create("חריג", "ריכוזיות גבוהה בקופה אחת", `נמצאה קופה בודדת עם ${fmtPercent(context.concentration.maxFundShare / 100)} מהצבירה.`));
      } else {
        insights.push(this.create("תקין", "פיזור קופות תקין", "אין קופה יחידה שחוצה 50% מסך הצבירה."));
      }
      if (context.concentration.maxManufacturerShare > 65) {
        insights.push(this.create("אזהרה", "תלות ביצרן דומיננטי", `${context.concentration.leadingManufacturer} מרכז/ת מעל ${fmtPercent(context.concentration.maxManufacturerShare / 100)} מהתיק.`));
      } else {
        insights.push(this.create("תקין", "תלות יצרן סבירה", "אין תלות חריגה ביצרן יחיד."));
      }
      const expensiveFunds = context.items.filter((item) => item.fee.balanceLevel === "גבוה" || item.fee.balanceLevel === "חריג" || item.fee.depositLevel === "חריג");
      if (expensiveFunds.length) {
        insights.push(this.create("הזדמנות", "פוטנציאל להפחתת דמי ניהול", `זוהו ${expensiveFunds.length} קופות עם עלות גבוהה לשיפור.`));
      }
      const ageMismatch = context.items.filter((item) => item.risk.fitStatus === "אגרסיבי" || item.risk.fitStatus === "שמרני");
      if (ageMismatch.length) {
        insights.push(this.create("אזהרה", "אי-התאמה בין סיכון לגיל", `${ageMismatch.length} קופות אינן בטווח הסיכון המומלץ לפי שנים לפרישה.`));
      }
      if (context.returnsSummary.dataCoverage < 0.4) {
        insights.push(this.create("אזהרה", "נתוני תשואה חלקיים", "לא נמצאו מספיק נתוני תשואה לניתוח מלא של כלל המסלולים."));
      } else if (context.returnsSummary.aboveGroupCount > context.returnsSummary.belowGroupCount) {
        insights.push(this.create("תקין", "יתרון יחסי בביצועי מסלולים", "רוב המסלולים עם נתונים זמינים מציגים ביצועים מעל ממוצע הקבוצה."));
      } else if (context.returnsSummary.belowGroupCount > 0) {
        insights.push(this.create("הזדמנות", "מסלולים חלשים מול ממוצע הקבוצה", `${context.returnsSummary.belowGroupCount} מסלולים נמצאים מתחת לממוצע הקבוצה בטווח האחרון.`));
      }
      return insights;
    },
    create(severity, title, text) {
      return { severity, title, text };
    }
  };

  const RecommendationEngine = {
    build(items, insights) {
      const recommendations = [];
      const expensive = items.filter((item) => item.tags.includes("יקר") || item.tags.includes("חריג"));
      if (expensive.length) {
        recommendations.push("לפתוח מו\"מ דמי ניהול בקופות היקרות לפני שינויים מבניים נוספים.");
      }
      const aggressive = items.filter((item) => item.risk.fitStatus === "אגרסיבי");
      if (aggressive.length) {
        recommendations.push("לבחון הקטנת חשיפה מנייתית במסלולים האגרסיביים ביחס לגיל הלקוח.");
      }
      const inactive = items.filter((item) => !isActiveStatus(item.fund.status));
      if (inactive.length) {
        recommendations.push("לבחון קופות לא פעילות ולאחד מוצרים חופפים לשיפור שליטה תפעולית.");
      }
      if (insights.some((insight) => insight.severity === "אזהרה" || insight.severity === "חריג")) {
        recommendations.push("לבצע ניתוח חוזר לאחר סימון יעדי קצבה ומיפוי מסלולים חסרים.");
      }
      return recommendations.slice(0, 4);
    }
  };

  const SmartAnalysisEngine = {
    analyzePortfolio(funds, client, returnsByFundId) {
      const items = funds.map((fund) => {
        const fee = FeeAnalysisEngine.analyzeFund(fund);
        const risk = RiskAnalysisEngine.analyzeFund(fund, client);
        const returnsData = returnsByFundId[fund.id] || null;
        const tags = buildFundTags(fund, fee, risk);
        const improvementGap = this.calculateImprovementGap(fee, risk, returnsData);
        const fundScore = roundNumber((fee.score * 0.35) + (risk.suitabilityScore * 0.45) + ((returnsData && returnsData.returns ? 75 : 55) * 0.2), 1);
        return { fund, fee, risk, returnsData, tags, improvementGap, fundScore };
      });
      const concentration = this.analyzeConcentration(items);
      const returnsSummary = this.analyzeReturns(items);
      const score = ScoreEngine.scorePortfolio(items, concentration, returnsSummary);
      const insights = InsightEngine.buildInsights({ items, concentration, returnsSummary, score });
      const recommendations = RecommendationEngine.build(items, insights);
      const status = this.resolveScoreStatus(score.total);
      return {
        items,
        concentration,
        returnsSummary,
        score,
        insights,
        recommendations,
        status
      };
    },
    calculateImprovementGap(fee, risk, returnsData) {
      const feeGap = clamp(100 - fee.score, 0, 100);
      const riskGap = clamp(100 - risk.suitabilityScore, 0, 100);
      const returnsGap = (!returnsData || returnsData.state !== "ready") ? 35 : 0;
      return roundNumber((feeGap * 0.45) + (riskGap * 0.45) + (returnsGap * 0.10), 1);
    },
    analyzeConcentration(items) {
      const total = sumBy(items, (item) => item.fund.currentBalance || 0);
      const maxFund = items.reduce((best, item) => {
        const share = total > 0 ? ((item.fund.currentBalance || 0) / total) * 100 : 0;
        return share > best.share ? { fund: item.fund, share } : best;
      }, { fund: null, share: 0 });
      const byManufacturer = new Map();
      items.forEach((item) => {
        const key = item.fund.manufacturer || "ללא יצרן";
        byManufacturer.set(key, (byManufacturer.get(key) || 0) + (item.fund.currentBalance || 0));
      });
      const leader = Array.from(byManufacturer.entries()).sort((a, b) => b[1] - a[1])[0] || ["—", 0];
      const maxManufacturerShare = total > 0 ? (leader[1] / total) * 100 : 0;
      const riskPenalty = clamp(Math.max(0, maxFund.share - 35) + Math.max(0, maxManufacturerShare - 45), 0, 90);
      return {
        totalBalance: total,
        maxFundShare: roundNumber(maxFund.share, 1),
        maxManufacturerShare: roundNumber(maxManufacturerShare, 1),
        leadingManufacturer: leader[0],
        riskPenalty
      };
    },
    analyzeReturns(items) {
      const withData = items.filter((item) => item.returnsData && item.returnsData.state === "ready" && item.returnsData.returns);
      const aboveGroupCount = withData.filter((item) => this.compareToGroup(item) > 0).length;
      const belowGroupCount = withData.filter((item) => this.compareToGroup(item) < 0).length;
      const score = withData.length ? roundNumber(clamp(60 + ((aboveGroupCount - belowGroupCount) * 8), 20, 100), 1) : 50;
      return {
        score,
        withDataCount: withData.length,
        dataCoverage: items.length ? withData.length / items.length : 0,
        aboveGroupCount,
        belowGroupCount
      };
    },
    compareToGroup(item) {
      const returns = item.returnsData && item.returnsData.returns;
      const avg = item.returnsData && item.returnsData.groupAverageReturns;
      if (!returns || !avg || !Number.isFinite(returns.trailing12m) || !Number.isFinite(avg.trailing12m)) return 0;
      return returns.trailing12m - avg.trailing12m;
    },
    resolveScoreStatus(score) {
      if (score >= 85) return "מצוין";
      if (score >= 72) return "טוב";
      if (score >= 58) return "בינוני";
      return "בעייתי";
    }
  };

  const SmartAnalysisPage = {
    async ensureReturnsLoaded(forceRefresh = false) {
      const snapshotKey = state.funds.map((fund) => getFundMergeKey(fund)).join("||");
      const shouldRefresh = forceRefresh || snapshotKey !== state.smartAnalysis.lastSnapshotKey;
      if (!shouldRefresh && Object.keys(state.smartAnalysis.returnsByFundId).length) return;
      state.smartAnalysis.status = "loading";
      state.smartAnalysis.returnsSourceStatus = "loading";
      renderSmartAnalysisTab();
      const resolved = await ReturnsProvider.resolveForFunds(state.funds, { forceRefresh });
      state.smartAnalysis.returnsByFundId = resolved.records || {};
      state.smartAnalysis.returnsSourceStatus = resolved.status || "partial";
      state.smartAnalysis.statusNote = resolved.statusNote || "";
      state.smartAnalysis.lastSnapshotKey = snapshotKey;
      state.smartAnalysis.lastAnalyzedAt = new Date().toISOString();
      state.smartAnalysis.matchWarnings = resolved.matchWarnings || [];
      state.smartAnalysis.status = "ready";
    },
    runAnalysis() {
      return SmartAnalysisEngine.analyzePortfolio(state.funds, state.client, state.smartAnalysis.returnsByFundId || {});
    },
    render() {
      return;
    },
    renderStatusChip() {
      const map = {
        loading: "טוען נתוני תשואה",
        ready: "נתונים זמינים",
        partial: "נתונים חלקיים",
        "manual-map-required": "נדרש מיפוי ידני",
        error: "שגיאה בטעינת מקור",
        idle: "ממתין לטעינה"
      };
      const label = map[state.smartAnalysis.returnsSourceStatus] || map.idle;
      return `<span class="smart-status-chip">${label}</span>`;
    },
    renderInsight(insight) {
      const severityClassMap = {
        "תקין": "smart-severity-ok",
        "הזדמנות": "smart-severity-opportunity",
        "אזהרה": "smart-severity-warning",
        "חריג": "smart-severity-danger"
      };
      const className = severityClassMap[insight.severity] || "smart-severity-opportunity";
      const iconEmojiMap = {
        "תקין": "✅",
        "הזדמנות": "💡",
        "אזהרה": "⚠️",
        "חריג": "🚨"
      };
      const iconEmoji = iconEmojiMap[insight.severity] || "💡";
      return `
        <article class="smart-insight-item">
          <div class="smart-insight-icon-zone">
            <div class="smart-insight-icon-3d">${iconEmoji}</div>
          </div>
          <div class="smart-insight-body">
            <div class="smart-insight-header">
              <div class="smart-insight-title">${escapeHtml(insight.title)}</div>
              <span class="smart-severity-badge ${className}">${escapeHtml(insight.severity)}</span>
            </div>
            <div class="smart-insight-text">${escapeHtml(insight.text)}</div>
          </div>
        </article>
      `;
    },
    renderDistributionChart(analysis) {
      const total = analysis.concentration.totalBalance || 0;
      const byManufacturer = new Map();
      analysis.items.forEach((item) => {
        const key = item.fund.manufacturer || "ללא יצרן";
        byManufacturer.set(key, (byManufacturer.get(key) || 0) + (item.fund.currentBalance || 0));
      });
      const top = Array.from(byManufacturer.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      if (!top.length || total <= 0) {
        return `<div class="smart-muted">אין מספיק נתונים להצגת פיזור.</div>`;
      }
      return `
        <div class="smart-mini-chart">
          ${top.map(([name, value]) => {
            const share = (value / total) * 100;
            return `
              <div class="smart-chart-row">
                <div class="smart-chart-label">${escapeHtml(name)}</div>
                <div class="smart-chart-track"><div class="smart-chart-fill" style="width:${clamp(share, 0, 100)}%"></div></div>
                <div class="smart-chart-value">${fmtNumber(share, 1)}%</div>
              </div>
            `;
          }).join("")}
        </div>
      `;
    },
    renderReturnsAndPensionChart(analysis, projectedPension) {
      const rows = analysis.items
        .map((item) => ({
          label: item.fund.planName || item.fund.investmentTrack || item.fund.productType || "מסלול",
          t12: item.returnsData && item.returnsData.returns ? item.returnsData.returns.trailing12m : NaN
        }))
        .filter((item) => Number.isFinite(item.t12))
        .sort((a, b) => b.t12 - a.t12)
        .slice(0, 5);
      if (!rows.length) {
        return `
          <div class="smart-mini-chart">
            <div class="smart-muted">לא נמצאו נתוני תשואה מספקים לצורך ניתוח מלא.</div>
            <div class="smart-muted">קצבה חזויה: ${fmtCurrency(projectedPension)}</div>
          </div>
        `;
      }
      const maxValue = Math.max(...rows.map((row) => row.t12), 1);
      return `
        <div class="smart-mini-chart">
          <div class="smart-muted">קצבה חזויה: ${fmtCurrency(projectedPension)}</div>
          ${rows.map((row) => `
            <div class="smart-chart-row">
              <div class="smart-chart-label">${escapeHtml(row.label)}</div>
              <div class="smart-chart-track"><div class="smart-chart-fill" style="width:${clamp((row.t12 / maxValue) * 100, 0, 100)}%"></div></div>
              <div class="smart-chart-value">${fmtNumber(row.t12, 2)}%</div>
            </div>
          `).join("")}
        </div>
      `;
    },
    renderSmartFundsTable(analysis) {
      return `
        <div class="smart-funds-table-wrap">
          <table class="smart-funds-table">
            <thead>
              <tr>
                <th>סוג מוצר</th>
                <th>שם קופה</th>
                <th>מסלול</th>
                <th>צבירה</th>
                <th>דמי ניהול</th>
                <th>אחוז מניות</th>
                <th>התאמה לגיל</th>
                <th>ציון קופה</th>
                <th>תגיות</th>
              </tr>
            </thead>
            <tbody>
              ${analysis.items.map((item) => {
                return `
                  <tr>
                    <td>${escapeHtml(item.fund.productType || "אין נתון")}</td>
                    <td>${escapeHtml(item.fund.manufacturer || "אין נתון")}<div class="smart-muted">${escapeHtml(item.fund.planName || "אין נתון")}</div></td>
                    <td>${escapeHtml(item.fund.investmentTrack || item.fund.retirementTrackName || "אין נתון")}</td>
                    <td>${fmtCurrency(item.fund.currentBalance || 0)}</td>
                    <td>
                      <div>${Number.isFinite(item.fee.balanceFee) ? `${fmtNumber(item.fee.balanceFee, 2)}% מצבירה` : "אין נתון"}</div>
                      <div class="smart-muted">${Number.isFinite(item.fee.depositFee) ? `${fmtNumber(item.fee.depositFee, 2)}% מהפקדה` : "אין נתון"}</div>
                    </td>
                    <td>${Number.isFinite(item.risk.equityExposureEstimated) ? `${fmtNumber(item.risk.equityExposureEstimated, 0)}%` : "אין נתון"}</td>
                    <td>${escapeHtml(item.risk.fitStatus || "אין נתון")}</td>
                    <td>${fmtNumber(item.fundScore, 1)}</td>
                    <td><div class="smart-tag-list">${item.tags.map((tag) => this.renderTag(tag)).join("")}</div></td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      `;
    },
    renderReturnWithDelta(value, groupAvg) {
      if (!Number.isFinite(value)) return "אין נתון";
      if (!Number.isFinite(groupAvg)) return `${fmtNumber(value, 2)}%`;
      const delta = value - groupAvg;
      const cls = delta > 0.05 ? "smart-delta-positive" : delta < -0.05 ? "smart-delta-negative" : "smart-delta-neutral";
      const sign = delta > 0 ? "+" : "";
      return `${fmtNumber(value, 2)}% <span class="${cls}">(${sign}${fmtNumber(delta, 2)} מול קבוצה)</span>`;
    },
    renderTag(tag) {
      const classMap = { חריג: "danger", יקר: "warning", יעיל: "success" };
      return `<span class="smart-tag ${classMap[tag] || ""}">${escapeHtml(tag)}</span>`;
    },
    renderSourceLabel(returnsData) {
      if (!returnsData) return "אין נתון";
      if (returnsData.state === "manual-map-required") return "לא זוהה בוודאות";
      if (returnsData.state === "no-data") return "לא נמצאו נתונים";
      return returnsData.source || "אין נתון";
    }
  };

  const MyGemelNetEmbed = {
    scriptPromise: null,
    async ensureScript() {
      if (!this.scriptPromise) {
        this.scriptPromise = ensureMyGemelAffiliateScript();
      }
      return this.scriptPromise;
    },
    async mount(container, options) {
      if (!container) return { ok: false, message: "חסר container" };
      const groups = (options && Array.isArray(options.groups)) ? options.groups : [];
      const periods = (options && options.periods && options.periods.length) ? options.periods : MY_GEMEL_NET_CONFIG.defaultPeriods;
      if (!groups.length) {
        container.innerHTML = `<div class="sim-note">בחר לפחות מסלול אחד להצגה.</div>`;
        return { ok: false, message: "בחר לפחות מסלול אחד להצגה" };
      }
      const innerId = `sharing_mygemel_net_sim_${Date.now().toString(36)}`;
      container.innerHTML = `<div id="${innerId}"></div>`;
      try {
        const Ctor = await this.ensureScript();
        const instanceName = `amgn_${innerId.replace("sharing_mygemel_net_", "")}`;
        window[instanceName] = new Ctor({
          container_id: innerId,
          plugin_version: MY_GEMEL_WIDGET_VERSION,
          groups,
          periods
        });
        return { ok: true, message: "הנתונים נטענו" };
      } catch (error) {
        container.innerHTML = `<div class="sim-note mygemel-status-err">לא ניתן לטעון את MyGemelNet. ${escapeHtml(error && error.message ? error.message : "")}</div>`;
        return { ok: false, message: "לא ניתן לטעון את MyGemelNet" };
      }
    }
  };

  function getScenarioShift(scenario) {
    if (scenario === "conservative") return -2;
    if (scenario === "optimistic") return 2;
    return 0;
  }

  function sanitizeCompoundInput(raw) {
    return {
      initialAmount: clamp(toNumber(raw.initialAmount), 0, 100000000),
      monthlyDeposit: clamp(toNumber(raw.monthlyDeposit), 0, 1000000),
      annualReturn: clamp(toNumber(raw.annualReturn), -5, 30),
      years: clamp(Math.round(toNumber(raw.years)), 1, 50),
      annualFee: clamp(toNumber(raw.annualFee), 0, 10),
      depositFee: clamp(toNumber(raw.depositFee), 0, 6),
      inflation: clamp(toNumber(raw.inflation != null ? raw.inflation : 2), 0, 20),
      taxType: ["real", "nominal", "exempt"].includes(raw.taxType) ? raw.taxType : "real",
      linked: Boolean(raw.linked),
      scenario: ["conservative", "base", "optimistic"].includes(raw.scenario) ? raw.scenario : "base"
    };
  }

  function calculateCompoundProjection(input) {
    const data = sanitizeCompoundInput(input);
    const annualReturnWithScenario = data.annualReturn + getScenarioShift(data.scenario);

    // נוסחה נכונה: המרת ריבית שנתית לחודשית בדריבית (לא חלוקה פשוטה)
    const monthlyReturn = Math.pow(1 + annualReturnWithScenario / 100, 1 / 12) - 1;
    // דמי ניהול חודשיים בדריבית נכונה
    const monthlyBalanceFeeRate = data.annualFee > 0 ? (1 - Math.pow(1 - data.annualFee / 100, 1 / 12)) : 0;
    // הצמדה חודשית (2% שנתי)
    const monthlyIndex = data.linked ? (Math.pow(1.02, 1 / 12) - 1) : 0;
    // אינפלציה חודשית לחישוב ריאלי
    const monthlyInflation = data.inflation > 0 ? (Math.pow(1 + data.inflation / 100, 1 / 12) - 1) : 0;
    const depositFeeRate = data.depositFee / 100;
    const totalMonths = data.years * 12;

    let grossBalance = data.initialAmount;
    let netBalance = data.initialAmount;
    let grossDeposits = data.initialAmount;
    let netDeposits = data.initialAmount;
    let totalBalanceFees = 0;
    let totalDepositFees = 0;
    let cumulativeInflationFactor = 1;
    const annualRows = [];

    for (let month = 1; month <= totalMonths; month += 1) {
      const indexedFactor = Math.pow(1 + monthlyIndex, month - 1);
      const rawDeposit = data.monthlyDeposit * indexedFactor;
      const depositFeeAmount = rawDeposit * depositFeeRate;
      const netMonthlyDeposit = rawDeposit - depositFeeAmount;

      grossDeposits += rawDeposit;
      netDeposits += netMonthlyDeposit;
      totalDepositFees += depositFeeAmount;

      // END of period — ordinary annuity (תואם CMPD SET=END)
      grossBalance *= (1 + monthlyReturn);
      grossBalance += rawDeposit;

      netBalance *= (1 + monthlyReturn);
      const balanceFeeForMonth = netBalance * monthlyBalanceFeeRate;
      totalBalanceFees += balanceFeeForMonth;
      netBalance -= balanceFeeForMonth;
      netBalance += netMonthlyDeposit;

      cumulativeInflationFactor *= (1 + monthlyInflation);

      if (month % 12 === 0) {
        const realBalance = cumulativeInflationFactor > 0 ? netBalance / cumulativeInflationFactor : netBalance;
        const nominalGain = netBalance - netDeposits;
        const inflationAdjustedInvested = netDeposits * cumulativeInflationFactor;
        const realGain = netBalance - inflationAdjustedInvested;
        let taxAmount = 0;
        if (data.taxType === "nominal") taxAmount = Math.max(0, nominalGain) * 0.25;
        else if (data.taxType === "real") taxAmount = Math.max(0, realGain) * 0.25;

        annualRows.push({
          year: month / 12,
          grossBalance,
          netBalance,
          realBalance,
          afterTax: netBalance - taxAmount,
          grossDeposits,
          netDeposits,
          balanceFees: totalBalanceFees,
          depositFees: totalDepositFees,
          totalFees: totalBalanceFees + totalDepositFees,
          nominalGain,
          taxAmount
        });
      }
    }

    // חישוב ריאלי ומס לסיום
    const realFinal = cumulativeInflationFactor > 0 ? netBalance / cumulativeInflationFactor : netBalance;
    const finalNominalGain = netBalance - netDeposits;
    const finalInflationAdjustedInvested = netDeposits * cumulativeInflationFactor;
    const finalRealGain = netBalance - finalInflationAdjustedInvested;
    let taxFinal = 0;
    if (data.taxType === "nominal") taxFinal = Math.max(0, finalNominalGain) * 0.25;
    else if (data.taxType === "real") taxFinal = Math.max(0, finalRealGain) * 0.25;
    const afterTaxFinal = netBalance - taxFinal;

    return {
      inputs: data,
      annualReturnWithScenario,
      effectiveMonthlyReturn: monthlyReturn,
      grossFinal: grossBalance,
      netFinal: netBalance,
      realFinal,
      afterTaxFinal,
      taxFinal,
      grossDeposits,
      netDeposits,
      deposits: grossDeposits,
      profits: netBalance - netDeposits,
      grossProfits: grossBalance - grossDeposits,
      totalBalanceFees,
      totalDepositFees,
      feeImpact: grossBalance - netBalance,
      annualRows
    };
  }

  function buildSimulationScenarioComparison(baseInput) {
    const baseline = sanitizeCompoundInput(baseInput);
    const scenarios = [
      { id: "conservative", label: "שמרני" },
      { id: "base", label: "בסיס" },
      { id: "optimistic", label: "אופטימי" }
    ];
    const rows = scenarios.map((scenario) => {
      const result = calculateCompoundProjection({ ...baseline, scenario: scenario.id });
      return {
        ...scenario,
        netFinal: result.netFinal,
        grossFinal: result.grossFinal,
        realFinal: result.realFinal,
        afterTaxFinal: result.afterTaxFinal
      };
    });
    const base = rows.find((row) => row.id === "base");
    return rows.map((row) => ({
      ...row,
      gapFromBase: base ? (row.netFinal - base.netFinal) : 0
    }));
  }

  function renderCompoundLineChart(rows) {
    if (!rows.length) return `<div class="sim-note">אין נתונים לגרף.</div>`;
    const width = 860;
    const height = 300;
    const pad = 36;
    const maxValue = Math.max(...rows.map((row) => row.netBalance), 1);
    const minValue = Math.min(...rows.map((row) => row.netBalance), 0);
    const range = Math.max(maxValue - minValue, 1);
    const points = rows.map((row, index) => {
      const x = pad + ((width - (pad * 2)) * (index / Math.max(rows.length - 1, 1)));
      const y = height - pad - (((row.netBalance - minValue) / range) * (height - (pad * 2)));
      return `${x},${y}`;
    }).join(" ");
    return `
      <svg class="sim-svg" viewBox="0 0 ${width} ${height}" aria-label="גרף צבירה">
        <rect x="0" y="0" width="${width}" height="${height}" fill="transparent"></rect>
        <polyline points="${points}" fill="none" stroke="#58a9e2" stroke-width="3"></polyline>
      </svg>
    `;
  }

  function renderCompoundBars(deposits, profits) {
    const depositsValue = Math.max(0, deposits);
    const profitsValue = Math.max(0, profits);
    const maxValue = Math.max(depositsValue, profitsValue, 1);
    const depositsWidth = clamp((depositsValue / maxValue) * 100, 8, 100);
    const profitsWidth = clamp((profitsValue / maxValue) * 100, 8, 100);
    return `
      <div class="smart-mini-chart">
        <div class="smart-chart-row">
          <div class="smart-chart-label">סך הפקדות</div>
          <div class="smart-chart-track"><div class="smart-chart-fill" style="width:${depositsWidth}%"></div></div>
          <div class="smart-chart-value">${fmtCurrency(depositsValue)}</div>
        </div>
        <div class="smart-chart-row">
          <div class="smart-chart-label">סך רווחים</div>
          <div class="smart-chart-track"><div class="smart-chart-fill" style="width:${profitsWidth}%"></div></div>
          <div class="smart-chart-value">${fmtCurrency(profitsValue)}</div>
        </div>
      </div>
    `;
  }

  function initCompoundChartJS(result) {
    if (!window.Chart) return;
    const canvas = document.getElementById("compoundChartCanvas");
    if (!canvas) return;
    if (compoundChartInstance) { compoundChartInstance.destroy(); compoundChartInstance = null; }
    const tab = compoundChartCurrentTab;
    const rows = result.annualRows;
    if (!rows.length) return;
    const labels = rows.map((r) => `שנה ${r.year}`);
    const navy = "#1052a8", navyBg = "rgba(16,82,168,0.10)";
    const blue = "#0878f7", blueBg = "rgba(8,120,247,0.08)";
    const steel = "rgba(100,136,177,0.6)", steelBg = "rgba(100,136,177,0.07)";
    const datasets = [];
    if (tab === "nominal" || tab === "both") {
      datasets.push({
        label: "שווי נומינלי",
        data: rows.map((r) => r.netBalance),
        borderColor: navy, backgroundColor: navyBg,
        fill: tab === "nominal", tension: 0.4, borderWidth: 2.5, pointRadius: 0, pointHoverRadius: 5,
      });
    }
    if (tab === "real" || tab === "both") {
      datasets.push({
        label: "שווי ריאלי",
        data: rows.map((r) => r.realBalance || 0),
        borderColor: blue, backgroundColor: blueBg,
        fill: tab === "real", tension: 0.4, borderWidth: 2.5, pointRadius: 0, pointHoverRadius: 5,
      });
    }
    datasets.push({
      label: 'סה"כ הופקד',
      data: rows.map((r) => r.grossDeposits),
      borderColor: steel, backgroundColor: steelBg,
      fill: true, tension: 0.4, borderWidth: 1.5, pointRadius: 0, borderDash: [4, 3],
    });
    const ctx = canvas.getContext("2d");
    compoundChartInstance = new window.Chart(ctx, {
      type: "line",
      data: { labels, datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(15,25,45,0.95)",
            borderColor: "rgba(59,130,246,0.3)", borderWidth: 1,
            titleColor: "#1052a8", bodyColor: "#4a6fa5", padding: 12,
            callbacks: { label: (c) => ` ${c.dataset.label}: ${fmtCurrency(c.parsed.y)}` }
          }
        },
        scales: {
          x: {
            ticks: { color: "#8ea0b3", font: { size: 11 }, maxTicksLimit: 10 },
            grid: { color: "rgba(59,130,246,0.06)" },
          },
          y: {
            ticks: {
              color: "#8ea0b3", font: { size: 11 },
              callback: (v) => {
                if (Math.abs(v) >= 1000000) return "₪" + (v / 1000000).toFixed(1) + "M";
                if (Math.abs(v) >= 1000) return "₪" + (v / 1000).toFixed(0) + "K";
                return "₪" + Math.round(v);
              }
            },
            grid: { color: "rgba(59,130,246,0.06)" },
          }
        }
      }
    });
  }

  function getSimulationReturnsRows() {
    return state.funds.map((fund) => {
      const returnsData = state.smartAnalysis.returnsByFundId[fund.id] || null;
      const returns = returnsData && returnsData.returns;
      return {
        id: fund.id,
        productType: fund.productType || "אין נתון",
        manufacturer: fund.manufacturer || "אין נתון",
        fundName: fund.planName || fund.productName || "אין נתון",
        trackName: fund.investmentTrack || fund.retirementTrackName || "אין נתון",
        trackNumber: returnsData && returnsData.trackNumber ? returnsData.trackNumber : "אין נתון",
        tMonth: Number.isFinite(returns && returns.monthly) ? returns.monthly : NaN,
        tYtd: Number.isFinite(returns && returns.ytd) ? returns.ytd : NaN,
        t12: Number.isFinite(returns && returns.trailing12m) ? returns.trailing12m : NaN,
        t36: Number.isFinite(returns && returns.trailing36m) ? returns.trailing36m : NaN,
        t60: Number.isFinite(returns && returns.trailing60m) ? returns.trailing60m : NaN,
        fee: fund.managementFeeText || "אין נתון",
        lastUpdated: returnsData && returnsData.lastUpdated ? returnsData.lastUpdated : "אין נתון",
        source: returnsData && returnsData.source ? returnsData.source : "אין נתון"
      };
    });
  }

  function formatSimulationInputValue(value, maxDigits = 2) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return "";
    if (maxDigits <= 0) return String(Math.round(numericValue));
    return String(roundNumber(numericValue, maxDigits)).replace(/\.?0+$/, "");
  }

  function parseSimulationInputValue(value) {
    const text = String(value || "").trim().replace(/[₪%]/g, "").replace(/\s+/g, "");
    if (!text) return NaN;
    const normalized = (() => {
      if (!text.includes(",")) return text;
      if (text.includes(".")) return text.replace(/,/g, "");
      const parts = text.split(",");
      // single comma + 1-2 trailing digits → decimal separator (e.g. "6,5" → "6.5")
      // single comma + 3 trailing digits → thousands separator (e.g. "1,500" → "1500")
      // multiple commas → all thousands separators (e.g. "1,500,000" → "1500000")
      if (parts.length === 2 && parts[1].length <= 2) return parts.join(".");
      return text.replace(/,/g, "");
    })();
    const numeric = Number(normalized);
    return Number.isFinite(numeric) ? numeric : NaN;
  }

  function renderSimulationsCompoundView() {
    const result = calculateCompoundProjection(state.simulations.compound);
    lastCompoundResult = result;
    const scenarioRows = buildSimulationScenarioComparison(state.simulations.compound);
    const advOpen = Boolean(state.simulations.compound.advOpen);
    const multiplier = result.grossDeposits > 0 ? result.netFinal / result.grossDeposits : 0;
    const midIdx = Math.floor(result.annualRows.length / 2);
    const mid = result.annualRows[midIdx] || {};
    const taxLabel = { real: "25% ריאלי", nominal: "25% נומינלי", exempt: "פטור" }[result.inputs.taxType] || "";
    return `
      <div class="sim-layout">

        <!-- INPUT -->
        <div class="sim-card">
          <h3>פרמטרי ההשקעה</h3>
          <div class="sim-grid-2">
            <div class="sim-field"><label>סכום התחלתי (₪)</label><input class="input" data-sim-field="initialAmount" type="text" inputmode="numeric" dir="ltr" value="${escapeHtml(formatSimulationInputValue(result.inputs.initialAmount, 0))}"></div>
            <div class="sim-field"><label>הפקדה חודשית (₪)</label><input class="input" data-sim-field="monthlyDeposit" type="text" inputmode="numeric" dir="ltr" value="${escapeHtml(formatSimulationInputValue(result.inputs.monthlyDeposit, 0))}"></div>
            <div class="sim-field"><label>תשואה שנתית (%)</label><input class="input" data-sim-field="annualReturn" type="text" inputmode="decimal" dir="ltr" value="${escapeHtml(formatSimulationInputValue(result.inputs.annualReturn, 2))}"></div>
            <div class="sim-field"><label>מספר שנים</label><input class="input" data-sim-field="years" type="text" inputmode="numeric" dir="ltr" value="${escapeHtml(formatSimulationInputValue(result.inputs.years, 0))}"></div>
          </div>

          <div class="sim-divider"></div>

          <div class="sim-adv-toggle ${advOpen ? "open" : ""}" data-sim-toggle-adv="1">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 4l5 5 5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
            הגדרות מתקדמות
          </div>
          <div class="sim-adv-body ${advOpen ? "open" : ""}">
            <div class="sim-grid-2" style="padding-top:14px;">
              <div class="sim-field"><label>דמי ניהול הפקדה (%)</label><input class="input" data-sim-field="depositFee" type="text" inputmode="decimal" dir="ltr" value="${escapeHtml(formatSimulationInputValue(result.inputs.depositFee, 2))}"><span class="sim-hint">אחוז מכל הפקדה חדשה</span></div>
              <div class="sim-field"><label>דמי ניהול צבירה שנתיים (%)</label><input class="input" data-sim-field="annualFee" type="text" inputmode="decimal" dir="ltr" value="${escapeHtml(formatSimulationInputValue(result.inputs.annualFee, 2))}"><span class="sim-hint">אחוז שנתי מהצבירה</span></div>
              <div class="sim-field"><label>אינפלציה שנתית (%)</label><input class="input" data-sim-field="inflation" type="text" inputmode="decimal" dir="ltr" value="${escapeHtml(formatSimulationInputValue(result.inputs.inflation, 1))}"><span class="sim-hint">לחישוב שווי ריאלי</span></div>
              <div class="sim-field">
                <label>סוג מס</label>
                <select class="select" data-sim-taxtype="taxType">
                  <option value="real" ${result.inputs.taxType === "real" ? "selected" : ""}>25% ריאלי</option>
                  <option value="nominal" ${result.inputs.taxType === "nominal" ? "selected" : ""}>25% נומינלי</option>
                  <option value="exempt" ${result.inputs.taxType === "exempt" ? "selected" : ""}>פטור ממס</option>
                </select>
              </div>
              <div class="sim-field">
                <label>הצמדת הפקדות לאינפלציה</label>
                <button class="sim-chip ${result.inputs.linked ? "active" : ""}" type="button" data-sim-toggle-linked="${result.inputs.linked ? "off" : "on"}">${result.inputs.linked ? "מופעלת (2% שנתי)" : "ללא הצמדה"}</button>
              </div>
            </div>
          </div>

          <div class="sim-divider"></div>

          <div class="sim-field">
            <label>תרחיש</label>
            <div class="sim-radio">
              <button class="sim-chip ${result.inputs.scenario === "conservative" ? "active" : ""}" type="button" data-sim-scenario="conservative">שמרני (−2%)</button>
              <button class="sim-chip ${result.inputs.scenario === "base" ? "active" : ""}" type="button" data-sim-scenario="base">בסיס</button>
              <button class="sim-chip ${result.inputs.scenario === "optimistic" ? "active" : ""}" type="button" data-sim-scenario="optimistic">אופטימי (+2%)</button>
            </div>
          </div>
          <div class="sim-note" style="margin-top:10px;">
            ריבית חודשית: <strong>${fmtNumber(result.effectiveMonthlyReturn * 100, 4)}%</strong>
            &nbsp;|&nbsp; תשואה בתרחיש: <strong>${fmtNumber(result.annualReturnWithScenario, 2)}%</strong>
            &nbsp;|&nbsp; מס: <strong>${taxLabel}</strong>
          </div>
        </div>

        <!-- KPIs -->
        <div class="sim-card">
          <h3>תוצאות</h3>
          <div class="sim-kpis">
            <article class="sim-kpi"><div class="sim-kpi-title">שווי נומינלי נטו</div><div class="sim-kpi-value">${fmtCurrency(result.netFinal)}</div><div class="sim-kpi-note">אחרי ${result.inputs.years} שנים ודמי ניהול</div></article>
            <article class="sim-kpi"><div class="sim-kpi-title">שווי ריאלי</div><div class="sim-kpi-value">${fmtCurrency(result.realFinal)}</div><div class="sim-kpi-note">בערכי היום — ${result.inputs.inflation}% אינפלציה</div></article>
            <article class="sim-kpi"><div class="sim-kpi-title">לאחר מס</div><div class="sim-kpi-value">${fmtCurrency(result.afterTaxFinal)}</div><div class="sim-kpi-note">מס משוער: ${fmtCurrency(result.taxFinal)}</div></article>
            <article class="sim-kpi"><div class="sim-kpi-title">סה"כ הפקדות</div><div class="sim-kpi-value">${fmtCurrency(result.grossDeposits)}</div><div class="sim-kpi-note">כולל סכום התחלתי</div></article>
            <article class="sim-kpi"><div class="sim-kpi-title">רווח נומינלי נטו</div><div class="sim-kpi-value">${fmtCurrency(result.profits)}</div><div class="sim-kpi-note">${result.grossDeposits > 0 ? fmtNumber((result.profits / result.grossDeposits) * 100, 0) + "% על ההשקעה" : ""}</div></article>
            <article class="sim-kpi"><div class="sim-kpi-title">מכפיל השקעה</div><div class="sim-kpi-value">${fmtNumber(multiplier, 1)}x</div><div class="sim-kpi-note">שנת מחצית: ${mid.year || "—"} (${mid.netBalance ? fmtCurrency(mid.netBalance) : "—"})</div></article>
            <article class="sim-kpi"><div class="sim-kpi-title">עלות ד"נ צבירה</div><div class="sim-kpi-value">${fmtCurrency(result.totalBalanceFees)}</div><div class="sim-kpi-note">מצטבר לאורך התקופה</div></article>
            <article class="sim-kpi"><div class="sim-kpi-title">השפעת דמי ניהול</div><div class="sim-kpi-value" style="color:#b55">${fmtCurrency(result.feeImpact)}</div><div class="sim-kpi-note">פוטנציאל אבוד לפרישה</div></article>
          </div>
        </div>
      </div>

      <!-- CHART -->
      <div class="sim-card">
        <div class="sim-chart-header">
          <h3 style="margin:0;">ציר זמן</h3>
          <div class="sim-chart-tabs">
            <button class="sim-chart-tab ${compoundChartCurrentTab === "nominal" ? "active" : ""}" type="button" data-compound-tab="nominal">נומינלי</button>
            <button class="sim-chart-tab ${compoundChartCurrentTab === "real" ? "active" : ""}" type="button" data-compound-tab="real">ריאלי</button>
            <button class="sim-chart-tab ${compoundChartCurrentTab === "both" ? "active" : ""}" type="button" data-compound-tab="both">השוואה</button>
          </div>
        </div>
        <div style="position:relative;height:300px;margin-top:16px;">
          <canvas id="compoundChartCanvas"></canvas>
        </div>
      </div>

      <!-- SCENARIOS -->
      <div class="sim-card">
        <h3>השוואת תרחישים</h3>
        <div class="sim-table-wrap">
          <table class="sim-table">
            <thead><tr><th>תרחיש</th><th>שווי נטו</th><th>שווי ריאלי</th><th>אחרי מס</th><th>פער מול בסיס</th></tr></thead>
            <tbody>
              ${scenarioRows.map((row) => `<tr>
                <td>${escapeHtml(row.label)}</td>
                <td>${fmtCurrency(row.netFinal)}</td>
                <td>${fmtCurrency(row.realFinal || 0)}</td>
                <td>${fmtCurrency(row.afterTaxFinal || 0)}</td>
                <td>${row.id === "base" ? "—" : fmtCurrency(row.gapFromBase)}</td>
              </tr>`).join("")}
            </tbody>
          </table>
        </div>
      </div>

      <!-- ANNUAL TABLE -->
      <div class="sim-card">
        <h3>פירוט שנתי</h3>
        <div class="sim-table-wrap">
          <table class="sim-table">
            <thead><tr><th>שנה</th><th>סה"כ הופקד</th><th>שווי נומינלי</th><th>שווי ריאלי</th><th>רווח נומינלי</th><th>מס משוער</th><th>אחרי מס</th><th>ד"נ מצטבר</th></tr></thead>
            <tbody>
              ${result.annualRows.map((row) => `<tr>
                <td>${row.year}</td>
                <td>${fmtCurrency(row.grossDeposits)}</td>
                <td>${fmtCurrency(row.netBalance)}</td>
                <td>${fmtCurrency(row.realBalance || 0)}</td>
                <td>${fmtCurrency(row.nominalGain || 0)}</td>
                <td>${(row.taxAmount || 0) > 0 ? fmtCurrency(row.taxAmount) : "—"}</td>
                <td>${fmtCurrency(row.afterTax || row.netBalance)}</td>
                <td>${fmtCurrency(row.totalFees)}</td>
              </tr>`).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderSimulationsReturnsView() {
    const rows = getSimulationReturnsRows();
    const search = normalizeText(state.simulations.returns.search);
    const filtered = rows.filter((row) => {
      if (state.simulations.returns.manufacturer !== "all" && row.manufacturer !== state.simulations.returns.manufacturer) return false;
      if (state.simulations.returns.productType !== "all" && row.productType !== state.simulations.returns.productType) return false;
      if (search && !normalizeText([row.fundName, row.manufacturer, row.trackNumber, row.trackName].join(" ")).includes(search)) return false;
      return true;
    });
    const manufacturers = ["all", ...new Set(rows.map((row) => row.manufacturer).filter(Boolean))];
    const productTypes = ["all", ...new Set(rows.map((row) => row.productType).filter(Boolean))];
    const periodMap = {
      month: "tMonth",
      ytd: "tYtd",
      trailing12m: "t12",
      trailing36m: "t36",
      trailing60m: "t60"
    };
    const periodKey = periodMap[state.simulations.returns.period] || "t12";
    filtered.sort((a, b) => (Number.isFinite(b[periodKey]) ? b[periodKey] : -999) - (Number.isFinite(a[periodKey]) ? a[periodKey] : -999));
    return `
      <div class="sim-card">
        <h3>טבלאות תשואות קופות</h3>
        <div class="sim-inline-controls">
          <input class="input" style="max-width:260px;" type="text" placeholder="חיפוש לפי יצרן / קופה / מספר מסלול" data-sim-returns-field="search" value="${escapeHtml(state.simulations.returns.search)}">
          <select class="select" data-sim-returns-field="manufacturer">${manufacturers.map((value) => `<option value="${escapeHtml(value)}" ${value === state.simulations.returns.manufacturer ? "selected" : ""}>${value === "all" ? "כל היצרנים" : escapeHtml(value)}</option>`).join("")}</select>
          <select class="select" data-sim-returns-field="productType">${productTypes.map((value) => `<option value="${escapeHtml(value)}" ${value === state.simulations.returns.productType ? "selected" : ""}>${value === "all" ? "כל סוגי המוצר" : escapeHtml(value)}</option>`).join("")}</select>
          <select class="select" data-sim-returns-field="period">
            <option value="month" ${state.simulations.returns.period === "month" ? "selected" : ""}>חודש אחרון</option>
            <option value="ytd" ${state.simulations.returns.period === "ytd" ? "selected" : ""}>מתחילת שנה</option>
            <option value="trailing12m" ${state.simulations.returns.period === "trailing12m" ? "selected" : ""}>12 חודשים</option>
            <option value="trailing36m" ${state.simulations.returns.period === "trailing36m" ? "selected" : ""}>36 חודשים</option>
            <option value="trailing60m" ${state.simulations.returns.period === "trailing60m" ? "selected" : ""}>60 חודשים</option>
          </select>
          <button class="button button-secondary" type="button" data-sim-export="excel">ייצוא אקסל (CSV)</button>
          <button class="button button-secondary" type="button" data-sim-export="pdf">ייצוא PDF</button>
        </div>
        <div class="sim-note">תוצאות: ${filtered.length} מסלולים</div>
      </div>
      <div class="sim-table-wrap">
        <table class="sim-table">
          <thead>
            <tr>
              <th>מועדף</th>
              <th>שם קופה / מסלול</th>
              <th>יצרן</th>
              <th>סוג מוצר</th>
              <th>מספר מסלול</th>
              <th>חודש</th>
              <th>מתחילת שנה</th>
              <th>12 חודשים</th>
              <th>36 חודשים</th>
              <th>60 חודשים</th>
              <th>דמי ניהול</th>
              <th>תאריך עדכון</th>
              <th>מקור נתון</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map((row) => `
              <tr>
                <td><button class="sim-chip ${state.simulations.returns.favorites[row.id] ? "active" : ""}" type="button" data-sim-fav="${row.id}">${state.simulations.returns.favorites[row.id] ? "★" : "☆"}</button></td>
                <td>${escapeHtml(row.fundName)}<div class="sim-note">${escapeHtml(row.trackName)}</div></td>
                <td>${escapeHtml(row.manufacturer)}</td>
                <td>${escapeHtml(row.productType)}</td>
                <td>${escapeHtml(row.trackNumber)}</td>
                <td>${Number.isFinite(row.tMonth) ? `${fmtNumber(row.tMonth, 2)}%` : "אין נתון"}</td>
                <td>${Number.isFinite(row.tYtd) ? `${fmtNumber(row.tYtd, 2)}%` : "אין נתון"}</td>
                <td>${Number.isFinite(row.t12) ? `${fmtNumber(row.t12, 2)}%` : "אין נתון"}</td>
                <td>${Number.isFinite(row.t36) ? `${fmtNumber(row.t36, 2)}%` : "אין נתון"}</td>
                <td>${Number.isFinite(row.t60) ? `${fmtNumber(row.t60, 2)}%` : "אין נתון"}</td>
                <td>${escapeHtml(row.fee)}</td>
                <td>${escapeHtml(row.lastUpdated)}</td>
                <td>${escapeHtml(row.source)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function getMyGemelProductOptions() {
    return [
      { id: "pension", label: "פנסיה", subtitle: "תשואות מסלולי פנסיה" },
      { id: "provident", label: "גמל", subtitle: "תשואות קופות גמל" },
      { id: "hishtalmut", label: "השתלמות", subtitle: "תשואות קרנות השתלמות" },
      { id: "providentinvest", label: "גמל להשקעה", subtitle: "תשואות קופות גמל להשקעה" },
      { id: "financialsavings", label: "חיסכון פיננסי", subtitle: "תשואות מוצרי חיסכון פיננסיים" }
    ];
  }

  function getMyGemelProductGroups(productType) {
    return (MY_GEMEL_NET_CONFIG.productGroups && MY_GEMEL_NET_CONFIG.productGroups[productType])
      ? MY_GEMEL_NET_CONFIG.productGroups[productType].slice()
      : MY_GEMEL_NET_CONFIG.defaultGroups.slice();
  }

  function getMyGemelProductLabel(productType) {
    const option = getMyGemelProductOptions().find((item) => item.id === productType);
    return option ? option.label : "לא נבחר";
  }

  function getMyGemelGroupLabel(groupId) {
    const label = MY_GEMEL_GROUP_LABELS[String(groupId)];
    if (!label) return `מסלול MyGemelNet ${groupId}`;
    return label;
  }

  function beautifySimulationsMyGemelEmbed() {
    const host = document.getElementById("simMyGemelEmbedHost");
    if (!host) return;
    const container = host.querySelector("div[id^='sharing_mygemel_net_']");
    if (!container) return;
    const tables = Array.from(container.querySelectorAll("table"));
    if (!tables.length) return;
    container.classList.add("mygemel-grid-ready");
    tables.forEach((table, index) => {
      const currentWrapper = table.closest(".mygemel-table-card");
      if (currentWrapper) return;
      const card = document.createElement("article");
      card.className = "mygemel-table-card";
      const titleText = findMyGemelTableTitle(table) || `טבלת תשואות ${index + 1}`;
      card.innerHTML = `
        <h4>${escapeHtml(titleText)}</h4>
        <div class="mygemel-card-note">על בסיס נתוני MyGemelNet לפי דמי ניהול</div>
      `;
      table.parentNode.insertBefore(card, table);
      card.appendChild(table);
    });
    dedupeMyGemelTableCards(container);
    syncMyGemelSelectedLabelsFromTables(container);
    hideMyGemelEmbedPromoLinks(container);
  }

  function dedupeMyGemelTableCards(container) {
    const seen = new Set();
    Array.from(container.querySelectorAll(".mygemel-table-card")).forEach((card) => {
      const title = normalizeText(card.querySelector("h4")?.textContent || "");
      const tableText = normalizeText(card.querySelector("table")?.textContent || "");
      const key = `${title}|${tableText}`;
      if (seen.has(key)) {
        card.remove();
        return;
      }
      seen.add(key);
    });
  }

  function syncMyGemelSelectedLabelsFromTables(container) {
    const selectedGroups = state.simulations && state.simulations.mygemel ? state.simulations.mygemel.groups : [];
    if (!selectedGroups || selectedGroups.length !== 1) return;
    const title = Array.from(container.querySelectorAll(".mygemel-table-card h4"))
      .map((node) => (node.textContent || "").trim())
      .find(Boolean);
    if (!title) return;
    const groupId = selectedGroups[0];
    const safeGroupId = typeof CSS !== "undefined" && CSS.escape ? CSS.escape(groupId) : String(groupId).replace(/"/g, '\\"');
    const input = document.querySelector(`[data-sim-mygemel-group="${safeGroupId}"]`);
    const label = input && input.closest(".sim-chip");
    if (!label) return;
    const checkbox = input.outerHTML;
    label.innerHTML = `${checkbox} ${escapeHtml(title)}`;
  }

  function hideMyGemelEmbedPromoLinks(container) {
    Array.from(container.querySelectorAll("a")).forEach((link) => {
      const text = normalizeText(link.textContent || "");
      if (text.includes("קבלו קוד") || text.includes("להטמעה באתר")) {
        link.style.display = "none";
      }
    });
  }

  function findMyGemelTableTitle(table) {
    let node = table.previousElementSibling;
    while (node) {
      const text = (node.textContent || "").trim();
      if (text && text.length < 90) return text;
      node = node.previousElementSibling;
    }
    const firstLink = table.querySelector("a");
    const linkText = (firstLink && firstLink.textContent || "").trim();
    return linkText || "";
  }

  function renderSimulationsMyGemelView() {
    const mState = state.simulations.mygemel;
    const periods = [
      { id: "month", label: "חודש" },
      { id: "year", label: "שנה" },
      { id: "3years", label: "3 שנים" },
      { id: "5years", label: "5 שנים" }
    ];
    const groups = getMyGemelProductGroups(mState.productType || "pension");
    const productOptions = getMyGemelProductOptions();
    const hasProductSelection = Boolean(mState.productType);
    return `
      <div class="sim-card sim-widget-box">
        <div class="sim-inline-controls" style="justify-content:space-between;">
          <div>
            <h3 style="margin:0;">טבלאות תשואות MyGemelNet</h3>
            <div class="sim-note">הטמעה תצוגתית בלבד. אין תלות לוגית מול מנוע הנתונים הפנימי.</div>
          </div>
          <button class="button button-secondary" type="button" data-sim-mygemel-refresh="1">רענון</button>
        </div>
        <div class="sim-mygemel-step" style="margin-top:10px;">
          <div class="sim-note">שלב 1: בחר סוג מוצר להצגת טבלת תשואות.</div>
          <div class="sim-mygemel-select-grid">
            ${productOptions.map((option) => `
              <button class="sim-mygemel-product ${mState.productType === option.id ? "active" : ""}" type="button" data-sim-mygemel-product="${option.id}">
                <div>${option.label}</div>
                <div class="sim-note">${option.subtitle}</div>
              </button>
            `).join("")}
          </div>
        </div>
        ${hasProductSelection ? `
          <div class="sim-mygemel-layout" style="margin-top:12px;">
            <div>
              <div class="sim-note">סוג מוצר נבחר: <strong>${escapeHtml(getMyGemelProductLabel(mState.productType))}</strong></div>
              <div class="sim-note" style="margin-top:10px;">מסלולים להצגה:</div>
              <div class="sim-mygemel-toolbar sim-mygemel-group-list">
                ${groups.map((group) => `<label class="sim-chip ${mState.groups.includes(group) ? "active" : ""}"><input type="checkbox" data-sim-mygemel-group="${group}" ${mState.groups.includes(group) ? "checked" : ""}> ${escapeHtml(getMyGemelGroupLabel(group))}</label>`).join("")}
              </div>
              <div class="sim-note ${mState.status === "ready" ? "mygemel-status-ok" : mState.status === "error" ? "mygemel-status-err" : ""}" style="margin-top:8px;">
                ${mState.status === "loading" ? "טוען נתוני MyGemelNet…" : mState.status === "ready" ? `הנתונים נטענו (${escapeHtml(mState.loadedAt || "עכשיו")})` : mState.status === "error" ? escapeHtml(mState.note || "לא ניתן לטעון את MyGemelNet") : "מוכן לטעינה"}
              </div>
            </div>
            <div class="mygemel-embed-wrapper" id="simMyGemelEmbedHost">
              <div class="sim-note">מתבצעת טעינה לפי מוצר ${escapeHtml(getMyGemelProductLabel(mState.productType))}...</div>
            </div>
          </div>
        ` : `
          <div class="mygemel-embed-wrapper" style="margin-top:12px;">
            <div class="sim-note">שלב 2: לאחר בחירה יוצגו טבלאות התשואות של סוג המוצר שבחרת.</div>
          </div>
        `}
      </div>
    `;
  }

  function renderSimulationsCompareView() {
    const rows = buildSimulationScenarioComparison(state.simulations.compound);
    return `
      <div class="sim-card">
        <h3>השוואות</h3>
        <div class="sim-note">השוואה מהירה בין תרחישי צמיחה לשווי עתידי נטו.</div>
        <div class="sim-table-wrap">
          <table class="sim-table">
            <thead><tr><th>תרחיש</th><th>שווי עתידי נטו</th><th>פער מול בסיס</th></tr></thead>
            <tbody>${rows.map((row) => `<tr><td>${row.label}</td><td>${fmtCurrency(row.netFinal)}</td><td>${row.id === "base" ? "—" : fmtCurrency(row.gapFromBase)}</td></tr>`).join("")}</tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderSimulationsPhoenixView() {
    return `
      <div class="sim-card sim-phoenix-panel">
        <div class="panel-head">
          <div>
            <h3>מחשבון קצבה של הפניקס</h3>
            <p>סימולטור קצבה משולב בתוך טאב סימולציות, בלי להשפיע על סיכום הפגישה או על יתר הטאבים.</p>
          </div>
        </div>
        <iframe class="sim-phoenix-frame" src="./pension-simulator/index.html?embedded=1" title="מחשבון קצבה של הפניקס" loading="lazy"></iframe>
      </div>
    `;
  }

  function renderSimulationsTab() {
    if (!dom.simulationsRoot) return;
    const view = state.simulations.activeView || "compound";
    const viewNeedsFunds = view === "returns" || view === "mygemel";
    if (viewNeedsFunds && !state.funds.length && !state.insurancePolicies.length) {
      dom.simulationsRoot.innerHTML = `<div class="panel"><div class="empty-state">טען דוח לקוח כדי לפתוח ${view === "mygemel" ? "MyGemelNet" : "טבלאות תשואות"}.</div></div>`;
      return;
    }
    const body = view === "returns"
      ? renderSimulationsReturnsView()
      : view === "mygemel"
        ? renderSimulationsMyGemelView()
        : view === "phoenix"
          ? renderSimulationsPhoenixView()
        : view === "compare"
          ? renderSimulationsCompareView()
          : renderSimulationsCompoundView();
    dom.simulationsRoot.innerHTML = `
      <div class="sim-shell">
        <section class="sim-head">
          <h2>סימולציות</h2>
          <p>כלים לחישוב, השוואה ובדיקת תשואות קופות לפי נתוני שוק.</p>
        </section>
        <section class="sim-segments">
          <button class="sim-segment ${view === "compound" ? "active" : ""}" type="button" data-sim-view="compound">מחשבון ריבית דריבית</button>
          <button class="sim-segment ${view === "phoenix" ? "active" : ""}" type="button" data-sim-view="phoenix">מחשבון קצבה הפניקס</button>
          <button class="sim-segment ${view === "returns" ? "active" : ""}" type="button" data-sim-view="returns">טבלאות תשואות</button>
          <button class="sim-segment ${view === "mygemel" ? "active" : ""}" type="button" data-sim-view="mygemel">MyGemelNet</button>
        </section>
        ${body}
      </div>
    `;
    if (view === "compound" && lastCompoundResult) {
      initCompoundChartJS(lastCompoundResult);
    }
    if (view === "mygemel" && state.simulations.mygemel.productType) {
      mountSimulationsMyGemelEmbed(false);
    }
  }

  async function mountSimulationsMyGemelEmbed(forceRefresh) {
    const host = document.getElementById("simMyGemelEmbedHost");
    if (!host) return;
    if (!state.simulations.mygemel.productType) {
      state.simulations.mygemel.status = "idle";
      state.simulations.mygemel.note = "בחר סוג מוצר";
      host.innerHTML = `<div class="sim-note">בחר סוג מוצר כדי להציג תשואות בווידג'ט.</div>`;
      return;
    }
    if (!state.simulations.mygemel.groups.length) {
      state.simulations.mygemel.status = "idle";
      state.simulations.mygemel.note = "בחר מסלולים להצגה";
      host.innerHTML = `<div class="sim-note">בחר מסלול אחד או יותר כדי להציג טבלאות תשואה.</div>`;
      return;
    }
    state.simulations.mygemel.status = "loading";
    state.simulations.mygemel.note = "";
    if (forceRefresh) {
      MyGemelNetEmbed.scriptPromise = null;
      const oldScripts = document.querySelectorAll("script[data-mygemel-embed='true']");
      oldScripts.forEach((script) => script.remove());
    }
    const result = await MyGemelNetEmbed.mount(host, {
      groups: state.simulations.mygemel.groups,
      periods: state.simulations.mygemel.periods
    });
    beautifySimulationsMyGemelEmbed();
    setTimeout(beautifySimulationsMyGemelEmbed, 500);
    setTimeout(beautifySimulationsMyGemelEmbed, 1500);
    state.simulations.mygemel.status = result.ok ? "ready" : "error";
    state.simulations.mygemel.note = result.message;
    state.simulations.mygemel.loadedAt = new Date().toLocaleString("he-IL");
    const statusLine = host.closest(".sim-card")?.querySelector(".sim-note");
    if (statusLine) {
      statusLine.textContent = result.ok ? `הנתונים נטענו (${state.simulations.mygemel.loadedAt})` : (result.message || "לא ניתן לטעון את MyGemelNet");
    }
  }

  function handleSimulationsClick(event) {
    const viewButton = event.target.closest("[data-sim-view]");
    if (viewButton) {
      state.simulations.activeView = viewButton.dataset.simView;
      renderSimulationsTab();
      return;
    }
    const scenarioButton = event.target.closest("[data-sim-scenario]");
    if (scenarioButton) {
      state.simulations.compound.scenario = scenarioButton.dataset.simScenario;
      renderSimulationsTab();
      return;
    }
    const linkedButton = event.target.closest("[data-sim-toggle-linked]");
    if (linkedButton) {
      state.simulations.compound.linked = linkedButton.dataset.simToggleLinked === "on";
      renderSimulationsTab();
      return;
    }
    const compoundTabButton = event.target.closest("[data-compound-tab]");
    if (compoundTabButton) {
      compoundChartCurrentTab = compoundTabButton.dataset.compoundTab;
      if (lastCompoundResult) initCompoundChartJS(lastCompoundResult);
      // update active tab visuals without full re-render
      dom.simulationsRoot.querySelectorAll("[data-compound-tab]").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.compoundTab === compoundChartCurrentTab);
      });
      return;
    }
    const advToggleButton = event.target.closest("[data-sim-toggle-adv]");
    if (advToggleButton) {
      state.simulations.compound.advOpen = !state.simulations.compound.advOpen;
      renderSimulationsTab();
      return;
    }
    const favoriteButton = event.target.closest("[data-sim-fav]");
    if (favoriteButton) {
      const id = favoriteButton.dataset.simFav;
      state.simulations.returns.favorites[id] = !state.simulations.returns.favorites[id];
      renderSimulationsTab();
      return;
    }
    const exportButton = event.target.closest("[data-sim-export]");
    if (exportButton) {
      if (exportButton.dataset.simExport === "excel") {
        exportSimulationsReturnsCsv();
      } else {
        printSimulationsReturns();
      }
      return;
    }
    const refreshMyGemel = event.target.closest("[data-sim-mygemel-refresh]");
    if (refreshMyGemel) {
      if (!state.simulations.mygemel.productType) {
        showToast("יש לבחור סוג מוצר לפני טעינת MyGemelNet.");
        return;
      }
      if (!state.simulations.mygemel.groups.length) {
        showToast("יש לבחור לפחות מסלול אחד להצגה.", true);
        return;
      }
      mountSimulationsMyGemelEmbed(true);
      return;
    }
    const productButton = event.target.closest("[data-sim-mygemel-product]");
    if (productButton) {
      const nextType = productButton.dataset.simMygemelProduct;
      state.simulations.mygemel.productType = nextType;
      state.simulations.mygemel.groups = [];
      state.simulations.mygemel.status = "idle";
      state.simulations.mygemel.note = "בחר מסלולים להצגה";
      renderSimulationsTab();
    }
  }

  function handleSimulationsInput(event) {
    const field = event.target.dataset.simField;
    if (field && Object.prototype.hasOwnProperty.call(state.simulations.compound, field)) {
      const typedValue = event.target.value;
      state.simulations.compound[field] = parseSimulationInputValue(typedValue);
      const restoreField = field;
      const restoreValue = typedValue;
      const restoreStart = event.target.selectionStart;
      const restoreEnd = event.target.selectionEnd;
      const inputVersion = ++simulationsInputVersion;
      if (simulationsInputRenderTimer) {
        clearTimeout(simulationsInputRenderTimer);
      }
      simulationsInputRenderTimer = setTimeout(() => {
        if (inputVersion !== simulationsInputVersion) return;
        renderSimulationsTab();
        const refreshed = dom.simulationsRoot.querySelector(`[data-sim-field="${restoreField}"]`);
        if (refreshed) {
          refreshed.value = restoreValue;
          refreshed.focus();
          try {
            const fallbackPos = String(restoreValue).length;
            refreshed.setSelectionRange(
              Number.isFinite(restoreStart) ? restoreStart : fallbackPos,
              Number.isFinite(restoreEnd) ? restoreEnd : fallbackPos
            );
          } catch (error) {
            // ignore for unsupported input types
          }
        }
      }, 180);
      return;
    }
    const returnsField = event.target.dataset.simReturnsField;
    if (returnsField) {
      state.simulations.returns[returnsField] = event.target.value;
      renderSimulationsTab();
    }
  }

  function handleSimulationsChange(event) {
    const taxTypeAttr = event.target.dataset.simTaxtype;
    if (taxTypeAttr) {
      state.simulations.compound.taxType = event.target.value;
      renderSimulationsTab();
      return;
    }
    const field = event.target.dataset.simField;
    if (field && Object.prototype.hasOwnProperty.call(state.simulations.compound, field)) {
      if (simulationsInputRenderTimer) {
        clearTimeout(simulationsInputRenderTimer);
        simulationsInputRenderTimer = null;
      }
      state.simulations.compound[field] = parseSimulationInputValue(event.target.value);
      renderSimulationsTab();
      return;
    }
    const returnsField = event.target.dataset.simReturnsField;
    if (returnsField) {
      state.simulations.returns[returnsField] = event.target.value;
      renderSimulationsTab();
      return;
    }
    const period = event.target.dataset.simMygemelPeriod;
    if (period) {
      if (event.target.checked) {
        if (!state.simulations.mygemel.periods.includes(period)) state.simulations.mygemel.periods.push(period);
      } else {
        state.simulations.mygemel.periods = state.simulations.mygemel.periods.filter((item) => item !== period);
      }
      renderSimulationsTab();
      if (state.simulations.activeView === "mygemel" && state.simulations.mygemel.productType) {
        mountSimulationsMyGemelEmbed(false);
      }
      return;
    }
    const group = event.target.dataset.simMygemelGroup;
    if (group) {
      if (event.target.checked) {
        if (!state.simulations.mygemel.groups.includes(group)) state.simulations.mygemel.groups.push(group);
      } else {
        state.simulations.mygemel.groups = state.simulations.mygemel.groups.filter((item) => item !== group);
      }
      renderSimulationsTab();
      if (state.simulations.activeView === "mygemel" && state.simulations.mygemel.productType) {
        mountSimulationsMyGemelEmbed(false);
      }
    }
  }

  function exportSimulationsReturnsCsv() {
    const rows = getSimulationReturnsRows();
    const csvRows = [
      ["שם קופה", "יצרן", "סוג מוצר", "מספר מסלול", "חודש", "מתחילת שנה", "12 חודשים", "36 חודשים", "60 חודשים", "מקור", "עדכון"].join(","),
      ...rows.map((row) => [
        row.fundName,
        row.manufacturer,
        row.productType,
        row.trackNumber,
        Number.isFinite(row.tMonth) ? row.tMonth : "",
        Number.isFinite(row.tYtd) ? row.tYtd : "",
        Number.isFinite(row.t12) ? row.t12 : "",
        Number.isFinite(row.t36) ? row.t36 : "",
        Number.isFinite(row.t60) ? row.t60 : "",
        row.source,
        row.lastUpdated
      ].map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
    ];
    const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `simulations-returns-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast("ייצוא CSV הושלם.");
  }

  function printSimulationsReturns() {
    const rows = getSimulationReturnsRows();
    const html = `
      <!doctype html>
      <html lang="he" dir="rtl">
      <head>
        <meta charset="utf-8">
        <title>טבלאות תשואות קופות</title>
        <style>
          body{font-family:Heebo,Arial,sans-serif;margin:18px;color:#244a73}
          h1{margin:0 0 10px;font-size:24px}
          table{width:100%;border-collapse:collapse}
          th,td{border:1px solid #cfe2f3;padding:7px 8px;font-size:12px;text-align:right}
          th{background:#eef6fd}
        </style>
      </head>
      <body>
        <h1>טבלאות תשואות קופות</h1>
        <table>
          <thead><tr><th>קופה</th><th>יצרן</th><th>סוג מוצר</th><th>מסלול</th><th>12ח'</th><th>36ח'</th><th>60ח'</th><th>מקור</th></tr></thead>
          <tbody>
            ${rows.map((row) => `<tr><td>${escapeHtml(row.fundName)}</td><td>${escapeHtml(row.manufacturer)}</td><td>${escapeHtml(row.productType)}</td><td>${escapeHtml(row.trackNumber)}</td><td>${Number.isFinite(row.t12) ? `${fmtNumber(row.t12, 2)}%` : "אין נתון"}</td><td>${Number.isFinite(row.t36) ? `${fmtNumber(row.t36, 2)}%` : "אין נתון"}</td><td>${Number.isFinite(row.t60) ? `${fmtNumber(row.t60, 2)}%` : "אין נתון"}</td><td>${escapeHtml(row.source)}</td></tr>`).join("")}
          </tbody>
        </table>
      </body>
      </html>`;
    const popup = window.open("", "_blank", "noopener,noreferrer,width=1100,height=760");
    if (!popup) {
      showToast("לא ניתן לפתוח חלון הדפסה.");
      return;
    }
    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    popup.focus();
    setTimeout(() => popup.print(), 220);
  }

  function buildFundTags(fund, fee, risk) {
    const tags = [];
    if (!isActiveStatus(fund.status)) tags.push("לא פעיל");
    if (fee.score >= 84) tags.push("יעיל");
    if (fee.score <= 52) tags.push("יקר");
    if (fee.balanceLevel === "חריג" || fee.depositLevel === "חריג") tags.push("חריג");
    if (risk.fitStatus === "אגרסיבי") tags.push("אגרסיבי");
    if (risk.fitStatus === "שמרני") tags.push("שמרני");
    if ((fund.currentBalance || 0) > (sumBy(state.funds, (item) => item.currentBalance || 0) * 0.35)) tags.push("מרכזי");
    if (!tags.length) tags.push("לשיפור");
    return tags;
  }

  async function runSmartAnalysis() {}

  function renderSmartAnalysisTab() {}

  function handleSmartAnalysisActions() {}

  function printSmartAnalysisReport() {}

  function average(values) {
    const valid = values.filter((value) => Number.isFinite(value));
    if (!valid.length) return 0;
    return sumBy(valid, (value) => value) / valid.length;
  }

  function importWorkbook(workbook, workbookName) {
    const clientRows = recordsFromSheet(workbook, "פרטי לקוח", { headerRowIndex: 0 });
    const productRows = recordsFromSheet(workbook, "מוצרי חיסכון", { headerRowIndex: 0 });
    const balanceRows = recordsFromSheet(workbook, "יתרות", { headerRowIndex: 0 });
    const periodRows = recordsFromSheet(workbook, "יתרות לפי תקופה", { headerRowIndex: 0 });
    const retirementRows = recordsFromSheet(workbook, "יתרות לפי גיל פרישה", { headerRowIndex: 1, prefixRowIndex: 0 });
    const beneficiaryRows = recordsFromSheet(workbook, "מוטבים", { headerRowIndex: 0 });
    const client = parseClient(clientRows[0] || {});
    const funds = buildFunds(productRows, balanceRows, periodRows, retirementRows, beneficiaryRows, workbookName);
    const derivedFactor = getWeightedBaseFactor(funds, 140);
    return { client, funds, derivedFactor };
  }

  async function importUploadedFile(file) {
    const extension = getFileExtension(file.name);
    const buffer = await file.arrayBuffer();

    if (extension === "zip") {
      setLoading(true, `מנתח את ${file.name}...`);
      await ensureJSZip();
      return importClearinghouseZip(buffer, file.name);
    }

    setLoading(true, "טוען ספריית Excel...");
    await ensureXLSX();
    setLoading(true, `מנתח את ${file.name}...`);

    const workbook = window.XLSX.read(buffer, {
      type: "array",
      cellDates: false,
      raw: false,
      defval: ""
    });

    if (isHarHabituachWorkbook(workbook)) {
      return importHarHabituachWorkbook(workbook, file.name);
    }

    const imported = importWorkbook(workbook, file.name);
    return {
      kind: "retirement",
      client: imported.client,
      funds: imported.funds,
      insurancePolicies: [],
      derivedFactor: imported.derivedFactor || 140
    };
  }

  function applyImportedDataset(imported, fileName) {
    if (imported.kind === "retirement") {
      const sameClient = shouldMergeClient(imported.client);
      const carryInsurance = sameClient ? state.insurancePolicies.filter(isHarHabituachPolicy) : [];
      const previousFunds = sameClient ? state.funds.slice() : [];
      const previousInfrastructureKeys = new Set(
        previousFunds
          .filter((fund) => state.infrastructureSelectedIds.has(fund.id))
          .map((fund) => getFundMergeKey(fund))
      );
      const previousActiveKey = state.ui.activeFundId
        ? getFundMergeKey(state.funds.find((fund) => fund.id === state.ui.activeFundId))
        : "";
      const mergedFunds = normalizeFundManufacturers(sameClient ? mergeFunds(previousFunds, imported.funds) : imported.funds.slice());
      const fallbackFactor = getWeightedBaseFactor(mergedFunds, imported.derivedFactor || state.calc.fallbackFactor || 140);

      state.workbookName = state.workbookName ? `${state.workbookName} + ${fileName}` : fileName;
      state.client = mergeClientRecords(
        sameClient ? state.client : carryInsurance[0] && carryInsurance[0].client ? carryInsurance[0].client : null,
        imported.client
      );
      state.funds = mergedFunds;
      state.insurancePolicies = mergeInsurancePolicies(carryInsurance, imported.insurancePolicies || []);
      state.smartAnalysis = {
        ...state.smartAnalysis,
        status: "idle",
        statusNote: "",
        returnsSourceStatus: "idle",
        returnsByFundId: {},
        lastSnapshotKey: "",
        matchWarnings: []
      };
      state.selectedIds = new Set();
      state.infrastructureSelectedIds = new Set(
        mergedFunds
          .filter((fund) => previousInfrastructureKeys.has(getFundMergeKey(fund)))
          .map((fund) => fund.id)
      );
      state.ui.activeFundId = mergedFunds.find((fund) => getFundMergeKey(fund) === previousActiveKey)?.id
        || (mergedFunds[0] ? mergedFunds[0].id : null);
      state.ui.fundModalOpen = false;
      state.ui.activeTab = "funds";
      state.filters = { search: "", manufacturer: "all", productType: "all", status: "all", sort: "manufacturer-asc" };
      if (!sameClient) {
        state.ui.tableLayouts = {};
      } else if (state.insurancePolicies.length) {
        delete state.ui.tableLayouts.insurance;
      }
      state.calc.fallbackFactor = fallbackFactor;
      if (!sameClient || !previousFunds.length) {
        state.calc.manualCapital = "";
        state.calc.factorCapital = "";
        state.calc.beneficiaryBasePension = "";
        state.calc.factorValue = fallbackFactor;
        state.calc.activeTrack = "none";
        state.calc.customTrackFactors = {};
        state.calc.factorAssignments = {};
        state.calc.factorSelectedIds = new Set();
        state.calc.spouseAge = "";
        state.meetingSummary = buildMeetingSummaryDefaults();
        state.selectedInsurancePolicyIds = new Set();
      }

      dom.fallbackFactorInput.value = String(roundNumber(state.calc.fallbackFactor, 2));
      if (!sameClient || !previousFunds.length) {
        dom.spouseAgeInput.value = "";
        dom.manualCapitalInput.value = "";
      }
      if (dom.searchInput) {
        dom.searchInput.value = "";
      }

      syncBeneficiaryTrackControls();
      return {
        kind: "retirement",
        hasFunds: Boolean(mergedFunds.length),
        hasInsurance: Boolean(state.insurancePolicies.length)
      };
    }

    assertSameClientUpload(imported.client);

    state.workbookName = state.workbookName ? `${state.workbookName} + ${fileName}` : fileName;
    state.client = mergeClientRecords(state.client, imported.client);
    state.insurancePolicies = mergeInsurancePolicies(state.insurancePolicies, imported.insurancePolicies);
    state.smartAnalysis = {
      ...state.smartAnalysis,
      status: "idle",
      statusNote: "",
      returnsSourceStatus: "idle",
      returnsByFundId: {},
      lastSnapshotKey: "",
      matchWarnings: []
    };
    delete state.ui.tableLayouts.insurance;
    state.ui.activeTab = "funds";
    return {
      kind: "insurance",
      hasFunds: Boolean(state.funds.length),
      hasInsurance: Boolean(state.insurancePolicies.length)
    };
  }

  function isHarHabituachWorkbook(workbook) {
    return Array.isArray(workbook && workbook.SheetNames)
      && workbook.SheetNames.some((name) => normalizeText(name) === normalizeText("תיק ביטוחי"));
  }

  function importHarHabituachWorkbook(workbook, workbookName) {
    const worksheet = workbook.Sheets["תיק ביטוחי"] || workbook.Sheets[workbook.SheetNames[0]];
    const rows = window.XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      blankrows: false,
      raw: false,
      defval: ""
    });
    const headerIndex = rows.findIndex((row) => Array.isArray(row) && row.some((cell) => getTextFromCell(cell) === "ענף ראשי") && row.some((cell) => getTextFromCell(cell) === "מספר פוליסה"));
    if (headerIndex === -1) {
      throw new Error("לא הצלחתי לזהות את מבנה קובץ הר הביטוח.");
    }

    const headers = (rows[headerIndex] || []).map((cell) => getTextFromCell(cell));
    const exportDate = findHarHabituachExportDate(rows);
    let currentBranch = "";
    const policies = [];
    let clientId = "";

    rows.slice(headerIndex + 1).forEach((row) => {
      const normalized = Array.isArray(row) ? row.map((cell) => getTextFromCell(cell)) : [];
      if (!normalized.some(Boolean)) return;
      if (normalized.every((cell) => !cell || isWorkbookPlaceholder(cell))) return;

      const record = {};
      headers.forEach((header, index) => {
        if (header) {
          record[header] = normalized[index] || "";
        }
      });

      const mainBranch = getText(record, ["ענף ראשי"]);
      const secondaryBranch = getText(record, ["ענף (משני)"]);
      const company = getText(record, ["חברה"]);
      const policyNumber = getText(record, ["מספר פוליסה"]);
      const classification = getText(record, ["סיווג תכנית"]);
      const productType = getText(record, ["סוג מוצר"]);
      const periodText = getText(record, ["תקופת ביטוח"]);
      const premiumType = getText(record, ["סוג פרמיה"]);
      const premium = getNumber(record, ["פרמיה בש\"ח"]);
      const ownerId = trimLeadingZeros(getText(record, ["תעודת זהות"]));
      const moreDetails = getText(record, ["פרטים נוספים"]);
      if ([mainBranch, secondaryBranch, company, policyNumber, classification, productType].every((value) => !value || isWorkbookPlaceholder(value))) {
        return;
      }

      const isBranchRow = mainBranch.startsWith("תחום -") && !secondaryBranch && !company && !policyNumber;
      if (isBranchRow) {
        currentBranch = mainBranch;
        return;
      }

      if (!policyNumber && !company && !secondaryBranch) {
        return;
      }

      clientId = clientId || ownerId;
      policies.push({
        id: `har-${workbookName}-${policies.length + 1}`,
        source: "har-habituach",
        sourceLabel: "הר הביטוח",
        mainBranch: mainBranch || currentBranch,
        categoryBranch: currentBranch,
        secondaryBranch,
        itemClass: classifyHarHabituachPolicy(mainBranch || currentBranch, productType, classification),
        productType,
        manufacturer: company,
        periodText,
        premium: Number.isFinite(premium) ? premium : 0,
        premiumText: Number.isFinite(premium) ? fmtCurrency(premium) : "",
        premiumType,
        policyNumber,
        planName: classification || productType,
        coverageAmount: 0,
        coverageAmountText: "",
        exportDate,
        moreDetails,
        client: {
          idNumber: clientId
        }
      });
    });

    return {
      kind: "insurance",
      client: {
        idNumber: clientId
      },
      funds: [],
      insurancePolicies: policies,
      derivedFactor: 140
    };
  }

  function findHarHabituachExportDate(rows) {
    for (const row of rows.slice(0, 4)) {
      if (!Array.isArray(row)) continue;
      for (const cell of row) {
        const text = getTextFromCell(cell);
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) {
          return text;
        }
      }
    }
    return "";
  }

  function formatDepositMonth(value) {
    const text = String(value || "").replace(/\D/g, "");
    if (text.length >= 6) {
      return `${text.slice(4, 6)}/${text.slice(0, 4)}`;
    }
    return String(value || "").trim();
  }

  function buildClearinghouseEmployerDirectory(xml) {
    const map = new Map();
    Array.from(xml.getElementsByTagName("YeshutMaasik")).forEach((node) => {
      const name = getXmlText(node, ["SHEM-MAASIK", "SHEM-MESHALEM"]);
      const rawIdNumber = normalizeDigits(getXmlText(node, ["MPR-MAASIK-BE-YATZRAN", "MISPAR-ZIHUY-MAASIK", "MISPAR-ZIHUY-MESHALEM"]));
      const idNumber = normalizeEmployerIdForDisplay(rawIdNumber, name);
      if (!idNumber && !name) return;
      registerEmployerDirectoryItem(map, { rawIdNumber, idNumber, name });
    });
    return map;
  }

  function extractClearinghouseEmployers(policyNode, employerDirectory) {
    const employers = new Map();
    const activeEmployerIds = new Set();
    Array.from(policyNode.getElementsByTagName("PirteiOved")).forEach((node) => {
      const rawIdNumber = normalizeDigits(getXmlText(node, ["MPR-MAASIK-BE-YATZRAN", "MISPAR-ZIHUY-MAASIK"]));
      const isCurrent = getXmlText(node, ["STATUS-MAASIK"]) === "1";
      const nodeName = getXmlText(node, ["SHEM-MAASIK"]);
      const directoryItem = findEmployerDirectoryItem(employerDirectory, rawIdNumber, "", nodeName);
      const name = nodeName || (directoryItem && directoryItem.name) || "";
      const idNumber = normalizeEmployerIdForDisplay(rawIdNumber, name) || (directoryItem && directoryItem.idNumber) || "";
      if (isCurrent && idNumber) activeEmployerIds.add(idNumber);
      if (!idNumber && !name) return;
      const key = idNumber || normalizeText(name);
      const existing = employers.get(key) || {};
      employers.set(key, {
        idNumber: existing.idNumber || idNumber,
        name: existing.name || name,
        isCurrent: Boolean(existing.isCurrent || isCurrent)
      });
    });
    Array.from(policyNode.getElementsByTagName("NetuneiGvia")).forEach((node) => {
      const name = getXmlText(node, ["SHEM-MESHALEM"]);
      const rawIdNumber = normalizeDigits(getXmlText(node, ["MISPAR-ZIHUY-MESHALEM"]));
      const directoryItem = findEmployerDirectoryItem(employerDirectory, rawIdNumber, "", name);
      const idNumber = normalizeEmployerIdForDisplay(rawIdNumber, name) || (directoryItem && directoryItem.idNumber) || "";
      if (!idNumber && !name) return;
      const key = idNumber || normalizeText(name);
      if (!employers.has(key)) {
        employers.set(key, { idNumber, name, isCurrent: activeEmployerIds.has(idNumber) });
      }
    });
    if (!employers.size && employerDirectory.size === 1) {
      const onlyEmployer = Array.from(employerDirectory.values())[0];
      employers.set(onlyEmployer.idNumber || normalizeText(onlyEmployer.name), {
        ...onlyEmployer,
        isCurrent: true
      });
    }
    const list = Array.from(employers.values());
    if (list.length && !list.some((item) => item.isCurrent)) {
      list[0].isCurrent = true;
    }
    return list;
  }

  function registerEmployerDirectoryItem(map, item) {
    if (!map || !item) return;
    const keys = [
      item.rawIdNumber,
      trimLeadingZeros(item.rawIdNumber),
      item.idNumber,
      normalizeText(item.name)
    ].filter(Boolean);
    keys.forEach((key) => {
      if (!map.has(key)) {
        map.set(key, { idNumber: item.idNumber || "", name: item.name || "", rawIdNumber: item.rawIdNumber || "" });
      }
    });
  }

  function findEmployerDirectoryItem(map, rawIdNumber, idNumber, name) {
    if (!map) return null;
    const keys = [
      rawIdNumber,
      trimLeadingZeros(rawIdNumber),
      idNumber,
      normalizeEmployerIdForDisplay(rawIdNumber, name),
      normalizeText(name)
    ].filter(Boolean);
    for (const key of keys) {
      const item = map.get(key);
      if (item) return item;
    }
    return null;
  }

  function normalizeEmployerIdForDisplay(value, employerName = "") {
    const officialId = getKnownEmployerOfficialId(employerName);
    if (officialId) return officialId;
    const digits = normalizeDigits(value);
    if (!digits) return "";
    const withoutWrapperZeros = digits.length > 9 ? digits.slice(-9) : digits;
    return withoutWrapperZeros.length < 9 ? withoutWrapperZeros.padStart(9, "0") : withoutWrapperZeros;
  }

  function getKnownEmployerOfficialId(name) {
    const text = normalizeText(name);
    if (!text) return "";
    if (text.includes("מגדל חברה לביטוח") || text.includes("מגדל לביטוח")) return "520004896";
    return "";
  }

  function classifyDepositComponent(node) {
    const depositorCode = getXmlText(node, ["SUG-MAFKID", "SUG-HAMAFKID"]);
    const contributionCode = getXmlText(node, ["SUG-HAFRASHA"]);
    if (["3", "4", "10"].includes(contributionCode)) return "compensation";
    if (depositorCode === "1" || ["1", "8"].includes(contributionCode)) return "employee";
    if (depositorCode === "2" || ["2", "9"].includes(contributionCode)) return "employer";
    return "employer";
  }

  function extractClearinghouseDepositRows(policyNode, employers) {
    const currentEmployer = employers.find((item) => item.isCurrent) || employers[0] || {};
    const nodesFromYear = Array.from(policyNode.getElementsByTagName("PerutHafkadotMetchilatShana"));
    const latestNodes = Array.from(policyNode.getElementsByTagName("PerutHafkadaAchrona"));
    const sourceNodes = nodesFromYear.length ? nodesFromYear : latestNodes;
    const byMonth = new Map();
    sourceNodes.forEach((node) => {
      const amount = firstPositive(
        getXmlNumber(node, ["SCHUM-HAFKADA-SHESHULAM"]),
        getXmlNumber(node, ["SCHUM-HAFRASHA"]),
        getXmlNumber(node, ["TOTAL-HAFKADA"]),
        0
      );
      if (!amount) return;
      const month = formatDepositMonth(
        getXmlText(node, ["CHODESH-SACHAR", "TAARICH-HAFKADA-ACHARON", "TAARICH-ERECH-HAFKADA", "TAARICH-MADAD"])
      );
      const employerName = getXmlText(node, ["SHEM-MAASIK", "SHEM-MESHALEM"]) || currentEmployer.name || "—";
      const key = `${month || "ללא חודש"}|${normalizeText(employerName)}`;
      const row = byMonth.get(key) || {
        employerName,
        employerId: currentEmployer.idNumber || "",
        month,
        employeeContribution: 0,
        employerContribution: 0,
        compensation: 0,
        total: 0
      };
      const component = classifyDepositComponent(node);
      if (component === "employee") row.employeeContribution += amount;
      if (component === "employer") row.employerContribution += amount;
      if (component === "compensation") row.compensation += amount;
      row.total += amount;
      byMonth.set(key, row);
    });
    return Array.from(byMonth.values()).sort((a, b) => normalizeText(b.month).localeCompare(normalizeText(a.month)));
  }

  async function importClearinghouseZip(buffer, fileName) {
    const zip = await window.JSZip.loadAsync(buffer);
    const xmlEntries = Object.keys(zip.files).filter((name) => name.toLowerCase().endsWith(".xml"));
    const documents = [];
    let client = null;

    for (const entryName of xmlEntries) {
      const xmlText = await zip.files[entryName].async("string");
      const xml = new DOMParser().parseFromString(xmlText, "application/xml");
      if (xml.getElementsByTagName("parsererror").length) {
        console.warn(`[ABD-finance][importClearinghouseZip] קובץ XML פגום: ${entryName}`);
        documents.push({ client: null, funds: [], insurancePolicies: [] });
        continue;
      }
      const parsed = parseClearinghouseDocument(xml, entryName, fileName);
      if (!client && parsed.client) {
        client = parsed.client;
      }
      documents.push(parsed);
    }

    const funds = documents.flatMap((document) => document.funds || []);
    const mergedClient = documents.reduce((result, document) => mergeClientRecords(result, document.client), client);

    return {
      kind: "retirement",
      client: mergedClient,
      funds,
      insurancePolicies: [],
      derivedFactor: getWeightedBaseFactor(funds, 140)
    };
  }

  function parseClearinghouseDocument(xml, entryName, fileName) {
    const manufacturer = getSingleXmlTextValue(xml, ["SHEM-YATZRAN"]);
    const employerDirectory = buildClearinghouseEmployerDirectory(xml);
    const clientNode = firstXmlNode(xml, "YeshutLakoach");
    const client = clientNode ? {
      firstName: getXmlText(clientNode, ["SHEM-PRATI"]),
      lastName: getXmlText(clientNode, ["SHEM-MISHPACHA"]),
      fullName: [getXmlText(clientNode, ["SHEM-PRATI"]), getXmlText(clientNode, ["SHEM-MISHPACHA"])].filter(Boolean).join(" "),
      idNumber: trimLeadingZeros(getXmlText(clientNode, ["MISPAR-ZIHUY-LAKOACH"])),
      email: getXmlText(clientNode, ["E-MAIL"]),
      phone: getXmlText(clientNode, ["MISPAR-CELLULARI", "MISPAR-TELEPHONE-KAVI"])
    } : null;

    const policyNodes = Array.from(xml.getElementsByTagName("HeshbonOPolisa"));
    const coverageNodes = Array.from(xml.getElementsByTagName("ZihuiKisui"));
    const funds = [];
    const policyRows = [];

    policyNodes.forEach((policyNode, index) => {
      const accountNumber = getXmlText(policyNode, ["MISPAR-POLISA-O-HESHBON"]) || getXmlText(policyNode, ["MISPAR-POLISA-O-HESHBON-NEGDI"]);
      const planName = getXmlText(policyNode, ["SHEM-TOCHNIT"]) || getXmlText(policyNode, ["SHEM-MASLOL"]) || extractSourceLabelFromFile(entryName);
      const startDate = formatXmlDate(getXmlText(policyNode, ["TAARICH-HITZTARFUT-MUTZAR", "TAARICH-TCHILAT-HABITUACH", "TAARICH-TCHILAT-KISUY"]));
      const endDate = formatXmlDate(getXmlText(policyNode, ["TAARICH-TOM-TKUFAT-HABITUAH", "TAARICH-TOM-KISUY", "TAARICH-HAFSAKAT-TASHLUM"]));
      const liquidityDate = formatXmlDate(getXmlText(policyNode, [
        "MOED-NEZILUT-TAGMULIM",
        "MOED-NEZILUT",
        "MOED-NEZILUT-KESAFIM",
        "TAARICH-NEZILUT",
        "TAARICH-ZAKAUT-LEMESHICHA",
        "TAARICH-ZAKAUT-LE-MESHICHA",
        "TAARICH-TCHILAT-ZAKAUT-LEMESHICHA"
      ]));
      const periodText = [startDate, endDate].map((item) => String(item || "").trim()).filter(Boolean).join(" - ");
      const trackNodes = Array.from(policyNode.getElementsByTagName("PerutMasluleiHashkaa"));
      const yitrotNodes = Array.from(policyNode.getElementsByTagName("PerutYitrot"));
      const periodNodes = Array.from(policyNode.getElementsByTagName("PerutYitraLeTkufa"));
      const retirementNode = firstXmlNode(policyNode, "YitraLefiGilPrisha");
      const directCoverageNodes = Array.from(policyNode.getElementsByTagName("ZihuiKisui"));
      const currentBalance = firstPositive(
        sumBy(yitrotNodes, (row) => firstPositive(
          getXmlNumber(row, ["TOTAL-CHISACHON-MTZBR"]),
          getXmlNumber(row, ["TOTAL-ERKEI-PIDION"]),
          0
        )),
        getXmlNumber(policyNode, ["TOTAL-CHISACHON-MTZBR"]),
        getXmlNumber(policyNode, ["TOTAL-ERKEI-PIDION"]),
        0
      );
      const retirementCapital = firstPositive(
        getXmlNumber(retirementNode || policyNode, [
          "TOTAL-SCHUM-MTZBR-TZAFUY-LEGIL-PRISHA-MECHUSHAV-LEKITZBA-IM-PREMIYOT",
          "TOTAL-SCHUM-MITZVTABER-TZFUY-LEGIL-PRISHA-MECHUSHAV-HAMEYOAD-LEKITZBA-LELO-PREMIYOT",
          "TOTAL-CHISACHON-MITZTABER-TZAFUY",
          "TZVIRAT-CHISACHON-CHAZUYA-LELO-PREMIYOT"
        ]),
        currentBalance,
        0
      );
      const importedPension = firstPositive(
        getXmlNumber(retirementNode || policyNode, ["KITZVAT-HODSHIT-TZFUYA", "SCHUM-KITZVAT-ZIKNA"]),
        0
      );
      const guaranteedCoefficient = firstPositive(
        getXmlNumber(retirementNode || policyNode, ["MEKADEM-MOVTACH-LEPRISHA"]),
        importedPension > 0 && retirementCapital > 0 ? retirementCapital / importedPension : NaN,
        0
      );
      const investmentTrack = getXmlText(trackNodes[0] || policyNode, ["SHEM-MASLUL-HASHKAA"]);
      const policyManufacturer = inferManufacturerFromText(`${planName} ${investmentTrack} ${entryName}`)
        || getClearinghousePolicyManufacturer(policyNode, manufacturer);
      const managementFees = getClearinghouseManagementFees(policyNode, trackNodes);
      const depositFee = managementFees.depositFee;
      const balanceFee = managementFees.balanceFee;
      const statusCode = getXmlText(policyNode, ["STATUS-POLISA-O-CHESHBON"]);
      const hasFundSignals = currentBalance > 0 || retirementCapital > 0 || importedPension > 0 || periodNodes.length > 0 || trackNodes.length > 0;
      const employers = extractClearinghouseEmployers(policyNode, employerDirectory);
      const depositRows = extractClearinghouseDepositRows(policyNode, employers);

      const clearingProductType = getClearinghouseProductType(entryName, planName, policyNode);
      const isRetirementSavingsOnly = isRetirementSavingsProduct(clearingProductType, planName);

      if (hasFundSignals) {
        funds.push({
          id: `clearing-fund-${fileName}-${entryName}-${index + 1}`,
          accountNumber: accountNumber || `חשבון-${index + 1}`,
          manufacturer: policyManufacturer || "ללא יצרן",
          productType: clearingProductType,
          productName: planName,
          planName,
          startDate,
          liquidityDate,
          investmentTrack,
          guaranteedYieldFlag: getXmlText(policyNode, ["AVTACHT-TESOA"]),
          status: mapClearinghouseStatus(statusCode),
          currentBalance,
          retirementCapital,
          guaranteedCoefficient: roundNumber(guaranteedCoefficient, 2),
          importedPension,
          retirementAge: getXmlNumber(retirementNode || policyNode, ["GIL-PRISHA"]) || 0,
          retirementTrackName: getXmlText(retirementNode || policyNode, ["SHEM-MASLOL"]),
          depositFee,
          balanceFee,
          recommendation: "",
          notes: extractSourceLabelFromFile(entryName),
          managementFeeDepositText: formatManagementFeeValue(depositFee),
          managementFeeBalanceText: formatManagementFeeValue(balanceFee),
          managementFeeText: buildManagementFeeTextFromValues(depositFee, balanceFee),
          beneficiaries: [],
          employers,
          depositRows,
          periodRows: periodNodes.map((periodNode, periodIndex) => ({
            id: `${accountNumber || index}-period-${periodIndex + 1}`,
            productType: clearingProductType,
            manufacturer: policyManufacturer,
            periodCode: getXmlText(periodNode, ["KOD-TECHULAT-SHICHVA"]),
            periodLabel: mapClearinghouseLayerCode(getXmlText(periodNode, ["KOD-TECHULAT-SHICHVA"])),
            componentCode: getXmlText(periodNode, ["REKIV-ITRA-LETKUFA"]),
            componentLabel: mapClearinghouseComponentCode(getXmlText(periodNode, ["REKIV-ITRA-LETKUFA"])),
            balanceTypeCode: getXmlText(periodNode, ["SUG-ITRA-LETKUFA"]),
            balanceTypeLabel: mapClearinghouseBalanceTypeCode(getXmlText(periodNode, ["SUG-ITRA-LETKUFA"])),
            amount: getXmlNumber(periodNode, ["SACH-ITRA-LESHICHVA-BESHACH"]),
            benefitCap: getXmlText(periodNode, ["TIKRAT-HAFKADA-MUTEVET"])
          }))
        });
      } else if (!isRetirementSavingsOnly) {
        const baseCoverageAmount = firstPositive(
          getXmlNumber(policyNode, ["SCHUM-BITUACH", "SCHUM-BITUAH-LEMAVET"]),
          0
        );
        const basePremium = firstPositive(
          getXmlNumber(policyNode, ["DMEI-BITUAH-LETASHLUM-BAPOAL", "PREMIA-ZFOYA"]),
          0
        );
        policyRows.push({
          id: `clearing-policy-${entryName}-${index + 1}`,
          source: "clearinghouse",
          sourceLabel: "מסלקה",
          manufacturer: policyManufacturer,
          mainBranch: extractSourceLabelFromFile(entryName),
          secondaryBranch: "",
          itemClass: isInsuranceSavingsProduct(clearingProductType, planName) ? "פוליסת חיסכון ביטוחית" : "פוליסת ביטוח",
          productType: isInsuranceSavingsProduct(clearingProductType, planName) ? "חיסכון עם רכיב ביטוחי" : "פוליסת ביטוח",
          planName,
          policyNumber: accountNumber,
          periodText: periodText || "—",
          premium: basePremium,
          premiumText: basePremium ? fmtCurrency(basePremium) : "",
          coverageAmount: baseCoverageAmount,
          coverageAmountText: baseCoverageAmount ? fmtCurrency(baseCoverageAmount) : "",
          client
        });
      }

      if (currentBalance <= 0 && retirementCapital <= 0 && importedPension <= 0 && shouldIncludeClearinghouseCoverage(clearingProductType, planName, extractSourceLabelFromFile(entryName))) {
        directCoverageNodes.forEach((coverageNode, coverageIndex) => {
          const coverageName = getXmlText(coverageNode, ["SHEM-KISUI-YATZRAN"]) || planName;
          if (!isInsuranceLikeCoverageName(coverageName, planName)) return;
          const coverageAmount = firstPositive(
            getXmlNumber(coverageNode, ["SCHUM-BITUACH", "SCHUM-BITUAH-LEMAVET"]),
            getXmlNumber(coverageNode, ["SCHUM-BITUH-ZFOY"]),
            0
          );
          const premium = firstPositive(
            getXmlNumber(coverageNode, ["DMEI-BITUAH-LETASHLUM-BAPOAL", "PREMIA-ZFOYA"]),
            0
          );
          policyRows.push({
          id: `clearing-coverage-${entryName}-${index + 1}-${coverageIndex + 1}`,
          source: "clearinghouse",
          sourceLabel: "מסלקה",
          manufacturer: policyManufacturer,
            mainBranch: extractSourceLabelFromFile(entryName),
            secondaryBranch: coverageName,
            itemClass: "כיסוי ביטוחי",
            productType: "כיסוי",
            planName: coverageName,
            policyNumber: accountNumber,
            periodText: periodText || "—",
            premium,
            premiumText: premium ? fmtCurrency(premium) : "",
            coverageAmount,
            coverageAmountText: coverageAmount ? fmtCurrency(coverageAmount) : "",
            client
          });
        });
      }
    });

    return {
      client,
      funds,
      insurancePolicies: []
    };
  }

  function isHarHabituachPolicy(policy) {
    return Boolean(policy && (policy.source === "har-habituach" || policy.sourceLabel === "הר הביטוח"));
  }

  function shouldMergeClient(nextClient) {
    if (!nextClient) return true;
    if (!state.client) return true;
    return shouldMergeClientAgainstBase(state.client, nextClient);
  }

  function shouldMergeClientAgainstBase(baseClient, nextClient) {
    if (!nextClient) return true;
    if (!baseClient) return true;
    const currentId = normalizeDigits(baseClient.idNumber);
    const nextId = normalizeDigits(nextClient.idNumber);
    if (currentId && nextId) {
      return currentId === nextId;
    }
    const currentName = normalizeText(baseClient.fullName);
    const nextName = normalizeText(nextClient.fullName);
    return !currentName || !nextName || currentName === nextName;
  }

  function assertSameClientUpload(nextClient) {
    if (!nextClient || !state.client) return;
    const currentId = normalizeDigits(state.client.idNumber);
    const nextId = normalizeDigits(nextClient.idNumber);
    if (currentId && nextId && currentId !== nextId) {
      throw new Error("לא ניתן להעלות קבצים של לקוחות שונים");
    }
    if (!shouldMergeClientAgainstBase(state.client, nextClient)) {
      throw new Error("לא ניתן להעלות קבצים של לקוחות שונים");
    }
  }

  function mergeClientRecords(baseClient, incomingClient) {
    if (!baseClient) return incomingClient || null;
    if (!incomingClient) return baseClient;
    return {
      ...baseClient,
      ...Object.fromEntries(Object.entries(incomingClient).filter(([, value]) => value !== undefined && value !== null && value !== ""))
    };
  }

  function mergeInsurancePolicies(currentPolicies, nextPolicies) {
    const map = new Map();
    [...(currentPolicies || []), ...(nextPolicies || [])].forEach((policy) => {
      const key = [
        policy.source,
        normalizeText(policy.manufacturer),
        normalizeText(policy.policyNumber),
        normalizeText(policy.planName),
        normalizeText(policy.secondaryBranch),
        normalizeText(policy.periodText)
      ].join("|");
      if (!map.has(key)) {
        map.set(key, policy);
      }
    });
    return Array.from(map.values());
  }

  function getFundMergeKey(fund) {
    if (!fund) return "";
    const account = normalizeAccount(fund.accountNumber || fund.policyNumber || "");
    const fallbackIdentity = [
      normalizeText(fund.planName || fund.productName),
      normalizeText(fund.investmentTrack || fund.retirementTrackName),
      Math.round(Number(fund.currentBalance || 0)),
      Math.round(Number(fund.retirementCapital || 0))
    ].join(":");
    return [
      normalizeText(fund.manufacturer),
      account || fallbackIdentity || normalizeAccount(fund.id),
      normalizeText(fund.productType),
      normalizeText(fund.planName || fund.productName)
    ].join("|");
  }

  function mergeCollectionByKey(currentItems, nextItems, getKey) {
    const map = new Map();
    [...(currentItems || []), ...(nextItems || [])].forEach((item) => {
      const key = getKey(item);
      if (!key || map.has(key)) return;
      map.set(key, item);
    });
    return Array.from(map.values());
  }

  function mergeFunds(currentFunds, nextFunds) {
    const map = new Map();
    (currentFunds || []).forEach((fund) => {
      map.set(getFundMergeKey(fund), {
        ...fund,
        periodRows: (fund.periodRows || []).slice(),
        beneficiaries: (fund.beneficiaries || []).slice(),
        employers: (fund.employers || []).slice(),
        depositRows: (fund.depositRows || []).slice()
      });
    });
    (nextFunds || []).forEach((fund) => {
      const key = getFundMergeKey(fund);
      if (!key) return;
      if (!map.has(key)) {
        map.set(key, fund);
        return;
      }
      const current = map.get(key);
      map.set(key, {
        ...current,
        ...Object.fromEntries(Object.entries(fund).filter(([, value]) => {
          if (value === undefined || value === null || value === "") return false;
          if (typeof value === "number" && !Number.isFinite(value)) return false;
          return true;
        })),
        id: current.id || fund.id,
        recommendation: current.recommendation || fund.recommendation || "",
        notes: current.notes || fund.notes || "",
        periodRows: mergeCollectionByKey(
          current.periodRows,
          fund.periodRows,
          (row) => [
            normalizeText(row.periodLabel),
            normalizeText(row.componentLabel),
            normalizeText(row.balanceTypeLabel),
            row.amount || 0
          ].join("|")
        ),
        beneficiaries: mergeCollectionByKey(
          current.beneficiaries,
          fund.beneficiaries,
          (row) => [
            normalizeText(row.name),
            normalizeText(row.trackName),
            normalizeText(row.relation),
            row.share || 0
          ].join("|")
        ),
        employers: mergeCollectionByKey(
          current.employers,
          fund.employers,
          (row) => [
            normalizeText(row.idNumber),
            normalizeText(row.name)
          ].join("|")
        ),
        depositRows: mergeCollectionByKey(
          current.depositRows,
          fund.depositRows,
          (row) => [
            normalizeText(row.employerName),
            normalizeText(row.month),
            row.employeeContribution || 0,
            row.employerContribution || 0,
            row.compensation || 0
          ].join("|")
        )
      });
    });
    return Array.from(map.values());
  }

  function parseClient(record) {
    const fullName = getText(record, ["שם מלא"]) || [getText(record, ["שם פרטי"]), getText(record, ["שם משפחה"])].filter(Boolean).join(" ");
    return {
      firstName: getText(record, ["שם פרטי"]),
      lastName: getText(record, ["שם משפחה"]),
      fullName,
      idNumber: getText(record, ["מספר מזהה"]),
      email: getText(record, ["אימייל"]),
      phone: getText(record, ["מספר פלאפון"]),
      address: getText(record, ["כתובת"]),
      gender: getText(record, ["מין"]),
      age: toNumber(getText(record, ["גיל"])) || null
    };
  }

  function buildFunds(productRows, balanceRows, periodRows, retirementRows, beneficiaryRows, workbookName) {
    const balancesByAccount = groupBy(balanceRows, (row) => normalizeAccount(getText(row, ["מס' פוליסה/חשבון", "מס פוליסה/חשבון"])));
    const periodsByAccount = groupBy(periodRows, (row) => normalizeAccount(getText(row, ["מס' פוליסה/חשבון", "מס פוליסה/חשבון"])));
    const retirementByAccount = new Map();
    retirementRows.forEach((row) => {
      const account = normalizeAccount(getText(row, ["מס' פוליסה/חשבון", "מס פוליסה/חשבון"]));
      if (account) retirementByAccount.set(account, row);
    });
    const beneficiariesByAccount = groupBy(beneficiaryRows, (row) => normalizeAccount(getText(row, ["מס' פוליסה/חשבון", "מס פוליסה/חשבון"])));

    const accounts = new Set();
    productRows.forEach((row) => {
      const account = normalizeAccount(getText(row, ["מס' פוליסה/חשבון", "מס פוליסה/חשבון"]));
      if (account) accounts.add(account);
    });
    retirementRows.forEach((row) => {
      const account = normalizeAccount(getText(row, ["מס' פוליסה/חשבון", "מס פוליסה/חשבון"]));
      if (account) accounts.add(account);
    });
    periodRows.forEach((row) => {
      const account = normalizeAccount(getText(row, ["מס' פוליסה/חשבון", "מס פוליסה/חשבון"]));
      if (account) accounts.add(account);
    });

    const funds = [];
    let fallbackIndex = 1;
    accounts.forEach((account) => {
      const product = productRows.find((row) => normalizeAccount(getText(row, ["מס' פוליסה/חשבון", "מס פוליסה/חשבון"])) === account) || {};
      const retirement = retirementByAccount.get(account) || {};
      const balances = balancesByAccount.get(account) || [];
      const periodEntries = periodsByAccount.get(account) || [];
      const beneficiaryEntries = beneficiariesByAccount.get(account) || [];

      const currentBalance = firstPositive(
        getNumber(product, ["צבירה"]),
        sumBy(balances, (row) => getNumber(row, ["סה\"כ חיסכון מצטבר"])),
        sumBy(balances, (row) => getNumber(row, ["סה\"כ ערכי פדיון"])),
        0
      );

      const retirementCapital = firstPositive(
        getNumber(retirement, ["קופה משלמת | סה\"כ סכום מצטבר צפוי לגיל פרישה מחושב המיועד לקצבה (כולל פרמיות עתידיות)"]),
        getNumber(retirement, ["קופה משלמת | סה\"כ סכום מצטבר צפוי לגיל פרישה מחושב המיועד לקצבה (ללא פרמיות עתידיות)"]),
        getNumber(retirement, ["קופה לא משלמת | סה\"כ סכום מצטבר צפוי לגיל פרישה מחושב המיועד לקצבה (כולל פרמיות עתידיות)"]),
        getNumber(retirement, ["קופה לא משלמת | סה\"כ סכום מצטבר צפוי לגיל פרישה מחושב המיועד לקצבה (ללא פרמיות עתידיות)"]),
        getNumber(retirement, ["סה\"כ סכום חיסכון מצטבר צפוי בגיל פרישה (כולל פרמיות)"]),
        getNumber(retirement, ["צבירת חיסכון חזויה לגיל פרישה לחישוב (ללא פרמיות)"]),
        currentBalance,
        0
      );

      const importedPension = firstPositive(
        getNumber(retirement, ["קופה משלמת | סכום קצבת זקנה"]),
        getNumber(retirement, ["קופה משלמת | קצבת זקנה/גמלא חודשית צפויה (ללא פרמיות)"]),
        getNumber(retirement, ["קופה לא משלמת | סכום קצבת זקנה"]),
        getNumber(retirement, ["קופה לא משלמת | קצבת זקנה/גמלא חודשית צפויה (ללא פרמיות)"]),
        getNumber(retirement, ["סכום קצבת זקנה"]),
        getNumber(retirement, ["קצבת זקנה/גמלא חודשית צפויה"]),
        0
      );

      const factorFromImport = firstPositive(
        getNumber(retirement, ["מקדם מובטח לפרישה"]),
        importedPension > 0 && retirementCapital > 0 ? retirementCapital / importedPension : NaN,
        0
      );

      const beneficiaries = beneficiaryEntries.map((entry, index) => ({
        id: `${account}-beneficiary-${index + 1}`,
        name: [getText(entry, ["שם פרטי"]), getText(entry, ["שם משפחה"])].filter(Boolean).join(" "),
        relationship: getText(entry, ["זיקת מוטב למבוטח"]),
        share: normalizeShare(getText(entry, ["חלק המוטב באחוזים"])),
        definition: getText(entry, ["הגדרת מוטב"]),
        type: getText(entry, ["מהות מוטב"])
      }));

      funds.push({
        id: `${account || workbookName}-${fallbackIndex++}`,
        accountNumber: account.replace(/^0+(?=\d)/, "") || `חשבון-${fallbackIndex}`,
        manufacturer: getText(product, ["יצרן"]) || getText(retirement, ["יצרן"]) || "ללא יצרן",
        productType: getText(product, ["סוג מוצר"]) || getText(retirement, ["סוג מוצר"]) || "מוצר לא מזוהה",
        productName: getText(product, ["מוצר"]),
        planName: getText(product, ["שם תוכנית"]),
        startDate: getText(product, ["תאריך הצטרפות"]),
        liquidityDate: getText(product, ["תאריך נזילות", "מועד נזילות", "תאריך נזילות תגמולים", "מועד נזילות תגמולים", "תאריך זכאות למשיכה", "מועד זכאות למשיכה"]),
        investmentTrack: getText(product, ["מסלולי השקעה"]),
        guaranteedYieldFlag: getText(product, ["קיים מקדם המרה המגלם הבטחת תשואה"]),
        status: getText(product, ["סטטוס"]) || "לא ידוע",
        currentBalance,
        retirementCapital,
        guaranteedCoefficient: roundNumber(factorFromImport, 2),
        importedPension,
        retirementAge: getNumber(retirement, ["גיל פרישה לחישוב"]) || 0,
        retirementTrackName: getText(retirement, ["שם מסלול פרישה"]),
        recommendation: getText(retirement, ["המלצה"]) || getText(product, ["המלצה"]),
        notes: [getText(product, ["הערות"]), getText(retirement, ["הערות"])].filter(Boolean).join(" | "),
        managementFeeDepositText: extractManagementFeeText(product, retirement, "deposit"),
        managementFeeBalanceText: extractManagementFeeText(product, retirement, "balance"),
        managementFeeText: buildManagementFeeDisplay(product, retirement),
        beneficiaries,
        periodRows: periodEntries.map((entry, index) => ({
          id: `${account}-period-${index + 1}`,
          productType: getText(entry, ["סוג מוצר"]),
          manufacturer: getText(entry, ["יצרן"]),
          periodCode: "",
          periodLabel: getText(entry, ["תקופת יתרה"]),
          componentCode: "",
          componentLabel: getText(entry, ["רכיב יתרה לתקופה"]),
          balanceTypeCode: "",
          balanceTypeLabel: getText(entry, ["סוג יתרה לתקופה"]),
          amount: getNumber(entry, ["סה\"כ יתרה תקופה"]),
          benefitCap: getText(entry, ["תקרת ההפקדה המוטבת"])
        }))
      });
    });

    return funds.sort(compareFunds("manufacturer-asc"));
  }

  function recordsFromSheet(workbook, sheetName, options) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) return [];

    const rows = window.XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      blankrows: false,
      raw: false,
      defval: ""
    });
    if (!rows.length) return [];

    const headerRowIndex = options && options.headerRowIndex ? options.headerRowIndex : 0;
    const prefixRowIndex = options && options.prefixRowIndex !== undefined ? options.prefixRowIndex : null;
    const prefixRow = prefixRowIndex !== null ? fillForward(rows[prefixRowIndex] || []) : [];
    const rawHeaders = rows[headerRowIndex] || [];
    const headers = rawHeaders.map((header, index) => {
      const main = normalizeHeader(header) || `עמודה ${index + 1}`;
      const prefix = normalizeHeader(prefixRow[index] || "");
      return prefix && prefix !== main ? `${prefix} | ${main}` : main;
    });
    const uniqueHeaders = makeHeadersUnique(headers);
    const dataStart = Math.max(headerRowIndex + 1, prefixRowIndex !== null ? prefixRowIndex + 1 : 0);

    return rows.slice(dataStart)
      .filter((row) => row.some((cell) => String(cell).trim() !== ""))
      .map((row) => {
        const record = {};
        uniqueHeaders.forEach((header, index) => {
          record[header] = row[index] !== undefined ? row[index] : "";
        });
        return record;
      });
  }

  function ensureXLSX() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    if (xlsxLoaderPromise) return xlsxLoaderPromise;

    xlsxLoaderPromise = new Promise((resolve, reject) => {
      let index = 0;
      const tryNext = () => {
        if (window.XLSX) {
          resolve(window.XLSX);
          return;
        }
        if (index >= XLSX_SOURCES.length) {
          reject(new Error("לא הצלחתי לטעון את ספריית Excel. ודא שיש חיבור אינטרנט ונסה שוב."));
          return;
        }
        const script = document.createElement("script");
        script.src = XLSX_SOURCES[index++];
        script.async = true;
        script.onload = () => window.XLSX ? resolve(window.XLSX) : tryNext();
        script.onerror = tryNext;
        document.head.appendChild(script);
      };
      tryNext();
    });

    return xlsxLoaderPromise;
  }

  function ensureJSZip() {
    if (window.JSZip) return Promise.resolve(window.JSZip);
    if (jsZipLoaderPromise) return jsZipLoaderPromise;

    jsZipLoaderPromise = new Promise((resolve, reject) => {
      let index = 0;
      const tryNext = () => {
        if (window.JSZip) {
          resolve(window.JSZip);
          return;
        }
        if (index >= JSZIP_SOURCES.length) {
          reject(new Error("לא הצלחתי לטעון את ספריית ה-ZIP. ודא שיש חיבור אינטרנט ונסה שוב."));
          return;
        }
        const script = document.createElement("script");
        script.src = JSZIP_SOURCES[index++];
        script.async = true;
        script.onload = () => window.JSZip ? resolve(window.JSZip) : tryNext();
        script.onerror = tryNext;
        document.head.appendChild(script);
      };
      tryNext();
    });

    return jsZipLoaderPromise;
  }

  function getMyGemelConstructor() {
    if (typeof window.AffiliateMygemelNet === "function") {
      return window.AffiliateMygemelNet;
    }
    if (typeof globalThis !== "undefined" && typeof globalThis.AffiliateMygemelNet === "function") {
      return globalThis.AffiliateMygemelNet;
    }
    try {
      const ctor = Function("return (typeof AffiliateMygemelNet === 'function' ? AffiliateMygemelNet : null);")();
      if (typeof ctor === "function") {
        return ctor;
      }
    } catch (error) {
      // ignore and continue
    }
    return null;
  }

  function attachMyGemelCompatibilityShim() {
    if (typeof window === "undefined") return;
    if (!window.MyGemelNet || typeof window.MyGemelNet !== "object") {
      window.MyGemelNet = {};
    }
    if (typeof window.MyGemelNet.getMyGemelConstructor !== "function") {
      window.MyGemelNet.getMyGemelConstructor = function getCtorShim() {
        return getMyGemelConstructor();
      };
    }
  }

  function waitForMyGemelConstructor(maxAttempts = 40, delayMs = 120) {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const tick = () => {
        const ctor = getMyGemelConstructor();
        if (ctor) {
          resolve(ctor);
          return;
        }
        attempts += 1;
        if (attempts >= maxAttempts) {
          reject(new Error("MyGemelNet script loaded without constructor"));
          return;
        }
        setTimeout(tick, delayMs);
      };
      tick();
    });
  }

  function ensureMyGemelAffiliateScript() {
    attachMyGemelCompatibilityShim();
    const readyCtor = getMyGemelConstructor();
    if (readyCtor) {
      attachMyGemelCompatibilityShim();
      return Promise.resolve(readyCtor);
    }
    if (myGemelLoaderPromise) {
      return myGemelLoaderPromise;
    }
    myGemelLoaderPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-mygemel-affiliate="true"]');
      if (existing) {
        waitForMyGemelConstructor(60, 120)
          .then((ctor) => {
            attachMyGemelCompatibilityShim();
            resolve(ctor);
          })
          .catch(reject);
        return;
      }
      const script = document.createElement("script");
      script.src = MY_GEMEL_NET_CONFIG.scriptUrl;
      script.async = true;
      script.dataset.mygemelAffiliate = "true";
      script.onload = () => {
        waitForMyGemelConstructor(40, 110)
          .then((ctor) => {
            attachMyGemelCompatibilityShim();
            resolve(ctor);
          })
          .catch(reject);
      };
      script.onerror = () => reject(new Error("Failed to load MyGemelNet script"));
      document.head.appendChild(script);
    });
    return myGemelLoaderPromise;
  }

  function buildBeneficiarySchedule(monthlyPension) {
    const planningYears = Math.max(1, state.calc.planningYears || 20);
    const rows = [];
    let remainingMonths = Math.max(0, Math.round(state.calc.guaranteeMonths || 0));
    const spouseMonthly = monthlyPension * state.calc.spouseShare;
    const yearsToRender = state.calc.spouseShare > 0 ? planningYears : Math.max(planningYears, Math.ceil(remainingMonths / 12) || 1);

    for (let year = 1; year <= yearsToRender; year += 1) {
      const guaranteedAnnual = Math.min(12, remainingMonths) * monthlyPension;
      const exposure = state.calc.spouseShare > 0
        ? spouseMonthly * 12 * Math.max(1, yearsToRender - year + 1)
        : remainingMonths * monthlyPension;
      rows.push({
        year,
        remainingStart: remainingMonths,
        memberMonthly: monthlyPension,
        spouseMonthly,
        guaranteedAnnual,
        exposure,
        remainingEnd: Math.max(0, remainingMonths - 12)
      });
      remainingMonths = Math.max(0, remainingMonths - 12);
    }
    return rows;
  }

  function getSelectedBeneficiaries() {
    const byName = new Map();
    getSelectedFunds().forEach((fund) => {
      fund.beneficiaries.forEach((beneficiary) => {
        const key = `${beneficiary.name}::${beneficiary.relationship}`;
        const existing = byName.get(key) || { name: beneficiary.name, relationship: beneficiary.relationship, share: 0, accounts: [] };
        existing.share += beneficiary.share;
        existing.accounts.push(fund.accountNumber);
        byName.set(key, existing);
      });
    });
    return Array.from(byName.values()).map((item) => ({ ...item, share: Math.min(item.share, 100) }));
  }

  function buildBeneficiaryComparisonRows() {
    const groups = new Map();
    getSelectedFunds().forEach((fund) => {
      const label = getBeneficiaryPolicyLabel(fund);
      const collection = groups.get(label) || [];
      collection.push(fund);
      groups.set(label, collection);
    });

    return Array.from(groups.entries())
      .map(([label, funds]) => {
        const capital = sumBy(funds, (fund) => getFundCapital(fund));
        const baseFactor = getWeightedBaseFactor(funds, state.calc.fallbackFactor);
        const tracks = BENEFICIARY_MATRIX_TRACKS.map((matrixTrack) => {
          const config = getTrackConfig(matrixTrack.id);
          const coefficient = getTrackCoefficient(matrixTrack.id, baseFactor);
          const pension = coefficient > 0 ? capital / coefficient : 0;
          return {
            ...matrixTrack,
            coefficient,
            pension,
            spousePension: pension * config.spouseShare
          };
        });
        return { label, capital, tracks };
      })
      .sort((left, right) => compareText(left.label, right.label));
  }

  function getBeneficiaryPolicyLabel(fund) {
    return fund.productType || fund.planName || fund.manufacturer || fund.accountNumber || "פוליסה";
  }

  function renderBeneficiaryComparisonTable(rows) {
    const totalCapital = sumBy(rows, (row) => row.capital);
    const totalTracks = BENEFICIARY_MATRIX_TRACKS.map((track) => {
      const config = getTrackConfig(track.id);
      const pension = sumBy(rows, (row) => {
        const rowTrack = row.tracks.find((item) => item.id === track.id);
        return rowTrack ? rowTrack.pension : 0;
      });
      return {
        ...track,
        pension,
        spousePension: pension * config.spouseShare
      };
    });

    return `
      <div class="needs-note" style="margin-bottom:12px;">הטבלה מסכמת את הקופות המסומנות לפי סוג מוצר/פוליסה, עם סכום ההמרה לקצבה והשוואה בין מסלולי הקצבה המרכזיים.</div>
      <div class="table-wrap">
        <table class="beneficiary-compare">
          <thead>
            <tr>
              <th rowspan="3">סוג פוליסה</th>
              <th rowspan="3">סכום המרה לקצבה</th>
              ${BENEFICIARY_MATRIX_TRACKS.map((track) => `<th colspan="${track.spouseColumn ? 3 : 2}" class="${track.id === state.calc.activeTrack ? "matrix-active" : ""}">${track.title}</th>`).join("")}
            </tr>
            <tr>
              ${BENEFICIARY_MATRIX_TRACKS.map((track) => `<th colspan="${track.spouseColumn ? 3 : 2}" class="${track.id === state.calc.activeTrack ? "matrix-active" : ""}">${escapeHtml(track.subtitle)}</th>`).join("")}
            </tr>
            <tr>
              ${BENEFICIARY_MATRIX_TRACKS.map((track) => `
                <th class="${track.id === state.calc.activeTrack ? "matrix-active" : ""}">מקדם</th>
                <th class="${track.id === state.calc.activeTrack ? "matrix-active" : ""}">גמלא</th>
                ${track.spouseColumn ? `<th class="${track.id === state.calc.activeTrack ? "matrix-active" : ""}">לבן/בת זוג</th>` : ""}
              `).join("")}
            </tr>
          </thead>
          <tbody>
            ${rows.map((row) => `
              <tr>
                <td>${escapeHtml(row.label)}</td>
                <td>${fmtCurrency(row.capital)}</td>
                ${row.tracks.map((track) => `
                  <td class="${track.id === state.calc.activeTrack ? "matrix-active" : ""}">${fmtNumber(track.coefficient, 2)}</td>
                  <td class="${track.id === state.calc.activeTrack ? "matrix-active" : ""}">${fmtCurrency(track.pension)}</td>
                  ${track.spouseColumn ? `<td class="${track.id === state.calc.activeTrack ? "matrix-active" : ""}">${fmtCurrency(track.spousePension)}</td>` : ""}
                `).join("")}
              </tr>
            `).join("")}
            <tr class="beneficiary-total-row">
              <td>סה"כ</td>
              <td>${fmtCurrency(totalCapital)}</td>
              ${totalTracks.map((track) => `
                <td class="${track.id === state.calc.activeTrack ? "matrix-active" : ""}"></td>
                <td class="${track.id === state.calc.activeTrack ? "matrix-active" : ""}">${fmtCurrency(track.pension)}</td>
                ${track.spouseColumn ? `<td class="${track.id === state.calc.activeTrack ? "matrix-active" : ""}">${fmtCurrency(track.spousePension)}</td>` : ""}
              `).join("")}
            </tr>
          </tbody>
        </table>
      </div>

      <div class="panel" style="margin-top:16px;padding:0;background:transparent;border:0;box-shadow:none;">
        <div class="panel-head" style="margin-bottom:10px;">
          <div>
            <h3>פירוט המסלולים</h3>
            <p>התנאים בפועל כפופים לפוליסה ולתנאי חברת הביטוח.</p>
          </div>
        </div>
        <div class="table-wrap">
          <table class="track-legend-table">
            <thead>
              <tr>
                <th>מס'</th>
                <th>פירוט המסלולים</th>
                <th>בכפוף לפוליסה / לתנאי חברת הביטוח</th>
              </tr>
            </thead>
            <tbody>
              ${BENEFICIARY_MATRIX_TRACKS.map((track, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${escapeHtml(track.subtitle.replace("גמלא ", ""))}</td>
                  <td>${escapeHtml(track.description)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function getLiveNeedsValue(key) {
    const numberInput = document.querySelector(`[data-needs-number="${key}"]`);
    if (numberInput) {
      return toNumber(numberInput.value) || 0;
    }
    const textInput = document.querySelector(`[data-needs-text="${key}"]`);
    if (textInput) {
      return String(textInput.value || "").trim();
    }
    return state.needs[key];
  }

  function buildMeetingSummaryNeedsSections() {
    const incomeRows = [
      { label: "שכר עבודה", primaryKey: "incomeWorkPrimary", spouseKey: "incomeWorkSpouse" },
      { label: "קצבת זקנה ב.לאומי", primaryKey: "incomeBituachPrimary", spouseKey: "incomeBituachSpouse" },
      { label: "פנסיה עתידית", primaryKey: "incomePensionPrimary", spouseKey: "incomePensionSpouse" },
      { label: "שכר דירה", primaryKey: "incomeRentPrimary", spouseKey: "incomeRentSpouse" },
      { label: "אחר", primaryKey: "incomeOtherPrimary", spouseKey: "incomeOtherSpouse" }
    ].map((row) => {
      const primaryValue = toNumber(getLiveNeedsValue(row.primaryKey)) || 0;
      const spouseValue = toNumber(getLiveNeedsValue(row.spouseKey)) || 0;
      return {
        label: row.label,
        primary: primaryValue > 0 ? primaryValue : null,
        spouse: spouseValue > 0 ? spouseValue : null
      };
    }).filter((row) => row.primary !== null || row.spouse !== null);

    const hasPrimaryIncome = incomeRows.some((row) => row.primary !== null);
    const hasSpouseIncome = incomeRows.some((row) => row.spouse !== null);
    if (incomeRows.length) {
      incomeRows.push({
        label: "סה\"כ",
        primary: hasPrimaryIncome ? sumBy(incomeRows, (row) => row.primary || 0) : null,
        spouse: hasSpouseIncome ? sumBy(incomeRows, (row) => row.spouse || 0) : null,
        isTotal: true
      });
    }

    const expenseRows = [
      { label: "הוצאות קבועות", amountKey: "fixedExpenses", noteKey: "fixedNotes" },
      { label: "הוצאות משתנות", amountKey: "variableExpenses", noteKey: "variableNotes" }
    ].map((row) => {
      const amountValue = toNumber(getLiveNeedsValue(row.amountKey)) || 0;
      const noteValue = String(getLiveNeedsValue(row.noteKey) || "").trim();
      return {
        label: row.label,
        amount: amountValue > 0 ? amountValue : null,
        note: hasMeaningfulText(noteValue) ? noteValue : ""
      };
    }).filter((row) => row.amount !== null || hasMeaningfulText(row.note));

    const hasExpenseNotes = expenseRows.some((row) => hasMeaningfulText(row.note));
    if (expenseRows.length) {
      expenseRows.push({
        label: "סה\"כ הוצאות",
        amount: sumBy(expenseRows, (row) => row.amount || 0),
        note: "",
        isTotal: true
      });
    }

    const assetRows = [
      { label: "בנק", amountKey: "assetBank" },
      { label: "תיק השקעות", amountKey: "assetPortfolio" },
      { label: "פוליסות", amountKey: "assetPolicies" },
      { label: "קופות גמל", amountKey: "assetProvident" },
      { label: "קרנות השתלמות", amountKey: "assetStudyFunds" },
      { label: "ירושה עתידית", amountKey: "assetInheritance" },
      { label: "נדל\"ן", amountKey: "assetRealEstate" },
      { label: "אחר", amountKey: "assetOther" }
    ].map((row) => {
      const amountValue = toNumber(getLiveNeedsValue(row.amountKey)) || 0;
      return {
        label: row.label,
        amount: amountValue > 0 ? amountValue : null
      };
    }).filter((row) => row.amount !== null);

    if (assetRows.length) {
      assetRows.push({
        label: "סה\"כ",
        amount: sumBy(assetRows, (row) => row.amount || 0),
        isTotal: true
      });
    }

    return {
      incomeRows,
      expenseRows,
      assetRows,
      hasPrimaryIncome,
      hasSpouseIncome,
      hasExpenseNotes,
      hasData: Boolean(incomeRows.length || expenseRows.length || assetRows.length)
    };
  }

  function getMeetingSummaryDefaultTitle() {
    return (state.meetingSummary.adviceType || "pension") === "retirement"
      ? "הנדון: תכנון פרישה - מסמך מרכז"
      : "הנדון: תכנון פנסיוני - מסמך מרכז";
  }

  function getMeetingSummaryDefaultIntro() {
    return (state.meetingSummary.adviceType || "pension") === "retirement"
      ? "מסמך זה מרכז את עיקרי הנתונים, הניתוח המקצועי והמלצות הפעולה כפי שסוכמו בפגישתנו, לטובת ניהול מיטבי של עתידך הפנסיוני."
      : "מסמך זה מרכז את עיקרי הנתונים, הניתוח המקצועי והמלצות הפעולה כפי שסוכמו בפגישתנו, לטובת קבלת החלטות מושכלת וניהול מיטבי של החיסכון הפנסיוני.";
  }

  function buildMeetingSummaryDefaults() {
    const clientName = state.client && state.client.fullName ? state.client.fullName : "לקוח";
    const idNumber = state.client && state.client.idNumber ? ` ת.ז ${state.client.idNumber}` : "";
    return {
      documentDate: formatDateForInput(new Date()),
      adviceType: "pension",
      brandName: "ABD-finance",
      documentTitle: "הנדון: תכנון פנסיוני - מסמך מרכז",
      clientLine: `עבור ${clientName}${idNumber}`,
      introText: "מסמך זה מרכז את עיקרי הנתונים, הניתוח המקצועי והמלצות הפעולה כפי שסוכמו בפגישתנו, לטובת ניהול מיטבי של עתידך הפנסיוני.",
      showFundsSummaryTable: true,
      showNeedsSection: true,
      showFactsTable: true,
      showPensionSnapshotTable: true,
      showInfrastructureTable: true,
      showMigrationTable: true,
      facts: buildMeetingSummaryFacts(),
      recommendations: buildMeetingSummaryRecommendations(),
      manualFollowUps: [],
      hiddenAutoFacts: [],
      hiddenAutoFollowUps: [],
      recommendationsAuto: true,
      screenshots: []
    };
  }

  function refreshMeetingSummaryDynamicData() {
    if (!state.meetingSummary) return;
    syncMeetingSummaryLiveData();
  }

  function buildMeetingSummaryFacts() {
    const selectedFunds = getSelectedFunds();
    const needsTotals = getNeedsTotals();
    const pensionResult = buildTrackResult(state.calc.activeTrack);
    const selectedInsurancePolicies = getSelectedInsurancePolicies();
    return [
      { id: "auto-fact-client-name", isAuto: true, label: "שם הלקוח", value: state.client && state.client.fullName ? state.client.fullName : "—" },
      { id: "auto-fact-client-id", isAuto: true, label: "תעודת זהות", value: state.client && state.client.idNumber ? state.client.idNumber : "—" },
      { id: "auto-fact-funds-count", isAuto: true, label: "מספר קופות בדוח", value: String(state.funds.length) },
      { id: "auto-fact-insurance-count", isAuto: true, label: "מספר פוליסות ביטוח", value: String(state.insurancePolicies.length) },
      { id: "auto-fact-selected-insurance-count", isAuto: true, label: "פוליסות שנבחרו לסיכום", value: String(selectedInsurancePolicies.length) },
      { id: "auto-fact-selected-funds-count", isAuto: true, label: "קופות שסומנו לחישוב", value: String(selectedFunds.length) },
      { id: "auto-fact-pension-capital", isAuto: true, label: "הון לקצבה", value: pensionResult.capital > 0 ? fmtCurrency(pensionResult.capital) : "טרם נבחרו קופות" },
      { id: "auto-fact-estimated-pension", isAuto: true, label: "קצבה משוערת", value: pensionResult.monthlyPension > 0 ? fmtCurrency(pensionResult.monthlyPension) : "טרם חושב" },
      { id: "auto-fact-guarantee-track", isAuto: true, label: "מסלול הבטחה גלובלי", value: describeMeetingGuaranteeTrack() },
      { id: "auto-fact-needs-balance", isAuto: true, label: "מאזן חודשי מבירור צרכים", value: fmtCurrency(needsTotals.balance) }
    ];
  }

  function buildMeetingSummaryRecommendations() {
    return getFundsWithMeetingRecommendations()
      .map((fund) => {
        const text = buildFundMeetingRecommendationText(fund);
        return text ? {
          id: createClientSideId("recommendation"),
          sourceFundId: fund.id,
          text
        } : null;
      })
      .filter(Boolean);
  }

  function getFundsWithMeetingRecommendations() {
    return (state.funds || []).filter((fund) => Boolean(buildFundMeetingRecommendationText(fund)));
  }

  function buildFundMeetingRecommendationText(fund) {
    const recommendationText = normalizeMeetingText(fund.recommendation);

    if (!recommendationText) {
      return "";
    }

    const migrationText = buildFundMigrationSummaryText(fund);
    return `${describeFundForMeeting(fund)}: ${recommendationText}${migrationText ? ` ${migrationText}` : ""}`;
  }

  function buildFundMigrationSummaryText(fund) {
    if (!isFundMigrationActive(fund)) {
      return "";
    }
    const plan = fund.migrationPlan || {};
    if (!plan.targetProduct && !plan.targetCompany && !plan.investmentTrack && !plan.reason && !plan.professionalNotes) {
      return "";
    }
    const parts = [];
    if (plan.targetProduct) parts.push(`מוצר יעד: ${plan.targetProduct}`);
    if (plan.targetCompany) parts.push(`יצרן יעד: ${plan.targetCompany}`);
    if (plan.investmentTrack) parts.push(`מסלול: ${plan.investmentTrack}`);
    if (hasMeaningfulText(plan.managementFeeBalance)) parts.push(`דמי ניהול מצבירה: ${plan.managementFeeBalance}%`);
    if (hasMeaningfulText(plan.managementFeeDeposit)) parts.push(`דמי ניהול מהפקדה: ${plan.managementFeeDeposit}%`);
    if (hasMeaningfulText(plan.reason)) parts.push(`סיבת ההמלצה: ${plan.reason}`);
    if (hasMeaningfulText(plan.professionalNotes)) parts.push(`הערות מקצועיות: ${plan.professionalNotes}`);
    return parts.length ? `פרטי הניוד: ${parts.join(" | ")}.` : "";
  }

  function getMigrationRecommendations() {
    return (state.funds || []).filter((fund) => isFundMigrationActive(fund) && fund.migrationPlan && (fund.migrationPlan.targetProduct || fund.migrationPlan.targetCompany || fund.migrationPlan.investmentTrack || fund.migrationPlan.reason || fund.migrationPlan.professionalNotes));
  }

  function renderMigrationSummaryTable() {
    const funds = getMigrationRecommendations();
    if (!funds.length) {
      return "";
    }
    return `
      <div class="summary-preview-table-wrap">
        <table class="summary-preview-table migration-summary-table">
          <thead>
            <tr>
              <th>קופה קיימת</th>
              <th>מוצר יעד</th>
              <th>יצרן יעד</th>
              <th>מסלול</th>
              <th>מצבירה</th>
              <th>מהפקדה</th>
              <th>סיבת המלצה</th>
            </tr>
          </thead>
          <tbody>
            ${funds.map((fund) => {
              const plan = fund.migrationPlan || {};
              return `
                <tr>
                  <td>${escapeHtml(describeFundForMeeting(fund))}</td>
                  <td>${escapeHtml(plan.targetProduct || "—")}</td>
                  <td>${escapeHtml(plan.targetCompany || "—")}</td>
                  <td>${escapeHtml(plan.investmentTrack || "—")}</td>
                  <td>${escapeHtml(hasMeaningfulText(plan.managementFeeBalance) ? `${plan.managementFeeBalance}%` : "—")}</td>
                  <td>${escapeHtml(hasMeaningfulText(plan.managementFeeDeposit) ? `${plan.managementFeeDeposit}%` : "—")}</td>
                  <td>${escapeHtml(plan.reason || plan.professionalNotes || "—")}</td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function buildMeetingSummaryFollowUps() {
    const selectedFunds = getSelectedFunds();
    const hiddenAuto = new Set((state.meetingSummary.hiddenAutoFollowUps || []).map((item) => normalizeMeetingText(item)).filter(Boolean));
    const entries = [];
    const seen = new Set();

    (state.meetingSummary.manualFollowUps || []).forEach((item) => {
      const text = normalizeMeetingText(item.text);
      if (!text || seen.has(text)) return;
      seen.add(text);
      entries.push({
        id: item.id || createClientSideId("followup"),
        text,
        isAuto: false
      });
    });

    selectedFunds.forEach((fund) => {
      [fund.notes]
        .map((value) => normalizeMeetingText(value))
        .filter(Boolean)
        .forEach((value) => {
          if (!seen.has(value) && !hiddenAuto.has(value)) {
            seen.add(value);
            entries.push({
              id: `auto-followup-${entries.length + 1}`,
              text: value,
              isAuto: true,
              sourceText: value
            });
          }
        });
    });
    const screenshotsFollowUp = "לסיכום צורפו צילומי מסך ומסמכים תומכים להמשך הטיפול.";
    if (state.meetingSummary.screenshots.some((item) => item.imageData) && !seen.has(screenshotsFollowUp) && !hiddenAuto.has(screenshotsFollowUp)) {
      entries.push({
        id: `auto-followup-${entries.length + 1}`,
        text: screenshotsFollowUp,
        isAuto: true,
        sourceText: screenshotsFollowUp
      });
    }
    return entries.slice(0, 8);
  }

  function renderInfrastructureSummaryPreview() {
    const rows = buildInfrastructureRows();
    if (!rows.length) {
      return "";
    }
    const totals = {
      compensationPension: sumBy(rows, (row) => row.compensationPension),
      compensationCapital: sumBy(rows, (row) => row.compensationCapital),
      capitalBefore2008: sumBy(rows, (row) => row.capitalBefore2008),
      capitalAfter2008: sumBy(rows, (row) => row.capitalAfter2008),
      pensionBefore2000: sumBy(rows, (row) => row.pensionBefore2000),
      pensionAfter2000: sumBy(rows, (row) => row.pensionAfter2000),
      total: sumBy(rows, (row) => row.total)
    };
    return `
      <div class="summary-preview-table-wrap">
        <table class="summary-preview-table summary-compact-table">
          <thead>
            <tr>
              <th>יצרן</th>
              <th>מס' פוליסה</th>
              <th>פיצויים למס</th>
              <th>פיצויים הון</th>
              <th>הון עד 2008</th>
              <th>הון מ-2008</th>
              <th>לקצבה עד 2000</th>
              <th>לקצבה אחרי 2000</th>
              <th>סה"כ</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((row) => `
              <tr>
                <td>${escapeHtml(row.manufacturer || "—")}</td>
                <td>${escapeHtml(row.accountNumber || "—")}</td>
                <td>${fmtCurrency(row.compensationPension)}</td>
                <td>${fmtCurrency(row.compensationCapital)}</td>
                <td>${fmtCurrency(row.capitalBefore2008)}</td>
                <td>${fmtCurrency(row.capitalAfter2008)}</td>
                <td>${fmtCurrency(row.pensionBefore2000)}</td>
                <td>${fmtCurrency(row.pensionAfter2000)}</td>
                <td>${fmtCurrency(row.total)}</td>
              </tr>
            `).join("")}
            <tr class="summary-total-row">
              <td colspan="2">סה"כ</td>
              <td>${fmtCurrency(totals.compensationPension)}</td>
              <td>${fmtCurrency(totals.compensationCapital)}</td>
              <td>${fmtCurrency(totals.capitalBefore2008)}</td>
              <td>${fmtCurrency(totals.capitalAfter2008)}</td>
              <td>${fmtCurrency(totals.pensionBefore2000)}</td>
              <td>${fmtCurrency(totals.pensionAfter2000)}</td>
              <td>${fmtCurrency(totals.total)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  function extractManagementFeeText(product, retirement, kind) {
    const depositKeys = [
      "דמי ניהול מהפקדה",
      "שיעור דמי ניהול מהפקדה",
      "דמי ניהול מהפקדות",
      "שיעור דמי ניהול מהפקדות"
    ];
    const balanceKeys = [
      "דמי ניהול מצבירה",
      "שיעור דמי ניהול מצבירה",
      "דמי ניהול מהצבירה",
      "שיעור דמי ניהול מהצבירה",
      "דמי ניהול שנתיים מצבירה"
    ];
    const keys = kind === "deposit" ? depositKeys : balanceKeys;
    return normalizeManagementFeeText(getText(product, keys) || getText(retirement, keys) || "");
  }

  function getSelectedInsurancePolicies() {
    return state.insurancePolicies.filter((policy) => state.selectedInsurancePolicyIds.has(policy.id));
  }

  function renderInsuranceSummaryPreview() {
    const policies = getSelectedInsurancePolicies();
    if (!policies.length) {
      return "";
    }
    return `
      <div class="summary-preview-table-wrap">
        <table class="summary-preview-table summary-compact-table">
          <thead>
            <tr>
              <th>חברה</th>
              <th>ענף ראשי</th>
              <th>כיסוי / ענף משני</th>
              <th>סוג מוצר</th>
              <th>תוכנית</th>
              <th>מס' פוליסה</th>
              <th>תקופת ביטוח</th>
              <th>סוג פרמיה</th>
              <th>פרמיה</th>
              <th>סכום ביטוח</th>
              <th>פרטים נוספים</th>
            </tr>
          </thead>
          <tbody>
            ${policies.map((policy) => `
              <tr>
                <td>${escapeHtml(policy.manufacturer || "—")}</td>
                <td>${escapeHtml(policy.mainBranch || "—")}</td>
                <td>${escapeHtml(policy.secondaryBranch || "—")}</td>
                <td>${escapeHtml(policy.productType || "—")}</td>
                <td>${escapeHtml(policy.planName || "—")}</td>
                <td>${escapeHtml(policy.policyNumber || "—")}</td>
                <td>${escapeHtml(policy.periodText || "—")}</td>
                <td>${escapeHtml(policy.premiumType || "—")}</td>
                <td>${policy.premium ? fmtCurrency(policy.premium) : "—"}</td>
                <td>${policy.coverageAmount ? fmtCurrency(policy.coverageAmount) : "—"}</td>
                <td>${escapeHtml(policy.moreDetails || "—")}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function normalizeManagementFeeText(value) {
    const raw = String(value || "").trim();
    const numeric = toNumber(raw);
    if (Number.isFinite(numeric) && /^[-+]?\d+(?:[.,]\d+)?\s*%?$/.test(raw)) {
      return `${trimTrailingZeros(normalizeFeePercentValue(numeric))}%`;
    }
    return raw
      .replace(/(\d+\.\d*?[1-9])0+(?=\s*%)/g, "$1")
      .replace(/(\d+)\.0+(?=\s*%)/g, "$1")
      .replace(/(\d+),(\d*?[1-9])0+(?=\s*%)/g, "$1.$2")
      .replace(/(\d+),0+(?=\s*%)/g, "$1")
      .replace(/(\d+)\.(?=\s*%)/g, "$1")
      .replace(/\s+/g, " ")
      .trim();
  }

  function buildManagementFeeDisplay(product, retirement) {
    const deposit = extractManagementFeeText(product, retirement, "deposit");
    const balance = extractManagementFeeText(product, retirement, "balance");
    if (deposit && balance) {
      return `מהפקדה ${deposit} | מצבירה ${balance}`;
    }
    if (balance) {
      return `מצבירה ${balance}`;
    }
    if (deposit) {
      return `מהפקדה ${deposit}`;
    }
    return "";
  }

  function describeMeetingGuaranteeTrack() {
    if (state.calc.spouseShare > 0) {
      return `${Math.round(state.calc.spouseShare * 100)}% לשאיר/ה`;
    }
    if (state.calc.guaranteeMonths > 0) {
      return `הבטחה ל-${state.calc.guaranteeMonths} גמלאות`;
    }
    return "ללא תקופת הבטחה";
  }

  function buildNeedsDefaults(funds) {
    const defaults = {
      incomeWorkPrimary: 0,
      incomeBituachPrimary: 0,
      incomePensionPrimary: sumBy(funds, (fund) => fund.importedPension),
      incomeRentPrimary: 0,
      incomeOtherPrimary: 0,
      incomeWorkSpouse: 0,
      incomeBituachSpouse: 0,
      incomePensionSpouse: 0,
      incomeRentSpouse: 0,
      incomeOtherSpouse: 0,
      fixedExpenses: 0,
      variableExpenses: 0,
      fixedNotes: "",
      variableNotes: "",
      assetBank: 0,
      assetPortfolio: 0,
      assetPolicies: sumBy(funds.filter((fund) => /פוליסה|מנהלים|ביטוח/i.test(fund.productType || "")), (fund) => fund.currentBalance),
      assetProvident: sumBy(funds.filter((fund) => /גמל/i.test(fund.productType || "")), (fund) => fund.currentBalance),
      assetStudyFunds: sumBy(funds.filter((fund) => /השתלמות/i.test(fund.productType || "")), (fund) => fund.currentBalance),
      assetInheritance: 0,
      assetRealEstate: 0,
      assetOther: 0,
      completed: false
    };
    return defaults;
  }

  function getNeedsTotals() {
    const primaryIncome = (state.needs.incomeWorkPrimary || 0)
      + (state.needs.incomeBituachPrimary || 0)
      + (state.needs.incomePensionPrimary || 0)
      + (state.needs.incomeRentPrimary || 0)
      + (state.needs.incomeOtherPrimary || 0);
    const spouseIncome = (state.needs.incomeWorkSpouse || 0)
      + (state.needs.incomeBituachSpouse || 0)
      + (state.needs.incomePensionSpouse || 0)
      + (state.needs.incomeRentSpouse || 0)
      + (state.needs.incomeOtherSpouse || 0);
    const totalIncome = primaryIncome + spouseIncome;
    const totalExpenses = (state.needs.fixedExpenses || 0) + (state.needs.variableExpenses || 0);
    const totalAssets = (state.needs.assetBank || 0)
      + (state.needs.assetPortfolio || 0)
      + (state.needs.assetPolicies || 0)
      + (state.needs.assetProvident || 0)
      + (state.needs.assetStudyFunds || 0)
      + (state.needs.assetInheritance || 0)
      + (state.needs.assetRealEstate || 0)
      + (state.needs.assetOther || 0);
    return {
      primaryIncome,
      spouseIncome,
      totalIncome,
      totalExpenses,
      totalAssets,
      balance: totalIncome - totalExpenses
    };
  }

  function getSimulationCapital(manualCapital) {
    const manual = toNumber(manualCapital);
    if (manual > 0) return manual;
    return sumBy(getSelectedFunds(), (fund) => getFundCapital(fund));
  }

  function getFundCapital(fund) {
    return firstPositive(fund.retirementCapital, fund.currentBalance, 0);
  }

  function getFundBaseFactor(fund, fallback) {
    return firstPositive(
      fund.guaranteedCoefficient,
      fund.importedPension > 0 && getFundCapital(fund) > 0 ? getFundCapital(fund) / fund.importedPension : NaN,
      fallback,
      0
    );
  }

  function getWeightedBaseFactor(funds, fallback) {
    const valid = funds.filter((fund) => getFundCapital(fund) > 0);
    if (!valid.length) return fallback;
    const totalCapital = sumBy(valid, (fund) => getFundCapital(fund));
    const totalPension = sumBy(valid, (fund) => {
      const factor = getFundBaseFactor(fund, fallback);
      return factor > 0 ? getFundCapital(fund) / factor : 0;
    });
    if (totalCapital <= 0 || totalPension <= 0) return fallback;
    return roundNumber(totalCapital / totalPension, 2);
  }

  function setLoading(show, message) {
    dom.loadingOverlay.classList.toggle("show", show);
    dom.loadingMessage.textContent = message || "טוען...";
  }

  function showToast(message, isError) {
    clearTimeout(toastTimer);
    dom.toast.textContent = message;
    dom.toast.classList.toggle("error", Boolean(isError));
    dom.toast.classList.add("show");
    toastTimer = setTimeout(() => dom.toast.classList.remove("show"), isError ? 5000 : 3200);
  }

  function renderSelectOptions(select, options, placeholder, selected) {
    select.innerHTML = [`<option value="all">${escapeHtml(placeholder)}</option>`]
      .concat(options.map((value) => `<option value="${escapeAttribute(value)}">${escapeHtml(value)}</option>`))
      .join("");
    select.value = selected;
  }

  function createSummaryCard(label, value, foot) {
    const iconSvgMap = {
      "לקוח":           `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`,
      "מבוטח/ת":        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`,
      "קופות":          `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3H8L6 7h12z"/></svg>`,
      "פוליסות ביטוח":  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L3 6v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V6z"/></svg>`,
      "הון לקצבה":      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
      "קצבה משוערת":    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`,
      "הכנסות נטו":     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
      "הוצאות":         `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
      "פער חודשי":      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
      "נכסים":          `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
      'סה"כ הכנסות':    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`,
      'סה"כ הוצאות':    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
      "עודף / גרעון":   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
    };
    const defaultSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
    const icon = iconSvgMap[label] || defaultSvg;
    return `<article class="summary-card">
      <div class="summary-card-icon">${icon}</div>
      <div class="summary-label">${escapeHtml(label)}</div>
      <div class="summary-value">${escapeHtml(value)}</div>
      <div class="summary-foot">${escapeHtml(foot)}</div>
      <svg class="summary-sparkline" viewBox="0 0 100 36" preserveAspectRatio="none">
        <defs><linearGradient id="sparkFillGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#3b82f6" stop-opacity="0.4"/><stop offset="100%" stop-color="#3b82f6" stop-opacity="0"/></linearGradient></defs>
        <polygon class="spark-fill" points="0,36 10,28 25,22 40,18 55,14 70,10 85,6 100,4 100,36"/>
        <polyline points="0,28 10,22 25,18 40,14 55,10 70,8 85,5 100,4"/>
      </svg>
    </article>`;
  }

  function renderResultCard(label, value, foot) {
    return `<article class="result-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><div class="muted">${escapeHtml(foot)}</div></article>`;
  }

  function hasMeaningfulText(value) {
    return String(value || "").trim().length > 0;
  }

  function normalizeMeetingText(value) {
    return String(value || "").replace(/\s+/g, " ").trim().replace(/[.]+$/g, "");
  }

  function describeFundForMeeting(fund) {
    const typeLabel = normalizeMeetingText(fund.productType || fund.planName || fund.productName || "מוצר");
    const manufacturerLabel = normalizeMeetingText(fund.manufacturer);
    const accountLabel = normalizeMeetingText(fund.accountNumber);
    return [
      typeLabel,
      manufacturerLabel ? `ב${manufacturerLabel}` : "",
      accountLabel ? `מספר ${accountLabel}` : ""
    ].filter(Boolean).join(" ");
  }

  function formatOptionalCurrency(value, showZero) {
    const amount = Number(value);
    if (!Number.isFinite(amount)) {
      return "—";
    }
    if (amount === 0 && !showZero) {
      return "—";
    }
    return fmtCurrency(amount);
  }

  function fmtCurrency(value) {
    const amount = Number.isFinite(value) ? value : 0;
    return new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(amount);
  }

  function fmtNumber(value, digits) {
    const amount = Number.isFinite(value) ? value : 0;
    return new Intl.NumberFormat("he-IL", { minimumFractionDigits: digits || 0, maximumFractionDigits: digits || 0 }).format(amount);
  }

  function fmtPercent(ratio) {
    const value = Number.isFinite(ratio) ? ratio : 0;
    return new Intl.NumberFormat("he-IL", { style: "percent", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  }

  function normalizeHeader(value) {
    return String(value || "").replace(/\n/g, " ").replace(/\s+/g, " ").replace(/["״]/g, "\"").trim();
  }

  function normalizeText(value) {
    return normalizeHeader(value).toLowerCase();
  }

  function getFileExtension(fileName) {
    return String(fileName || "").split(".").pop().toLowerCase();
  }

  function getTextFromCell(value) {
    return String(value || "").trim();
  }

  function isWorkbookPlaceholder(value) {
    return /^\[[^\]]+\]$/.test(getTextFromCell(value));
  }

  function normalizeDigits(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function trimLeadingZeros(value) {
    const digits = normalizeDigits(value);
    return digits.replace(/^0+/, "") || digits;
  }

  function formatXmlDate(value) {
    const digits = normalizeDigits(value);
    if (digits.length !== 8) return "";
    return `${digits.slice(6, 8)}/${digits.slice(4, 6)}/${digits.slice(0, 4)}`;
  }

  function extractSourceLabelFromFile(fileName) {
    const name = String(fileName || "").toUpperCase();
    if (name.includes("KGM")) return "קופת גמל";
    if (name.includes("ING")) return "ביטוח / חיסכון";
    if (name.includes("INK")) return "קרן השתלמות";
    if (name.includes("INP")) return "ביטוח";
    if (name.includes("PNO")) return "קרן פנסיה";
    if (name.includes("PNN")) return "קרן פנסיה";
    return "מסלקה";
  }

  function getClearinghouseProductType(entryName, planName, policyNode) {
    const sourceLabel = extractSourceLabelFromFile(entryName);
    const normalizedPlan = normalizeText(planName);
    const productCode = getXmlText(policyNode, ["SUG-MUTZAR", "SUG-TOCHNIT-O-CHESHBON"]);
    if (sourceLabel === "קרן פנסיה") return "קרן פנסיה";
    if (sourceLabel === "קרן השתלמות" || normalizedPlan.includes("השתל")) return "קרן השתלמות";
    if (sourceLabel === "קופת גמל") return "קופת גמל";
    if (sourceLabel === "ביטוח" || sourceLabel === "ביטוח / חיסכון") {
      if (normalizedPlan.includes("חיסכון")) return "פוליסת חיסכון";
      return "ביטוח";
    }
    if (String(productCode) === "1") return "ביטוח";
    if (String(productCode) === "4") return "קופת גמל";
    return sourceLabel;
  }

  function isInsuranceSavingsProduct(productType, planName) {
    const combined = normalizeText([productType, planName].filter(Boolean).join(" "));
    return combined.includes("מנהלים") || combined.includes("פוליסת חיסכון") || combined.includes("חיסכון");
  }

  function isRetirementSavingsProduct(productType, planName) {
    const combined = normalizeText([productType, planName].filter(Boolean).join(" "));
    return combined.includes("קרן השתלמות")
      || combined.includes("קופת גמל")
      || combined.includes("קרן פנסיה");
  }

  function shouldIncludeClearinghouseCoverage(productType, planName, sourceLabel) {
    if (isRetirementSavingsProduct(productType, planName)) return false;
    const normalizedSource = normalizeText(sourceLabel);
    return normalizedSource.includes("ביטוח")
      || isInsuranceSavingsProduct(productType, planName);
  }

  function isInsuranceLikeCoverageName(coverageName, planName) {
    const coverage = normalizeText(coverageName);
    const plan = normalizeText(planName);
    if (!coverage) return false;
    if (coverage === plan) return false;
    return coverage.includes("ריסק")
      || coverage.includes("חיים")
      || coverage.includes("מוות")
      || coverage.includes("אובדן")
      || coverage.includes("נכות")
      || coverage.includes("סיעוד")
      || coverage.includes("בריאות")
      || coverage.includes("תאונ")
      || coverage.includes("מחלות")
      || coverage.includes("שארים")
      || coverage.includes("שאיר");
  }

  function classifyHarHabituachPolicy(mainBranch, productType, classification) {
    const branchText = normalizeText(mainBranch);
    const combined = normalizeText([productType, classification].filter(Boolean).join(" "));
    if (combined.includes("מנהלים") || combined.includes("פוליסת חיסכון")) return "פוליסת חיסכון ביטוחית";
    if (branchText.includes("פנסיה")) return "חיסכון פנסיוני";
    if (branchText.includes("חיים") || branchText.includes("בריאות") || branchText.includes("תאונות") || branchText.includes("סיעוד")) return "פוליסת ביטוח";
    return "פוליסת ביטוח";
  }

  function mapClearinghouseStatus(code) {
    switch (String(code || "").trim()) {
      case "1":
        return "פעיל";
      case "2":
        return "לא פעיל";
      case "3":
        return "מוקפא";
      default:
        return "לא ידוע";
    }
  }

  function mapClearinghouseLayerCode(code) {
    switch (String(code || "").trim()) {
      case "1": return "לפני 2000";
      case "2": return "עד 2008";
      case "3": return "אחרי 2008";
      case "4": return "הון עד 2008";
      case "5": return "שכבה נוספת";
      case "6": return "הון עד 2008";
      case "7": return "הון אחרי 2008";
      case "9": return "רכיב הוני";
      default: return `שכבה ${code || "לא ידועה"}`;
    }
  }

  function mapClearinghouseComponentCode(code) {
    switch (String(code || "").trim()) {
      case "1": return "פיצויים";
      case "2": return "תגמולים";
      case "3": return "תגמולים לקצבה";
      case "4": return "תגמולים 47";
      default: return `רכיב ${code || "לא ידוע"}`;
    }
  }

  function mapClearinghouseBalanceTypeCode(code) {
    switch (String(code || "").trim()) {
      case "1": return "הון";
      case "2": return "קצבה משלמת";
      case "3": return "קצבה לא משלמת";
      case "4": return "חייב";
      default: return `סוג ${code || "לא ידוע"}`;
    }
  }

  function formatManagementFeeValue(value) {
    if (!Number.isFinite(value)) return "";
    return `${trimTrailingZeros(value)}%`;
  }

  function buildManagementFeeTextFromValues(depositFee, balanceFee) {
    const parts = [];
    if (Number.isFinite(depositFee)) {
      parts.push(`מהפקדה ${trimTrailingZeros(depositFee)}%`);
    }
    if (Number.isFinite(balanceFee)) {
      parts.push(`מצבירה ${trimTrailingZeros(balanceFee)}%`);
    }
    return parts.join(" | ");
  }

  function getClearinghouseManagementFees(policyNode, trackNodes) {
    const tracks = Array.isArray(trackNodes) ? trackNodes : [];
    const expensesNode = firstXmlNode(policyNode, "HotzaotBafoalLehodeshDivoach");
    const depositFee = firstMeaningfulFeeNumber(
      ...getXmlFeeStructureValues(policyNode, "deposit"),
      ...tracks.map((trackNode) => getDirectXmlPercent(trackNode, ["SHEUR-DMEI-NIHUL-HAFKADA"], "deposit")),
      ...tracks.map((trackNode) => getDirectXmlPercent(trackNode, ["SHEUR-DMEI-NIHUL-HAFKADA-MIVNE"], "deposit")),
      getDirectXmlPercent(expensesNode, ["SHEUR-DMEI-NIHUL-HAFKADA"], "deposit"),
      getDirectXmlPercent(expensesNode, ["MEMOTZA-SHEUR-DMEI-NIHUL-HAFKADA"], "deposit")
    );
    const balanceFee = firstMeaningfulFeeNumber(
      ...getXmlFeeStructureValues(policyNode, "balance"),
      ...tracks.map((trackNode) => getDirectXmlPercent(trackNode, ["SHEUR-DMEI-NIHUL-HISACHON"], "balance")),
      ...tracks.map((trackNode) => getDirectXmlPercent(trackNode, ["SHEUR-DMEI-NIHUL-HISACHON-MIVNE"], "balance")),
      getDirectXmlPercent(expensesNode, ["SHEUR-DMEI-NIHUL-HISACHON"], "balance"),
      getMonthlyXmlPercentAsAnnual(expensesNode || policyNode, ["SHEUR-DMEI-NIHUL-TZVIRA"])
    );
    return { depositFee, balanceFee };
  }

  function getClearinghousePolicyManufacturer(policyNode, fallbackManufacturer) {
    const direct = getDirectXmlText(policyNode, ["SHEM-YATZRAN", "SHEM-GUF-MOSDI", "SHEM-HEVRA"]);
    if (direct) return direct;
    let current = policyNode ? policyNode.parentNode : null;
    while (current && current.nodeType === 1) {
      const tagName = String(current.nodeName || "");
      if (/YeshutYatzran|NetuneiMutzar|MivneMutzar|^Mutzar$/i.test(tagName)) {
        const ancestorManufacturer = getDirectXmlText(current, ["SHEM-YATZRAN", "SHEM-GUF-MOSDI", "SHEM-HEVRA"]);
        if (ancestorManufacturer) return ancestorManufacturer;
      }
      current = current.parentNode;
    }
    return fallbackManufacturer || "";
  }

  function getXmlFeeStructureValues(policyNode, kind) {
    if (!policyNode) return [];
    return Array.from(policyNode.getElementsByTagName("PerutMivneDmeiNihul"))
      .filter((node) => {
        const expenseType = getXmlText(node, ["SUG-HOTZAA", "OFEN-HAFRASHA"]);
        if (kind === "deposit") return expenseType === "2" || expenseType === "3";
        if (kind === "balance") return expenseType === "1";
        return true;
      })
      .map((node) => getXmlPercent(node, ["SHEUR-DMEI-NIHUL"], kind));
  }

  function getMonthlyXmlPercentAsAnnual(root, possibleTagNames) {
    const value = normalizeMonthlyFeePercentValue(getXmlNumber(root, possibleTagNames));
    return Number.isFinite(value) ? roundNumber(value * 12, 4) : NaN;
  }

  function firstFiniteNumber(...values) {
    return values.find((value) => Number.isFinite(value));
  }

  function firstMeaningfulFeeNumber(...values) {
    const finiteValues = values.filter((value) => Number.isFinite(value));
    if (!finiteValues.length) return NaN;
    const positiveValue = finiteValues.find((value) => Math.abs(value) > 0.00001);
    return Number.isFinite(positiveValue) ? positiveValue : finiteValues[0];
  }

  function trimTrailingZeros(value) {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return "";
    return String(amount.toFixed(5)).replace(/\.?0+$/, "");
  }

  function firstXmlNode(root, tagName) {
    const nodes = root ? root.getElementsByTagName(tagName) : [];
    return nodes && nodes.length ? nodes[0] : null;
  }

  function getXmlText(root, possibleTagNames) {
    for (const tagName of possibleTagNames) {
      const node = firstXmlNode(root, tagName);
      if (node && node.textContent && String(node.textContent).trim()) {
        return String(node.textContent).trim();
      }
    }
    return "";
  }

  function getDirectXmlText(root, possibleTagNames) {
    if (!root || !root.childNodes) return "";
    for (const tagName of possibleTagNames) {
      const node = Array.from(root.childNodes || [])
        .find((child) => child.nodeType === 1 && child.nodeName === tagName);
      const value = node && node.textContent ? String(node.textContent).trim() : "";
      if (value) return value;
    }
    return "";
  }

  function getSingleXmlTextValue(root, possibleTagNames) {
    const values = [];
    possibleTagNames.forEach((tagName) => {
      Array.from(root ? root.getElementsByTagName(tagName) : []).forEach((node) => {
        const value = node && node.textContent ? String(node.textContent).trim() : "";
        const comparable = normalizeComparable(value);
        if (value && !values.some((item) => normalizeComparable(item) === comparable)) {
          values.push(value);
        }
      });
    });
    return values.length === 1 ? values[0] : "";
  }

  function inferManufacturerFromText(value) {
    const text = normalizeText(value);
    if (!text) return "";
    const compact = text.replace(/\s+/g, "");
    const manufacturers = [
      { name: "ילין לפידות", patterns: ["ילין לפידות", "יליןלפידות"] },
      { name: "אלטשולר שחם", patterns: ["אלטשולר שחם", "אלטשולר"] },
      { name: "מנורה מבטחים", patterns: ["מנורה מבטחים", "מנורה"] },
      { name: "הפניקס", patterns: ["הפניקס", "פניקס"] },
      { name: "הראל", patterns: ["הראל"] },
      { name: "מגדל", patterns: ["מגדל", "מקפת"] },
      { name: "מיטב", patterns: ["מיטב"] },
      { name: "מור", patterns: ["מור גמל", "מור השתלמות", "מור השקעות"] },
      { name: "אנליסט", patterns: ["אנליסט"] },
      { name: "איילון", patterns: ["איילון"] },
      { name: "הכשרה", patterns: ["הכשרה"] },
      { name: "כלל", patterns: ["כלל חברה", "כלל פנסיה", "כלל ביטוח", "כלל גמל"] },
      { name: "עמיתים", patterns: ["עמיתים", "מבטחים ותיקה", "מבטחים הוותיקה", "קרן מבטחים הוותיקה", "קגמ", "קג\"מ", "נתיב", "חקלאים", "בניין", "אגד", "הדסה"] }
    ];
    const match = manufacturers.find((manufacturer) => manufacturer.patterns.some((pattern) => {
      const normalizedPattern = normalizeText(pattern);
      return text.includes(normalizedPattern) || compact.includes(normalizedPattern.replace(/\s+/g, ""));
    }));
    return match ? match.name : "";
  }

  function normalizeFundManufacturers(funds) {
    return (Array.isArray(funds) ? funds : []).map((fund) => {
      if (!fund) return fund;
      const inferred = inferManufacturerFromText([
        fund.productName,
        fund.planName,
        fund.investmentTrack,
        fund.retirementTrackName,
        fund.manufacturer
      ].filter(Boolean).join(" "));
      if (!inferred || normalizeComparable(inferred) === normalizeComparable(fund.manufacturer || "")) {
        return fund;
      }
      return { ...fund, manufacturer: inferred };
    });
  }

  function getXmlNumber(root, possibleTagNames) {
    const value = getXmlText(root, possibleTagNames);
    return toNumber(value);
  }

  function getXmlPercent(root, possibleTagNames, kind = "") {
    return normalizeFeePercentValue(getXmlNumber(root, possibleTagNames), kind);
  }

  function getDirectXmlNumber(root, possibleTagNames) {
    const value = getDirectXmlText(root, possibleTagNames);
    return toNumber(value);
  }

  function getDirectXmlPercent(root, possibleTagNames, kind = "") {
    return normalizeFeePercentValue(getDirectXmlNumber(root, possibleTagNames), kind);
  }

  function normalizeComparable(value) {
    return normalizeHeader(value).replace(/[()"'״־–—\-]/g, "").replace(/\s+/g, "").toLowerCase();
  }

  function getText(record, possibleHeaders) {
    const key = findHeader(record, possibleHeaders);
    return key ? String(record[key] || "").trim() : "";
  }

  function getNumber(record, possibleHeaders) {
    const key = findHeader(record, possibleHeaders);
    return key ? toNumber(record[key]) : NaN;
  }

  function findHeader(record, possibleHeaders) {
    const entries = Object.keys(record || {}).map((key) => ({ key, comparable: normalizeComparable(key) }));
    for (const candidate of possibleHeaders) {
      const comparableCandidate = normalizeComparable(candidate);
      const exact = entries.find((entry) => entry.comparable === comparableCandidate);
      if (exact) return exact.key;
      const partial = entries.find((entry) => entry.comparable.includes(comparableCandidate));
      if (partial) return partial.key;
    }
    return "";
  }

  function normalizeAccount(value) {
    return String(value || "").replace(/[^\dA-Za-z]/g, "").trim();
  }

  function normalizeShare(value) {
    const numeric = toNumber(value);
    if (!Number.isFinite(numeric)) return 0;
    return numeric <= 1 ? numeric * 100 : numeric;
  }

  function normalizeFeePercentValue(value, kind = "") {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return NaN;
    if (numeric === 0) return 0;
    const maxReasonableFee = kind === "deposit" ? 8 : kind === "balance" ? 3 : 10;
    if (numeric > 100 && numeric / 10000 <= maxReasonableFee) {
      return roundNumber(numeric / 10000, 5);
    }
    if (numeric > maxReasonableFee && numeric / 100 <= maxReasonableFee) {
      return roundNumber(numeric / 100, 5);
    }
    if (numeric > 0 && numeric < 0.0005 && numeric * 10000 <= maxReasonableFee) {
      return roundNumber(numeric * 10000, 5);
    }
    if (numeric > 0 && numeric < 0.05 && numeric * 100 <= maxReasonableFee) {
      return roundNumber(numeric * 100, 5);
    }
    return numeric <= maxReasonableFee ? roundNumber(numeric, 5) : NaN;
  }

  function normalizeMonthlyFeePercentValue(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return NaN;
    if (numeric > 100) return numeric / 10000;
    return numeric;
  }

  function toNumber(value) {
    if (typeof value === "number") return Number.isFinite(value) ? value : NaN;
    let cleaned = String(value || "").trim().replace(/[₪%]/g, "").replace(/\s+/g, "");
    const hasComma = cleaned.includes(",");
    const hasDot = cleaned.includes(".");
    if (hasComma && hasDot) {
      cleaned = cleaned.replace(/,/g, "");
    } else if (hasComma) {
      const parts = cleaned.split(",");
      const lastPart = parts[parts.length - 1] || "";
      cleaned = lastPart.length <= 2
        ? `${parts.slice(0, -1).join("")}.${lastPart}`
        : parts.join("");
    }
    if (!cleaned) return NaN;
    const numeric = Number(cleaned);
    return Number.isFinite(numeric) ? numeric : NaN;
  }

  function sumBy(items, mapper) {
    return items.reduce((sum, item) => sum + (mapper(item) || 0), 0);
  }

  function groupBy(items, keyGetter) {
    const map = new Map();
    items.forEach((item) => {
      const key = keyGetter(item);
      if (!key) return;
      const collection = map.get(key) || [];
      collection.push(item);
      map.set(key, collection);
    });
    return map;
  }

  function firstPositive(...values) {
    for (const value of values) {
      if (Number.isFinite(value) && value > 0) return value;
    }
    return 0;
  }

  function uniqueValues(values) {
    return Array.from(new Set(values)).sort((left, right) => compareText(left, right));
  }

  function isActiveStatus(status) {
    const text = String(status || "").trim();
    if (!text) return false;
    return text.includes("פעיל") && !text.includes("לא פעיל") && !text.includes("מוקפא") && !text.includes("מסולק");
  }

  function isInactiveStatus(status) {
    const text = String(status || "").trim();
    if (!text) return false;
    return text.includes("לא פעיל") || text.includes("מוקפא") || text.includes("מסולק") || text.includes("תום תקופה");
  }

  function getStatusVisualClass(status) {
    if (isActiveStatus(status)) return "is-active-status";
    if (isInactiveStatus(status)) return "is-inactive-status";
    return "";
  }

  function renderStatusBadge(status) {
    const text = String(status || "").trim();
    const badgeClass = isActiveStatus(text) ? "mint" : isInactiveStatus(text) ? "danger" : "";
    return `<span class="badge ${badgeClass}">${escapeHtml(text || "—")}</span>`;
  }

  function resolveManufacturerBrand(fundOrName) {
    const fund = typeof fundOrName === "object" && fundOrName ? fundOrName : {};
    const rawName = typeof fundOrName === "string" ? fundOrName : fund.manufacturer;
    const haystack = normalizeText([
      rawName,
      fund.planName,
      fund.productName,
      fund.productType,
      fund.investmentTrack,
      fund.retirementTrackName
    ].filter(Boolean).join(" "));
    const brands = [
      { key: "phoenix", label: "הפניקס", fileName: "הפניקס", mark: "פ", terms: ["הפניקס"] },
      { key: "harel", label: "הראל", fileName: "הראל", mark: "ה", terms: ["הראל"] },
      { key: "migdal", label: "מגדל", fileName: "מגדל", mark: "מ", terms: ["מגדל"] },
      { key: "clal", label: "כלל", fileName: "כלל", mark: "כ", terms: ["כלל"] },
      { key: "menora", label: "מנורה", fileName: "מנורה", mark: "מ", terms: ["מנורה", "מבטחים החדשה"] },
      { key: "meitav", label: "מיטב", fileName: "מיטב", mark: "ט", terms: ["מיטב"] },
      { key: "altshuler", label: "אלטשולר", fileName: "אלטשולר", mark: "א", terms: ["אלטשולר"] },
      { key: "yelin", label: "ילין לפידות", fileName: "ילין לפידות", mark: "י", terms: ["ילין", "לפידות"] },
      { key: "more", label: "MORE", fileName: "מור", mark: "M", terms: ["מור", "more"] },
      { key: "analyst", label: "אנליסט", fileName: "אנליסט", mark: "א", terms: ["אנליסט"] },
      { key: "ayalon", label: "איילון", fileName: "איילון", mark: "א", terms: ["איילון"] },
      { key: "hachshara", label: "הכשרה", fileName: "הכשרה", mark: "ה", terms: ["הכשרה"] },
      {
        key: "amitim",
        label: "עמיתים",
        fileName: "עמיתים",
        mark: "ע",
        terms: ["עמיתים", "מבטחים", "מקפת", "קגמ", "קג\"מ", "נתיב", "חקלאים", "בניין", "בניה", "אגד", "הדסה", "ותיקה", "פנסיה ותיקה"]
      }
    ];
    return brands.find((brand) => brand.terms.some((term) => haystack.includes(normalizeText(term)))) || {
      key: "generic",
      label: rawName || "יצרן",
      mark: "•"
    };
  }

  function renderManufacturerLogo(fundOrName) {
    const brand = resolveManufacturerBrand(fundOrName);
    const title = typeof fundOrName === "string" ? fundOrName : (fundOrName && fundOrName.manufacturer) || brand.label;
    const hasKnownLogo = brand.key !== "generic";
    if (!hasKnownLogo) {
      return `<span class="manufacturer-logo is-generic" title="${escapeAttribute(title || brand.label)}"><span class="manufacturer-logo-text">${escapeHtml(title || brand.label)}</span></span>`;
    }
    const svgCode = renderManufacturerLogoSvg(brand.key);
    if (svgCode) {
      return `<span class="manufacturer-logo has-logo is-${escapeAttribute(brand.key)}" title="${escapeAttribute(title || brand.label)}">${svgCode}<span class="manufacturer-logo-text">${escapeHtml(brand.label)}</span></span>`;
    }
    const sources = getManufacturerLogoSources(brand);
    return `<span class="manufacturer-logo has-logo is-${escapeAttribute(brand.key)}" title="${escapeAttribute(title || brand.label)}"><img class="manufacturer-logo-img" src="${escapeAttribute(sources[0])}" data-logo-index="0" data-logo-sources="${escapeAttribute(sources.join("|"))}" alt="${escapeAttribute(brand.label)}" onerror="handleManufacturerLogoError(this);"><span class="manufacturer-logo-text">${escapeHtml(brand.label)}</span></span>`;
  }

  function getManufacturerLogoSources(brand) {
    const names = [brand.key, brand.fileName, brand.label].filter(Boolean);
    const extensions = ["png", "jpg", "jpeg", "webp", "svg"];
    const seen = new Set();
    const sources = [];
    names.forEach((name) => {
      extensions.forEach((ext) => {
        const source = `assets/logos/${encodeURIComponent(name)}.${ext}`;
        if (!seen.has(source)) {
          seen.add(source);
          sources.push(source);
        }
      });
    });
    return sources.length ? sources : ["assets/logos/missing.png"];
  }

  function handleManufacturerLogoError(img) {
    const sources = String(img.dataset.logoSources || "").split("|").filter(Boolean);
    const nextIndex = Number(img.dataset.logoIndex || 0) + 1;
    if (sources[nextIndex]) {
      img.dataset.logoIndex = String(nextIndex);
      img.src = sources[nextIndex];
      return;
    }
    const wrapper = img.closest(".manufacturer-logo");
    if (wrapper) {
      wrapper.classList.remove("has-logo");
      wrapper.classList.add("is-missing-logo");
    }
  }

  function renderManufacturerLogoSvg(key) {
    const svg = {
      phoenix: '<svg viewBox="0 0 36 28" aria-hidden="true"><path d="M3 5c7 1 12 7 14 17C10 19 5 14 3 5Z" fill="#163f9c"/><path d="M15 3c8 2 13 8 18 19-8-4-14-10-18-19Z" fill="#ff7a17"/></svg>',
      harel: '<svg viewBox="0 0 36 28" aria-hidden="true"><circle cx="15" cy="14" r="9" fill="#0b8bd7"/><path d="M18 4a10 10 0 0 1 8 16 10 10 0 0 1-8-16Z" fill="#39a848"/><path d="M9 18a10 10 0 0 1 18-4 10 10 0 0 1-18 4Z" fill="#f5c51b"/></svg>',
      migdal: '<svg viewBox="0 0 36 28" aria-hidden="true"><path d="M18 2 28 26H8L18 2Z" fill="#0b438c"/><path d="M14 9h8M13 14h10M12 19h12" stroke="#fff" stroke-width="2"/></svg>',
      clal: '<svg viewBox="0 0 36 28" aria-hidden="true"><path d="M7 6h15a8 8 0 0 1 0 16H7Z" fill="#0758aa"/><path d="M21 6a8 8 0 0 1 0 16c4-3 4-13 0-16Z" fill="#23a1df"/></svg>',
      menora: '<svg viewBox="0 0 36 28" aria-hidden="true"><path d="M5 21c10-1 18-7 25-18-2 13-11 22-25 18Z" fill="#e0a51a"/><path d="M4 24c9-1 16-6 21-15-4 11-11 16-21 15Z" fill="#5a2414"/></svg>',
      meitav: '<svg viewBox="0 0 36 28" aria-hidden="true"><circle cx="10" cy="9" r="3" fill="#65bd3d"/><circle cx="10" cy="19" r="3" fill="#65bd3d"/><path d="M17 7h12v5H17Zm0 9h12v5H17Z" fill="#3a1b78"/></svg>',
      altshuler: '<svg viewBox="0 0 36 28" aria-hidden="true"><path d="M5 20 14 9l6 6L31 4" fill="none" stroke="#07924f" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="21" cy="7" r="3" fill="#ff7f18"/></svg>',
      yelin: '<svg viewBox="0 0 36 28" aria-hidden="true"><path d="M5 19h18l8-10" fill="none" stroke="#b28a1e" stroke-width="4" stroke-linecap="round"/><path d="M25 7l7 2-2 7" fill="none" stroke="#0d5aa7" stroke-width="4" stroke-linecap="round"/></svg>',
      more: '<svg viewBox="0 0 36 28" aria-hidden="true"><rect x="2" y="5" width="32" height="18" rx="4" fill="#102b52"/><path d="M6 20V8l6 7 6-7v12" fill="none" stroke="#ff5d81" stroke-width="3" stroke-linejoin="round"/></svg>',
      analyst: '<svg viewBox="0 0 36 28" aria-hidden="true"><path d="M7 14 17 5l10 9-10 9Z" fill="none" stroke="#2369a8" stroke-width="4"/><path d="M17 5v18" stroke="#2369a8" stroke-width="3"/></svg>',
      ayalon: '<svg viewBox="0 0 36 28" aria-hidden="true"><circle cx="19" cy="14" r="11" fill="#102f80"/><path d="m13 9 6 5 5-8 1 12-8-1-4 6Z" fill="#f6d925"/></svg>',
      hachshara: '<svg viewBox="0 0 36 28" aria-hidden="true"><path d="M4 18c7-8 17-9 28-6" fill="none" stroke="#d51e28" stroke-width="5" stroke-linecap="round"/><circle cx="28" cy="14" r="7" fill="none" stroke="#d51e28" stroke-width="4"/></svg>',
      amitim: '<svg viewBox="0 0 36 28" aria-hidden="true"><circle cx="14" cy="14" r="9" fill="none" stroke="#176ed0" stroke-width="4"/><circle cx="22" cy="14" r="9" fill="none" stroke="#111" stroke-width="4"/></svg>'
    };
    return svg[key] || "";
  }

  function compareText(left, right) {
    return String(left || "").localeCompare(String(right || ""), "he");
  }

  function ensureWorkspaceAccess() {
    const portalState = readPortalState();
    if (!portalState.db) {
      return {
        authorized: false,
        mode: "blocked",
        message: "המערכת הזו סגורה. יש להיכנס קודם דרך פורטל הניהול."
      };
    }

    const embeddedMode = isEmbeddedWorkspace();
    const user = getPortalSessionUser(portalState.db);
    const activeUser = embeddedMode ? user : getDirectWorkspaceUser(portalState.db, user);
    if (!activeUser) {
      state.auth.mode = "login";
      state.auth.pendingUserId = "";
      return {
        authorized: false,
        mode: "login",
        message: "יש להזין פרטי משתמש מורשה כדי לפתוח את מערכת ABD-finance."
      };
    }

    if (!userCanAccessRetirement(activeUser, portalState.db)) {
      return {
        authorized: false,
        mode: "blocked",
        message: "למשתמש הזה אין הרשאה למערכת ABD-finance."
      };
    }

    if (activeUser.firstLogin) {
      state.auth.mode = "change-password";
      state.auth.pendingUserId = activeUser.id;
      return {
        authorized: false,
        mode: "change-password",
        message: "לפני כניסה למערכת יש להחליף את הסיסמה הראשונית שלך.",
        email: activeUser.email || ""
      };
    }

    localStorage.setItem(PORTAL_DB_KEY, JSON.stringify(portalState.db));
    localStorage.setItem(PORTAL_SESSION_KEY, activeUser.id);
    state.auth.mode = "login";
    state.auth.pendingUserId = "";
    return { authorized: true, user: activeUser };
  }

  function readPortalState() {
    try {
      for (const key of PORTAL_DB_KEYS) {
        const raw = localStorage.getItem(key);
        if (raw) {
          return { db: JSON.parse(raw) };
        }
      }
      return { db: null };
    } catch (error) {
      return { db: null };
    }
  }

  function createPasswordSalt() {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  async function hashPassword(password, salt) {
    if (!crypto.subtle || !window.TextEncoder) {
      throw new Error("הדפדפן אינו תומך בהצפנת סיסמאות מקומית.");
    }
    const data = new TextEncoder().encode(`${salt}:${password}`);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  async function verifyUserPassword(user, password) {
    if (!user) return false;
    if (user.passwordHash && user.passwordSalt) {
      return await hashPassword(password, user.passwordSalt) === user.passwordHash;
    }
    return typeof user.password === "string" && user.password === password;
  }

  async function storeUserPasswordHash(user, password) {
    const salt = createPasswordSalt();
    user.passwordSalt = salt;
    user.passwordHash = await hashPassword(password, salt);
    user.passwordHashed = true;
    delete user.password;
  }

  function getPortalSessionUser(db) {
    let sessionId = "";
    for (const key of PORTAL_SESSION_KEYS) {
      sessionId = localStorage.getItem(key) || "";
      if (sessionId) break;
    }
    return Array.isArray(db && db.users) ? db.users.find((user) => user.id === sessionId && user.enabled) || null : null;
  }

  function isEmbeddedWorkspace() {
    try {
      return window.self !== window.top;
    } catch (error) {
      return true;
    }
  }

  function getDirectWorkspaceUser(db, sessionUser) {
    const directUserId = sessionStorage.getItem(WORKSPACE_DIRECT_AUTH_KEY) || "";
    if (!directUserId || !sessionUser || sessionUser.id !== directUserId) {
      sessionStorage.removeItem(WORKSPACE_DIRECT_AUTH_KEY);
      return null;
    }
    return Array.isArray(db && db.users) ? db.users.find((user) => user.id === directUserId && user.enabled) || null : null;
  }

  function userCanAccessRetirement(user, db) {
    if (!user) {
      return false;
    }
    if (user.role === "admin") {
      return true;
    }
    const apps = db && db.access && Array.isArray(db.access[user.id]) ? db.access[user.id] : [];
    const retirementApp = Array.isArray(db && db.apps) ? db.apps.find((app) => app.id === PORTAL_APP_ID) : null;
    if (retirementApp && retirementApp.enabled === false) {
      return false;
    }
    return apps.includes(PORTAL_APP_ID);
  }

  function renderWorkspaceAuthGate(accessState) {
    dom.mainShell.hidden = true;
    dom.authGate.hidden = false;
    dom.authMessage.textContent = "";
    dom.authEmailInput.value = accessState.email || "";
    dom.authPasswordInput.value = "";
    dom.authNewPasswordInput.value = "";
    dom.authConfirmPasswordInput.value = "";

    const isPasswordChange = accessState.mode === "change-password";
    const isBlocked = accessState.mode === "blocked";

    dom.authTitle.textContent = isPasswordChange ? "החלפת סיסמה" : "התחברות למערכת";
    dom.authCopy.textContent = accessState.message || "יש להזין פרטי משתמש מורשה כדי לפתוח את מערכת ABD-finance.";
    dom.authLoginFields.hidden = isPasswordChange || isBlocked;
    dom.authPasswordChangeFields.hidden = !isPasswordChange;
    dom.authEmailInput.disabled = isPasswordChange || isBlocked;
    dom.authPasswordInput.disabled = isPasswordChange || isBlocked;
    dom.authNewPasswordInput.disabled = !isPasswordChange;
    dom.authConfirmPasswordInput.disabled = !isPasswordChange;
    dom.authSubmitButton.hidden = isBlocked;
    dom.authSubmitButton.textContent = isPasswordChange ? "שמור סיסמה והמשך" : "התחבר";
    dom.authFootnote.textContent = isBlocked
      ? "יש לנהל את ההרשאות מתוך פורטל הניהול."
      : "הגישה למערכת נקבעת לפי ההרשאות בפורטל הניהול.";
  }

  async function handleWorkspaceAuthSubmit(event) {
    event.preventDefault();
    try {
    const portalState = readPortalState();
    if (!portalState.db) {
      renderWorkspaceAuthGate({
        authorized: false,
        mode: "blocked",
        message: "לא נמצאו נתוני פורטל. יש להיכנס קודם דרך פורטל הניהול."
      });
      return;
    }

    if (state.auth.mode === "change-password") {
      const user = Array.isArray(portalState.db.users) ? portalState.db.users.find((item) => item.id === state.auth.pendingUserId && item.enabled) : null;
      if (!user) {
        dom.authMessage.textContent = "לא נמצא משתמש פעיל להחלפת סיסמה.";
        return;
      }
      const newPassword = String(dom.authNewPasswordInput.value || "").trim();
      const confirmPassword = String(dom.authConfirmPasswordInput.value || "").trim();
      if (newPassword.length < 6) {
        dom.authMessage.textContent = "הסיסמה החדשה חייבת להכיל לפחות 6 תווים.";
        return;
      }
      if (newPassword !== confirmPassword) {
        dom.authMessage.textContent = "אימות הסיסמה אינו תואם.";
        return;
      }
      if (await verifyUserPassword(user, newPassword)) {
        dom.authMessage.textContent = "יש לבחור סיסמה חדשה ושונה מהקודמת.";
        return;
      }
      await storeUserPasswordHash(user, newPassword);
      user.firstLogin = false;
      localStorage.setItem(PORTAL_DB_KEY, JSON.stringify(portalState.db));
      localStorage.setItem(PORTAL_SESSION_KEY, user.id);
      if (!isEmbeddedWorkspace()) {
        sessionStorage.setItem(WORKSPACE_DIRECT_AUTH_KEY, user.id);
      }
      window.location.reload();
      return;
    }

    const email = String(dom.authEmailInput.value || "").trim().toLowerCase();
    const password = String(dom.authPasswordInput.value || "");
    const user = Array.isArray(portalState.db.users)
      ? portalState.db.users.find((item) => item.enabled && String(item.email || "").trim().toLowerCase() === email) || null
      : null;
    const passwordOk = user ? await verifyUserPassword(user, password) : false;
    if (passwordOk && !user.passwordHash) {
      await storeUserPasswordHash(user, password);
    }
    if (!user || !passwordOk) {
      dom.authMessage.textContent = "פרטי ההתחברות שגויים.";
      return;
    }
    if (!userCanAccessRetirement(user, portalState.db)) {
      dom.authMessage.textContent = "למשתמש הזה אין הרשאה למערכת ABD-finance.";
      return;
    }
    localStorage.setItem(PORTAL_DB_KEY, JSON.stringify(portalState.db));
    localStorage.setItem(PORTAL_SESSION_KEY, user.id);
    if (user.firstLogin) {
      state.auth.mode = "change-password";
      state.auth.pendingUserId = user.id;
      renderWorkspaceAuthGate({
        authorized: false,
        mode: "change-password",
        message: "לפני כניסה למערכת יש להחליף את הסיסמה הראשונית שלך.",
        email: user.email || ""
      });
      return;
    }
    if (!isEmbeddedWorkspace()) {
      sessionStorage.setItem(WORKSPACE_DIRECT_AUTH_KEY, user.id);
    }
    window.location.reload();
    } catch (error) {
      console.error("[ABD-finance][handleWorkspaceAuthSubmit]", error);
      dom.authMessage.textContent = "לא ניתן להשלים התחברות בדפדפן הזה. נסה לרענן או לפתוח בדפדפן עדכני.";
    }
  }

  function logoutWorkspaceUser() {
    PORTAL_SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
    sessionStorage.removeItem(WORKSPACE_DIRECT_AUTH_KEY);
    window.location.reload();
  }

  function fillForward(values) {
    let current = "";
    let active = false;
    return values.map((value) => {
      const normalized = normalizeHeader(value);
      if (normalized) {
        current = normalized;
        active = true;
        return current;
      }
      return active ? current : "";
    });
  }

  function makeHeadersUnique(headers) {
    const counts = new Map();
    return headers.map((header) => {
      const next = (counts.get(header) || 0) + 1;
      counts.set(header, next);
      return next === 1 ? header : `${header} ${next}`;
    });
  }

  function roundNumber(value, digits) {
    const factor = 10 ** (digits || 0);
    return Math.round((value || 0) * factor) / factor;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function numberInputValue(value) {
    return Number.isFinite(value) && value !== 0 ? String(roundNumber(value, 2)) : "";
  }

  function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function formatMeetingSummaryDate(value) {
    if (!value) {
      return "";
    }
    const parts = String(value).split("-");
    if (parts.length !== 3) {
      return value;
    }
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  function createClientSideId(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function getBrandLogoSrc() {
    try {
      return new URL(BRAND_LOGO_SRC, window.location.href).href;
    } catch (error) {
      return BRAND_LOGO_SRC;
    }
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/'/g, "&#39;");
  }
