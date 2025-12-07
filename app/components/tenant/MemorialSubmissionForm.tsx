'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';
import { 
  ArrowLeft, Flower2, Upload, X, Loader2, AlertCircle, CheckCircle 
} from 'lucide-react';

export default function MemorialSubmissionForm() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.tenantId as string;

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    birthDate: '',
    deathDate: '',
    story: '',
    photos: [] as string[],
    tags: '',
    privacy: 'PUBLIC',
    submitterName: '',
    submitterEmail: '',
    submitterRelationship: '',
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotos: string[] = [];
    // Upload each file to /api/upload and collect the returned URL
    for (let i = 0; i < files.length && formData.photos.length + newPhotos.length < 10; i++) {
      const file = files[i];
      try {
        const fd = new FormData();
        fd.append('file', file);
        if (tenantId) fd.append('tenantId', tenantId);
        fd.append('category', 'photos');

        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        if (!res.ok) {
          console.error('Upload failed for', file.name);
          continue;
        }
        const data = await res.json().catch(() => ({}));
        let url = data?.url || (data?.storageKey ? `/storage/${data.storageKey}` : null);
        // Normalize relative storage paths to absolute URLs so server-side validation (zod url) accepts them
        if (url && url.startsWith('/')) {
          try {
            url = window.location.origin + url;
          } catch (e) {
            // window may not be available in some environments; leave as-is
          }
        }
        if (url) newPhotos.push(url);
      } catch (err) {
        console.error('Upload error', err);
      }
    }

    if (newPhotos.length > 0) {
      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, ...newPhotos],
      }));
    }
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.name.trim()) {
        throw new Error('Name is required');
      }
      if (!formData.submitterName.trim()) {
        throw new Error('Your name is required');
      }
      if (!formData.submitterEmail.trim()) {
        throw new Error('Your email is required');
      }

      const tags = formData.tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0)
        .slice(0, 10);

      // Convert date-only inputs (YYYY-MM-DD) to full ISO datetimes expected by the API
      const toIsoDatetime = (d: string) => {
        if (!d) return null;
        // If already looks like an ISO datetime, return as-is
        if (d.includes('T') && d.endsWith('Z')) return d;
        try {
          // Treat the input as local date; append T00:00:00Z to represent the date in UTC
          const iso = new Date(d + 'T00:00:00Z').toISOString();
          return iso;
        } catch (e) {
          return null;
        }
      };

      // Ensure photos are absolute URLs (zod expects valid URL format)
      const normalize = (u: string) => {
        if (!u) return u;
        if (u.startsWith('/')) return (typeof window !== 'undefined' ? window.location.origin + u : u);
        return u;
      };

      const payload = {
        name: formData.name.trim(),
        birthDate: toIsoDatetime(formData.birthDate),
        deathDate: toIsoDatetime(formData.deathDate),
        story: formData.story.trim() || null,
        photos: formData.photos.map(normalize),
        tags,
        privacy: formData.privacy,
        submitterName: formData.submitterName.trim(),
        submitterEmail: formData.submitterEmail.trim(),
        submitterRelationship: formData.submitterRelationship.trim() || null,
      };

      const res = await fetch(`/api/tenants/${tenantId}/memorials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Failed to submit memorial' }));

        // Log raw API response to the console to aid debugging
        console.error('Memorial submission failed - API response:', data);

        // Format Zod validation errors (array of issues) into a readable string
        let errMsg = 'Failed to submit memorial';
        if (data && data.error) {
          if (Array.isArray(data.error)) {
            errMsg = data.error
              .map((issue: any) => {
                if (typeof issue === 'string') return issue;
                const path = Array.isArray(issue.path) && issue.path.length ? issue.path.join('.') : '';
                const message = issue.message ?? issue.toString?.() ?? JSON.stringify(issue);
                return path ? `${path}: ${message}` : message;
              })
              .join('; ');
          } else if (typeof data.error === 'string') {
            errMsg = data.error;
          } else {
            // Fallback: stringify the error object
            try {
              errMsg = JSON.stringify(data.error);
            } catch (e) {
              errMsg = String(data.error);
            }
          }
        }

        throw new Error(errMsg);
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <Card className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Memorial Submitted
          </h2>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            Thank you for honoring your loved one's memory. Your submission is pending review 
            and will be published once approved by an administrator.
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              variant="secondary"
              onClick={() => {
                setSuccess(false);
                setFormData({
                  name: '',
                  birthDate: '',
                  deathDate: '',
                  story: '',
                  photos: [],
                  tags: '',
                  privacy: 'PUBLIC',
                  submitterName: '',
                  submitterEmail: '',
                  submitterRelationship: '',
                });
              }}
            >
              Submit Another
            </Button>
            <Button 
              onClick={() => router.push(`/tenants/${tenantId}/memorials`)}
            >
              View Memorials
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        onClick={() => router.push(`/tenants/${tenantId}/memorials`)}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Memorials
      </Button>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-purple-100 rounded-full">
            <Flower2 className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Submit a Memorial
        </h1>
        <p className="text-slate-600">
          Honor the memory of a loved one by creating a lasting tribute.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Form */}
      <Card title="Memorial Details" description="Submissions are reviewed before being published. We'll notify you once approved.">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-slate-700">Name of Deceased *</label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Full name"
              required
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="birthDate" className="block text-sm font-medium text-slate-700">Date of Birth</label>
              <Input
                id="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="deathDate" className="block text-sm font-medium text-slate-700">Date of Passing</label>
              <Input
                id="deathDate"
                type="date"
                value={formData.deathDate}
                onChange={(e) => setFormData(prev => ({ ...prev, deathDate: e.target.value }))}
              />
            </div>
          </div>

          {/* Story */}
          <div className="space-y-2">
            <label htmlFor="story" className="block text-sm font-medium text-slate-700">Life Story / Obituary</label>
            <textarea
              id="story"
              value={formData.story}
              onChange={(e) => setFormData(prev => ({ ...prev, story: e.target.value }))}
              placeholder="Share memories, achievements, and the impact they had on others..."
              rows={6}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[color:var(--primary)] focus:border-transparent"
            />
            <p className="text-xs text-slate-500">
              {formData.story.length}/10,000 characters
            </p>
          </div>

          {/* Photos */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Photos (up to 10)</label>
            <div className="grid grid-cols-5 gap-2">
              {formData.photos.map((photo, index) => (
                <div key={index} className="relative aspect-square">
                  <img 
                    src={photo} 
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {formData.photos.length < 10 && (
                <label className="aspect-square border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 transition-colors">
                  <Upload className="h-6 w-6 text-slate-400" />
                  <span className="text-xs text-slate-400 mt-1">Add</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label htmlFor="tags" className="block text-sm font-medium text-slate-700">Tags</label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="e.g., Veteran, Teacher, Musician (comma-separated)"
            />
            <p className="text-xs text-slate-500">
              Add tags to help others find this memorial
            </p>
          </div>

          {/* Privacy */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Privacy Setting</label>
            <select 
              value={formData.privacy}
              onChange={(e) => setFormData(prev => ({ ...prev, privacy: e.target.value }))}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[color:var(--primary)] focus:border-transparent"
            >
              <option value="PUBLIC">Public - Visible to everyone</option>
              <option value="MEMBERS_ONLY">Members Only - Visible to signed-in members</option>
              <option value="PRIVATE">Private - Visible only to you and administrators</option>
            </select>
          </div>

          <hr className="my-6" />

          {/* Submitter Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900">Your Information</h3>
            
            <div className="space-y-2">
              <label htmlFor="submitterName" className="block text-sm font-medium text-slate-700">Your Name *</label>
              <Input
                id="submitterName"
                value={formData.submitterName}
                onChange={(e) => setFormData(prev => ({ ...prev, submitterName: e.target.value }))}
                placeholder="Your full name"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="submitterEmail" className="block text-sm font-medium text-slate-700">Your Email *</label>
              <Input
                id="submitterEmail"
                type="email"
                value={formData.submitterEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, submitterEmail: e.target.value }))}
                placeholder="your@email.com"
                required
              />
              <p className="text-xs text-slate-500">
                We'll notify you when the memorial is approved
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="submitterRelationship" className="block text-sm font-medium text-slate-700">Your Relationship</label>
              <Input
                id="submitterRelationship"
                value={formData.submitterRelationship}
                onChange={(e) => setFormData(prev => ({ ...prev, submitterRelationship: e.target.value }))}
                placeholder="e.g., Family member, Friend, Colleague"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4 pt-4">
            <Button 
              type="button" 
              variant="secondary" 
              className="flex-1"
              onClick={() => router.push(`/tenants/${tenantId}/memorials`)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Flower2 className="h-4 w-4 mr-2" />
                  Submit Memorial
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
