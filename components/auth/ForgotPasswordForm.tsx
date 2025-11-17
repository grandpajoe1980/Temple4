import React, { useState } from 'react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface ForgotPasswordFormProps {
  onSubmit: (email: string) => boolean;
  onNavigateToLogin: () => void;
  onNavigateToResetPassword: (email: string) => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onSubmit, onNavigateToLogin, onNavigateToResetPassword }) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [userFound, setUserFound] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = onSubmit(email);
    setUserFound(found);
    setSubmitted(true);
  };

  return (
    <div className="max-w-md mx-auto">
      <Card title="Forgot Password" description="Enter your email address and we'll send you a link to reset your password.">
        {submitted ? (
          <div className="text-center">
            <div className="p-4 bg-green-100 border border-green-200 text-green-800 rounded-md text-sm">
                <h3 className="font-semibold">Check your email</h3>
                <p className="mt-1">If an account with that email exists, a password reset link has been sent.</p>
            </div>
            {userFound && (
                <div className="mt-4 text-xs text-gray-400">
                    <p>(For this prototype, click below to simulate opening the link from your email.)</p>
                    <Button variant="secondary" className="mt-2" onClick={() => onNavigateToResetPassword(email)}>
                        Reset Password for {email}
                    </Button>
                </div>
            )}
            <button type="button" onClick={onNavigateToLogin} className="mt-6 text-sm text-amber-600 hover:text-amber-800 hover:underline">
               &larr; Back to Login
             </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input 
              id="email" 
              name="email" 
              label="Email Address"
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              autoFocus
            />
            <div className="flex justify-between items-center">
              <button type="button" onClick={onNavigateToLogin} className="text-sm text-amber-600 hover:text-amber-800 hover:underline">
                Back to Login
              </button>
              <Button type="submit">Send Reset Link</Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};

export default ForgotPasswordForm;