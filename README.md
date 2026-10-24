# 🌿 خضارنا — متجر خضروات وفواكه (الناصرية)

موقع متكامل لمتجر خضروات وفواكه، مبني بـ HTML/CSS/JS خالص (بدون إطار عمل) ويعمل مع [Supabase](https://supabase.com) كخادم خلفي (قاعدة بيانات + مصادقة).

## الصفحات
- `index.html` — واجهة المتجر للزبائن (تصفح، بحث، سلة مشتريات، طلب).
- `login.html` — تسجيل دخول / إنشاء حساب للزبائن.
- `admin.html` — لوحة إدارة (منتجات، طلبات، مناطق توصيل، زبائن).
- `courier.html` — واجهة مندوب التوصيل.

## الإعداد
1. أنشئ مشروعًا على [supabase.com](https://supabase.com).
2. من **Settings → API** انسخ **Project URL** و **anon / publishable key** (وليس `service_role` أبدًا).
3. افتح `config.js` وضع القيمتين:
   ```js
   window.KHUDARNA_CONFIG = {
     SUPABASE_URL: "https://xxxx.supabase.co",
     SUPABASE_ANON_KEY: "sb_publishable_xxxxxxxx",
     STORE_PHONE: "07xxxxxxxxx",
     STORE_CITY: "الناصرية، ذي قار، العراق"
   };
   ```
4. أنشئ الجداول اللازمة في Supabase (`kh_products`, `kh_categories`, `kh_orders`, `kh_delivery_zones`, `kh_customers`, `kh_profiles`) وفعّل Row Level Security المناسب.
5. لإنشاء حساب إدارة: سجّل مستخدمًا عاديًا من `login.html`، ثم من جدول `kh_profiles` غيّر `role` إلى `admin` و `active` إلى `true` لذلك المستخدم.

## النشر
الموقع ملفات ثابتة بالكامل — يمكن نشره مباشرة على GitHub Pages، Netlify، Vercel أو أي استضافة ثابتة أخرى بدون أي بناء (build) مسبق.

## ملاحظة أمنية
لا تضع مفتاح `service_role` في أي ملف من هذه الملفات — فهي تُقرأ من المتصفح مباشرة ومرئية للجميع. استخدم `anon` / `publishable key` فقط، واعتمد على Row Level Security في Supabase لحماية البيانات.
