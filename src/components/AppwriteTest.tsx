import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const AppwriteTest = () => {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user, userRole, signOut } = useAuth();
  const { toast } = useToast();

  const handleTestLogin = async () => {
    setLoading(true);
    try {
      const response = await signIn(email, password);
      console.log('Login response:', response);
      
      if (response?.redirect) {
        toast({
          title: 'Login successful!',
          description: response.redirect.message,
        });
        
        // Show the redirect info
        console.log('Redirect URL:', response.redirect.url);
        console.log('Redirect message:', response.redirect.message);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: 'Login failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestSignup = async () => {
    setLoading(true);
    try {
      const response = await signUp(email, password, { name: 'Test User' });
      console.log('Signup response:', response);
      toast({
        title: 'Signup successful!',
        description: 'Check console for details',
      });
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: 'Signup failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestLogout = async () => {
    try {
      await signOut();
      toast({
        title: 'Logout successful!',
        description: 'User logged out',
      });
    } catch (error: any) {
      console.error('Logout error:', error);
      toast({
        title: 'Logout failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Appwrite Authentication Test</CardTitle>
        <CardDescription>
          Test the Appwrite authentication integration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="test@example.com"
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password123"
          />
        </div>

        <div className="flex space-x-2">
          <Button
            onClick={handleTestLogin}
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Testing...' : 'Test Login'}
          </Button>
          
          <Button
            onClick={handleTestSignup}
            disabled={loading}
            variant="outline"
            className="flex-1"
          >
            {loading ? 'Testing...' : 'Test Signup'}
          </Button>
        </div>

        {user && (
          <div className="space-y-2">
            <Button
              onClick={handleTestLogout}
              variant="destructive"
              className="w-full"
            >
              Test Logout
            </Button>
            
            <div className="p-3 bg-gray-100 rounded-md">
              <h4 className="font-medium mb-2">Current User:</h4>
              <p><strong>ID:</strong> {user.id}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Role:</strong> {user.role}</p>
              <p><strong>Role from context:</strong> {userRole?.role}</p>
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500">
          <p>Check browser console for detailed logs</p>
          <p>Current user state: {user ? 'Logged in' : 'Not logged in'}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AppwriteTest;
