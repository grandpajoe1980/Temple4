"use client"

import React from 'react';
import Link from 'next/link';
import useTranslation from '@/app/hooks/useTranslation';

interface TripsTabProps {
  tenant: any;
  currentUser: any;
  onRefresh: () => void;
}

const TripsTab: React.FC<TripsTabProps> = ({ tenant, currentUser, onRefresh }) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-900">{t('settings.trips.title')}</h3>
        <p className="mt-1 text-sm text-gray-500">{t('settings.trips.description')}</p>
      </div>

      <div className="rounded-lg border border-gray-200 p-6 text-center">
        <p className="text-gray-600 mb-4">{t('settings.trips.visitTripsPage')}</p>
        <Link
          href={`/tenants/${tenant.id}/trips`}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-[color:var(--primary-foreground)] tenant-active-strong hover:opacity-90"
        >
          {t('settings.trips.goToTrips')} →
        </Link>
      </div>
    </div>
  );
};

export default TripsTab;
