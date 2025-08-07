// Email Template System for Arzan Site
// This file contains all email templates for user authentication and account management

export interface EmailTemplateData {
  userName?: string;
  userEmail?: string;
  actionUrl?: string;
  expirationTime?: string;
  loginTime?: string;
  loginLocation?: string;
  browserInfo?: string;
  newRole?: string;
  deactivationReason?: string;
  supportEmail?: string;
  companyName?: string;
  companyAddress?: string;
  socialLinks?: {
    website?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
}

// Base email template structure
const getBaseTemplate = (content: string, data: EmailTemplateData) => `
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.companyName || 'Arzan Site'}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Tahoma', 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            direction: rtl;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px 20px;
            text-align: center;
            color: white;
        }
        
        .logo {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .header-subtitle {
            font-size: 16px;
            opacity: 0.9;
        }
        
        .content {
            padding: 40px 30px;
            background-color: #ffffff;
        }
        
        .greeting {
            font-size: 20px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 20px;
        }
        
        .message {
            font-size: 16px;
            color: #555;
            margin-bottom: 30px;
            line-height: 1.8;
        }
        
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 25px;
            font-weight: bold;
            font-size: 16px;
            margin: 20px 0;
            transition: all 0.3s ease;
        }
        
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        
        .info-box {
            background-color: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .info-title {
            font-weight: bold;
            color: #495057;
            margin-bottom: 10px;
        }
        
        .info-content {
            color: #6c757d;
            font-size: 14px;
        }
        
        .footer {
            background-color: #2c3e50;
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        
        .footer-content {
            margin-bottom: 20px;
        }
        
        .footer-links {
            margin: 15px 0;
        }
        
        .footer-links a {
            color: #bdc3c7;
            text-decoration: none;
            margin: 0 10px;
            font-size: 14px;
        }
        
        .footer-links a:hover {
            color: #ecf0f1;
        }
        
        .social-links {
            margin-top: 20px;
        }
        
        .social-links a {
            display: inline-block;
            margin: 0 8px;
            color: #bdc3c7;
            text-decoration: none;
            font-size: 16px;
        }
        
        .social-links a:hover {
            color: #ecf0f1;
        }
        
        .disclaimer {
            font-size: 12px;
            color: #95a5a6;
            margin-top: 20px;
            line-height: 1.5;
        }
        
        @media (max-width: 600px) {
            .email-container {
                margin: 10px;
                border-radius: 4px;
            }
            
            .header {
                padding: 20px 15px;
            }
            
            .content {
                padding: 30px 20px;
            }
            
            .logo {
                font-size: 24px;
            }
            
            .greeting {
                font-size: 18px;
            }
            
            .message {
                font-size: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">${data.companyName || 'Arzan Site'}</div>
            <div class="header-subtitle">پلتفرم طراحی و توسعه وب‌سایت</div>
        </div>
        
        <div class="content">
            ${content}
        </div>
        
        <div class="footer">
            <div class="footer-content">
                <div>${data.companyName || 'Arzan Site'}</div>
                <div>${data.companyAddress || 'تهران، ایران'}</div>
                <div>پشتیبانی: ${data.supportEmail || 'support@arzansite.com'}</div>
            </div>
            
            <div class="footer-links">
                <a href="${data.socialLinks?.website || '#'}">وب‌سایت</a>
                <a href="${data.socialLinks?.twitter || '#'}">توییتر</a>
                <a href="${data.socialLinks?.instagram || '#'}">اینستاگرام</a>
                <a href="${data.socialLinks?.linkedin || '#'}">لینکدین</a>
            </div>
            
            <div class="disclaimer">
                این ایمیل به صورت خودکار ارسال شده است. لطفاً به آن پاسخ ندهید.
                اگر سوالی دارید، با تیم پشتیبانی ما تماس بگیرید.
            </div>
        </div>
    </div>
</body>
</html>
`;

// 1. Welcome Email Template
export const getWelcomeEmailTemplate = (data: EmailTemplateData): string => {
  const content = `
    <div class="greeting">سلام ${data.userName || 'کاربر عزیز'}! 👋</div>
    
    <div class="message">
      به <strong>${data.companyName || 'Arzan Site'}</strong> خوش آمدید! 
      ما خوشحالیم که شما را در جمع کاربران ما می‌بینیم.
    </div>
    
    <div class="message">
      حالا می‌توانید از تمام امکانات پلتفرم ما استفاده کنید:
    </div>
    
    <div class="info-box">
      <div class="info-title">🎨 طراحی وب‌سایت</div>
      <div class="info-content">با ابزارهای پیشرفته ما، وب‌سایت رویایی خود را طراحی کنید</div>
    </div>
    
    <div class="info-box">
      <div class="info-title">💳 مدیریت سفارشات</div>
      <div class="info-content">سفارشات خود را پیگیری و مدیریت کنید</div>
    </div>
    
    <div class="info-box">
      <div class="info-title">💰 کیف پول دیجیتال</div>
      <div class="info-content">از کیف پول امن ما برای تراکنشات استفاده کنید</div>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.actionUrl || '/dashboard'}" class="cta-button">
        شروع کنید
      </a>
    </div>
    
    <div class="message">
      اگر سوالی دارید یا به کمک نیاز دارید، تیم پشتیبانی ما آماده کمک به شما است.
    </div>
  `;
  
  return getBaseTemplate(content, data);
};

// 2. Email Verification Template
export const getEmailVerificationTemplate = (data: EmailTemplateData): string => {
  const content = `
    <div class="greeting">تایید ایمیل 📧</div>
    
    <div class="message">
      سلام ${data.userName || 'کاربر عزیز'}،
      برای تکمیل ثبت‌نام خود، لطفاً ایمیل خود را تایید کنید.
    </div>
    
    <div class="message">
      با کلیک روی دکمه زیر، حساب کاربری شما فعال خواهد شد:
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.actionUrl || '#'}" class="cta-button">
        تایید ایمیل
      </a>
    </div>
    
    <div class="info-box">
      <div class="info-title">⚠️ نکات مهم:</div>
      <div class="info-content">
        • این لینک تا ${data.expirationTime || '24 ساعت'} معتبر است<br>
        • اگر دکمه کار نمی‌کند، لینک را کپی کرده و در مرورگر خود باز کنید<br>
        • اگر این ایمیل را درخواست نکرده‌اید، آن را نادیده بگیرید
      </div>
    </div>
    
    <div class="message">
      اگر ایمیل تایید را دریافت نکرده‌اید، لطفاً پوشه اسپم خود را بررسی کنید.
    </div>
  `;
  
  return getBaseTemplate(content, data);
};

// 3. Password Reset Request Template
export const getPasswordResetTemplate = (data: EmailTemplateData): string => {
  const content = `
    <div class="greeting">بازنشانی رمز عبور 🔐</div>
    
    <div class="message">
      سلام ${data.userName || 'کاربر عزیز'}،
      درخواست بازنشانی رمز عبور برای حساب کاربری شما دریافت شده است.
    </div>
    
    <div class="message">
      برای بازنشانی رمز عبور، روی دکمه زیر کلیک کنید:
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.actionUrl || '#'}" class="cta-button">
        بازنشانی رمز عبور
      </a>
    </div>
    
    <div class="info-box">
      <div class="info-title">🔒 امنیت:</div>
      <div class="info-content">
        • این لینک تا ${data.expirationTime || '1 ساعت'} معتبر است<br>
        • لینک فقط یک بار قابل استفاده است<br>
        • اگر درخواست نکرده‌اید، این ایمیل را نادیده بگیرید
      </div>
    </div>
    
    <div class="message">
      اگر شما این درخواست را نکرده‌اید، لطفاً فوراً با تیم پشتیبانی تماس بگیرید.
    </div>
  `;
  
  return getBaseTemplate(content, data);
};

// 4. Password Successfully Reset Confirmation Template
export const getPasswordResetConfirmationTemplate = (data: EmailTemplateData): string => {
  const content = `
    <div class="greeting">رمز عبور با موفقیت تغییر یافت ✅</div>
    
    <div class="message">
      سلام ${data.userName || 'کاربر عزیز'}،
      رمز عبور حساب کاربری شما با موفقیت بازنشانی شد.
    </div>
    
    <div class="info-box">
      <div class="info-title">🔐 اطلاعات ورود جدید:</div>
      <div class="info-content">
        • ایمیل: ${data.userEmail || 'کاربر'}<br>
        • رمز عبور: رمز عبور جدیدی که انتخاب کرده‌اید
      </div>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.actionUrl || '/auth'}" class="cta-button">
        ورود به حساب کاربری
      </a>
    </div>
    
    <div class="info-box">
      <div class="info-title">⚠️ نکات امنیتی:</div>
      <div class="info-content">
        • رمز عبور خود را با هیچ‌کس به اشتراک نگذارید<br>
        • از رمز عبور قوی و منحصر به فرد استفاده کنید<br>
        • در صورت مشکوک شدن، فوراً رمز عبور را تغییر دهید
      </div>
    </div>
    
    <div class="message">
      اگر شما این تغییر را انجام نداده‌اید، لطفاً فوراً با تیم پشتیبانی تماس بگیرید.
    </div>
  `;
  
  return getBaseTemplate(content, data);
};

// 5. Login Notification Template
export const getLoginNotificationTemplate = (data: EmailTemplateData): string => {
  const content = `
    <div class="greeting">ورود جدید به حساب کاربری 🔔</div>
    
    <div class="message">
      سلام ${data.userName || 'کاربر عزیز'}،
      ورود جدیدی به حساب کاربری شما ثبت شده است.
    </div>
    
    <div class="info-box">
      <div class="info-title">📊 جزئیات ورود:</div>
      <div class="info-content">
        • زمان ورود: ${data.loginTime || 'نامشخص'}<br>
        • مکان: ${data.loginLocation || 'نامشخص'}<br>
        • مرورگر: ${data.browserInfo || 'نامشخص'}
      </div>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.actionUrl || '/dashboard'}" class="cta-button">
        مشاهده فعالیت‌ها
      </a>
    </div>
    
    <div class="info-box">
      <div class="info-title">🔒 اگر این شما نبوده‌اید:</div>
      <div class="info-content">
        • فوراً رمز عبور خود را تغییر دهید<br>
        • با تیم پشتیبانی تماس بگیرید<br>
        • بررسی کنید که آیا دستگاه‌های دیگر شما امن هستند
      </div>
    </div>
    
    <div class="message">
      این ایمیل برای اطمینان از امنیت حساب کاربری شما ارسال شده است.
    </div>
  `;
  
  return getBaseTemplate(content, data);
};

// 6. Account Role Notification Template
export const getRoleNotificationTemplate = (data: EmailTemplateData): string => {
  const content = `
    <div class="greeting">تغییر نقش حساب کاربری 👑</div>
    
    <div class="message">
      سلام ${data.userName || 'کاربر عزیز'}،
      نقش حساب کاربری شما تغییر یافته است.
    </div>
    
    <div class="info-box">
      <div class="info-title">🎯 نقش جدید شما:</div>
      <div class="info-content">
        <strong>${data.newRole || 'کاربر'}</strong>
      </div>
    </div>
    
    <div class="message">
      با این نقش جدید، شما دسترسی به امکانات بیشتری خواهید داشت:
    </div>
    
    ${data.newRole === 'admin' ? `
    <div class="info-box">
      <div class="info-title">🔧 امکانات مدیر:</div>
      <div class="info-content">
        • مدیریت کاربران و سفارشات<br>
        • مشاهده آمار و گزارشات<br>
        • تنظیمات سیستم<br>
        • مدیریت کیف پول‌ها
      </div>
    </div>
    ` : `
    <div class="info-box">
      <div class="info-title">✨ امکانات جدید:</div>
      <div class="info-content">
        • دسترسی به ویژگی‌های پیشرفته<br>
        • اولویت در پشتیبانی<br>
        • تخفیف‌های ویژه
      </div>
    </div>
    `}
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.actionUrl || '/dashboard'}" class="cta-button">
        مشاهده امکانات جدید
      </a>
    </div>
    
    <div class="message">
      اگر سوالی در مورد نقش جدید خود دارید، با تیم پشتیبانی تماس بگیرید.
    </div>
  `;
  
  return getBaseTemplate(content, data);
};

// 7. Account Deactivation/Suspension Template
export const getAccountDeactivationTemplate = (data: EmailTemplateData): string => {
  const content = `
    <div class="greeting">تغییر وضعیت حساب کاربری ⚠️</div>
    
    <div class="message">
      سلام ${data.userName || 'کاربر عزیز'}،
      وضعیت حساب کاربری شما تغییر یافته است.
    </div>
    
    <div class="info-box">
      <div class="info-title">📋 دلیل تغییر وضعیت:</div>
      <div class="info-content">
        ${data.deactivationReason || 'به دلایل امنیتی یا نقض قوانین'}
      </div>
    </div>
    
    <div class="message">
      برای بازگردانی دسترسی به حساب کاربری خود، لطفاً مراحل زیر را دنبال کنید:
    </div>
    
    <div class="info-box">
      <div class="info-title">📝 مراحل بازگردانی:</div>
      <div class="info-content">
        1. با تیم پشتیبانی تماس بگیرید<br>
        2. دلیل تغییر وضعیت را بررسی کنید<br>
        3. در صورت نیاز، اطلاعات تکمیلی ارائه دهید<br>
        4. منتظر تایید تیم پشتیبانی باشید
      </div>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="mailto:${data.supportEmail || 'support@arzansite.com'}" class="cta-button">
        تماس با پشتیبانی
      </a>
    </div>
    
    <div class="message">
      تیم پشتیبانی ما آماده کمک به شما برای حل این مشکل است.
    </div>
  `;
  
  return getBaseTemplate(content, data);
};

// Email template selector function
export const getEmailTemplate = (
  templateType: 'welcome' | 'verification' | 'password-reset' | 'password-reset-confirmation' | 'login-notification' | 'role-notification' | 'deactivation',
  data: EmailTemplateData
): string => {
  switch (templateType) {
    case 'welcome':
      return getWelcomeEmailTemplate(data);
    case 'verification':
      return getEmailVerificationTemplate(data);
    case 'password-reset':
      return getPasswordResetTemplate(data);
    case 'password-reset-confirmation':
      return getPasswordResetConfirmationTemplate(data);
    case 'login-notification':
      return getLoginNotificationTemplate(data);
    case 'role-notification':
      return getRoleNotificationTemplate(data);
    case 'deactivation':
      return getAccountDeactivationTemplate(data);
    default:
      return getWelcomeEmailTemplate(data);
  }
};

// Utility function to prepare email data with defaults
export const prepareEmailData = (data: Partial<EmailTemplateData>): EmailTemplateData => {
  return {
    companyName: 'Arzan Site',
    companyAddress: 'تهران، ایران',
    supportEmail: 'support@arzansite.com',
    socialLinks: {
      website: 'https://arzansite.com',
      twitter: 'https://twitter.com/arzansite',
      instagram: 'https://instagram.com/arzansite',
      linkedin: 'https://linkedin.com/company/arzansite'
    },
    ...data
  };
}; 