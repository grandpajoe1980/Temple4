"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Tenant } from '@prisma/client';

// This type represents the data we collect from the form.
export type CreateTenantData = Pick<Tenant, 'name' | 'creed' | 'description' | 'street' | 'city' | 'state' | 'country' | 'postalCode'>;

const CreateTenantForm: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<Partial<CreateTenantData>>({
    name: '',
    creed: '',
    description: '',
    street: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.creed) {
      setError('Please fill in at least the Name and Creed.');
      return;
    }
    setIsLoading(true);
    setError(null);

    // Generate a basic slug from the name
    const slug = formData.name!.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    try {
      const response = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, slug }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Handle slug conflict specifically
        if (response.status === 409) {
             setError(`The name "${formData.name}" is already taken. Please choose another.`);
        } else {
            throw new Error(errorData.message || 'Failed to create tenant');
        }
        setIsLoading(false);
        return;
      }

      const newTenant = await response.json();
      router.push(`/tenants/${newTenant.id}`); // Redirect to the new tenant's page using ID
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.back(); // Go back to the previous page
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card title="Create Your Community" description="Start by providing some basic information about your community.">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <p className="text-red-500 bg-red-100 p-3 rounded-md">{error}</p>}
          
          <Input id="name" name="name" label="Community Name" value={formData.name} onChange={handleChange} required />
          <Input id="creed" name="creed" label="Creed / Religion" value={formData.creed} onChange={handleChange} required />
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-white text-gray-900"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input containerClassName="md:col-span-2" id="street" name="street" label="Street Address" value={formData.street} onChange={handleChange} />
            <Input id="city" name="city" label="City" value={formData.city} onChange={handleChange} />
            <Input id="state" name="state" label="State / Province" value={formData.state} onChange={handleChange} />
            <Input id="country" name="country" label="Country" value={formData.country} onChange={handleChange} />
            <Input id="postalCode" name="postalCode" label="Postal Code" value={formData.postalCode} onChange={handleChange} />
          </div>

          <div className="flex justify-end items-center space-x-4">
            <Button type="button" variant="secondary" onClick={handleCancel} disabled={isLoading}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>{isLoading ? 'Creating...' : 'Create Community'}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CreateTenantForm;
