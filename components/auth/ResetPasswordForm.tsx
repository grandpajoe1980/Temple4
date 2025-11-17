import React, { useState } from 'react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface ResetPasswordFormProps {
  email: string;
  onReset: (email: string, newPass: string) => { success: boolean, message?: string };
  onNavigateToLogin: () => void;
}

const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ email, onReset, onNavigateToLogin }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const result = onReset(email, password);
    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.message || 'An unexpected error occurred.');
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto">
        <Card title="Password Reset Successful">
          <div className="text-center">
              <div className="p-4 bg-green-100 border border-green-200 text-green-800 rounded-md text-sm">
                  <p>Your password has been successfully updated.</p>
              </div>
              <Button className="mt-6" onClick={onNavigateToLogin}>
                Proceed to Login
              </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <Card title="Reset Your Password" description={`Enter a new password for ${email}.`}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-100 border border-red-200 text-red-800 rounded-md text-sm">
                {error}
            </div>
          )}
          <Input 
            id="password" 
            name="password" 
            label="New Password"
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            autoFocus
          />
           <Input 
            id="confirmPassword" 
            name="confirmPassword" 
            label="Confirm New Password"
            type="password" 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            required 
          />
           <div className="flex justify-end">
            <Button type="submit">Set New Password</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ResetPasswordForm;