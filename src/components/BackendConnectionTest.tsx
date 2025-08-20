import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from "sonner";

interface TestResult {
  endpoint: string;
  status: 'pending' | 'success' | 'error';
  response?: unknown;
  error?: string;
  timestamp: Date;
}

const BackendConnectionTest = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const testEndpoints = [
    { name: 'Health Check', url: 'https://nest.arzansite.com/api/health', method: 'GET' },
    // Some backends use /auth/me instead of /auth/status
    { name: 'Auth Me', url: 'https://nest.arzansite.com/api/auth/me', method: 'GET' },
    { name: 'Profiles (me)', url: 'https://nest.arzansite.com/api/profiles/me', method: 'GET' },
    { name: 'Orders', url: 'https://nest.arzansite.com/api/orders', method: 'GET' },
    { name: 'Invoices', url: 'https://nest.arzansite.com/api/invoices', method: 'GET' },
    { name: 'Receipts', url: 'https://nest.arzansite.com/api/receipts', method: 'GET' },
    { name: 'Wallet Balance', url: 'https://nest.arzansite.com/api/wallets/me/balance', method: 'GET' },
    { name: 'Wallet Transactions', url: 'https://nest.arzansite.com/api/wallets/me/transactions', method: 'GET' },
  ];

  const runTest = async (endpoint: typeof testEndpoints[0]) => {
    const result: TestResult = {
      endpoint: endpoint.name,
      status: 'pending',
      timestamp: new Date()
    };

    setResults(prev => [...prev, result]);

    try {
      console.log(`Testing ${endpoint.name}: ${endpoint.url}`);
      
      const bearer = localStorage.getItem('backend_access_token') || localStorage.getItem('access_token');
      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: {
          'Accept': 'application/json',
          ...(bearer ? { 'Authorization': `Bearer ${bearer}` } : {}),
        },
        mode: 'cors',
        credentials: 'include'
      });

      console.log(`${endpoint.name} response:`, response);

      if (response.ok) {
        const data = await response.json();
        result.status = 'success';
        result.response = data;
        toast.success(`${endpoint.name}: Connected successfully`);
      } else {
        result.status = 'error';
        result.error = `HTTP ${response.status}: ${response.statusText}`;
        toast.error(`${endpoint.name}: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error(`${endpoint.name} test error:`, error);
      result.status = 'error';
      result.error = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`${endpoint.name}: Connection failed`);
    }

    setResults(prev => prev.map(r => 
      r.endpoint === endpoint.name && r.timestamp === result.timestamp 
        ? result 
        : r
    ));
  };

  const runAllTests = async () => {
    setIsTesting(true);
    setResults([]);
    
    for (const endpoint of testEndpoints) {
      await runTest(endpoint);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsTesting(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary">Testing...</Badge>;
      case 'success': return <Badge variant="default" className="bg-green-500">Connected</Badge>;
      case 'error': return <Badge variant="destructive">Failed</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Backend Connection Test
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Test connectivity to your backend endpoints to diagnose connection issues
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={runAllTests} 
            disabled={isTesting}
            className="flex-1"
          >
            {isTesting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running Tests...
              </>
            ) : (
              'Run All Tests'
            )}
          </Button>
        </div>

        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium">Test Results</h3>
            {results.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(result.status)}
                  <div>
                    <p className="font-medium">{result.endpoint}</p>
                    <p className="text-sm text-muted-foreground">
                      {result.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {getStatusBadge(result.status)}
                  {result.error && (
                    <p className="text-sm text-red-600 max-w-xs truncate" title={result.error}>
                      {result.error}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Troubleshooting Tips:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Check if your backend server is running</li>
            <li>• Verify the backend URL is correct</li>
            <li>• Check server logs for errors</li>
            <li>• Ensure firewall/network allows the connection</li>
            <li>• Check if the server crashed during file upload</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default BackendConnectionTest;
