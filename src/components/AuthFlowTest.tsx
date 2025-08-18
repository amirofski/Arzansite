import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, ShieldCheck, ShieldX, Loader2, Key } from 'lucide-react';
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { sessionAuthService } from "@/lib/sessionAuthService";

interface AuthTestResult {
  status: 'success' | 'failed' | 'skipped';
  data?: Record<string, unknown>;
  error?: string;
}

interface AuthResults {
  auth?: AuthTestResult;
  protected?: AuthTestResult;
  error?: string;
}

const AuthFlowTest = () => {
  const { user } = useAuth();
  const [isTesting, setIsTesting] = useState(false);
  const [authResults, setAuthResults] = useState<AuthResults>({});

  const testAuthFlow = async () => {
    setIsTesting(true);
    setAuthResults({});

    try {
      // Test 1: Check current user
      console.log('AuthFlowTest: Current user:', user);
      
      // Test 2: Check if we have session data
      const sessionInfo = sessionAuthService.getSessionInfo();
      
      console.log('AuthFlowTest: Session info:', sessionInfo);

      // Test 3: Try to authenticate with NestJS (cookie/session)
      const authResponse = await fetch('https://nest.arzansite.com/api/auth/status', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        mode: 'cors',
        credentials: 'include'
      });

      console.log('AuthFlowTest: NestJS auth response:', authResponse);

      if (authResponse.ok) {
        const authData = await authResponse.json();
        setAuthResults({ auth: { status: 'success', data: authData } });
        toast.success('NestJS authentication successful');
      } else {
        setAuthResults({ auth: { status: 'failed', error: `${authResponse.status}: ${authResponse.statusText}` } });
        toast.error(`NestJS authentication failed: ${authResponse.status}`);
      }

      // Test 4: Try to access protected endpoint with session
      if (sessionInfo.isAuthenticated) {
        const protectedResponse = await fetch('https://nest.arzansite.com/api/uploads', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          mode: 'cors',
          credentials: 'include'
        });

        console.log('AuthFlowTest: Protected endpoint response:', protectedResponse);

        if (protectedResponse.ok) {
          const protectedData = await protectedResponse.json();
          setAuthResults(prev => ({ ...prev, protected: { status: 'success', data: protectedData } }));
          toast.success('Protected endpoint access successful');
        } else {
          setAuthResults(prev => ({ ...prev, protected: { status: 'failed', error: `${protectedResponse.status}: ${protectedResponse.statusText}` } }));
          toast.error(`Protected endpoint failed: ${protectedResponse.status}`);
        }
      } else {
        setAuthResults(prev => ({ ...prev, protected: { status: 'skipped', error: 'No valid session available' } }));
      }

    } catch (error) {
      console.error('AuthFlowTest: Error testing auth flow:', error);
      setAuthResults({ error: error instanceof Error ? error.message : 'Unknown error' });
      toast.error('Authentication test failed');
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <ShieldCheck className="w-4 h-4 text-green-500" />;
      case 'failed': return <ShieldX className="w-4 h-4 text-red-500" />;
      case 'skipped': return <Shield className="w-4 h-4 text-yellow-500" />;
      default: return <Shield className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success': return <Badge variant="default" className="bg-green-500">Success</Badge>;
      case 'failed': return <Badge variant="destructive">Failed</Badge>;
      case 'skipped': return <Badge variant="outline">Skipped</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="w-5 h-5" />
          Authentication Flow Test
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Test the authentication flow between Appwrite and NestJS
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={testAuthFlow} 
            disabled={isTesting}
            className="flex-1"
          >
            {isTesting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing Auth Flow...
              </>
            ) : (
              'Test Authentication Flow'
            )}
          </Button>
        </div>

        {/* Current User Status */}
        <div className="p-3 border rounded-lg">
          <h4 className="font-medium mb-2">Current User Status:</h4>
          <div className="text-sm space-y-1">
            <div>Appwrite User: {user ? '✅ Logged In' : '❌ Not Logged In'}</div>
            {user && (
              <div>User ID: {user.id}</div>
            )}
            <div>Session ID: {sessionAuthService.getSessionInfo().sessionId ? '✅ Present' : '❌ Missing'}</div>
            <div>Backend Token: {sessionAuthService.getSessionInfo().hasAccessToken ? '✅ Present' : '❌ Missing'}</div>
          </div>
        </div>

        {/* Test Results */}
        {Object.keys(authResults).length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Test Results:</h4>
            
            {authResults.auth && (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(authResults.auth.status)}
                  <div>
                    <p className="font-medium">NestJS Auth Status</p>
                    <p className="text-sm text-muted-foreground">
                      {authResults.auth.status === 'success' ? 'Authentication endpoint working' : 'Authentication endpoint failed'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(authResults.auth.status)}
                  {authResults.auth.error && (
                    <p className="text-sm text-red-600 max-w-xs truncate" title={authResults.auth.error}>
                      {authResults.auth.error}
                    </p>
                  )}
                </div>
              </div>
            )}

            {authResults.protected && (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(authResults.protected.status)}
                  <div>
                    <p className="font-medium">Protected Endpoint</p>
                    <p className="text-sm text-muted-foreground">
                      {authResults.protected.status === 'success' ? 'File uploads endpoint accessible' : 'File uploads endpoint blocked'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(authResults.protected.status)}
                  {authResults.protected.error && (
                    <p className="text-sm text-red-600 max-w-xs truncate" title={authResults.protected.error}>
                      {authResults.protected.error}
                    </p>
                  )}
                </div>
              </div>
            )}

            {authResults.error && (
              <div className="p-3 border border-red-200 rounded-lg bg-red-50">
                <p className="text-sm text-red-600">
                  <strong>Test Error:</strong> {authResults.error}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Recommendations */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Recommendations:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• If NestJS auth fails: Check JWT validation in backend</li>
            <li>• If protected endpoints fail: Check token format compatibility</li>
            <li>• Consider using NestJS for authentication instead of Appwrite</li>
            <li>• Ensure JWT secrets are properly configured</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default AuthFlowTest;
