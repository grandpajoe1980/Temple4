"use client"

import React from 'react';
import type { EnrichedResourceItem, User, Tenant } from '@/types';
import { FileType, ResourceVisibility } from '@/types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import useTranslation from '@/app/hooks/useTranslation';

interface ResourceItemCardProps {
  resource: EnrichedResourceItem;
  currentUser: User;
  tenant: Tenant;
  permissions?: Record<string, boolean> | undefined;
  onUpdate: () => void;
}

const FileTypeIcon: React.FC<{ type: FileType }> = ({ type }) => {
  // FIX: Changed `JSX.Element` to `React.ReactElement` to resolve the "Cannot find namespace 'JSX'" error by using the explicit type from the imported React module.
  const iconMap: { [key in FileType]: React.ReactElement } = {
    [FileType.PDF]: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 11-2 0V4H6a1 1 0 11-2 0V4zm4.586 4.586a1 1 0 00-1.414 0L6 9.757V14a1 1 0 001 1h6a1 1 0 001-1V9.757l-1.172-1.171a1 1 0 00-1.414 0L10 9.586 8.586 8.586z" clipRule="evenodd" />
      </svg>
    ),
    [FileType.DOCX]: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 11-2 0V4H6a1 1 0 11-2 0V4zm1 6a1 1 0 011-1h6a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H6z" clipRule="evenodd" />
      </svg>
    ),
    [FileType.MP3]: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" viewBox="0 0 20 20" fill="currentColor">
        <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V3z" />
      </svg>
    ),
    [FileType.JPG]: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
      </svg>
    ),
    [FileType.PNG]: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
      </svg>
    ),
    [FileType.OTHER]: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
      </svg>
    ),
  };
  return iconMap[type] || iconMap[FileType.OTHER];
};

const ResourceItemCard: React.FC<ResourceItemCardProps> = ({ resource, currentUser, tenant, permissions, onUpdate }) => {
  const { t, lang } = useTranslation();
  const localeCode = lang === 'vi' ? 'vi-VN' : lang === 'es' ? 'es-ES' : 'en-US';
  const canManage = Boolean(permissions?.canManageResources ?? false);

  const handleDelete = async () => {
    if (!window.confirm(t('resources.confirmDelete'))) return;
    try {
      const res = await fetch(`/api/tenants/${tenant.id}/resources/${resource.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || 'Failed to delete resource');
      }
      onUpdate();
    } catch (error) {
      console.error('Failed to delete resource:', error);
      alert(t('resources.deleteFailed'));
    }
  };

  const iconBgColor = resource.visibility === ResourceVisibility.MEMBERS_ONLY ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600';

  return (
    <Card className="!p-0 flex flex-col h-full">
      <div className="p-6 flex-grow flex flex-col">
        <div className="flex items-start space-x-4">
          <div className={`w-12 h-12 flex-shrink-0 rounded-lg p-2 ${iconBgColor}`}>
            <FileTypeIcon type={resource.fileType} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{resource.title}</h3>
            {resource.visibility === ResourceVisibility.MEMBERS_ONLY && (
              <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800 mt-1">
                {t('resources.membersOnly')}
              </span>
            )}
          </div>
        </div>
        <p className="mt-4 text-sm text-gray-600 flex-grow line-clamp-3">{resource.description}</p>
      </div>
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{resource.uploaderDisplayName}</span>
          <span>{new Date(resource.createdAt).toLocaleDateString(localeCode)}</span>
        </div>
        <div className="mt-3 flex items-center space-x-2">
          <a href={resource.fileUrl} download className="w-full">
            <Button className="w-full">{t('resources.download')}</Button>
          </a>
          {canManage && (
            <Button variant="danger" size="sm" onClick={handleDelete} className="!p-2.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
              </svg>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ResourceItemCard;
