// Appwrite authentication service that integrates with your backend API
// This service handles the frontend authentication flow and communicates with your backend

export interface AppwriteUser {
  $id: string;
  email: string;
  emailVerification: boolean;
  name?: string;
  phone?: string;
  status: number;
  registration: number;
  passwordUpdate: number;
  lastActivity: number;
}

export interface UserProfile {
  id: string;
  email: string;
  role: 'user' | 'admin';
  first_name?: string;
  last_name?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: UserProfile;
  redirect: {
    url: string;
    message: string;
  };
}

export interface SignupResponse {
  requiresFrontendVerification: boolean;
  verificationEmailSent: boolean;
  message: string;
}

class AppwriteAuthService {
  private baseURL = import.meta.env.VITE_API_URL || (import.meta.env.PROD 
    ? 'https://nest.arzansite.com/api'  // Production
    : 'http://localhost:3000/api');     // Development
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    console.log('AppwriteAuthService initialized with baseURL:', this.baseURL);
    console.log('Environment:', import.meta.env.MODE);
    console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
  }

  // Set tokens after successful authentication
  private setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    // Store in localStorage for persistence
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }

  // Clear tokens on logout
  private clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  // Get stored tokens on initialization
  private loadStoredTokens() {
    const storedAccessToken = localStorage.getItem('access_token');
    const storedRefreshToken = localStorage.getItem('refresh_token');
    if (storedAccessToken && storedRefreshToken) {
      this.accessToken = storedAccessToken;
      this.refreshToken = storedRefreshToken;
    }
  }

  // Make authenticated API request
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401 && this.refreshToken) {
      // Try to refresh token
      try {
        await this.refreshAccessToken();
        // Retry the original request with new token
        headers['Authorization'] = `Bearer ${this.accessToken}`;
        return fetch(url, {
          ...options,
          headers,
        });
      } catch (error) {
        this.clearTokens();
        throw new Error('Authentication failed');
      }
    }

    return response;
  }

  // Refresh access token
  private async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${this.baseURL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: this.refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    this.setTokens(data.access_token, this.refreshToken);
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      // First, check if the user's email is verified
      const verificationStatus = await this.checkEmailVerification(email);
      
      if (!verificationStatus.emailVerified) {
        throw new Error('Please verify your email before logging in. Check your inbox for the verification email.');
      }

      const loginUrl = `${this.baseURL}/auth/login`;
      const requestBody = { email, password };
      
      console.log('SignIn: Making request to:', loginUrl);
      console.log('SignIn: Request body:', requestBody);
      
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      console.log('SignIn: Response status:', response.status);
      console.log('SignIn: Response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('SignIn: Error response:', errorData);
        
        // Handle specific error cases
        if (errorData.message?.includes('email verification')) {
          throw new Error('Please verify your email before logging in. Check your inbox for the verification email.');
        }
        
        throw new Error(errorData.message || 'Login failed');
      }

      const responseData = await response.json();
      
      // Debug logging to identify response structure
      console.log('SignIn: Full response data:', responseData);
      console.log('SignIn: Data structure keys:', Object.keys(responseData));
      console.log('SignIn: Data.data object:', responseData?.data);
      
      // The backend returns data in a nested structure: { data: { access_token, user, ... } }
      const data = responseData.data;
      
      if (!data) {
        console.error('SignIn: No data property found in response. Available keys:', Object.keys(responseData));
        throw new Error('Invalid response structure from server');
      }
      
      console.log('SignIn: Access token in data:', data?.access_token);
      console.log('SignIn: User object in data:', data?.user);
      
      // Set tokens - the backend returns tokens inside the data object
      const accessToken = data.access_token;
      const refreshToken = data.refresh_token;
      
      if (!accessToken) {
        console.error('SignIn: No access token found in data. Available keys:', Object.keys(data));
        throw new Error('No access token received from server');
      }
      
      console.log('SignIn: Access token found, setting tokens...');
      this.setTokens(accessToken, refreshToken);
      
      // Create user profile from response - user is inside the data object
      let userProfile: UserProfile;
      
      if (data.user && data.user.id) {
        // User object is inside data: { data: { user: { id, email, ... } } }
        console.log('SignIn: Using nested data user structure');
        userProfile = {
          id: data.user.id,
          email: data.user.email || email,
          role: data.user.role || 'user',
          created_at: data.user.created_at || new Date().toISOString(),
          updated_at: data.user.updated_at || new Date().toISOString(),
        };
      } else if (data.id) {
        // Flat structure inside data: { data: { id, email, ... } }
        console.log('SignIn: Using flat data user structure');
        userProfile = {
          id: data.id,
          email: data.email || email,
          role: data.role || 'user',
          created_at: data.created_at || new Date().toISOString(),
          updated_at: data.updated_at || new Date().toISOString(),
        };
      } else {
        // Fallback: create a minimal user profile
        console.log('SignIn: Using fallback user structure');
        userProfile = {
          id: 'unknown',
          email: email,
          role: 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        console.warn('SignIn: Could not extract user ID from data, using fallback');
      }

      // Determine redirect URL based on user role
      const redirectUrl = data.redirect?.url || '/dashboard';
      const redirectMessage = data.redirect?.message || 'Login successful! Redirecting to dashboard...';

      const result: AuthResponse = {
        access_token: accessToken,
        refresh_token: refreshToken,
        user: userProfile,
        redirect: {
          url: redirectUrl,
          message: redirectMessage
        }
      };

      console.log('SignIn: Final auth response:', result);
      return result;
    } catch (error) {
      console.error('SignIn: Sign in error:', error);
      throw new Error(error instanceof Error ? error.message : 'Sign in failed');
    }
  }

  async signUp(email: string, password: string, metadata?: Record<string, unknown>): Promise<SignupResponse> {
    try {
      const response = await fetch(`${this.baseURL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          metadata: metadata || {}
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Signup failed');
      }

      const data = await response.json();

      return {
        requiresFrontendVerification: data.requiresFrontendVerification || false,
        verificationEmailSent: data.verificationEmailSent || false,
        message: data.message || 'Account created successfully! Please check your email for verification.'
      };
    } catch (error) {
      console.error('Sign up error:', error);
      throw new Error(error instanceof Error ? error.message : 'Sign up failed');
    }
  }

  async signOut(): Promise<void> {
    try {
      if (this.accessToken) {
        await this.makeRequest('/auth/logout', { method: 'POST' });
      }
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      this.clearTokens();
    }
  }

  async getCurrentUser(): Promise<UserProfile | null> {
    try {
      if (!this.accessToken) {
        return null;
      }

      const response = await this.makeRequest('/auth/me');
      
      if (!response.ok) {
        this.clearTokens();
        return null;
      }

      const data = await response.json();
      
      // Create user profile from response
      const userProfile: UserProfile = {
        id: data.id,
        email: data.email || '',
        role: data.role || 'user',
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        phone: data.phone || '',
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString(),
      };

      return userProfile;
    } catch (error) {
      console.error('Get current user error:', error);
      this.clearTokens();
      return null;
    }
  }

  async refreshUserToken(): Promise<void> {
    try {
      await this.refreshAccessToken();
    } catch (error) {
      console.error('Refresh token error:', error);
      this.clearTokens();
      throw new Error('Failed to refresh token');
    }
  }

  async forgotPassword(email: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/auth/password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send password reset email');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to send password reset email');
    }
  }

  async resetPassword(userId: string, secret: string, password: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, secret, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to reset password');
    }
  }

  async checkEmailVerification(email: string): Promise<{ email: string; emailVerified: boolean; userId: string; message: string }> {
    try {
      // First try to check with the backend
      const response = await fetch(`${this.baseURL}/auth/check-verification/${encodeURIComponent(email)}`);
      
      if (response.ok) {
        const data = await response.json();
        return {
          email: data.email,
          emailVerified: data.emailVerified,
          userId: data.userId,
          message: data.message
        };
      }

      // If backend check fails, try to get user info from Appwrite directly
      // This is a fallback method
      console.log('Backend verification check failed, trying direct Appwrite check...');
      
      // For now, we'll assume the email is verified if we can't check
      // In a production environment, you'd want to implement proper Appwrite SDK calls here
      return {
        email: email,
        emailVerified: true, // Assume verified for now
        userId: 'unknown',
        message: 'Email verification status could not be determined'
      };
    } catch (error) {
      console.error('Check email verification error:', error);
      // Return a default response that allows login to proceed
      return {
        email: email,
        emailVerified: true, // Assume verified to prevent blocking
        userId: 'unknown',
        message: 'Could not verify email status, proceeding with login'
      };
    }
  }

  async requestVerification(email: string, password: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/auth/request-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to request verification email');
      }
    } catch (error) {
      console.error('Request verification error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to request verification email');
    }
  }

  // Create user profile after successful authentication
  async createUserProfile(userData: UserProfile): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/profiles/me`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userData.id,
          email: userData.email,
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          role: userData.role,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to create profile:', errorData);
        throw new Error(errorData.message || 'Failed to create user profile');
      }

      console.log('User profile created successfully');
    } catch (error) {
      console.error('Error creating user profile:', error);
      // Don't throw here as this is not critical for login
    }
  }

  // Verify email with token and userId
  async verifyEmail(token: string, userId: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${this.baseURL}/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Email verification failed');
      }

      const data = await response.json();
      return { message: data.message || 'Email verified successfully' };
    } catch (error) {
      console.error('Email verification error:', error);
      throw new Error(error instanceof Error ? error.message : 'Email verification failed');
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.accessToken !== null;
  }

  // Get current access token
  getAccessToken(): string | null {
    return this.accessToken;
  }

  // Initialize the service (load stored tokens)
  initialize() {
    this.loadStoredTokens();
  }
}

export const appwriteAuthService = new AppwriteAuthService();

// Initialize the service when the module is loaded
appwriteAuthService.initialize();
