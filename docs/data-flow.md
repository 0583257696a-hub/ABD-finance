# מיפוי נתונים - ABD Finance

המסמך הזה הוא מפת העבודה של הייבוא והזרמת הנתונים במערכת. המטרה היא שלא נבנה מסכים מנותקים: כל נתון צריך להיות מזוהה בפורמט המקור, מנורמל, נשמר במקום אחד, ונצרך במסכים הרלוונטיים.

## מקורות קבצים

| מקור | פורמטים | פונקציית כניסה | יעד שמירה |
| --- | --- | --- | --- |
| מסלקה פנסיונית | zip/xml | `importWorkspaceFiles` -> `parseClearinghouseZip` / `parseXmlFile` | `abd_next_funds`, `abd_next_client` |
| דוח קופות Excel | xlsx/xls/xlsm | `importWorkspaceFiles` -> `parseRetirementWorkbook` | `abd_next_funds`, `abd_next_client` |
| הר הביטוח | xlsx/xls/xlsm | `importWorkspaceFiles` -> `parseHarHabituchWorkbook` | `abd_next_insurance` |
| נתוני תשואות רשות שוק ההון | `returns-data.ts` | `returns-catalog.ts` | מקור קריאה מרכזי למסלולים והמלצות |

## מבנה קופה אחיד

כל קופה במערכת נשמרת כ-`FundRecord`:

| שדה | מקור אפשרי | שימוש במסכים |
| --- | --- | --- |
| `manufacturer` | יצרן / חברה מנהלת / שם יצרן | דשבורד, חלון קופה, המלצות, סיכום פגישה |
| `productType` | סוג מוצר / סוג קופה / נירמול ממסלול | טבלת קופות, סינון מסלולי תשואות |
| `productName` / `planName` | שם מוצר / שם תוכנית | טבלה, חלון קופה |
| `accountNumber` | מספר פוליסה/חשבון / מספר קופה | חלון קופה, העתקה בלחיצה |
| `investmentTrack` | מסלול השקעה / שם מסלול | התאמה לנתוני תשואות |
| `currentBalance` | צבירה / יתרה / ערך פדיון / XML יתרות | KPI, טבלה, המלצות |
| `depositFee` / `balanceFee` | דמי ניהול מהפקדה/מצבירה | טבלה, חלון קופה, המלצה |
| `status` | סטטוס / מצב | badge פעיל/לא פעיל |
| `joinDate` / `liquidityDate` | הצטרפות / נזילות | חלון קופה |
| `pensionBalance` / `compensationBalance` | תגמולים / פיצויים | חלון קופה, סימולציות עתידיות |
| `recommendation` | הזנת יועץ בחלון הקופה | סיכום פגישה |

## הר הביטוח

כל פוליסה נשמרת כ-`InsurancePolicyRecord`:

| שדה | מקור אפשרי |
| --- | --- |
| `manufacturer` | חברה / חברת ביטוח / מבטח |
| `policyNumber` | מספר פוליסה / מספר חוזה |
| `insuranceType` | ענף ראשי / תחום ביטוח |
| `productType` | ענף משני / כיסוי / סוג מוצר |
| `policyName` | שם תוכנית / שם פוליסה / שם מוצר |
| `premium` | פרמיה / דמי ביטוח / עלות חודשית |
| `coverageAmount` | סכום ביטוח / סכום כיסוי |
| `status` | סטטוס / מצב פוליסה |

## תשואות והמלצות

בחירת מסלול להמלצה משתמשת רק בשכבת `returns-catalog.ts`:

1. `normalizeProductType(productType)` מאחד סוגי מוצר.
2. `normalizeManufacturerName(manufacturer)` מאחד שמות יצרנים.
3. `getManufacturersByProductType(productType)` מחזיר רק יצרנים שיש להם מסלולים בקבצי התשואות.
4. `getTracksByProductAndManufacturer(productType, manufacturer)` מחזיר רק מסלולים של אותו מוצר ואותו יצרן.
5. `findAbdTrackForFund(...)` מנסה להתאים קופה קיימת למסלול תשואות לפי סוג מוצר, יצרן ושם מסלול.

המלצות נשמרות ב-`abd_next_recommendations` ונקראות גם במסך סיכום פגישה.

## בירור צרכים

בירור צרכים נשמר ב-`abd_next_needs` לפי המבנה המקורי:

- הכנסות נטו: מבוטח/ת ובן/בת זוג.
- הוצאות: קבועות ומשתנות + תיאורים.
- נכסים קיימים: בנק, תיק השקעות, פוליסות חיסכון, קופות גמל, קרנות השתלמות, ירושה עתידית, נדל"ן, אחר.

שדות קופות גמל וקרנות השתלמות מקבלים ערך ראשוני מתוך הקופות שנטענו, אבל נשארים ניתנים לעריכה ידנית.
