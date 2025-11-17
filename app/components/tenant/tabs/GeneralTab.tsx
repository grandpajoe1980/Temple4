import React from 'react';
import type { Tenant } from '@/types';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import ToggleSwitch from '../../ui/ToggleSwitch';

interface GeneralTabProps {
  tenant: Tenant;
  onUpdate: (tenant: Tenant) => void;
}

const GeneralTab: React.FC<GeneralTabProps> = ({ tenant, onUpdate }) => {
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onUpdate({ ...tenant, [name]: value });
  };
  
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onUpdate({
        ...tenant,
        address: { ...tenant.address, [name]: value },
    });
  };

  const handleToggle = (isPublic: boolean) => {
    onUpdate({
        ...tenant,
        settings: { ...tenant.settings, isPublic }
    });
  };

  return (
    <div className="space-y-8">
        <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">Basic Information</h3>
            <p className="mt-1 text-sm text-gray-500">Update your community's public details.</p>
        </div>
        <div className="space-y-6">
            <Input label="Temple Name" id="name" name="name" value={tenant.name} onChange={handleInputChange} />
            <Input label="Creed / Religion" id="creed" name="creed" value={tenant.creed} onChange={handleInputChange} />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Contact Email" id="contactEmail" name="contactEmail" type="email" value={tenant.contactEmail || ''} onChange={handleInputChange} />
                <Input label="Phone Number" id="phoneNumber" name="phoneNumber" type="tel" value={tenant.phoneNumber || ''} onChange={handleInputChange} />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                id="description" name="description" rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-white text-gray-900"
                value={tenant.description} onChange={handleInputChange}
              />
            </div>
        </div>

        <div className="border-t border-gray-200 pt-8">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Location</h3>
            <p className="mt-1 text-sm text-gray-500">Where your community is located.</p>
        </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input containerClassName="md:col-span-2" label="Street Address" id="street" name="street" value={tenant.address.street || ''} onChange={handleAddressChange} />
            <Input label="City" id="city" name="city" value={tenant.address.city} onChange={handleAddressChange} />
            <Input label="State / Province" id="state" name="state" value={tenant.address.state} onChange={handleAddressChange} />
            <Input label="Country" id="country" name="country" value={tenant.address.country} onChange={handleAddressChange} />
            <Input label="Postal Code" id="postalCode" name="postalCode" value={tenant.address.postalCode} onChange={handleAddressChange} />
        </div>
        
        <div className="border-t border-gray-200 pt-8">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Visibility</h3>
        </div>
        <ToggleSwitch
            label="Public Tenant"
            description="Allow this temple to be discovered in public search results."
            enabled={tenant.settings.isPublic}
            onChange={handleToggle}
        />
        
        <div className="text-right border-t border-gray-200 pt-6">
            <Button onClick={() => alert('Settings saved (mock)!')}>Save Changes</Button>
        </div>
    </div>
  );
};

export default GeneralTab;