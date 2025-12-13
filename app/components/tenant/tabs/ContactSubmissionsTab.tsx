"use client"

import React, { useState, useEffect, useMemo } from 'react';
import type { Tenant, User, ContactSubmission } from '@/types';
import { ContactSubmissionStatus } from '@/types';
// Use tenant admin API endpoints instead of server helpers
import Button from '../../ui/Button';
import RespondSubmissionModal from '../forms/RespondSubmissionModal';
import useTranslation from '@/app/hooks/useTranslation';

interface ContactSubmissionsTabProps {
  tenant: Tenant;
  currentUser: User;
  onRefresh: () => void;
}

const ContactSubmissionsTab: React.FC<ContactSubmissionsTabProps> = ({ tenant, currentUser, onRefresh }) => {
  const { t } = useTranslation();
  const [allSubmissions, setAllSubmissions] = useState<ContactSubmission[]>([]);
  const [statusFilter, setStatusFilter] = useState<ContactSubmissionStatus | 'ALL'>('ALL');
  const [respondingTo, setRespondingTo] = useState<ContactSubmission | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSubmissions = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/tenants/${tenant.id}/admin/contact-submissions`);
        if (!res.ok) throw new Error('Failed to load submissions');
        const submissions = await res.json();
        // Normalize dates
        const normalized = submissions.map((s: any) => ({ ...s, createdAt: new Date(s.createdAt) }));
        setAllSubmissions(normalized as ContactSubmission[]);
      } catch (error) {
        console.error('Failed to load contact submissions:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSubmissions();
  }, [tenant.id, onRefresh]);

  const handleStatusChange = async (submissionId: string, newStatus: ContactSubmissionStatus) => {
    try {
      const res = await fetch(`/api/tenants/${tenant.id}/admin/contact-submissions/${submissionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      onRefresh();
    } catch (err) {
      console.error(err);
      alert(t('settings.contactSubmissions.updateFailed'));
    }
  };

  const handleRespond = async (responseText: string) => {
    if (!respondingTo) return;
    try {
      const res = await fetch(`/api/tenants/${tenant.id}/admin/contact-submissions/${respondingTo.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: responseText }),
      });
      if (!res.ok) throw new Error('Failed to send response');
      setRespondingTo(null);
      onRefresh();
      alert(t('settings.contactSubmissions.responseSent'));
    } catch (err) {
      console.error(err);
      alert(t('settings.contactSubmissions.responseFailed'));
    }
  };

  const filteredSubmissions = useMemo(() => {
    if (statusFilter === 'ALL') {
      return allSubmissions;
    }
    return allSubmissions.filter(s => s.status === statusFilter);
  }, [allSubmissions, statusFilter]);

  const statusFilters: (ContactSubmissionStatus | 'ALL')[] = ['ALL', ContactSubmissionStatus.UNREAD, ContactSubmissionStatus.READ, ContactSubmissionStatus.ARCHIVED];

  const statusColors: { [key in ContactSubmissionStatus]: string } = {
    [ContactSubmissionStatus.UNREAD]: 'bg-red-100 text-red-800',
    [ContactSubmissionStatus.READ]: 'bg-blue-100 text-blue-800',
    [ContactSubmissionStatus.ARCHIVED]: 'bg-gray-100 text-gray-800',
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900">{t('settings.contactSubmissions.title')}</h3>
          <p className="mt-1 text-sm text-gray-500">{t('settings.contactSubmissions.description')}</p>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-500">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-900">{t('settings.contactSubmissions.title')}</h3>
        <p className="mt-1 text-sm text-gray-500">{t('settings.contactSubmissions.description')}</p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          {statusFilters.map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`${statusFilter === status
                  ? 'border-[color:var(--primary)] tenant-text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
            >
              {status.toLowerCase()}
            </button>
          ))}
        </nav>
      </div>

      <div className="flow-root">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">{t('settings.contactSubmissions.from')}</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{t('contact.message')}</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{t('settings.smallGroups.status')}</th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0"><span className="sr-only">{t('common.actions')}</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredSubmissions.map(submission => (
                  <tr key={submission.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-0">
                      <div className="font-medium text-gray-900">{submission.name}</div>
                      <div className="text-gray-500">{submission.email}</div>
                      <div className="text-xs text-gray-400 mt-1">{submission.createdAt.toLocaleString()}</div>
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-500">
                      <p className="line-clamp-3">{submission.message}</p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[submission.status]}`}>
                        {submission.status.toLowerCase()}
                      </span>
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0 space-x-2">
                      <Button size="sm" onClick={() => setRespondingTo(submission)}>{t('settings.contactSubmissions.respond')}</Button>
                      {submission.status === ContactSubmissionStatus.UNREAD && (
                        <Button size="sm" variant="secondary" onClick={() => handleStatusChange(submission.id, ContactSubmissionStatus.READ)}>{t('settings.contactSubmissions.markRead')}</Button>
                      )}
                      {submission.status !== ContactSubmissionStatus.ARCHIVED && (
                        <Button size="sm" variant="secondary" onClick={() => handleStatusChange(submission.id, ContactSubmissionStatus.ARCHIVED)}>{t('settings.contactSubmissions.archive')}</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredSubmissions.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                {t('settings.contactSubmissions.noSubmissions')}
              </div>
            )}
          </div>
        </div>
      </div>

      {respondingTo && (
        <RespondSubmissionModal
          isOpen={!!respondingTo}
          onClose={() => setRespondingTo(null)}
          onSubmit={handleRespond}
          submission={respondingTo}
        />
      )}
    </div>
  );
};

export default ContactSubmissionsTab;
