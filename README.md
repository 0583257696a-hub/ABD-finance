# ABD Finance

מערכת פרישה ופיננסים ב-Next.js.

חשוב: זה לא פרויקט HTML סטטי ולא מיועד לפתיחה דרך GitHub Pages.
יש להריץ או לפרוס אותו כסביבת Node/Next.js.

## הרצה מקומית

```bash
npm install
npm run dev
```

פתיחה בדפדפן:

```text
http://localhost:3000/login
```

משתמש בדיקה:

```text
admin@abd-finance.co.il
Abd123456!
```

## מבנה הפרויקט

- `src/app` - מסכי המערכת וה-API routes 
- `src/components` - רכיבי ממשק
- `src/lib` - לוגיקת ייבוא, מיפוי, חישובים ותשואות
- `prisma` - סכמת בסיס הנתונים
- `public/assets` - לוגואים ונכסים

## פריסה

המערכת כוללת NextAuth, Prisma ו-API routes, ולכן דורשת שרת שתומך ב-Next.js.
GitHub Pages מציג HTML סטטי בלבד ולכן לא מתאים להרצת המערכת הזו.
