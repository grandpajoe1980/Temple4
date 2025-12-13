"use client"

import { useEffect, useMemo, useState } from 'react';
import type { ServiceCategory, ServiceOffering, Tenant } from '@/types';
import Button from '../../ui/Button';
import Card from '../../ui/Card';
import Modal from '../../ui/Modal';
import { SERVICE_CATEGORY_OPTIONS } from '@/constants';
import ServiceOfferingForm from '../forms/ServiceOfferingForm';
import useTranslation from '@/app/hooks/useTranslation';

interface ServicesTabProps {
  tenant: Tenant;
  onRefresh: () => void;
}

const defaultServiceTemplates: Array<{
  name: string;
  description: string;
  category: ServiceCategory;
  pricing?: string;
  requiresBooking?: boolean;
}> = [
    {
      name: 'Community Meeting',
      description: 'Regular community gathering with presentations and discussions.',
      category: 'CEREMONY',
    },
    {
      name: 'Weddings',
      description: 'Ceremony planning, officiant coordination, and counseling for couples.',
      category: 'CEREMONY',
      requiresBooking: true,
      pricing: 'Suggested honorarium',
    },
    {
      name: 'Memorials',
      description: 'Supportive services to honor loved ones with care and dignity.',
      category: 'CEREMONY',
      requiresBooking: true,
    },
    {
      name: 'Counseling',
      description: 'Confidential care sessions for individuals and families.',
      category: 'COUNSELING',
      requiresBooking: true,
    },
    {
      name: 'Facility Reservations',
      description: 'Request to reserve rooms, halls, or outdoor spaces for gatherings.',
      category: 'FACILITY',
      requiresBooking: true,
      pricing: 'Varies by space',
    },
  ];

export default function ServicesTab({ tenant, onRefresh }: ServicesTabProps) {
  const { t } = useTranslation();
  const [services, setServices] = useState<ServiceOffering[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingService, setEditingService] = useState<ServiceOffering | null>(null);

  useEffect(() => {
    const loadServices = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/tenants/${tenant.id}/services`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load services');
        const data = await res.json();
        setServices((data as any) ?? []);
      } catch (error) {
        console.error('Failed to load services', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadServices();
  }, [tenant.id]);

  const handleRefresh = async () => {
    try {
      const res = await fetch(`/api/tenants/${tenant.id}/services`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load services');
      const data = await res.json();
      setServices((data as any) ?? []);
    } catch (err) {
      console.error('Failed to load services', err);
    }
    onRefresh();
  };

  const handleCreate = async (payload: Partial<ServiceOffering>) => {
    try {
      const res = await fetch(`/api/tenants/${tenant.id}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to create service');
      setIsModalOpen(false);
      await handleRefresh();
    } catch (err) {
      console.error('Failed to create service', err);
      alert(t('settings.services.createFailed'));
    }
  };

  const handleUpdate = async (payload: Partial<ServiceOffering>) => {
    if (!editingService) return;
    try {
      const res = await fetch(`/api/tenants/${tenant.id}/services/${editingService.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to update service');
      setEditingService(null);
      setIsModalOpen(false);
      await handleRefresh();
    } catch (err) {
      console.error('Failed to update service', err);
      alert(t('settings.services.updateFailed'));
    }
  };

  const handleDelete = async (serviceId: string) => {
    const confirmed = window.confirm(t('settings.services.deleteConfirm'));
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/tenants/${tenant.id}/services/${serviceId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete service');
      await handleRefresh();
    } catch (err) {
      console.error('Failed to delete service', err);
      alert(t('settings.services.deleteFailed'));
    }
  };

  const openCreateModal = (template?: typeof defaultServiceTemplates[number]) => {
    if (template) {
      setEditingService({
        id: '',
        tenantId: tenant.id,
        name: template.name,
        description: template.description,
        category: template.category,
        isPublic: true,
        requiresBooking: template.requiresBooking ?? false,
        contactEmailOverride: null,
        pricing: template.pricing ?? null,
        imageUrl: null,
        order: services.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      setEditingService(null);
    }
    setIsModalOpen(true);
  };

  const sortedServices = useMemo(
    () => [...services].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name)),
    [services],
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900">{t('settings.services.title')}</h3>
          <p className="mt-1 text-sm text-gray-500">{t('settings.services.description')}</p>
        </div>
        <Button onClick={() => openCreateModal()}>{t('settings.services.addService')}</Button>
      </div>

      <Card>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            {defaultServiceTemplates.map((template) => (
              <button
                key={template.name}
                type="button"
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-[color:var(--primary)] hover:text-[color:var(--primary)]"
                onClick={() => openCreateModal(template)}
                title="Quick add with prefilled details"
              >
                Add {template.name}
              </button>
            ))}
          </div>

          {isLoading ? (
            <p className="text-sm text-gray-500">{t('common.loading')}</p>
          ) : sortedServices.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-gray-200 p-6 text-center">
              <p className="text-sm font-medium text-gray-900">{t('settings.services.noServices')}</p>
              <p className="text-sm text-gray-500">{t('settings.services.noServicesHint')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedServices.map((service) => (
                <div key={service.id} className="flex items-start justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <span>{SERVICE_CATEGORY_OPTIONS.find((opt) => opt.value === service.category)?.label ?? service.category}</span>
                      {!service.isPublic && (
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-medium text-gray-700">{t('settings.services.membersOnly')}</span>
                      )}
                      {service.requiresBooking && (
                        <span className="rounded-full tenant-bg-100 px-3 py-1 text-[11px] font-medium tenant-text-primary">{t('settings.services.bookingRequired')}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-gray-900">{service.name}</p>
                      <p className="text-sm text-gray-600">{service.description}</p>
                    </div>
                    <div className="text-sm text-gray-700">
                      {service.pricing ? <span className="font-medium">{t('settings.services.cost')}:</span> : <span className="text-gray-500">{t('settings.services.noCost')}</span>}{' '}
                      {service.pricing && <span>{service.pricing}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={() => { setEditingService(service); setIsModalOpen(true); }}>
                      {t('common.edit')}
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(service.id)}>
                      {t('common.delete')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingService(null); }}
        title={editingService && editingService.id ? t('settings.services.editService') : t('settings.services.addService')}
      >
        <ServiceOfferingForm
          initialValues={editingService ?? undefined}
          onSubmit={editingService && editingService.id ? handleUpdate : handleCreate}
          onCancel={() => { setIsModalOpen(false); setEditingService(null); }}
        />
      </Modal>
    </div>
  );
}
