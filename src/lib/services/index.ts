// Services Index for ArzanSite
// Exports all API services for easy importing

// Base API Service
export { BaseApiService } from './api/baseApiService';
export type { ApiError } from './api/baseApiService';

// Authentication Service
export { authService } from './auth/authService';
export type {
  SignUpRequest,
  SignInRequest,
  VerifyEmailRequest,
  PasswordResetRequest,
  PasswordResetConfirmRequest,
  AuthResponse,
  SignUpResponse,
  UserProfile,
} from './auth/authService';

// Wizard Service
export { wizardService } from './wizard/wizardService';
export type {
  CompleteOrderRequest,
  CalculatePriceRequest,
  SaveDesignRequest,
  CheckDomainRequest,
  OrderResponse,
  PriceCalculationResponse,
  DesignResponse,
  SaveProgressResponse,
  DomainAvailabilityResponse,
} from './wizard/wizardService';

// Orders Service
export { ordersService } from './orders/ordersService';
export type {
  CreateOrderRequest,
  UpdateOrderRequest as OrderUpdateRequest,
  Order,
  EnhancedOrderData,
  OrderListResponse,
  OrderDetailResponse,
} from './orders/ordersService';

// Wallet Service
export { walletService } from './wallet/walletService';
export type {
  WalletDepositRequest,
  WalletVerificationRequest,
  WalletTopUpRequest,
  CreateTransactionRequest,
  WalletBalanceResponse,
  WalletTransaction,
  WalletDepositResponse,
  WalletVerificationResponse,
  WalletTopUpResponse,
  WalletTransactionResponse,
  WalletTransactionsResponse,
} from './wallet/walletService';

// Payment Service
export { paymentService } from './payments/paymentService';
export type {
  PaymentRequest,
  PaymentVerificationRequest,
  PaymentStatusRequest,
  PaymentResponse,
  PaymentVerificationResponse,
  PaymentStatusResponse,
  PaymentMethod,
  PaymentMethodsResponse,
} from './payments/paymentService';

// Invoice Service
export { invoiceService } from './invoices/invoiceService';
export type {
  Invoice,
  InvoiceListRequest,
  PayInvoiceRequest,
  PayInvoiceResponse,
} from './invoices/invoiceService';

// Receipt Service
export { receiptService } from './receipts/receiptService';
export type {
  Receipt,
  ReceiptListRequest,
  DownloadReceiptRequest,
} from './receipts/receiptService';

// Transactions Service
export { transactionsService } from './transactions/transactionsService';
export type {
  TransactionItem,
  TransactionsPagination,
} from './transactions/transactionsService';

// Email Management Service
export { emailManagementService } from './emails/emailManagementService';
export type {
  EmailLog,
  EmailStats,
  EmailTestRequest,
  EmailTestResponse,
  EmailListRequest,
} from './emails/emailManagementService';

// Site Configuration Service
export { siteConfigurationService } from './site/siteConfigurationService';
export type {
  SiteConfig,
  UpdateSiteConfigRequest,
  SiteConfigHistory,
} from './site/siteConfigurationService';

// File Management Service
export { fileManagementService } from './files/fileManagementService';
export type {
  ListUploadsRequest,
  UploadFileRequest,
  DeleteFileRequest,
  GetFileUrlRequest,
  UploadedFile,
  FileListResponse,
  FileUploadResponse,
  FileUrlResponse,
  DeleteFileResponse,
} from './files/fileManagementService';

// Admin Service
export { adminService } from './admin/adminService';
export type {
  GetOrdersRequest,
  UpdateOrderRequest,
  TestEmailRequest,
  UpdateDomainPriceRequest,
  CreateDomainExtensionRequest,
  CheckDomainRequest as AdminCheckDomainRequest,
  DeleteUserRequest,
  AdminOrder,
  AdminUser,
  EmailLog as AdminEmailLog,
  DomainExtension,
  SystemMetrics,
  AdminStats,
  AdminWallet,
  AdminInvoice,
  AdminWalletAdjustment,
} from './admin/adminService';

// Notifications Service
export { notificationsService } from './notifications/notificationsService';
export type {
  MarkNotificationReadRequest,
  Notification,
  NotificationListResponse,
  MarkNotificationReadResponse,
} from './notifications/notificationsService';

// Support Service
export { supportService } from './support/supportService';
export type {
  CreateTicketRequest,
  UpdateTicketRequest,
  AddMessageRequest,
  SupportTicket,
  TicketListResponse,
  CreateTicketResponse,
  UpdateTicketResponse,
  AddMessageResponse,
} from './support/supportService';

// Utility exports
export { FieldMapper } from '@/lib/utils/fieldMapper';
export { ErrorHandler } from '@/lib/utils/errorHandler';
export { withRetry } from '@/lib/utils/retry';

// React Hooks
export { 
  useApi, 
  useApiWithCache, 
  useApiWithOptimisticUpdate, 
  useApiWithPolling, 
  useApiSubmit 
} from '@/hooks/useApi';