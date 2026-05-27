# השוואת שדות: HTML מקורי מול Next.js

מטרת הקובץ: לוודא שההמרה ל-Next לא מאבדת שדות, פעולות או זרימת נתונים מהמערכת המקורית.

## סטטוס כללי

| אזור | מצב ב-Next | פער עיקרי |
| --- | --- | --- |
| דשבורד / קופות | קיים ומוצג ב-`/` וב-`/funds` | חסרים עדיין פילטרים, פעולות מרוכזות מלאות, תצוגות משנה ופרטי קופה מלאים |
| בירור צרכים | רוב השדות קיימים | צריך לחבר את סיכום בירור הצרכים לסיכום הפגישה ולחישובים |
| חלון קופה | קיים בסיס + המלצה | חסרים מוטבים, מעסיקים, הפקדות, תקופות יתרה, מקדם מובטח, קצבה מיובאת, תבניות |
| פוליסות ביטוח | קיים מסך בסיסי | חסרים כל שדות הטבלה המקורית ויכולת בחירה לסיכום |
| סימולציות | עדיין לא משוחזר מלא | חסרים מחשבון קצבה, מסלולים, תשתיות לקצבה, פירוט כספים |
| סיכום פגישה | קיים בסיס | חסרים עורך מלא, מקטעים ניתנים להפעלה, עובדות/המלצות/מעקב דינמיים |
| הגדרות | קיים חלקי | צריך לחבר הגדרות לפעולה אמיתית במערכת |

## בירור צרכים

### קיים ב-HTML המקורי

שדות מספריים:

- `incomeWorkPrimary`
- `incomeWorkSpouse`
- `incomeBituachPrimary`
- `incomeBituachSpouse`
- `incomePensionPrimary`
- `incomePensionSpouse`
- `incomeRentPrimary`
- `incomeRentSpouse`
- `incomeOtherPrimary`
- `incomeOtherSpouse`
- `fixedExpenses`
- `variableExpenses`
- `assetBank`
- `assetPortfolio`
- `assetPolicies`
- `assetProvident`
- `assetStudyFunds`
- `assetInheritance`
- `assetRealEstate`
- `assetOther`

שדות טקסט:

- `fixedNotes`
- `variableNotes`

### מצב ב-Next

כל השדות קיימים ב-`FundsWorkspace.tsx`.

### פערים לסגירה

- להציג גם `סיכום בירור צרכים` בתחתית החלון כמו במקור.
- להזרים את הנתונים לסיכום הפגישה.
- להזרים את הנתונים לחישובי קצבה/סימולציה.

## טבלת קופות

### קיים ב-HTML המקורי

הטבלה המקורית נבנית דינמית מ-`renderFundsTable`.
הפעולות הקיימות:

- סינון לפי יצרן
- סינון לפי סוג מוצר
- סינון לפי סטטוס
- מיון
- סימון קופות לחישוב
- הוספת מוצר
- איחוד צבירות כאשר יש לפחות שתי קופות מסומנות
- פתיחת חלון קופה

### מצב ב-Next

קיים:

- טבלה בדשבורד
- מיון לפי כותרות
- פתיחת חלון קופה
- ייבוא קבצים
- ניקוי קופות
- כפתור בירור צרכים

### פערים לסגירה

- להחזיר פילטרים מעל הטבלה.
- להחזיר סימון קופות מרובות לפעולות.
- להחזיר איחוד צבירות.
- להחזיר תצוגת “קופות מסומנות לחישוב” בצורה מלאה.
- להחזיר עמודות נוספות לפי מקור הנתונים: קצבה מיובאת, מקדם, הון לפרישה, הפקדה חודשית.

## חלון קופה

### שדות עריכה שקיימים ב-HTML המקורי

שדות `data-fund-field`:

- `liquidityDate`
- `status`
- `currentBalance`
- `guaranteedCoefficient`
- `recommendation`

שדות מידע נוספים מהמקור:

- מספר קופה / פוליסה
- יצרן
- סוג מוצר
- שם מוצר
- שם תוכנית
- מסלול השקעה
- תאריך הצטרפות
- תאריך נזילות
- סה"כ צבירה
- הון לפרישה
- קצבה חודשית מיובאת
- מקדם מובטח / מקדם בסיס
- דמי ניהול מצבירה
- דמי ניהול מהפקדה
- מוטבים
- מעסיקים
- הפקדות
- תקופות יתרה
- הערות
- המלצה

### מצב ב-Next

קיים:

- מספר קופה עם העתקה
- יצרן
- סוג מוצר
- סטטוס
- סה"כ צבירה
- תגמולים
- פיצויים
- דמי ניהול הפקדה
- דמי ניהול צבירה
- תאריך נזילות
- מסלול השקעה
- שמירת המלצה לקופה

### פערים לסגירה

- להפוך `liquidityDate`, `status`, `currentBalance`, `guaranteedCoefficient` לשדות עריכה כמו במקור.
- להוסיף `retirementCapital`.
- להוסיף `importedPension`.
- להוסיף `guaranteedCoefficient`.
- להוסיף טבלת מוטבים.
- להוסיף טבלת מעסיקים.
- להוסיף טבלת הפקדות.
- להוסיף טבלת תקופות יתרה.
- להוסיף אזור הערות.
- להוסיף תבניות המלצה קיימות מהגדרות.

## ייבוא קבצים

### פורמטים במקור

- Excel קופות / דוח לקוח
- מסלקה ZIP/XML
- הר הביטוח Excel

### מצב ב-Next

קיים מנוע `client-importers.ts`.

### פערים לסגירה

- להשתמש במבנה המקורי של `buildFunds` עבור דוחות Excel:
  - מוצרי חיסכון
  - יתרות
  - יתרות לפי תקופה
  - פרישה
  - מוטבים
- להרחיב את מסלקה ZIP/XML כך שתשמור:
  - employers
  - depositRows
  - periodRows
  - retirementCapital
  - importedPension
  - guaranteedCoefficient
- להר הביטוח לשמור את כל שדות המקור:
  - mainBranch
  - secondaryBranch
  - itemClass
  - periodText
  - premiumType
  - premiumText
  - coverageAmountText
  - exportDate

## פוליסות ביטוח

### עמודות HTML מקוריות

- סיווג
- חברה
- ענף ראשי
- ענף משני / כיסוי
- סוג מוצר
- תוכנית / כיסוי
- מס' פוליסה
- תקופת ביטוח
- סוג פרמיה
- פרמיה
- סכום ביטוח
- פרטים נוספים
- סימון לסיכום פגישה

### מצב ב-Next

קיים מסך בסיסי בלבד.

### פערים לסגירה

- להחזיר את כל העמודות.
- להוסיף checkbox “לסיכום”.
- לחבר לסיכום פגישה.
- להוסיף חלון פוליסה.

## סימולציות ותשתיות לקצבה

### שדות HTML מקוריים

- `manualCapitalInput`
- `fallbackFactorInput`
- `mainTrackSelect`
- `spouseAgeInput`
- `trackCards`
- `mainResultGrid`
- `pensionBreakdown`
- `infrastructurePillStrip`
- `infrastructureSummaryGrid`
- `infrastructureTableHost`
- `infrastructureLegend`

### מצב ב-Next

עדיין לא שוחזר כמסך אמיתי.

### פערים לסגירה

- לבנות את מחשבון הקצבה מהפונקציות שכבר הועתקו ל-`calculations.ts`.
- להשתמש בקופות שסומנו כמיועדות לקצבה.
- להציג פירוט קופות שנבחרו.
- להחזיר טבלת תשתיות לקצבה.

## סיכום פגישה

### שדות HTML מקוריים

- `meetingSummaryDateInput`
- `meetingSummaryAdviceTypeInput`
- `meetingSummaryBrandInput`
- `meetingSummaryTitleInput`
- `meetingSummaryClientLineInput`
- `meetingSummaryIntroInput`
- `meetingShowFundsSummaryToggle`
- `meetingShowNeedsToggle`
- `meetingShowFactsToggle`
- `meetingShowPensionSnapshotToggle`
- `meetingShowInfrastructureToggle`
- `meetingShowMigrationToggle`
- `meetingSummaryFacts`
- `meetingSummaryRecommendations`
- `meetingSummaryFollowUps`
- `meetingSummaryScreenshots`
- `meetingSummaryPreview`

### מצב ב-Next

קיים מסך בסיסי שקורא קופות והמלצות.

### פערים לסגירה

- להחזיר את כל שדות העריכה.
- להחזיר הפעלה/ביטול מקטעים.
- להחזיר עובדות דינמיות.
- להחזיר משימות להמשך.
- להחזיר צילומי מסך/תמונות.
- להחזיר הדפסה ושליחה למייל עם חתימה.

## סדר עבודה מומלץ לסגירת הפערים

1. להשלים ייבוא קבצים כך שכל שדות `FundRecord` ו-`InsurancePolicyRecord` מתמלאים.
2. להשלים חלון קופה מלא.
3. להשלים טבלת קופות עם פילטרים ופעולות.
4. להשלים פוליסות ביטוח.
5. להשלים סימולציות ותשתיות לקצבה.
6. להשלים סיכום פגישה מלא.
7. להשלים הגדרות שמשפיעות בפועל על המסכים.
