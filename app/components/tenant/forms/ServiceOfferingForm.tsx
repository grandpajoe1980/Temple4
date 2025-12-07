"use client"

import { useEffect, useMemo, useState } from 'react';
import type { ServiceCategory, ServiceOffering } from '@/types';
import { SERVICE_CATEGORY_OPTIONS } from '@/constants';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import ToggleSwitch from '../../ui/ToggleSwitch';

interface ServiceOfferingFormProps {
  initialValues?: Partial<ServiceOffering>;
  onSubmit: (data: Partial<ServiceOffering>) => void | Promise<void>;
  onCancel: () => void;
}

export default function ServiceOfferingForm({ initialValues, onSubmit, onCancel }: ServiceOfferingFormProps) {
  const [name, setName] = useState(initialValues?.name ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [category, setCategory] = useState<ServiceCategory>(initialValues?.category ?? 'CEREMONY');
  const [isPublic, setIsPublic] = useState(initialValues?.isPublic ?? true);
  const [requiresBooking, setRequiresBooking] = useState(initialValues?.requiresBooking ?? false);
  const [hasCost, setHasCost] = useState(!!initialValues?.pricing);
  const [pricing, setPricing] = useState(initialValues?.pricing ?? '');
  const [contactEmailOverride, setContactEmailOverride] = useState(initialValues?.contactEmailOverride ?? '');
  const [imageUrl, setImageUrl] = useState(initialValues?.imageUrl ?? '');
  const [order, setOrder] = useState(initialValues?.order ?? 0);

  useEffect(() => {
    if (initialValues) {
      setName(initialValues.name ?? '');
      setDescription(initialValues.description ?? '');
      setCategory(initialValues.category ?? 'CEREMONY');
      setIsPublic(initialValues.isPublic ?? true);
      setRequiresBooking(initialValues.requiresBooking ?? false);
      setHasCost(!!initialValues.pricing);
      setPricing(initialValues.pricing ?? '');
      setContactEmailOverride(initialValues.contactEmailOverride ?? '');
      setImageUrl(initialValues.imageUrl ?? '');
      setOrder(initialValues.order ?? 0);
    }
  }, [initialValues]);

  const categoryOptions = useMemo(() => SERVICE_CATEGORY_OPTIONS, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !description.trim()) {
      alert('Name and description are required.');
      return;
    }

    await onSubmit({
      name: name.trim(),
      description: description.trim(),
      category,
      isPublic,
      requiresBooking,
      contactEmailOverride: contactEmailOverride || null,
      pricing: hasCost ? pricing.trim() || null : null,
      imageUrl: imageUrl || null,
      order,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Service Name"
          id="service-name"
          name="service-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            id="category"
            name="category"
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-[color:var(--primary)]"
            value={category}
            onChange={(e) => setCategory(e.target.value as ServiceCategory)}
          >
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-[color:var(--primary)]"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Display Order"
          id="order"
          name="order"
          type="number"
          min={0}
          value={order}
          onChange={(e) => {
            const next = parseInt(e.target.value, 10);
            setOrder(Number.isNaN(next) ? 0 : next);
          }}
        />
        <Input
          label="Contact Email (optional)"
          id="contactEmailOverride"
          name="contactEmailOverride"
          type="email"
          value={contactEmailOverride ?? ''}
          onChange={(e) => setContactEmailOverride(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Image URL (optional)"
          id="imageUrl"
          name="imageUrl"
          value={imageUrl ?? ''}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://…"
        />
        <ToggleSwitch
          label="Requires Booking"
          description="Show that a coordinator will help schedule next steps."
          enabled={requiresBooking}
          onChange={setRequiresBooking}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ToggleSwitch
          label="Visible to Visitors"
          description="Turn off to make this service members-only."
          enabled={isPublic}
          onChange={setIsPublic}
        />
        <ToggleSwitch
          label="Include Cost"
          description="Show pricing or suggested contributions on the service card."
          enabled={hasCost}
          onChange={setHasCost}
        />
      </div>

      {hasCost && (
        <Input
          label="Cost or Suggested Contribution"
          id="pricing"
          name="pricing"
          value={pricing}
          onChange={(e) => setPricing(e.target.value)}
          placeholder="$150 honorarium"
        />
      )}

      <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Service</Button>
      </div>
    </form>
  );
}
