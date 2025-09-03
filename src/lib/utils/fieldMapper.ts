// Field Mapper Utility for ArzanSite
// Handles conversion between camelCase (frontend) and snake_case (backend) naming conventions

export class FieldMapper {
  private static readonly FIELD_MAPPING = {
    // User fields
    userId: 'user_id',
    firstName: 'first_name',
    lastName: 'last_name',
    fullName: 'full_name',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    emailConfirmedAt: 'email_confirmed_at',
    userMetadata: 'user_metadata',
    
    // Order fields
    orderId: 'order_id',
    orderNumber: 'order_number',
    totalAmount: 'total_amount',
    paymentStatus: 'payment_status',
    siteType: 'site_type',
    designSnapshot: 'design_snapshot',
    totalPages: 'total_pages',
    totalSections: 'total_sections',
    sessionId: 'session_id',
    wizardData: 'wizard_data',
    
    // Payment fields
    paymentId: 'payment_id',
    transactionId: 'transaction_id',
    refId: 'ref_id',
    authority: 'authority',
    paymentMethod: 'payment_method',
    paymentUrl: 'payment_url',
    
    // Wallet fields
    walletId: 'wallet_id',
    balanceBefore: 'balance_before',
    balanceAfter: 'balance_after',
    referenceId: 'reference_id',
    referenceType: 'reference_type',
    
    // Invoice fields
    invoiceId: 'invoice_id',
    dueDate: 'due_date',
    
    // Design fields
    currentPageId: 'current_page_id',
    canvasDimensions: 'canvas_dimensions',
    sectionType: 'section_type',
    layoutId: 'layout_id',
    customData: 'custom_data',
    
    // Common fields
    id: 'id',
    status: 'status',
    description: 'description',
    amount: 'amount',
    currency: 'currency',
    comments: 'comments',
    title: 'title',
    price: 'price',
    email: 'email',
    // Auth fields
    // Keep login/signup password as 'password'
    password: 'password',
    // Map newPassword used in reset flows to backend 'new_password'
    newPassword: 'new_password',
    refreshToken: 'refresh_token',
    accessToken: 'access_token',
    expiresAt: 'expires_at',
  };

  /**
   * Convert camelCase object to snake_case
   */
  static toSnakeCase(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (Array.isArray(obj)) return obj.map(item => this.toSnakeCase(item));
    if (typeof obj !== 'object') return obj;

    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = this.FIELD_MAPPING[key as keyof typeof this.FIELD_MAPPING] || key;
      result[snakeKey] = this.toSnakeCase(value);
    }
    return result;
  }

  /**
   * Convert snake_case object to camelCase
   */
  static toCamelCase(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (Array.isArray(obj)) return obj.map(item => this.toCamelCase(item));
    if (typeof obj !== 'object') return obj;

    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = this.getCamelCaseKey(key);
      result[camelKey] = this.toCamelCase(value);
    }
    return result;
  }

  /**
   * Get camelCase key from snake_case key using reverse mapping
   */
  private static getCamelCaseKey(snakeKey: string): string {
    const reverseMapping = Object.fromEntries(
      Object.entries(this.FIELD_MAPPING).map(([camel, snake]) => [snake, camel])
    );
    return reverseMapping[snakeKey] || snakeKey;
  }

  /**
   * Convert a single camelCase string to snake_case
   */
  static camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  /**
   * Convert a single snake_case string to camelCase
   */
  static snakeToCamel(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  /**
   * Transform API request data to snake_case
   */
  static transformRequest<T>(data: T): any {
    return this.toSnakeCase(data);
  }

  /**
   * Transform API response data to camelCase
   */
  static transformResponse<T>(data: any): T {
    return this.toCamelCase(data) as T;
  }

  /**
   * Transform nested response with data wrapper
   */
  static transformWrappedResponse<T>(response: any): T {
    if (response && typeof response === 'object' && 'data' in response) {
      return this.transformResponse<T>(response.data);
    }
    return this.transformResponse<T>(response);
  }

  /**
   * Transform list response
   */
  static transformListResponse<T>(response: any): T[] {
    if (Array.isArray(response)) {
      return response.map(item => this.transformResponse<T>(item));
    }
    
    if (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)) {
      return response.data.map((item: any) => this.transformResponse<T>(item));
    }
    
    return [];
  }
} 
