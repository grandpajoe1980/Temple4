
import React, { useState } from 'react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import type { Tenant } from '../../types';

interface CreateTenantFormProps {
  onCreate: (tenantDetails: Omit<Tenant, 'id' | 'slug' | 'settings' | 'branding' | 'permissions'>) => void;
  onCancel: () => void;
}

const CreateTenantForm: React.FC<CreateTenantFormProps> = ({ onCreate, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    creed: '',
    description: '',
    // FIX: Added 'street' to state to match the Tenant address type.
    street: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.creed) {
      alert('Please fill in at least the Name and Creed.');
      return;
    }
    // FIX: Destructured 'street' from formData and included it in the address object.
    const { street, city, state, country, postalCode, ...rest } = formData;
    onCreate({
      ...rest,
      address: { street, city, state, country, postalCode },
    });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card title="Create Your Temple" description="Start by providing some basic information about your community.">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input id="name" name="name" label="Temple Name" value={formData.name} onChange={handleChange} required />
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
            {/* FIX: Added an input field for the street address. */}
            <Input containerClassName="md:col-span-2" id="street" name="street" label="Street Address" value={formData.street} onChange={handleChange} />
            <Input id="city" name="city" label="City" value={formData.city} onChange={handleChange} />
            <Input id="state" name="state" label="State / Province" value={formData.state} onChange={handleChange} />
            <Input id="country" name="country" label="Country" value={formData.country} onChange={handleChange} />
            <Input id="postalCode" name="postalCode" label="Postal Code" value={formData.postalCode} onChange={handleChange} />
          </div>

          <div className="flex justify-end items-center space-x-4">
            <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
            <Button type="submit">Create Temple</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CreateTenantForm;
