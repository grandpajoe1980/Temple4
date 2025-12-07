'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';
import { 
  Database, 
  Shield, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  Trash2,
  Save
} from 'lucide-react';

interface DatabaseConfig {
  hasMasterPassword: boolean;
  hasDbUrl: boolean;
  source: 'secrets' | 'env' | 'none';
  maskedUrl: string;
  connectionStatus: 'connected' | 'error' | 'not-configured';
  connectionError: string;
}

export default function DatabaseConfigPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [config, setConfig] = useState<DatabaseConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [databaseUrl, setDatabaseUrl] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Fetch current configuration
  const fetchConfig = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/admin/database-config');
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch configuration');
      }
      const data = await res.json();
      setConfig(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch configuration');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (status === 'authenticated') {
      fetchConfig();
    }
  }, [status]);
  
  // Redirect non-admins
  useEffect(() => {
    if (status === 'authenticated' && !session?.user?.isSuperAdmin) {
      router.push('/');
    }
  }, [status, session, router]);
  
  // Save database URL
  const handleSave = async () => {
    if (!databaseUrl.trim()) {
      setError('Please enter a database URL');
      return;
    }
    
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      const res = await fetch('/api/admin/database-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ databaseUrl: databaseUrl.trim() }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save configuration');
      }
      
      if (data.testResult === 'success') {
        setSuccess('Database URL saved and connection verified! Restart the application for full effect.');
      } else {
        setSuccess(`Database URL saved, but connection test failed: ${data.testError}. Check the URL and try again.`);
      }
      
      setDatabaseUrl('');
      fetchConfig();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };
  
  // Delete database URL from secrets
  const handleDelete = async () => {
    if (!confirm('Remove DATABASE_URL from encrypted secrets? The app will fall back to .env value if present.')) {
      return;
    }
    
    setError(null);
    setSuccess(null);
    
    try {
      const res = await fetch('/api/admin/database-config', { method: 'DELETE' });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete');
      }
      
      setSuccess(data.message);
      fetchConfig();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };
  
  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }
  
  if (!session?.user?.isSuperAdmin) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-semibold">Access Denied</span>
          </div>
          <p className="mt-2 text-red-700 dark:text-red-300">
            Only platform administrators can access database configuration.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2 text-foreground">
          <Database className="h-8 w-8" />
          Database Configuration
        </h1>
        <p className="text-muted-foreground mt-2">
          Securely configure your database connection. The DATABASE_URL is stored encrypted.
        </p>
      </div>
      
      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
            <XCircle className="h-5 w-5" />
            <span className="font-semibold">Error</span>
          </div>
          <p className="mt-1 text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}
      
      {/* Success Alert */}
      {success && (
        <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-semibold">Success</span>
          </div>
          <p className="mt-1 text-green-700 dark:text-green-300">{success}</p>
        </div>
      )}
      
      {/* Security Status */}
      <Card title="Security Status" className="mb-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Master Password</span>
            </div>
            {config?.hasMasterPassword ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <CheckCircle2 className="h-3 w-3" /> Configured
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                <XCircle className="h-3 w-3" /> Not Set
              </span>
            )}
          </div>
          
          {!config?.hasMasterPassword && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-semibold">Action Required</span>
              </div>
              <p className="mt-1 text-amber-700 dark:text-amber-300">
                Set <code className="bg-amber-200 dark:bg-amber-800 px-1 rounded">SECRETS_MASTER_PASSWORD</code> in your .env file 
                to enable encrypted secret storage.
              </p>
            </div>
          )}
        </div>
      </Card>
      
      {/* Current Configuration */}
      <Card title="Current Configuration" className="mb-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Connection Status</span>
            {config?.connectionStatus === 'connected' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <CheckCircle2 className="h-3 w-3" /> Connected
              </span>
            )}
            {config?.connectionStatus === 'error' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                <XCircle className="h-3 w-3" /> Error
              </span>
            )}
            {config?.connectionStatus === 'not-configured' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                <AlertTriangle className="h-3 w-3" /> Not Configured
              </span>
            )}
          </div>
          
          {config?.connectionError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <code className="text-sm text-red-700 dark:text-red-300 break-all">
                {config.connectionError}
              </code>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span className="font-medium">Configuration Source</span>
            <span className="text-sm text-muted-foreground">
              {config?.source === 'secrets' && '🔐 Encrypted Secrets'}
              {config?.source === 'env' && '📄 Environment File'}
              {config?.source === 'none' && '❌ Not Set'}
            </span>
          </div>
          
          {config?.maskedUrl && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Database URL (masked)</label>
              <code className="block bg-muted p-3 rounded text-sm break-all text-foreground">
                {config.maskedUrl}
              </code>
            </div>
          )}
          
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" onClick={fetchConfig}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            {config?.source === 'secrets' && (
              <Button variant="danger" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Remove from Secrets
              </Button>
            )}
          </div>
        </div>
      </Card>
      
      {/* Update Configuration */}
      {config?.hasMasterPassword && (
        <Card title="Update Database URL" description="Enter a new database connection URL to store in encrypted secrets.">
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="databaseUrl" className="text-sm font-medium text-foreground">
                Database URL
              </label>
              <div className="relative">
                <Input
                  id="databaseUrl"
                  type={showPassword ? 'text' : 'password'}
                  value={databaseUrl}
                  onChange={(e) => setDatabaseUrl(e.target.value)}
                  placeholder="postgresql://user:password@host:5432/database"
                  className="pr-10 font-mono"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                For Supabase, use the pooler connection string for IPv4 support.
              </p>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                <Shield className="h-5 w-5" />
                <span className="font-semibold">Encrypted Storage</span>
              </div>
              <p className="mt-1 text-blue-700 dark:text-blue-300 text-sm">
                The database URL will be encrypted with AES-256-GCM and stored in{' '}
                <code className="bg-blue-200 dark:bg-blue-800 px-1 rounded">secrets.encrypted.json</code>.
              </p>
            </div>
            
            <Button onClick={handleSave} disabled={saving || !databaseUrl.trim()}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save & Test Connection
                </>
              )}
            </Button>
          </div>
        </Card>
      )}
      
      {/* Help Section */}
      <Card title="How It Works" className="mt-6">
        <div className="space-y-4 text-sm">
          <div>
            <h4 className="font-semibold text-foreground">1. Master Password (Required)</h4>
            <p className="text-muted-foreground">
              Set <code className="bg-muted px-1 rounded">SECRETS_MASTER_PASSWORD</code> in your{' '}
              <code className="bg-muted px-1 rounded">.env</code> file. This is the only secret 
              that must remain unencrypted.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground">2. Encrypted Storage</h4>
            <p className="text-muted-foreground">
              All other secrets (including DATABASE_URL) are encrypted with AES-256-GCM and stored in{' '}
              <code className="bg-muted px-1 rounded">secrets.encrypted.json</code>, which is safe to commit to git.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground">3. Automatic Loading</h4>
            <p className="text-muted-foreground">
              On application startup, secrets are decrypted and loaded into the environment before 
              any database connections are made.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground">4. Supabase Connection</h4>
            <p className="text-muted-foreground">
              For Supabase PostgreSQL with IPv4, use the <strong>Session Mode pooler</strong> connection string:
            </p>
            <code className="block bg-muted p-2 rounded mt-1 text-xs break-all">
              postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
            </code>
          </div>
        </div>
      </Card>
    </div>
  );
}
