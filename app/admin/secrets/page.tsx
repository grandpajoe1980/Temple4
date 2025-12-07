'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, Key, Save, Trash2, RefreshCw, Download, Shield, AlertTriangle, Check, X } from 'lucide-react';
import Button from '@/app/components/ui/Button';
import Card from '@/app/components/ui/Card';

interface SecretMetadata {
  key: string;
  description: string;
  category: 'email' | 'oauth' | 'api' | 'auth' | 'database' | 'other';
  required: boolean;
  hasValue: boolean;
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  auth: { label: 'Authentication', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  email: { label: 'Email', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  oauth: { label: 'OAuth', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  api: { label: 'API Keys', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  database: { label: 'Database', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  other: { label: 'Other', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' },
};

export default function SecretsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [secrets, setSecrets] = useState<SecretMetadata[]>([]);
  const [masterPassword, setMasterPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state for editing secrets
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showValue, setShowValue] = useState(false);
  
  // Change password modal
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Export modal
  const [showExport, setShowExport] = useState(false);
  const [exportData, setExportData] = useState('');

  // Load secrets metadata
  const loadSecrets = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/secrets');
      if (!res.ok) throw new Error('Failed to load secrets');
      const data = await res.json();
      setSecrets(data.secrets);
    } catch (err) {
      setError('Failed to load secrets');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user?.isSuperAdmin) {
      router.push('/');
      return;
    }
    loadSecrets();
  }, [session, status, router, loadSecrets]);

  // Verify master password
  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      const res = await fetch('/api/admin/secrets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', masterPassword }),
      });
      
      const data = await res.json();
      
      if (data.valid) {
        setIsUnlocked(true);
        setSuccess('Secrets vault unlocked');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Invalid master password');
      }
    } catch {
      setError('Failed to verify password');
    }
  };

  // Save a secret
  const handleSaveSecret = async (key: string) => {
    setError(null);
    
    try {
      const res = await fetch('/api/admin/secrets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: editValue, masterPassword }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }
      
      setSuccess(`Secret ${key} saved successfully`);
      setEditingKey(null);
      setEditValue('');
      loadSecrets();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save secret');
    }
  };

  // Delete a secret
  const handleDeleteSecret = async (key: string) => {
    if (!confirm(`Are you sure you want to delete ${key}?`)) return;
    
    setError(null);
    
    try {
      const res = await fetch('/api/admin/secrets', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      
      if (!res.ok) throw new Error('Failed to delete');
      
      setSuccess(`Secret ${key} deleted`);
      loadSecrets();
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError('Failed to delete secret');
    }
  };

  // Get current value of a secret
  const handleViewSecret = async (key: string) => {
    if (editingKey === key) {
      setEditingKey(null);
      setEditValue('');
      setShowValue(false);
      return;
    }
    
    setEditingKey(key);
    setShowValue(false);
    
    // Check if secret exists
    const secret = secrets.find(s => s.key === key);
    if (!secret?.hasValue) {
      setEditValue('');
      return;
    }
    
    try {
      const res = await fetch('/api/admin/secrets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-value', key, masterPassword }),
      });
      
      const data = await res.json();
      setEditValue(data.value || '');
    } catch {
      setEditValue('');
    }
  };

  // Generate a secure secret
  const handleGenerate = async () => {
    try {
      const res = await fetch('/api/admin/secrets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', length: 64 }),
      });
      
      const data = await res.json();
      setEditValue(data.secret);
    } catch {
      setError('Failed to generate secret');
    }
  };

  // Change master password
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 12) {
      setError('Password must be at least 12 characters');
      return;
    }
    
    try {
      const res = await fetch('/api/admin/secrets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change-password',
          currentPassword: masterPassword,
          newPassword,
        }),
      });
      
      if (!res.ok) throw new Error('Failed to change password');
      
      setMasterPassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      setShowChangePassword(false);
      setSuccess('Master password changed successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError('Failed to change master password');
    }
  };

  // Export secrets
  const handleExport = async () => {
    try {
      const res = await fetch('/api/admin/secrets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'export', masterPassword }),
      });
      
      const data = await res.json();
      setExportData(data.exportData);
      setShowExport(true);
    } catch {
      setError('Failed to export secrets');
    }
  };

  // Group secrets by category
  const groupedSecrets = secrets.reduce((acc, secret) => {
    const category = secret.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(secret);
    return acc;
  }, {} as Record<string, SecretMetadata[]>);

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          Secrets Management
        </h1>
        <p className="text-muted-foreground mt-2">
          Securely store and manage sensitive configuration values. Secrets are encrypted with AES-256-GCM.
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex items-center gap-3 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      
      {success && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3 text-green-700 dark:text-green-400">
          <Check className="h-5 w-5" />
          {success}
        </div>
      )}

      {/* Unlock Form */}
      {!isUnlocked ? (
        <Card title="Unlock Secrets Vault" description="Enter your master password to access and manage secrets.">
          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label htmlFor="masterPassword" className="block text-sm font-medium text-foreground mb-1">
                Master Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="masterPassword"
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  className="w-full px-4 py-2 pr-10 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Enter master password"
                  required
                  minLength={8}
                />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                First time? Enter a new password to create the vault.
              </p>
            </div>
            <Button type="submit">
              <Key className="h-4 w-4 mr-2" />
              Unlock Vault
            </Button>
          </form>
        </Card>
      ) : (
        <>
          {/* Toolbar */}
          <div className="mb-6 flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => setShowChangePassword(true)}>
              <Key className="h-4 w-4 mr-2" />
              Change Password
            </Button>
            <Button variant="secondary" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export for Production
            </Button>
            <Button variant="ghost" onClick={loadSecrets}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Secrets by Category */}
          {Object.entries(groupedSecrets).map(([category, categorySecrets]) => (
            <div key={category} className="mb-8">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${CATEGORY_LABELS[category]?.color || CATEGORY_LABELS.other.color}`}>
                  {CATEGORY_LABELS[category]?.label || category}
                </span>
              </h2>
              
              <div className="space-y-3">
                {categorySecrets.map((secret) => (
                  <div
                    key={secret.key}
                    className="bg-card border border-border rounded-lg p-4 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono font-semibold text-foreground">
                            {secret.key}
                          </code>
                          {secret.required && (
                            <span className="text-xs text-destructive font-medium">Required</span>
                          )}
                          {secret.hasValue ? (
                            <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                              <Check className="h-3 w-3" /> Set
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Not set</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {secret.description}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant={editingKey === secret.key ? 'primary' : 'secondary'}
                          onClick={() => handleViewSecret(secret.key)}
                        >
                          {editingKey === secret.key ? 'Cancel' : 'Edit'}
                        </Button>
                        {secret.hasValue && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteSecret(secret.key)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* Edit Form */}
                    {editingKey === secret.key && (
                      <div className="mt-4 pt-4 border-t border-border space-y-3">
                        <div className="relative">
                          <input
                            type={showValue ? 'text' : 'password'}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-full px-4 py-2 pr-20 border border-input rounded-lg bg-background text-foreground font-mono text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                            placeholder={`Enter value for ${secret.key}`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowValue(!showValue)}
                            className="absolute right-10 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                          >
                            {showValue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                          {(secret.key.includes('SECRET') || secret.key.includes('KEY')) && (
                            <button
                              type="button"
                              onClick={handleGenerate}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                              title="Generate secure value"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleSaveSecret(secret.key)}>
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Change Password Modal */}
          {showChangePassword && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-card rounded-xl border border-border p-6 max-w-md w-full">
                <h3 className="text-lg font-semibold mb-4">Change Master Password</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-input rounded-lg bg-background"
                      minLength={12}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Confirm Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-input rounded-lg bg-background"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleChangePassword}>Change Password</Button>
                    <Button variant="secondary" onClick={() => setShowChangePassword(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Export Modal */}
          {showExport && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-card rounded-xl border border-border p-6 max-w-2xl w-full max-h-[80vh] flex flex-col">
                <h3 className="text-lg font-semibold mb-4">Export Secrets for Production</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Copy these commands to set environment variables in your production environment.
                  <strong className="text-destructive"> Never commit these values to git!</strong>
                </p>
                <div className="flex-1 overflow-auto">
                  <pre className="bg-muted p-4 rounded-lg text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                    {exportData || 'No secrets to export'}
                  </pre>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      navigator.clipboard.writeText(exportData);
                      setSuccess('Copied to clipboard');
                      setTimeout(() => setSuccess(null), 3000);
                    }}
                  >
                    Copy to Clipboard
                  </Button>
                  <Button variant="ghost" onClick={() => setShowExport(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Info Card */}
      <div className="mt-8 p-4 bg-muted/50 rounded-lg border border-border">
        <h3 className="font-semibold text-foreground mb-2">How it works</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Secrets are encrypted using AES-256-GCM with a key derived from your master password</li>
          <li>• The encrypted file <code className="text-primary">secrets.encrypted.json</code> is safe to commit to git</li>
          <li>• Set <code className="text-primary">SECRETS_MASTER_PASSWORD</code> in production to auto-load secrets</li>
          <li>• Use the &ldquo;Export for Production&rdquo; feature to get environment variable commands</li>
        </ul>
      </div>
    </div>
  );
}
