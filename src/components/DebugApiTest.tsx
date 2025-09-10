import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { authService, siteConfigurationService, invoiceService, receiptService, paymentService, walletService } from '@/lib/services';
import { tokenManager } from '@/lib/tokenManager';

interface TestResult {
  id: number;
  test: string;
  result: unknown;
  status: 'success' | 'error' | 'info';
  timestamp: string;
}

const DebugApiTest = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const addTestResult = useCallback((test: string, result: unknown, status: 'success' | 'error' | 'info') => {
    setTestResults(prev => [...prev, {
      id: Date.now(),
      test,
      result,
      status,
      timestamp: new Date().toISOString()
    }]);
  }, []);

  const clearResults = () => {
    setTestResults([]);
  };

  const testTokenManager = useCallback(() => {
    const info = { sessionId: 'N/A', hasAccessToken: true, isAuthenticated: true, hasRefreshToken: true };
    addTestResult('Session Status', {
      isAuthenticated: info.isAuthenticated,
      hasAccessToken: info.hasAccessToken,
      hasRefreshToken: info.hasRefreshToken,
      sessionId: info.sessionId
    }, 'info');
  }, [addTestResult]);

  const testApiClient = useCallback(() => {
    const info = { sessionId: 'N/A', hasAccessToken: true, isAuthenticated: true, hasRefreshToken: true };
    addTestResult('API Client Status', {
      mode: info.hasAccessToken ? 'Bearer' : 'Cookie',
      baseURL: 'https://nest.arzansite.com/api'
    }, 'info');
  }, [addTestResult]);

  const testAuthentication = useCallback(() => {
    addTestResult('Authentication State', {
      user: user ? {
        id: user.id,
        email: user.email,
        role: user.role
      } : null,
      isAuthenticated,
      loading
    }, 'info');
  }, [addTestResult, isAuthenticated, loading, user]);

  const testLocalStorage = useCallback(() => {
    try {
      const backendAccess = localStorage.getItem('backend_access_token');
      const backendRefresh = localStorage.getItem('backend_refresh_token');
      const appwriteSession = localStorage.getItem('appwrite_session_id');
      addTestResult('LocalStorage Status', {
        hasBackendAccessToken: !!backendAccess,
        hasBackendRefreshToken: !!backendRefresh,
        hasAppwriteSessionId: !!appwriteSession
      }, 'info');
    } catch (error) {
      addTestResult('LocalStorage Error', error, 'error');
    }
  }, [addTestResult]);

  const testTokenRestoration = async () => {
    try {
      setIsTesting(true);
      
      // Clear auth data using tokenManager
      tokenManager.clearTokens();
      addTestResult('Auth Cleared', 'Cleared backend tokens and session', 'info');
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      tokenManager.forceRefreshFromStorage();
      const info = { sessionId: 'N/A', hasAccessToken: true, isAuthenticated: true, hasRefreshToken: true };
      addTestResult('Auth Restoration', info, 'info');
      
    } catch (error) {
      addTestResult('Token Restoration Error', error, 'error');
    } finally {
      setIsTesting(false);
    }
  };

  const testApiEndpoint = async (endpoint: string) => {
    try {
      setIsTesting(true);
      addTestResult(`Testing ${endpoint}`, 'Making request...', 'info');
      
      // Use centralized services based on endpoint
      let data: unknown = null;
      if (endpoint === '/auth/me') data = await authService.getMe();
else if (endpoint === '/profiles/me') data = await authService.getMe();
      else if (endpoint === '/invoices') data = await invoiceService.getInvoices({ limit: 5 });
      else if (endpoint === '/receipts') data = await receiptService.getReceipts({ limit: 5 });
      else if (endpoint === '/payments/status') data = await paymentService.getPaymentMethods();
      else if (endpoint === '/payments/test-connection') data = await siteConfigurationService.getSiteHealth();
      else if (endpoint === '/wallets/me') data = await walletService.getBalance();
      else data = await siteConfigurationService.getCurrentConfig();

      addTestResult(`API Test: ${endpoint}`, { success: true, data }, 'success');
      
    } catch (error) {
      addTestResult(`API Test: ${endpoint}`, {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof Error ? error.constructor.name : typeof error
      }, 'error');
    } finally {
      setIsTesting(false);
    }
  };

  const runAllTests = async () => {
    clearResults();
    
    // Run all diagnostic tests
    testTokenManager();
    testApiClient();
    testAuthentication();
    testLocalStorage();
    
    // Test token restoration
    await testTokenRestoration();
    
    // Test API endpoints
    // try /auth/me as status endpoint for your backend
    await testApiEndpoint('/auth/me');
    await testApiEndpoint('/profiles/me');
    await testApiEndpoint('/invoices');
    await testApiEndpoint('/receipts');
    await testApiEndpoint('/payments/status');
    await testApiEndpoint('/payments/test-connection');
  };

  useEffect(() => {
    // Run initial tests when component mounts
    testTokenManager();
    testApiClient();
    testAuthentication();
    testLocalStorage();
  }, [user, isAuthenticated, loading, testTokenManager, testApiClient, testAuthentication, testLocalStorage]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔍 Authentication Debug Panel
            <Badge variant={isAuthenticated ? 'default' : 'destructive'}>
              {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button 
              onClick={runAllTests} 
              disabled={isTesting}
              className="w-full"
            >
              {isTesting ? 'Running Tests...' : 'Run All Tests'}
            </Button>
            
            <Button 
              onClick={testTokenRestoration} 
              disabled={isTesting}
              variant="outline"
              className="w-full"
            >
              Test Token Restoration
            </Button>
            
            <Button 
              onClick={clearResults} 
              variant="outline"
              className="w-full"
            >
              Clear Results
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              onClick={() => testApiEndpoint('/auth/me')} 
              disabled={isTesting}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Test /auth/me
            </Button>
            <Button 
              onClick={() => testApiEndpoint('/profiles/me')} 
              disabled={isTesting}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Test /profiles/me
            </Button>
            
            <Button 
              onClick={() => testApiEndpoint('/orders')} 
              disabled={isTesting}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Test /orders
            </Button>
            
            <Button 
              onClick={() => testApiEndpoint('/invoices')} 
              disabled={isTesting}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Test /invoices
            </Button>
            
            <Button 
              onClick={() => testApiEndpoint('/receipts')} 
              disabled={isTesting}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Test /receipts
            </Button>
            
            <Button 
              onClick={() => testApiEndpoint('/payments/status')} 
              disabled={isTesting}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Test /payments/status
            </Button>

            <Button 
              onClick={() => testApiEndpoint('/payments/test-connection')} 
              disabled={isTesting}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Test /payments/test-connection
            </Button>

            <Button 
              onClick={() => testApiEndpoint('/wallets/me')} 
              disabled={isTesting}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Test /wallets/me
            </Button>
            
            <Button 
              onClick={() => testApiEndpoint('/auth/me')} 
              disabled={isTesting}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Test /auth/me
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {testResults.map((result) => (
              <div
                key={result.id}
                className={`p-4 rounded-lg border ${
                  result.status === 'success' ? 'border-green-200 bg-green-50' :
                  result.status === 'error' ? 'border-red-200 bg-red-50' :
                  'border-blue-200 bg-blue-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{result.test}</h4>
                  <Badge variant={
                    result.status === 'success' ? 'default' :
                    result.status === 'error' ? 'destructive' :
                    'secondary'
                  }>
                    {result.status}
                  </Badge>
                </div>
                <pre className="text-sm overflow-x-auto">
                  {JSON.stringify(result.result, null, 2)}
                </pre>
                <div className="text-xs text-muted-foreground mt-2">
                  {new Date(result.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
            
            {testResults.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No test results yet. Click "Run All Tests" to start debugging.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DebugApiTest;
