import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

const SimplePingTest = () => {
  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState<'idle' | 'success' | 'failed'>('idle');
  const [responseTime, setResponseTime] = useState<number | null>(null);

  const pingBackend = async () => {
    setIsPinging(true);
    setPingResult('idle');
    setResponseTime(null);

    const startTime = performance.now();
    
    try {
      // Try to fetch a simple endpoint
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch('https://nest.arzansite.com/api/health', {
        method: 'GET',
        signal: controller.signal,
        mode: 'cors'
      });
      
      clearTimeout(timeoutId);
      const endTime = performance.now();
      const responseTimeMs = Math.round(endTime - startTime);
      
      if (response.ok) {
        setPingResult('success');
        setResponseTime(responseTimeMs);
      } else {
        setPingResult('failed');
      }
    } catch (error) {
      console.error('Ping test error:', error);
      setPingResult('failed');
    } finally {
      setIsPinging(false);
    }
  };

  const getStatusIcon = () => {
    if (isPinging) return <Loader2 className="w-4 h-4 animate-spin" />;
    if (pingResult === 'success') return <Wifi className="w-4 h-4 text-green-500" />;
    if (pingResult === 'failed') return <WifiOff className="w-4 h-4 text-red-500" />;
    return <Wifi className="w-4 h-4 text-gray-400" />;
  };

  const getStatusBadge = () => {
    if (isPinging) return <Badge variant="secondary">Pinging...</Badge>;
    if (pingResult === 'success') return <Badge variant="default" className="bg-green-500">Connected</Badge>;
    if (pingResult === 'failed') return <Badge variant="destructive">Failed</Badge>;
    return <Badge variant="outline">Not Tested</Badge>;
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          {getStatusIcon()}
          Backend Ping Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status:</span>
          {getStatusBadge()}
        </div>
        
        {responseTime && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Response Time:</span>
            <span className="text-sm font-medium">{responseTime}ms</span>
          </div>
        )}
        
        <Button 
          onClick={pingBackend} 
          disabled={isPinging}
          className="w-full"
          variant="outline"
        >
          {isPinging ? 'Pinging...' : 'Ping Backend'}
        </Button>
        
        {pingResult === 'failed' && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            Backend server appears to be unreachable. Check if the server is running.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SimplePingTest;
