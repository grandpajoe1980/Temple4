"use client"

import { useEffect, useMemo, useState } from 'react';
import type { ServiceCategory, ServiceOffering, Tenant } from '@/types';
import {
  createServiceOffering,
  deleteServiceOffering,
  getServiceOfferingsForTenant,
  updateServiceOffering,
} from '@/lib/data';
import Button from '../../ui/Button';
import Card from '../../ui/Card';
import Modal from '../../ui/Modal';
import { SERVICE_CATEGORY_OPTIONS } from '@/constants';
import ServiceOfferingForm from '../forms/ServiceOfferingForm';

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
    name: 'Sunday Service',
    description: 'Weekly worship service with teaching, music, and fellowship.',
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
    name: 'Funerals & Memorials',
    description: 'Supportive services to honor loved ones with care and dignity.',
    category: 'CEREMONY',
    requiresBooking: true,
  },
  {
    name: 'Baptisms',
    description: 'Preparation and scheduling for baptisms across all age groups.',
    category: 'CEREMONY',
  },
  {
    name: 'Pastoral Counseling',
    description: 'Confidential pastoral care sessions for individuals and families.',
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
  const [services, setServices] = useState<ServiceOffering[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingService, setEditingService] = useState<ServiceOffering | null>(null);

  useEffect(() => {
    const loadServices = async () => {
      setIsLoading(true);
      try {
        const data = await getServiceOfferingsForTenant(tenant.id, { includePrivate: true });
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
    const data = await getServiceOfferingsForTenant(tenant.id, { includePrivate: true });
    setServices((data as any) ?? []);
    onRefresh();
  };

  const handleCreate = async (payload: Partial<ServiceOffering>) => {
    await createServiceOffering(tenant.id, payload as any);
    setIsModalOpen(false);
    await handleRefresh();
  };

  const handleUpdate = async (payload: Partial<ServiceOffering>) => {
    if (!editingService) return;
    await updateServiceOffering(tenant.id, editingService.id, payload as any);
    setEditingService(null);
    setIsModalOpen(false);
    await handleRefresh();
  };

  const handleDelete = async (serviceId: string) => {
    const confirmed = window.confirm('Are you sure you want to remove this service?');
    if (!confirmed) return;
    await deleteServiceOffering(tenant.id, serviceId);
    await handleRefresh();
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
          <h3 className="text-lg font-medium leading-6 text-gray-900">Service Catalog</h3>
          <p className="mt-1 text-sm text-gray-500">Define the ceremonies, sacraments, and care services offered by your community.</p>
        </div>
        <Button onClick={() => openCreateModal()}>+ Add Service</Button>
      </div>

      <Card>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            {defaultServiceTemplates.map((template) => (
              <button
                key={template.name}
                type="button"
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-amber-300 hover:text-amber-700"
                onClick={() => openCreateModal(template)}
                title="Quick add with prefilled details"
              >
                Add {template.name}
              </button>
            ))}
          </div>

          {isLoading ? (
            <p className="text-sm text-gray-500">Loading services…</p>
          ) : sortedServices.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-gray-200 p-6 text-center">
              <p className="text-sm font-medium text-gray-900">No services created yet.</p>
              <p className="text-sm text-gray-500">Use a template above or add a custom service to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedServices.map((service) => (
                <div key={service.id} className="flex items-start justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <span>{SERVICE_CATEGORY_OPTIONS.find((opt) => opt.value === service.category)?.label ?? service.category}</span>
                      {!service.isPublic && (
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-medium text-gray-700">Members Only</span>
                      )}
                      {service.requiresBooking && (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-medium text-amber-800">Booking Required</span>
                      )}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-gray-900">{service.name}</p>
                      <p className="text-sm text-gray-600">{service.description}</p>
                    </div>
                    <div className="text-sm text-gray-700">
                      {service.pricing ? <span className="font-medium">Cost:</span> : <span className="text-gray-500">No cost listed</span>}{' '}
                      {service.pricing && <span>{service.pricing}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={() => { setEditingService(service); setIsModalOpen(true); }}>
                      Edit
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(service.id)}>
                      Delete
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
        title={editingService && editingService.id ? 'Edit Service' : 'Add Service'}
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
