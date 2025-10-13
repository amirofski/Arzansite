# راهنمای تنظیم متغیرهای محیطی (Environment Variables)

## نحوه تنظیم فایل `.env` یا `.env.local`

یک فایل با نام `.env.local` در ریشه پروژه ایجاد کنید و متغیرهای زیر را در آن قرار دهید:

---

## 1️⃣ تنظیمات Appwrite (برای OAuth)

```bash
VITE_APPWRITE_ENDPOINT=https://app.arzansite.com/v1
VITE_APPWRITE_PROJECT_ID=6898b35e003067cd7b43
```

### توضیحات:
- **`VITE_APPWRITE_ENDPOINT`**: آدرس Appwrite Server شما
- **`VITE_APPWRITE_PROJECT_ID`**: شناسه پروژه Appwrite

> ⚠️ **نکته مهم**: برای OAuth (Google, GitHub) به **API Key نیاز نیست**! 
> API Key فقط برای Server SDK استفاده می‌شود. در Client SDK (مرورگر) فقط به Endpoint و Project ID نیاز است.

---

## 2️⃣ تنظیمات Backend API

```bash
VITE_REACT_APP_API_BASE=https://nest.arzansite.com/api
```

### توضیحات:
این متغیر برای سایر عملیات API مانند:
- ورود با ایمیل/پسورد
- ثبت‌نام
- مدیریت پروفایل
- مدیریت تراکنش‌ها

استفاده می‌شود.

---

## 3️⃣ تقسیم مسئولیت‌ها

### از طریق Appwrite مستقیماً:
✅ **OAuth (Google, GitHub)**
✅ **Email OTP** (کد یکبار مصرف ایمیل)
✅ **Magic Link** (لینک جادویی)

### از طریق Backend API:
✅ **ورود با ایمیل/پسورد**
✅ **ثبت‌نام**
✅ **تایید ایمیل**
✅ **بازیابی رمز عبور**
✅ **مدیریت پروفایل کاربری**
✅ **تراکنش‌ها و پرداخت‌ها**

---

## 4️⃣ تنظیم OAuth در Appwrite Console

برای فعال‌سازی ورود با Google و GitHub:

### مراحل:
1. به [Appwrite Console](https://app.arzansite.com) بروید
2. پروژه خود را انتخاب کنید
3. به **Auth** > **Settings** بروید
4. برای هر Provider (Google/GitHub):
   - **Success URL**: `https://yourdomain.com/auth/oauth/callback`
   - **Failure URL**: `https://yourdomain.com/auth?oauth=failed`

### برای Google:
- به [Google Cloud Console](https://console.cloud.google.com) بروید
- یک OAuth Client ID ایجاد کنید
- **Authorized redirect URIs**: `https://app.arzansite.com/v1/account/sessions/oauth2/callback/google/[PROJECT_ID]`
- Client ID و Client Secret را در Appwrite وارد کنید

### برای GitHub:
- به [GitHub Developer Settings](https://github.com/settings/developers) بروید
- یک OAuth App جدید ایجاد کنید
- **Authorization callback URL**: `https://app.arzansite.com/v1/account/sessions/oauth2/callback/github/[PROJECT_ID]`
- Client ID و Client Secret را در Appwrite وارد کنید

---

## 5️⃣ مثال فایل `.env.local` کامل

```bash
# Appwrite Configuration
VITE_APPWRITE_ENDPOINT=https://app.arzansite.com/v1
VITE_APPWRITE_PROJECT_ID=6898b35e003067cd7b43

# Backend API Configuration
VITE_REACT_APP_API_BASE=https://nest.arzansite.com/api
```

> 💡 **نکته**: فایل `.env.local` به صورت خودکار در `.gitignore` قرار دارد و commit نمی‌شود.

---

## 6️⃣ اطلاعات تکمیلی

### چرا نیازی به API Key نیست؟
- **Client SDK** (مرورگر): فقط به `endpoint` و `projectId` نیاز دارد
- **Server SDK** (Backend): به API Key نیاز دارد

OAuth از Client SDK استفاده می‌کند، بنابراین API Key لازم نیست.

### امنیت
تمام درخواست‌های OAuth از طریق Appwrite با استفاده از:
- CORS policy
- Redirect URL validation
- Session management

امن می‌شوند.

---

## ❓ سوالات متداول

**Q: آیا می‌توانم OAuth را از طریق Backend API مدیریت کنم؟**
A: خیر، OAuth باید مستقیماً از Client (مرورگر) به سرویس OAuth (Google/GitHub) برود. Appwrite این فرآیند را مدیریت می‌کند.

**Q: آیا نیاز به HTTPS دارم؟**
A: برای production بله، ولی برای development می‌توانید از `http://localhost` استفاده کنید.

**Q: چطور متوجه شوم OAuth کار می‌کند؟**
A: وقتی روی دکمه کلیک می‌کنید، باید به صفحه ورود Google/GitHub منتقل شوید.

