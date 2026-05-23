# משימות תיקון למערכת פרישה (ABD-finance)

קובץ עיקרי שנבדק: `מערכת פרישה/retirement_workspace.html` (כ‑11,626 שורות, סקריפט 4008‑11624).
כל מספרי השורות שלהלן הם של הקובץ הזה.

המסמך מסודר לפי חומרה. כל פריט כולל מיקום מדויק, הסבר על הבאג, ותיקון מוצע.

---

## 🔴 קריטי

### 1. שער הכניסה (Auth Gate) מנותק לחלוטין — המערכת פתוחה לכולם

**מיקום:** `init()` שורות 4269‑4271; הפונקציות `ensureWorkspaceAccess`, `renderWorkspaceAuthGate`, `handleWorkspaceAuthSubmit`, `logoutWorkspaceUser` (שורות 11347, 11451, 11478, 11549).

**הבעיה:** שורות 4269‑4271 מבטלות במפורש את שער הכניסה בכל טעינה:
```js
dom.authGate.hidden = true;
dom.mainShell.hidden = false;
dom.welcomeLogoutButton.hidden = true;
```
הפונקציות שמטפלות בכניסה מוגדרות אבל **לא נקראות מאף מקום**. בדקתי בכל הקובץ — אין קריאה ל‑`ensureWorkspaceAccess()`, אין מאזין ל‑`authForm`, אין הפעלה של `logoutWorkspaceUser`. כלומר כל אחד שיש לו את הקובץ נכנס ישר למערכת ורואה נתוני לקוחות.

**תיקון נדרש:**
1. ב‑`init()`, להחליף את 4269‑4271 בקריאה:
   ```js
   const accessState = ensureWorkspaceAccess();
   if (!accessState.authorized) {
     renderWorkspaceAuthGate(accessState);
     return;
   }
   dom.authGate.hidden = true;
   dom.mainShell.hidden = false;
   ```
2. לחבר מאזין:
   ```js
   dom.authForm.addEventListener("submit", handleWorkspaceAuthSubmit);
   dom.welcomeLogoutButton.addEventListener("click", logoutWorkspaceUser);
   ```
3. לחשוף את כפתור ההתנתקות ב‑welcome (להסיר `dom.welcomeLogoutButton.hidden = true`).

---

### 2. סיסמאות נשמרות ב‑plaintext ב‑localStorage

**מיקום:** `handleWorkspaceAuthSubmit` שורות 11506, 11510, 11524.

**הבעיה:** הקוד משווה `item.password === password` ושומר `user.password = newPassword` כטקסט גלוי ב‑localStorage. במערכת פיננסית עם נתוני לקוחות זה לא מקובל גם אם זה לוקאלי בלבד.

**תיקון נדרש:**
- לעבור ל‑hash (`SubtleCrypto.digest('SHA-256', ...)` עם salt ייחודי לכל משתמש), ולשמור רק את ה‑hash + salt.
- להוסיף "שדרוג" שקוף שממיר משתמשים קיימים ב‑login הראשון (אם נמצא password גלוי → להחליף אותו ב‑hash מחושב, ולסמן `passwordHashed: true`).
- לוודא ש‑`PORTAL_DB_KEY` לא מכיל יותר את שדה `password` כטקסט.

---

### 3. פוליסות ביטוח מקבצי מסלקה (ZIP) נזרקות לפח

**מיקום:** `parseClearinghouseDocument` שורות 9732‑9905; `importClearinghouseZip` שורות 9703‑9730.

**הבעיה:** ב‑`parseClearinghouseDocument` הקוד אוסף `policyRows` (מאותחל ב‑9747, מוזן ב‑9845‑9862 ל‑`פוליסת ביטוח` וב‑9878‑9895 לכיסויי ביטוח), אבל בהחזרה, שורות 9900‑9904:
```js
return {
  client,
  funds,
  insurancePolicies: []   // ← תמיד ריק!
};
```
כתוצאה מכך גם ב‑`importClearinghouseZip` שורה 9720 `const policies = [];` נשאר ריק. כלומר משתמש שמעלה קובץ מסלקה רואה את הקופות אבל **לא רואה אף פוליסת ביטוח שיש בקובץ**, ובסיכום הפגישה אין כיסויים.

**תיקון נדרש:**
1. ב‑`parseClearinghouseDocument` להחזיר את `policyRows`:
   ```js
   return { client, funds, insurancePolicies: policyRows };
   ```
2. ב‑`importClearinghouseZip` לאחד את הפוליסות מכל המסמכים:
   ```js
   const policies = documents.flatMap((doc) => doc.insurancePolicies || []);
   ```
3. לעדכן את הטקסט במצב הריק של טאב הביטוח (שורה 4675 ו‑4852) — היום כתוב "טען קובץ הר הביטוח" אבל אחרי התיקון גם מסלקה תזין פוליסות.

---

### 4. שגיאת ReferenceError בעת שינוי "סוג ייעוץ" בסיכום פגישה

**מיקום:** שורה 4500 בתוך מאזין `dom.meetingSummaryAdviceTypeInput`.

**הבעיה:** הקוד קורא `renderMeetingSummaryEditors()` אבל הפונקציה לא קיימת — שמה האמיתי הוא `enhanceMeetingSummaryEditors` (מוגדרת בשורה 5513). כשהמשתמש מחליף בין "תכנון פנסיוני" ל"תכנון פרישה" נזרק `ReferenceError` ועריכת הכותרת/הקדמה לא מתעדכנת.

**תיקון:** להחליף בשורה 4500 ל‑`renderMeetingSummaryTab();` (זו הפונקציה שמרענן את כל ה‑editors כולל ה‑enhance) או למינימום ל‑`enhanceMeetingSummaryEditors();`.

---

### 5. שליחת מייל ללקוח עובדת רק מול שרת לוקאלי

**מיקום:** `sendMeetingSummaryToClient` שורה 6513.
```js
const response = await fetch("http://localhost:8091/api/send-meeting-summary", { ... });
```

**הבעיה:**
- אם המערכת מתפרסת ב‑Vercel (יש `vercel.json`), הדפדפן יחסום `http://` מתוך דף `https://` (mixed content).
- אין fallback אמיתי — רק `mailto:` שדורש מהיוזר לצרף PDF ידנית, וזה לא הזרימה שהכפתור מבטיח ("שלח ללקוח").
- ה‑URL קשיח, אין configurable endpoint.

**תיקון נדרש:**
1. להוציא את הכתובת ל‑constant בראש הקובץ (`MEETING_SUMMARY_ENDPOINT`).
2. אם המערכת מתארחת ב‑Vercel — להעביר את הלוגיקה של בניית ה‑PDF ושליחת המייל ל‑Vercel Function ב‑`/api/send-meeting-summary`. אז ה‑fetch יהיה יחסי (`/api/send-meeting-summary`) וירוץ באותו origin.
3. אם נשארים עם שרת לוקאלי, לפחות לזהות את המצב, להציג הודעה ברורה "השירות לא זמין" ולהציע גיבוי ידני (הורדת PDF + פתיחת מייל) ולא רק `mailto`.

---

## 🟠 גבוה

### 6. טאב "מקדם פוליסה" (renderFactorTab) הוא קוד מת שזורק TypeError

**מיקום:** `renderFactorTab` שורה 5148; קריאות אליו ב‑6909, 6922, 6941, 6953, 6960.

**הבעיה:** הפונקציה ניגשת ל‑`dom.factorCapitalInput`, `dom.factorValueInput`, `dom.factorRangeInput`, `dom.factorNote`, `dom.factorResultGrid`, `dom.factorPolicyTable`, `dom.factorAssignmentSummary`. בדקתי — ה‑IDs האלה **לא קיימים בכלל ב‑HTML של הקובץ הזה**, וגם לא נטענים ב‑`init()`. כל קריאה תזרוק TypeError על `Cannot set properties of undefined`.

**תיקון נדרש:** להחליט מה הסטטוס של פיצ'ר ה‑"מקדם":
- **אם רוצים אותו:** להחזיר את המקטע HTML (panel עם השדות `factorCapitalInput` וכו'), להוסיף לו טאב ב‑`#tabButtons` ו‑`<section data-panel="factor">`, ולהחזיר את ההגדרות של `dom.factor*` ב‑`init`.
- **אם לא:** למחוק את `renderFactorTab`, את `buildFactorScenario`, את `renderFactorAssignmentSummary`/`renderFactorPolicyTable`, את `applyFactorToSelectedPolicies`, `clearFactorForSelectedPolicies`, `resetFactorAssignments`, ואת השדות `state.calc.factorValue/factorCapital/factorAssignments/factorSelectedIds`. אחרת הם יישארו רעש שמטעה.

---

### 7. אין drag‑and‑drop אמיתי על ה‑dropzone

**מיקום:** מאזינים ב‑4355‑4361, אזור CSS ב‑303‑358.

**הבעיה:** ה‑CSS של `.dropzone` והטקסט "להתחלת עבודה אנא בחר קובץ" משדרים תחושת drop. בפועל יש רק `click` ו‑`keydown`. גרירה של קובץ לאזור לא עושה כלום, והמסך המלא יציג overlay של הדפדפן ש"יחטוף" את הקובץ ויעבור לכתובת חדשה.

**תיקון:** להוסיף ב‑`init`:
```js
["dragenter","dragover"].forEach((evt) =>
  dom.dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dom.dropzone.classList.add("is-dragover");
  })
);
["dragleave","drop"].forEach((evt) =>
  dom.dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dom.dropzone.classList.remove("is-dragover");
  })
);
dom.dropzone.addEventListener("drop", (e) => {
  if (!e.dataTransfer?.files?.length) return;
  handleFileSelect({ target: { files: e.dataTransfer.files, value: "" } });
});
// ועל כל ה-window למנוע "navigation" בטעות:
["dragover","drop"].forEach((evt) =>
  window.addEventListener(evt, (e) => e.preventDefault())
);
```
+ סגנון `.dropzone.is-dragover` ב‑CSS.

---

### 8. iframe למחשבון קצבה מחזיק נתיב יחסי שיישבר ב‑Vercel

**מיקום:** שורה 3753:
```html
<iframe ... src="../סימולטור_ביטוחים_פרישה/retirement.html?embedded=1" ...></iframe>
```

**הבעיה:** `vercel.json` מפעיל `cleanUrls: true` (ראה קובץ vercel.json), והנתיב יחסי "אחורה" מתוך `מערכת פרישה/`. בעת deployment ל‑Vercel הסימולטור לא יישלח עם הפרויקט (הוא בתיקייה אחרת), ובמיקום אחר ה‑URL יהיה שבור. בנוסף שם התיקייה בעברית מקשה על URL encoding.

**תיקון:**
- להעביר את הסימולטור לתת‑תיקייה של אותו פרויקט (למשל `public/pension-simulator/index.html`) ולעדכן את ה‑src לנתיב פנימי ולא יחסי "אחורה".
- או לטעון את הסימולטור inline ולהפסיק עם iframe.
- או להחזיר את הטופס הישן (יש legacy shell ב‑3756 שמוסתר) ולהפעיל אותו במקום iframe.

---

### 9. השדה `state.ui.tableLayouts` נמחק כפול ב‑apply

**מיקום:** `applyImportedDataset` שורות 9532‑9535.
```js
state.ui.tableLayouts = {};
if (state.insurancePolicies.length) {
  delete state.ui.tableLayouts.insurance;
}
```
ה‑`delete` מיותר — מחקנו את כל האובייקט שורה לפני. זה לא מזיק, אבל זו אינדיקציה ללוגיקה שכפי הנראה לא תוכננה נכון. כנראה רצו **לשמור** את ה‑layouts ובמקרה של פוליסות לאתחל רק את שלהן.

**תיקון:** להחליט מה הכוונה. אם רוצים לשמור פריסות בין טעינות:
```js
if (!sameClient) {
  state.ui.tableLayouts = {};
} else {
  // איפוס ספציפי בעת הצורך:
  if (state.insurancePolicies.length) delete state.ui.tableLayouts.insurance;
}
```

---

## 🟡 בינוני

### 10. הטופס הישן של "מחשבון קצבה" מקבל renders אבל מוסתר

**מיקום:** HTML שורות 3756‑3818 (`pension-legacy-shell` עם `hidden aria-hidden="true"`); הקריאה ב‑`renderPensionTab` שורה 5066.

**הבעיה:** מאחר שה‑shell הישן מוסתר אבל ה‑IDs (`mainTrackSelect`, `trackCards`, `mainResultGrid`, `pensionBreakdown`, `manualCapitalInput`, `fallbackFactorInput`, `spouseAgeInput`) קיימים בתוכו, `renderPensionTab` ממלא אותם בכל renderAll(). זה רנדור מיותר ועומס מיותר.

**תיקון:** להחליט — אם הטופס הישן הוקפא, להוציא את שורות 3756‑3818 לגמרי ואת `renderPensionTab` יחד איתן. אם הוא חוזר במצב "ללא iframe", להחליף את ה‑iframe והחזיר את הטופס.

---

### 11. `closeFundModal` משאיר `state.ui.activeFundId` מוגדר

**מיקום:** `closeFundModal` שורה 6635, `renderFundDetails` 4986.

**הבעיה (אם רלוונטי לכוונה):** כשסוגרים את חלון הקופה, רנדורים מאוחרים יותר עדיין מחפשים את `state.ui.activeFundId` ובטבלה הראשית (שורה 6546) מסמנים אותה כ‑`is-active`. תלוי בכוונה — אם רוצים שהשורה תישאר בולטת, זה תקין. אם לא — צריך לאפס.

---

### 12. הודעות שגיאה לא ידידותיות בכשל פירוק XML

**מיקום:** `parseClearinghouseDocument` 9711.
```js
const xml = new DOMParser().parseFromString(xmlText, "application/xml");
```
אם ה‑XML פגום, `DOMParser` מחזיר מסמך שמכיל `<parsererror>` במקום לזרוק. הקוד ממשיך כאילו הכל בסדר ופשוט מקבל אפסים בכל הערכים. המשתמש רואה "נטענו 0 קופות" בלי הסבר.

**תיקון:**
```js
const xml = new DOMParser().parseFromString(xmlText, "application/xml");
if (xml.getElementsByTagName("parsererror").length) {
  console.warn(`קובץ XML פגום: ${entryName}`);
  // לדלג על הקובץ ולהוסיף ל-warnings שיוצגו ל-toast
  return { client: null, funds: [], insurancePolicies: [] };
}
```
ולצבור את ה‑warnings ולהציג ב‑`showToast`.

---

### 13. מיזוג קופות מסכן: רשומות עם `accountNumber` ריק כולן ידחו

**מיקום:** `getFundMergeKey` 9965, `mergeFunds` 9985.

**הבעיה:** אם `accountNumber` ריק, הפונקציה נופלת ל‑`fund.id` שלרוב מכיל את שם הקובץ והאינדקס. בעת טעינת אותו לקוח שוב (refresh) — שני קבצים שונים יקבלו ID שונה ונקבל כפילות. ובמקרה הפוך — שני קבצי מסלקה לאותה תכנית, יוצאים מאותו יצרן, אך ללא מספר חשבון, ייחשבו זהים בטעות.

**תיקון:**
- לשפר את ה‑key כך שיתבסס על `manufacturer` + `planName` + `productType` כשאין `accountNumber`.
- במקרים של `id` נופל אחורה לשם קובץ — להוסיף בדיקה: אם `accountNumber` חסר וקיים `currentBalance` או `retirementCapital`, להשתמש ב‑hash שלהם כדי שלא ימחק נתון אמיתי.

---

### 14. תאריך תוקף XML לא מנורמל בכל המקומות

**מיקום:** `formatXmlDate` שורה 11102; השימושים ב‑9752, 9753.

**הבעיה (יש לאמת מול קובץ אמיתי):** התאריכים מהמסלקה מגיעים בפורמט `YYYYMMDD` או `YYYY-MM-DD` בהתאם לגוף. `formatXmlDate` מטפל באלה אבל הקוד לפעמים מצרף תאריך פתיחה+סיום עם " - " בין השניים (`periodText`). אם אחד מהם null זה ייצא "01/01/2020 - " או " - 01/01/2025". לא בדקתי את כל הענפים אבל זה אזור שצריך verify לאחר תיקונים אחרים.

**תיקון:** להבטיח ש‑`[startDate, endDate].filter(Boolean).join(" - ")` לא ייצור פלט עם רווח מוביל/סוגר. כבר יש `filter(Boolean)` (9754) — אבל אם הפורמט הוחזר כמחרוזת עם רווחים זה לא יסונן. להוסיף `.map(s => s.trim()).filter(Boolean)`.

---

### 15. `recordsFromSheet` נקרא רק על שמות גיליון בעברית

**מיקום:** `importWorkbook` שורות 9442‑9447.

**הבעיה:** השמות "פרטי לקוח", "מוצרי חיסכון", "יתרות" וכו' הם של פורמט מסוים. אם החברה משדרגת את שמות הגיליונות ('פרטי הלקוח' במקום 'פרטי לקוח') הקוד שותק ומחזיר 0 קופות בלי הסבר.

**תיקון:** ב‑`recordsFromSheet`, אם הגיליון לא נמצא — לזרוק שגיאה ידידותית: `אין גיליון בשם "פרטי לקוח" בקובץ. ודא שהקובץ הוא דוח לקוח חוקי`.

---

## 🟢 שיפורים ו‑hygiene

### 16. ניקיון constants

יש שתי מערכות קבועים מקבילות (`PORTAL_DB_KEYS`, `PORTAL_SESSION_KEYS`) לתאימות לאחור. כדאי תיעוד ב‑comment שמסביר מתי נמחק ה‑v2/v1 ולמה זה עדיין נמצא.

### 17. אין loading indicator בעת `ensureXLSX`/`ensureJSZip`

יש `setLoading` לפני, אבל אם הספרייה כבר נטענה הקריאה `await` משמיטה את ה‑indicator. זה תקין רוב הזמן, אבל בכשל רשת המשתמש לא רואה דבר. כדאי להוסיף `setTimeout` של 5 שניות שיציג "מתחבר ל‑CDN" כ‑fallback.

### 18. הסיכום של תיק חכם תלוי ב‑module חיצוני

`SmartAnalysisEngine.analyzePortfolio` (שורה 8289) — לא ראיתי איפה מוגדר ה‑module. אם הוא מ‑`smart_analysis_engine.js` או external script, חסר `<script>` tag לטעינה. כדאי לבדוק (לא יכולתי לאמת ללא ריצה).

### 19. הודעות פנים‑דפדפן לא מתורגמות

חלק מהודעות השגיאה ל‑console הן באנגלית (`console.error(error)`), אבל ל‑toast הן בעברית. עקביות זה טוב, אבל למפתח שמדבג כדאי להוסיף prefix:
```js
console.error("[ABD-finance][handleFileSelect]", error);
```

### 20. CSP / שדרוגי אבטחה

ב‑`vercel.json` אין כיום CSP. בקובץ HTML יש `<style>` inline ענק וחיבור ל‑Google Fonts ול‑cdnjs. כדאי להוסיף:
```json
{
  "headers": [{
    "source": "/(.*)",
    "headers": [
      { "key": "Content-Security-Policy",
        "value": "default-src 'self'; script-src 'self' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net" },
      { "key": "X-Content-Type-Options", "value": "nosniff" },
      { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
    ]
  }]
}
```

---

## תכנית עבודה מומלצת ל‑Claude Code (לפי סדר)

1. **#4** — תיקון ה‑typo של `renderMeetingSummaryEditors` (שינוי שם של 1 שורה). זה מתקן regression שגלוי למשתמש.
2. **#3** — להחזיר את `policyRows` מ‑`parseClearinghouseDocument` ולהזרים אותם ב‑`importClearinghouseZip`. זה פיצ'ר מרכזי שלא עובד.
3. **#1 + #2** — להפעיל את שער הכניסה ולעבור ל‑hashed passwords. דרוש לפני כל פריסה ציבורית.
4. **#6** — להחליט אם פיצ'ר ה‑"מקדם" חי או מת, ולנקות בהתאם.
5. **#5** — לקבע כתובת endpoint יחסית ולתחזק Vercel Function לשליחת מייל.
6. **#7** — drag‑and‑drop אמיתי.
7. **#8** — נתיב ה‑iframe.
8. **#10‑#15** — תיקונים נקודתיים.
9. **#16‑#20** — hygiene ושיפורי DX.

## לתשומת לב המפתח

- לא הצלחתי להריץ את המערכת בסנדבוקס (סביבת ה‑Linux לא הצליחה לעלות בזמן הסשן), כל הבדיקות הן סטטיות על הקוד. מומלץ לאחר התיקונים להעלות את קובץ המסלקה לדוגמה (`מסלקה_פרידה אלמגור.zip` שצורף לסשן) ולוודא ש:
  - מתפענח לקוח, קופות וגם פוליסות ביטוח (#3).
  - שינוי "סוג ייעוץ" בסיכום פגישה לא זורק שגיאה (#4).
  - שער הכניסה עוצר מי שאין לו הרשאה (#1).
- כדאי להפעיל linter (eslint עם no‑undef) — הוא היה תופס את `renderMeetingSummaryEditors` ואת ה‑`dom.factor*` שלא קיימים תוך שניות.
