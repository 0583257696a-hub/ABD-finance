# פגישה חכמה — מדריך הפעלה והגדרות

**מערכת:** `smart-meeting.abd-finance.co.il` · Cloudflare Worker בשם `abd-finale-smart-meening` · מסד נתונים D1 `abd-finance-db`
**עדכון:** 19.8.2026

המסמך מסביר **מה להגדיר, באיזה ממשק, ולמה** — כדי שכל היכולות של המערכת יעבדו כמו שצריך.
מסודר לפי ממשק (Cloudflare, Google, Microsoft, המערכת עצמה, הדפדפן), ובסוף צ'ק-ליסט מרוכז.

> **כלל זהב:** סיסמאות ומפתחות לעולם לא נכתבים בקוד ולא ב-git. הם נשמרים רק כ-Secrets ב-Cloudflare (ובקובץ `.dev.vars` המקומי שאינו עולה ל-git).

---

## 1. Cloudflare — הלב של המערכת

ממשק: https://dash.cloudflare.com → **Workers & Pages** → `abd-finale-smart-meening`

### 1.1 Bindings (חיבורים) — כבר מוגדרים בקוד (`wrangler.jsonc`), רק לוודא שהם קיימים בפועל

| Binding | סוג | לשם מה | איפה בודקים |
|---|---|---|---|
| `AI` | Workers AI | תמלול הקלטות (Whisper), סיכום AI, הפקת הצעות מהשיחה, ניתוח | Worker → Settings → Bindings. **חייב להיות פעיל** — בלעדיו כפתורי ה-AI מחזירים "השירות אינו זמין" |
| `DB` | D1 Database (`abd-finance-db`) | משתמשים, פגישות, סיכומים, משימות המשך, טפסים, יומן ביקורת. הטבלאות נוצרות לבד בהפעלה הראשונה | Storage & Databases → D1 |
| `EMAIL` | Send Email | שליחת הזמנות, שאלונים וסיכומים ללקוחות מהכתובת `noreply@abd-finance.co.il` (כשהיועץ לא מחובר ל-Gmail) | Worker → Settings → Bindings |
| `ASSETS` | Static assets | קבצי האתר | אוטומטי |
| `WORKER_SELF_REFERENCE` | Service | נדרש ל-Next.js (OpenNext) | אוטומטי |

**Workers AI — עלויות:** יש מכסה חינמית יומית (10,000 "neurons"). מעבר לזה החיוב הוא לפי שימוש (Whisper ≈ לפי דקות אודיו; llama לפי טוקנים). לוודא שיש אמצעי תשלום בחשבון כדי שהתמלול לא ייעצר באמצע פגישה: **Billing → Payment info**.

### 1.2 Secrets (סודות) — Worker → Settings → Variables and Secrets

הגדרה מהמחשב של המפתח: `npx wrangler secret put SHEM_HAMISHTANE` (מבקש את הערך בשקט, לא נשמר בהיסטוריה).

| Secret | חובה? | מצב היום | תיאור |
|---|---|---|---|
| `NEXTAUTH_SECRET` | **חובה** | ✅ קיים | חתימת סשנים. מחרוזת אקראית ארוכה. **החלפה = כל המשתמשים מנותקים** |
| `NEXTAUTH_URL` | **חובה** | ✅ קיים | חייב להיות בדיוק `https://smart-meeting.abd-finance.co.il` |
| `ADMIN_PASSWORD` | **חובה** | ✅ קיים | סיסמת חשבון האדמין הסטטי (`admin@abd-finance.co.il`, או `ADMIN_EMAIL` אם הוגדר). **להחליף מהסיסמה ההתחלתית** אם עדיין לא |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | חובה ל-Google | ✅ קיימים | כניסה עם Google, יומן Google, קישורי Google Meet, שליחת מייל מה-Gmail של היועץ (ראה §2) |
| `MICROSOFT_CLIENT_ID` / `MICROSOFT_CLIENT_SECRET` | אופציונלי | ✅ קיימים | יומן Outlook (ראה §3) |
| `CALENDLY_CLIENT_ID` / `CALENDLY_CLIENT_SECRET` | אופציונלי | ⬜ לא מוגדר | חיבור Calendly. בלי זה כפתור Calendly בהגדרות יציג "לא מוגדר" |
| `ANTHROPIC_API_KEY` | אופציונלי | ⬜ לא מוגדר | גיבוי לסיכום ה-AI אם Workers AI לא זמין. **לא נדרש** — Workers AI עובד |
| `SYSTEM_EMAIL_FROM` | אופציונלי | ⬜ ברירת מחדל | כתובת השולח של המערכת. ברירת מחדל: `Smart Meeting <noreply@abd-finance.co.il>` |
| `SYSTEM_EMAIL_REPLY_TO` | אופציונלי | ⬜ ברירת מחדל | ברירת מחדל `support@abd-finance.co.il` |
| `ADMIN_NOTIFICATION_EMAIL` | אופציונלי | ⬜ | לאן נשלחות התראות מערכת (בקשות תמיכה, הרשמות). ברירת מחדל: כתובת האדמין |
| `APP_USER_EMAIL` / `APP_USER_PASSWORD` | אופציונלי | ⬜ ברירת מחדל | חשבון יועץ סטטי לבדיקות (`advisor@abd-finance.co.il`). **בפרודקשן מומלץ להגדיר סיסמה חזקה משלכם** או ליצור יועצים אמיתיים בפאנל הניהול |
| `DISABLE_LOGIN` | לא | ⬜ | **לא להגדיר** בפרודקשן (מבטל התחברות — לפיתוח בלבד) |

### 1.3 דומיין ו-DNS

- **Worker → Settings → Domains & Routes**: לוודא ש-`smart-meeting.abd-finance.co.il` מופיע כ-Custom Domain (SSL אוטומטי). HTTPS חובה — בלעדיו הדפדפן לא מאפשר מיקרופון (הקלטה) ולא PWA.
- **Email → Email Routing / Sending** (בדומיין `abd-finance.co.il`): כדי שמיילים מ-`noreply@abd-finance.co.il` יגיעו ולא ייפלו לספאם, לוודא שהדומיין מאומת לשליחה (רשומות SPF/DKIM שהדשבורד מציע). אם לא — המיילים עדיין נשלחים דרך ה-Gmail של היועץ כשהוא מחובר (§2), אבל לקוחות של יועץ לא-מחובר עלולים לא לקבל.

### 1.4 D1 — מסד הנתונים

- לא נדרשות פעולות ידניות. הטבלאות (`users`, `meetings`, `meeting_summaries`, `follow_ups`, `client_forms`, `audit_log` ועוד) נוצרות אוטומטית.
- **גיבוי:** D1 → `abd-finance-db` → Time Travel (שחזור עד 30 יום אחורה). מומלץ מדי פעם `npx wrangler d1 export abd-finance-db --remote --output backup.sql`.
- **מחיקת נתונים:** מפאנל הניהול (§4.1) — מחיקת משתמש / ניקוי טבלאות. תמלילים נשמרים בתוך סיכום הפגישה ונמחקים איתו.

---

## 2. Google Cloud Console — כניסה, יומן, Meet, Gmail

ממשק: https://console.cloud.google.com → הפרויקט של ABD Finance

### 2.1 APIs & Services → Library — להפעיל
- **Google Calendar API** — יצירת אירועים + קישורי Google Meet
- **Gmail API** — שליחת הזמנות/שאלונים/סיכומים מה-Gmail של היועץ (מופיע ב"נשלח" שלו)

### 2.2 APIs & Services → Credentials → OAuth 2.0 Client (Web application)

**Authorized JavaScript origins:**
```
https://smart-meeting.abd-finance.co.il
```
**Authorized redirect URIs** (כולם, בדיוק כך):
```
https://smart-meeting.abd-finance.co.il/api/auth/callback/google
https://smart-meeting.abd-finance.co.il/api/calendar/callback/google_calendar
```
(לפיתוח מקומי אפשר להוסיף גם את אותם נתיבים עם `http://localhost:3000`.)

ה-Client ID וה-Client Secret → Cloudflare Secrets `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (§1.2).

### 2.3 OAuth consent screen
- **Scopes** שהאפליקציה מבקשת: `openid email profile` (כניסה), `https://www.googleapis.com/auth/calendar.events`, `https://www.googleapis.com/auth/gmail.send`.
- **מצב Testing:** רק משתמשים שמופיעים ב-**Test users** יכולים לחבר יומן/Gmail. **להוסיף כל יועץ** לרשימה (עד 100). הטוקנים במצב Testing פגים אחרי 7 ימים → היועץ יצטרך "התחבר מחדש" בהגדרות.
- **מצב Production:** דורש אימות של Google. `gmail.send` הוא scope "restricted" — האימות כולל בדיקת אבטחה. עד אז: להשאיר Testing + Test users.
- **חשוב:** יועץ שחיבר Google לפני שנוסף scope ה-Gmail — צריך **לנתק ולחבר מחדש** (הגדרות → אינטגרציות) כדי שהמיילים יצאו מה-Gmail שלו.

### 2.4 מה זה נותן במערכת
| יכולת | דורש |
|---|---|
| "כניסה עם Google" | Client + redirect `/api/auth/callback/google` + חשבון קיים במערכת (האימייל חייב להיות רשום בפאנל הניהול) |
| קביעת פגישה ביומן Google + הזמנה ללקוח | יועץ מחובר בהגדרות → אינטגרציות → Google |
| כפתור **Google Meet** בקביעת פגישה | אותו חיבור. יוצר קישור Meet אוטומטי באירוע |
| שליחת מייל "מהיועץ" (לא מ-noreply) | אותו חיבור + scope gmail.send |

---

## 3. Microsoft Entra (Azure) — יומן Outlook (אופציונלי)

ממשק: https://entra.microsoft.com → App registrations

- **Redirect URI (Web):** `https://smart-meeting.abd-finance.co.il/api/calendar/callback/microsoft_outlook`
- **API permissions (Delegated):** `Calendars.ReadWrite`, `offline_access`, `User.Read`
- **Supported account types:** "Accounts in any organizational directory and personal Microsoft accounts" (כדי שיועצים עם Outlook.com וגם Microsoft 365 יוכלו להתחבר)
- Certificates & secrets → Client secret (**שים לב לתוקף** — ברירת מחדל 6–24 חודשים; כשפג, החיבורים נופלים)
- Application (client) ID + Secret → Cloudflare `MICROSOFT_CLIENT_ID` / `MICROSOFT_CLIENT_SECRET`

**Teams / Zoom:** עדיין לא ממומשים (דורשים אפליקציית OAuth נוספת לכל אחד). כרגע יש חלופה: להדביק קישור וידאו ידני בשדה "מקום/קישור" בקביעת פגישה.

## 3.1 Calendly (אופציונלי)
Calendly → Integrations → API & Webhooks → OAuth app · Redirect: `https://smart-meeting.abd-finance.co.il/api/calendar/callback/calendly` → Secrets `CALENDLY_CLIENT_ID` / `CALENDLY_CLIENT_SECRET`.

---

## 4. בתוך המערכת — מה להגדיר אחרי ההתקנה

### 4.1 פאנל ניהול — `https://smart-meeting.abd-finance.co.il/admin-panel`
כניסה עם חשבון האדמין. הלשוניות:
1. **דשבורד** — מונים, פעילות אחרונה, מצב המערכת.
2. **משתמשים** — ליצור את היועצים (שם, אימייל, תפקיד, סיסמה ראשונית), לחסום/לאפס סיסמה. יועץ שנכנס עם Google חייב שהאימייל שלו יהיה כאן קודם.
3. **סוכנויות** — קבוצות יועצים (מנהל ↔ סוכנים), אישור/דחייה של קישורי הזמנה.
4. **תוכניות ומנויים** — הקצאת תוכנית לכל משתמש (אילו מודולים פתוחים).
5. **תמיכה ופניות** — פניות שנשלחו מתוך המערכת.
6. **לוג פעילות** — יומן ביקורת: כניסות, אישורי הקלטה (`meeting.recording_consent`), שליחות, מחיקות. לא ניתן לעריכה.
7. **הגדרות מערכת** — מצב התשתית (Bindings: AI, DB, Email — אם משהו אדום, לחזור ל-§1.1), הגדרות גלובליות, וניקוי טבלאות (**בלתי הפיך**, רק לאדמין).

### 4.2 הגדרות (לכל יועץ) — `/settings` — 3 לשוניות
| לשונית | מה להגדיר |
|---|---|
| **מיתוג** | שם, טלפון, לוגו, ערכת צבעים (בהיר/כהה/מותאם) — מופיעים על סיכומי הפגישה, ההזמנות וה-PDF. "איפוס מיתוג" מחזיר לברירת המחדל |
| **חיבורים** | **חיבור Google** (מומלץ לכל יועץ — יומן + Meet + מייל מהחשבון שלו), Outlook/Calendly אם רלוונטי. "התחבר מחדש" אם פג תוקף |
| **שאלונים** | תבניות שאלוני הכנה שנשלחים ללקוח לפני הפגישה |

### 4.3 הקלטה ותמלול (חדש) — מה צריך כדי שיעבוד
- **HTTPS** (קיים) + **הרשאת מיקרופון** בדפדפן לדומיין (§5).
- לפני ההקלטה המערכת דורשת לסמן שהלקוח אישר — האישור נרשם ביומן הביקורת עם חותמת זמן. **חובה חוקית להודיע ללקוח.**
- האודיו **לא נשמר** בשום מקום. נשמר רק תמליל, כמידע פנימי בתוך הסיכום (לא מודפס ולא נשלח ללקוח).
- "הפק הצעות מהשיחה" מציע עובדות/החלטות/משימות/חששות — **שום דבר לא נכנס למסמך בלי לחיצה על "הוסף"**.
- דורש Workers AI פעיל (§1.1). אם מופיע "שירות התמלול אינו זמין" — ה-Binding `AI` חסר.
- אפשר גם **להעלות הקלטה קיימת** (שיחת טלפון) — קבצי mp3/m4a/wav/webm עד ~25MB.

### 4.4 חיבורים בין יועצים (סוכנות)
הרשמה יוצרת משתמש בודד. סוכנות נוצרת דרך **קישור הזמנה**: המנהל שולח קישור, היועץ מאשר → המנהל רואה את הפגישות של הצוות. אין צורך בהגדרה חיצונית.

---

## 5. דפדפן ומכשיר — מה היועץ צריך לאשר

| נושא | מה לעשות |
|---|---|
| **מיקרופון** | בכניסה הראשונה להקלטה הדפדפן שואל — לאשר "Allow". אם נחסם: לחיצה על המנעול ליד הכתובת → Site settings → Microphone → Allow. **ב-iPhone:** Safari בלבד תומך במיקרופון מתוך אתר (לא Chrome ל-iOS). |
| **דפדפן מומלץ** | Chrome / Edge / Safari עדכניים. תמלול חי עובד גם ב-Safari (הקלטה בפורמט mp4). |
| **התקנה כאפליקציה (PWA)** | Chrome: תפריט ⋮ → "Install app". iPhone: שתף → "הוסף למסך הבית". מקבלים אייקון ABD ומסך מלא. |
| **חיפוש מהיר (Ctrl+K / ⌘K)** | מכל מסך: פותח חלון חיפוש — שם לקוח → הפגישה או הסיכום שלו, "הגדרות", "התחל פגישה", "התנתקות". גם דרך שורת "חיפוש…" בתפריט הצד. |
| **חלונות קופצים** | חיבור Google/Outlook נפתח בטאב חדש — לא לחסום. |
| **קאש אחרי עדכון** | אם אחרי עדכון גרסה משהו נראה ישן — רענון (Ctrl+Shift+R) או סגירה ופתיחה של האפליקציה. |

---

## 6. למפתח — פריסה ותחזוקה

```bash
# תלויות
npm install

# פיתוח מקומי (סודות בקובץ .dev.vars — לא ב-git)
npm run dev

# בדיקות סטטיות
npx tsc --noEmit && npx eslint src

# פריסה לפרודקשן (עוצרים קודם שרת פיתוח — הוא נועל את .open-next)
rm -rf .next .open-next && npm run deploy

# הגדרת סוד
npx wrangler secret put GOOGLE_CLIENT_SECRET

# גיבוי D1
npx wrangler d1 export abd-finance-db --remote --output backup.sql
```

- הפריסה מדפיסה `Current Version ID` — זו ההוכחה שהעלייה הצליחה. Rollback: Worker → Deployments → גרסה קודמת → Rollback.
- `.dev.vars` לפיתוח צריך את אותם שמות משתנים כמו §1.2.
- Service Worker: בשינוי נכסים סטטיים לעדכן `APP_CACHE_VERSION` ב-`src/app/sw.ts` כדי שהמשתמשים יקבלו את הגרסה החדשה.

---

## 7. צ'ק-ליסט הפעלה (לסמן ✔)

| # | פריט | ממשק | מצב |
|---|---|---|---|
| 1 | Binding `AI` פעיל + אמצעי תשלום בחשבון Cloudflare | Cloudflare → Worker → Bindings / Billing | ✅ פעיל (נבדק 19.8: תמלול Whisper + הפקת הצעות עובדים בפרודקשן) |
| 2 | Binding `DB` (D1) | Cloudflare | ✅ |
| 3 | Binding `EMAIL` + דומיין שליחה מאומת (SPF/DKIM) | Cloudflare → Email | ⚠️ לוודא אימות דומיין |
| 4 | `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `ADMIN_PASSWORD` | Cloudflare Secrets | ✅ קיימים — **לוודא שסיסמת האדמין הוחלפה** |
| 5 | Google OAuth: 2 redirect URIs + Calendar API + Gmail API | Google Cloud Console | ⚠️ לוודא ששני ה-URIs קיימים ושה-APIs מופעלים |
| 6 | Google consent screen: כל היועצים ב-Test users (או אפליקציה מאומתת) | Google Cloud Console | ⚠️ |
| 7 | Microsoft app: redirect + הרשאות + תוקף Secret | Entra | ✅ Secrets קיימים — לבדוק תוקף |
| 8 | Calendly (אם רוצים) | Calendly + Secrets | ⬜ לא מוגדר |
| 9 | יצירת יועצים והרשאות | פאנל ניהול | לפי הצורך |
| 10 | כל יועץ: מיתוג + חיבור Google | הגדרות | לפי יועץ |
| 11 | הרשאת מיקרופון + התקנת PWA | דפדפן היועץ | לפי יועץ |
| 12 | Custom domain + HTTPS | Cloudflare | ✅ |
| 13 | גיבוי D1 תקופתי | wrangler / Time Travel | מומלץ חודשי |

---

## 8. מה עדיין לא קיים ומה נדרש כדי להוסיף

| יכולת | מה נדרש |
|---|---|
| WhatsApp (שליחת סיכום/תזכורת) | חשבון WhatsApp Business API (Meta) — אימות עסק, מספר ייעודי, תבניות מאושרות. היום "שלח ללקוח" שולח במייל (מה-Gmail של היועץ או מ-noreply) |
| Teams / Zoom אוטומטי | אפליקציית OAuth ב-Entra (Teams) / Zoom Marketplace + Secrets. עד אז: הדבקת קישור ידנית |
| חתימה דיגיטלית על סיכום | ספק חתימה (למשל Comsign / DocuSign) — עלות שוטפת |
| פורטל לקוח | החלטה מוצרית: דורש שמירת נתוני לקוח בצד השרת (היום המערכת שומרת מינימום — פרטיות) |
