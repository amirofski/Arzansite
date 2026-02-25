/**
 * Error Messages Translation Utility
 * Translates API error messages to Persian
 */

export interface ErrorTranslation {
  pattern: RegExp | string;
  translation: string;
}

/**
 * Common API error patterns and their Persian translations
 */
export const ERROR_TRANSLATIONS: ErrorTranslation[] = [
  // Email Verification Errors
  {
    pattern: /please verify your email|email verification required|verify your email/i,
    translation: 'لطفاً ابتدا ایمیل خود را تأیید کنید. ایمیل تأیید را در صندوق ورودی خود بررسی کنید.'
  },
  {
    pattern: /email.*not.*verified/i,
    translation: 'ایمیل شما تأیید نشده است. لطفاً ایمیل خود را تأیید کنید.'
  },
  {
    pattern: /verification email sent/i,
    translation: 'ایمیل تأیید با موفقیت ارسال شد. لطفاً صندوق ورودی خود را بررسی کنید.'
  },
  {
    pattern: /email verified successfully/i,
    translation: 'ایمیل شما با موفقیت تأیید شد.'
  },
  {
    pattern: /invalid.*verification.*token/i,
    translation: 'لینک تأیید نامعتبر یا منقضی شده است.'
  },

  // Authentication Errors
  {
    pattern: /invalid.*credentials|incorrect.*password|wrong.*password|invalid.*email.*password/i,
    translation: 'ایمیل یا رمز عبور اشتباه است.'
  },
  {
    pattern: /user.*not.*found|account.*not.*found/i,
    translation: 'حساب کاربری با این ایمیل یافت نشد.'
  },
  {
    pattern: /account.*disabled|account.*blocked|user.*blocked/i,
    translation: 'حساب کاربری شما غیرفعال شده است. لطفاً با پشتیبانی تماس بگیرید.'
  },
  {
    pattern: /unauthorized|authentication.*failed|please.*log.*in/i,
    translation: 'لطفا قبل از ورود ایمیل خود را تایید کنید.لینک برای شما ایمیل شده'
  },
  {
    pattern: /session.*expired|token.*expired/i,
    translation: 'نشست شما منقضی شده است. لطفاً دوباره وارد شوید.'
  },
  {
    pattern: /invalid.*token/i,
    translation: 'توکن نامعتبر است.'
  },

  // Sign Up Errors
  {
    pattern: /email.*already.*exists|email.*already.*registered|user.*already.*exists/i,
    translation: 'این ایمیل قبلاً ثبت شده است.'
  },
  {
    pattern: /invalid.*email.*format/i,
    translation: 'فرمت ایمیل نامعتبر است.'
  },
  {
    pattern: /password.*too.*short|password.*must.*be.*at.*least/i,
    translation: 'رمز عبور باید حداقل ۸ کاراکتر باشد.'
  },
  {
    pattern: /password.*too.*weak/i,
    translation: 'رمز عبور باید شامل حروف بزرگ، کوچک و اعداد باشد.'
  },

  // Password Reset Errors
  {
    pattern: /password.*reset.*email.*sent/i,
    translation: 'ایمیل بازیابی رمز عبور ارسال شد.'
  },
  {
    pattern: /password.*reset.*successful/i,
    translation: 'رمز عبور با موفقیت تغییر کرد.'
  },
  {
    pattern: /invalid.*reset.*token/i,
    translation: 'لینک بازیابی رمز عبور نامعتبر یا منقضی شده است.'
  },

  // Network Errors
  {
    pattern: /network.*error|failed.*to.*fetch/i,
    translation: 'خطا در برقراری ارتباط. لطفاً اتصال اینترنت خود را بررسی کنید.'
  },
  {
    pattern: /timeout|request.*timed.*out/i,
    translation: 'زمان درخواست تمام شد. لطفاً دوباره تلاش کنید.'
  },

  // Server Errors
  {
    pattern: /internal.*server.*error|server.*error/i,
    translation: 'خطای سرور. لطفاً چند لحظه دیگر دوباره تلاش کنید.'
  },
  {
    pattern: /service.*unavailable/i,
    translation: 'سرویس در حال حاضر در دسترس نیست. لطفاً بعداً تلاش کنید.'
  },
  {
    pattern: /bad.*gateway/i,
    translation: 'خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.'
  },

  // Rate Limiting
  {
    pattern: /too.*many.*requests|rate.*limit/i,
    translation: 'تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً چند دقیقه صبر کنید.'
  },

  // Validation Errors
  {
    pattern: /validation.*error|invalid.*input/i,
    translation: 'اطلاعات وارد شده نامعتبر است. لطفاً دوباره بررسی کنید.'
  },
  {
    pattern: /required.*field|field.*required/i,
    translation: 'لطفاً تمام فیلدهای الزامی را پر کنید.'
  },

  // Permission Errors
  {
    pattern: /forbidden|access.*denied|permission.*denied/i,
    translation: 'شما اجازه دسترسی به این بخش را ندارید.'
  },

  // Payment Errors
  {
    pattern: /payment.*failed/i,
    translation: 'پرداخت ناموفق بود. لطفاً دوباره تلاش کنید.'
  },
  {
    pattern: /insufficient.*funds|insufficient.*balance/i,
    translation: 'موجودی کیف پول شما کافی نیست.'
  },
  {
    pattern: /payment.*successful/i,
    translation: 'پرداخت با موفقیت انجام شد.'
  },

  // Order Errors
  {
    pattern: /order.*not.*found/i,
    translation: 'سفارش مورد نظر یافت نشد.'
  },
  {
    pattern: /order.*already.*completed/i,
    translation: 'این سفارش قبلاً تکمیل شده است.'
  },

  // Domain Errors
  {
    pattern: /domain.*not.*available|domain.*already.*taken/i,
    translation: 'این دامنه در دسترس نیست.'
  },
  {
    pattern: /domain.*available/i,
    translation: 'این دامنه در دسترس است.'
  },
  {
    pattern: /invalid.*domain/i,
    translation: 'نام دامنه نامعتبر است.'
  },

  // File Upload Errors
  {
    pattern: /file.*too.*large/i,
    translation: 'حجم فایل بیش از حد مجاز است.'
  },
  {
    pattern: /invalid.*file.*type/i,
    translation: 'نوع فایل مجاز نیست.'
  },
  {
    pattern: /upload.*failed/i,
    translation: 'آپلود فایل ناموفق بود.'
  },

  // Generic HTTP errors
  {
    pattern: /http.*400|bad.*request/i,
    translation: 'درخواست نامعتبر است.'
  },
  {
    pattern: /http.*404|not.*found/i,
    translation: 'منبع مورد نظر یافت نشد.'
  },
  {
    pattern: /http.*500/i,
    translation: 'خطای سرور. لطفاً بعداً تلاش کنید.'
  },
  {
    pattern: /http.*503/i,
    translation: 'سرویس در حال حاضر در دسترس نیست.'
  },

  // Generic catch-all for "Http Exception"
  {
    pattern: /^http exception$/i,
    translation: 'خطایی رخ داد. لطفاً دوباره تلاش کنید.'
  },
];

/**
 * Translates an English error message to Persian
 * @param errorMessage - The error message in English
 * @returns Translated error message in Persian
 */
export function translateErrorMessage(errorMessage: string | null | undefined): string {
  if (!errorMessage || typeof errorMessage !== 'string') {
    return 'خطایی نامشخص رخ داد.';
  }

  // Try to find a matching translation
  for (const { pattern, translation } of ERROR_TRANSLATIONS) {
    if (typeof pattern === 'string') {
      if (errorMessage.toLowerCase().includes(pattern.toLowerCase())) {
        return translation;
      }
    } else {
      if (pattern.test(errorMessage)) {
        return translation;
      }
    }
  }

  // If no translation found, return the original message
  // (in production, you might want to return a generic error message)
  console.warn('No translation found for error:', errorMessage);
  return errorMessage;
}

/**
 * Extracts error message from various error response formats
 * @param error - Error object from API
 * @returns Extracted error message
 */
export function extractErrorMessage(error: any): string {
  // If it's a string, return it
  if (typeof error === 'string') {
    return error;
  }

  // If it's an Error object
  if (error instanceof Error) {
    return error.message;
  }

  // If it's an object with error field (common API format)
  if (error?.error && typeof error.error === 'string') {
    return error.error;
  }

  // If it's an object with message field
  if (error?.message && typeof error.message === 'string') {
    return error.message;
  }

  // If it's a response object with data
  if (error?.response?.data) {
    return extractErrorMessage(error.response.data);
  }

  // If it's wrapped in data
  if (error?.data) {
    return extractErrorMessage(error.data);
  }

  return 'خطایی نامشخص رخ داد.';
}

/**
 * Gets a translated Persian error message from any error format
 * @param error - Error object from API or catch block
 * @returns Translated error message in Persian
 */
export function getErrorMessage(error: any): string {
  const extractedMessage = extractErrorMessage(error);
  return translateErrorMessage(extractedMessage);
}

