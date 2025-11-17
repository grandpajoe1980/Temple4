
import React, { useState } from 'react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface LoginFormProps {
  onLogin: (email: string, pass: string) => boolean;
  onNavigateToRegister: () => void;
  onNavigateToForgotPassword: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, onNavigateToRegister, onNavigateToForgotPassword }) => {
  const [email, setEmail] = useState('admin@temple.com');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = onLogin(email, password);
    if (!success) {
      setError('Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <Card title="Platform Login" description="Enter your credentials to continue.">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-100 border border-red-200 text-red-800 rounded-md text-sm">
                {error}
            </div>
          )}
          <Input 
            id="email" 
            name="email" 
            label="Email Address"
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
          <Input 
            id="password" 
            name="password" 
            label="Password"
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
           <div className="text-right">
             <button type="button" onClick={onNavigateToForgotPassword} className="text-sm text-amber-600 hover:text-amber-800 hover:underline">
               Forgot your password?
             </button>
           </div>
           <div className="flex justify-between items-center">
             <button type="button" onClick={onNavigateToRegister} className="text-sm text-amber-600 hover:text-amber-800 hover:underline">
               Create an account
             </button>
            <Button type="submit">Login</Button>
          </div>
           <div className="text-center text-xs text-gray-400 pt-4">
             <p>For this prototype, use:</p>
             <p>Email: <strong>admin@temple.com</strong> / Password: <strong>admin</strong></p>
             <p>Or any other user from the mock data.</p>
           </div>
        </form>
      </Card>
    </div>
  );
};

export default LoginForm;