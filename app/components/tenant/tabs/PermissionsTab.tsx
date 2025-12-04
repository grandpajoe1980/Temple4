"use client"

import React, { useState, useEffect } from 'react';
import type { Tenant, RolePermissions, User } from '@/types';
import { TenantRoleType } from '@/types';
import Button from '../../ui/Button';
import { adminPermissions } from '@/constants';

interface PermissionsTabProps {
  tenant: Tenant;
  onUpdate: (tenant: Tenant) => void;
  currentUser: User;
}

const PermissionsTab: React.FC<PermissionsTabProps> = ({ tenant, onUpdate, currentUser }) => {
    const [localPermissions, setLocalPermissions] = useState(() => tenant.permissions ?? {});
  const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        setLocalPermissions(tenant.permissions ?? {});
        setHasChanges(false);
    }, [tenant.permissions]);

  const handlePermissionChange = (
    roleType: TenantRoleType,
    permission: keyof RolePermissions,
    value: boolean
  ) => {
        setLocalPermissions(prev => {
            const base = prev ?? {};
            const newPerms = JSON.parse(JSON.stringify(base)); // Deep copy
            if (!newPerms[roleType]) {
                newPerms[roleType] = {};
            }
            newPerms[roleType][permission] = value;
            return newPerms;
        });
    setHasChanges(true);
  };
  
    const handleSaveChanges = async () => {
        try {
            const res = await fetch(`/api/tenants/${tenant.id}/admin/settings`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ permissions: localPermissions }),
            });
            if (!res.ok) throw new Error('Failed to save permissions');
            const updated = await res.json();
            onUpdate({ ...tenant, permissions: localPermissions });
            setHasChanges(false);
            alert('Permissions saved successfully!');
        } catch (err: any) {
            console.error('Error saving permissions', err);
            alert(err?.message || 'Failed to save permissions');
        }
    };

  const formatLabel = (key: string) => {
    return key.replace('can', '').replace(/([A-Z])/g, ' $1').trim();
  };

  const editableRoleTypes = [TenantRoleType.MEMBER, TenantRoleType.STAFF, TenantRoleType.MODERATOR];
  const permissionKeys = Object.keys(adminPermissions) as Array<keyof RolePermissions>;

  return (
    <div className="space-y-8">
        <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">Role Permissions</h3>
            <p className="mt-1 text-sm text-gray-500">Define what different roles can do within your community.</p>
        </div>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Permission
                        </th>
                        {editableRoleTypes.map(roleType => (
                            <th key={roleType} scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {roleType}
                            </th>
                        ))}
                         <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ADMIN
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {permissionKeys.map(permission => (
                        <tr key={permission}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {formatLabel(permission)}
                            </td>
                            {editableRoleTypes.map(roleType => (
                                <td key={`${roleType}-${permission}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                                        checked={localPermissions?.[roleType]?.[permission] || false}
                                        onChange={(e) => handlePermissionChange(roleType, permission, e.target.checked)}
                                    />
                                </td>
                            ))}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                                    checked={true}
                                    disabled={true}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        <div className="text-right border-t border-gray-200 pt-6">
            <Button onClick={handleSaveChanges} disabled={!hasChanges}>
                Save Permissions
            </Button>
        </div>
    </div>
  );
};

export default PermissionsTab;