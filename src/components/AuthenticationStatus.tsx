import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { tokenManager } from '@/lib/tokenManager';
import { apiClient } from '@/lib/api-client';
import { RefreshCw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const AuthenticationStatus = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const [tokenStatus, setTokenStatus] = useState({
    hasAccessToken: false,
    hasRefreshToken: false,
    isExpired: false,
    tokenLength: 0
  });
  const [localStorageStatus, setLocalStorageStatus] = useState({
    hasAccessToken: false,
    hasRefreshToken: false,
    hasExpiresAt: false
  });
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const updateStatus = () => {
    // Check TokenManager status
    const accessToken = tokenManager.getAccessToken();
    const refreshToken = tokenManager.getRefreshToken();
    const isExpired = tokenManager.isTokenExpired();
    
    setTokenStatus({
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      isExpired,
      tokenLength: accessToken?.length || 0
    });

    // Check localStorage status
    try {
      const lsAccessToken = localStorage.getItem('access_token');
      const lsRefreshToken = localStorage.getItem('refresh_token');
      const lsExpiresAt = localStorage.getItem('token_expires_at');
      
      setLocalStorageStatus({
        hasAccessToken: !!lsAccessToken,
        hasRefreshToken: !!lsRefreshToken,
        hasExpiresAt: !!lsExpiresAt
      });
    } catch (error) {
      console.error('Failed to check localStorage:', error);
    }

    setLastUpdate(new Date());
  };

  const forceTokenRestoration = () => {
    tokenManager.forceRefreshFromStorage();
    updateStatus();
  };

  const clearTokens = () => {
    tokenManager.clearTokens();
    updateStatus();
  };

  useEffect(() => {
    updateStatus();
    
    // Update status every 5 seconds
    const interval = setInterval(updateStatus, 5000);
    
    return () => clearInterval(interval);
  }, [user, isAuthenticated, loading]);

  const getOverallStatus = () => {
    if (loading) return 'loading';
    if (!isAuthenticated) return 'not-authenticated';
    if (tokenStatus.isExpired) return 'expired';
    if (!tokenStatus.hasAccessToken) return 'no-token';
    return 'authenticated';
  };

  const getStatusIcon = () => {
    const status = getOverallStatus();
    switch (status) {
      case 'loading':
        return <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />;
      case 'authenticated':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'expired':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'no-token':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <XCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    const status = getOverallStatus();
    switch (status) {
      case 'loading':
        return 'Checking authentication...';
      case 'authenticated':
        return 'Authenticated';
      case 'expired':
        return 'Token expired';
      case 'no-token':
        return 'No access token';
      case 'not-authenticated':
        return 'Not authenticated';
      default:
        return 'Unknown status';
    }
  };

  const getStatusColor = () => {
    const status = getOverallStatus();
    switch (status) {
      case 'loading':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'authenticated':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'expired':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'no-token':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {getStatusIcon()}
          Authentication Status
          <Badge variant="outline" className={getStatusColor()}>
            {getStatusText()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">User State</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Loading:</span>
                <Badge variant={loading ? 'default' : 'secondary'}>
                  {loading ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Authenticated:</span>
                <Badge variant={isAuthenticated ? 'default' : 'secondary'}>
                  {isAuthenticated ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>User ID:</span>
                <span className="font-mono text-xs">
                  {user?.id ? `${user.id.substring(0, 8)}...` : 'None'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Email:</span>
                <span className="font-mono text-xs">
                  {user?.email || 'None'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">Token Status</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Access Token:</span>
                <Badge variant={tokenStatus.hasAccessToken ? 'default' : 'secondary'}>
                  {tokenStatus.hasAccessToken ? 'Present' : 'Missing'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Refresh Token:</span>
                <Badge variant={tokenStatus.hasRefreshToken ? 'default' : 'secondary'}>
                  {tokenStatus.hasRefreshToken ? 'Present' : 'Missing'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Expired:</span>
                <Badge variant={tokenStatus.isExpired ? 'destructive' : 'default'}>
                  {tokenStatus.isExpired ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Token Length:</span>
                <span className="font-mono text-xs">
                  {tokenStatus.tokenLength} chars
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* LocalStorage Status */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-muted-foreground">LocalStorage Status</h4>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="text-center">
              <div className="font-medium">Access Token</div>
              <Badge variant={localStorageStatus.hasAccessToken ? 'default' : 'secondary'}>
                {localStorageStatus.hasAccessToken ? '✓' : '✗'}
              </Badge>
            </div>
            <div className="text-center">
              <div className="font-medium">Refresh Token</div>
              <Badge variant={localStorageStatus.hasRefreshToken ? 'default' : 'secondary'}>
                {localStorageStatus.hasRefreshToken ? '✓' : '✗'}
              </Badge>
            </div>
            <div className="text-center">
              <div className="font-medium">Expires At</div>
              <Badge variant={localStorageStatus.hasExpiresAt ? 'default' : 'secondary'}>
                {localStorageStatus.hasExpiresAt ? '✓' : '✗'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            onClick={updateStatus} 
            variant="outline" 
            size="sm"
            className="flex-1"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Status
          </Button>
          <Button 
            onClick={forceTokenRestoration} 
            variant="outline" 
            size="sm"
            className="flex-1"
          >
            Restore Tokens
          </Button>
          <Button 
            onClick={clearTokens} 
            variant="outline" 
            size="sm"
            className="flex-1"
          >
            Clear Tokens
          </Button>
        </div>

        {/* Last Update */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );
};

export default AuthenticationStatus;
