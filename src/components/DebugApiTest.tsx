import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

export const DebugApiTest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testApiConnectivity = async () => {
    setLoading(true);
    setTestResults([]);
    
    try {
      addResult('Starting API connectivity test...');
      
      // Test 1: Basic fetch to health endpoint
      addResult('Test 1: Testing basic fetch to health endpoint...');
      try {
        const response = await fetch('https://nest.arzansite.com/api/health');
        addResult(`✓ Health endpoint: ${response.status} ${response.statusText}`);
        const data = await response.json();
        addResult(`✓ Health data: ${JSON.stringify(data).substring(0, 100)}...`);
      } catch (error) {
        addResult(`✗ Health endpoint failed: ${error}`);
      }

      // Test 2: Test with apiClient
      addResult('Test 2: Testing apiClient.getSiteConfig...');
      try {
        const siteConfig = await apiClient.getSiteConfig();
        addResult(`✓ Site config: ${JSON.stringify(siteConfig).substring(0, 100)}...`);
      } catch (error) {
        addResult(`✗ Site config failed: ${error}`);
        if (error instanceof Error) {
          addResult(`  Error name: ${error.name}`);
          addResult(`  Error message: ${error.message}`);
          addResult(`  Error stack: ${error.stack?.substring(0, 200)}...`);
        }
      }

      // Test 3: Test with credentials
      addResult('Test 3: Testing fetch with credentials...');
      try {
        const response = await fetch('https://nest.arzansite.com/api/site-config/current', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        addResult(`✓ Credentials test: ${response.status} ${response.statusText}`);
      } catch (error) {
        addResult(`✗ Credentials test failed: ${error}`);
      }

      // Test 4: Check environment variables
      addResult('Test 4: Checking environment variables...');
      addResult(`VITE_API_URL: ${import.meta.env.VITE_API_URL || 'NOT SET'}`);
      addResult(`MODE: ${import.meta.env.MODE}`);
      addResult(`PROD: ${import.meta.env.PROD}`);
      addResult(`DEV: ${import.meta.env.DEV}`);

      // Test 5: Test CORS preflight
      addResult('Test 5: Testing CORS preflight...');
      try {
        const response = await fetch('https://nest.arzansite.com/api/site-config/current', {
          method: 'OPTIONS',
          credentials: 'include',
        });
        addResult(`✓ CORS preflight: ${response.status} ${response.statusText}`);
        addResult(`CORS headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`);
      } catch (error) {
        addResult(`✗ CORS preflight failed: ${error}`);
      }

      // Test 6: Test different fetch configurations
      addResult('Test 6: Testing different fetch configurations...');
      
      // Test 6a: No credentials
      try {
        const response = await fetch('https://nest.arzansite.com/api/site-config/current', {
          method: 'GET',
          credentials: 'omit',
        });
        addResult(`✓ No credentials: ${response.status} ${response.statusText}`);
      } catch (error) {
        addResult(`✗ No credentials failed: ${error}`);
      }

      // Test 6b: Same origin
      try {
        const response = await fetch('https://nest.arzansite.com/api/site-config/current', {
          method: 'GET',
          credentials: 'same-origin',
        });
        addResult(`✓ Same origin: ${response.status} ${response.statusText}`);
      } catch (error) {
        addResult(`✗ Same origin failed: ${error}`);
      }

      // Test 7: Test with different headers
      addResult('Test 7: Testing with different headers...');
      try {
        const response = await fetch('https://nest.arzansite.com/api/site-config/current', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'ArzanSite-Debug/1.0'
          },
        });
        addResult(`✓ Custom headers: ${response.status} ${response.statusText}`);
      } catch (error) {
        addResult(`✗ Custom headers failed: ${error}`);
      }

      // Test 8: Test network connectivity
      addResult('Test 8: Testing network connectivity...');
      try {
        const startTime = Date.now();
        const response = await fetch('https://nest.arzansite.com/api/health');
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        addResult(`✓ Network response time: ${responseTime}ms`);
        addResult(`✓ Network status: ${response.status} ${response.statusText}`);
      } catch (error) {
        addResult(`✗ Network test failed: ${error}`);
      }

      // Test 9: Test CORS specifically
      addResult('Test 9: Testing CORS policy...');
      try {
        // Test if the issue is with credentials
        const response1 = await fetch('https://nest.arzansite.com/api/site-config/current', {
          method: 'GET',
          credentials: 'omit',
          mode: 'cors'
        });
        addResult(`✓ CORS with omit credentials: ${response1.status} ${response1.statusText}`);
        
        // Test with include credentials
        const response2 = await fetch('https://nest.arzansite.com/api/site-config/current', {
          method: 'GET',
          credentials: 'include',
          mode: 'cors'
        });
        addResult(`✓ CORS with include credentials: ${response2.status} ${response2.statusText}`);
        
      } catch (error) {
        addResult(`✗ CORS test failed: ${error}`);
        if (error instanceof Error) {
          addResult(`  CORS Error details: ${error.message}`);
        }
      }

      // Test 10: Test browser fetch API support
      addResult('Test 10: Testing browser fetch API support...');
      try {
        if (typeof fetch !== 'undefined') {
          addResult(`✓ Fetch API is available`);
          addResult(`✓ Fetch API type: ${typeof fetch}`);
        } else {
          addResult(`✗ Fetch API is not available`);
        }
        
        // Test if fetch works with a simple request
        const testResponse = await fetch('https://httpbin.org/get');
        addResult(`✓ External fetch test: ${testResponse.status} ${testResponse.statusText}`);
        
      } catch (error) {
        addResult(`✗ Fetch API test failed: ${error}`);
      }

    } catch (error) {
      addResult(`✗ Overall test failed: ${error}`);
    } finally {
      setLoading(false);
      addResult('API connectivity test completed.');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">API Connectivity Debug Test</h2>
      
      <button
        onClick={testApiConnectivity}
        disabled={loading}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Run API Test'}
      </button>

      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Test Results:</h3>
        <div className="space-y-1 text-sm font-mono">
          {testResults.map((result, index) => (
            <div key={index} className={result.startsWith('✗') ? 'text-red-600' : 'text-gray-800'}>
              {result}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-semibold text-yellow-800">Common Issues:</h3>
        <ul className="mt-2 text-sm text-yellow-700 space-y-1">
          <li>• CORS policy blocking requests</li>
          <li>• Network connectivity issues</li>
          <li>• SSL/TLS certificate problems</li>
          <li>• Environment variables not loaded</li>
          <li>• Browser security policies</li>
        </ul>
      </div>
    </div>
  );
};
