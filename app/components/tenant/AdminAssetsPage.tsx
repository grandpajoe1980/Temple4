'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Button from '@/app/components/ui/Button';
import Card from '@/app/components/ui/Card';
import Input from '@/app/components/ui/Input';
import Modal from '@/app/components/ui/Modal';
import ToggleSwitch from '@/app/components/ui/ToggleSwitch';
import type { Asset, AssetStatus, AssetCategory, AssetCondition } from '@/types';

interface AdminAssetsPageProps {
  tenantId: string;
}

const STATUS_COLORS: Record<AssetStatus, string> = {
  AVAILABLE: 'bg-green-100 text-green-800',
  IN_USE: 'bg-blue-100 text-blue-800',
  MAINTENANCE: 'bg-yellow-100 text-yellow-800',
  RESERVED: 'bg-purple-100 text-purple-800',
  RETIRED: 'bg-gray-100 text-gray-600',
  DISPOSED: 'bg-red-100 text-red-800',
};

const CONDITION_COLORS: Record<AssetCondition, string> = {
  EXCELLENT: 'text-green-600',
  GOOD: 'text-blue-600',
  FAIR: 'text-yellow-600',
  POOR: 'text-orange-600',
  DAMAGED: 'text-red-600',
  UNKNOWN: 'text-gray-500',
};

const CATEGORY_LABELS: Record<AssetCategory, string> = {
  EQUIPMENT: 'Equipment',
  FURNITURE: 'Furniture',
  VEHICLE: 'Vehicle',
  BUILDING: 'Building',
  SUPPLIES: 'Supplies',
  INSTRUMENTS: 'Instruments',
  LITURGICAL: 'Liturgical',
  KITCHEN: 'Kitchen',
  GROUNDS: 'Grounds',
  OTHER: 'Other',
};

export default function AdminAssetsPage({ tenantId }: AdminAssetsPageProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [featureEnabled, setFeatureEnabled] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: '',
  });

  // Form state
  const [newAsset, setNewAsset] = useState({
    name: '',
    description: '',
    category: 'OTHER' as AssetCategory,
    serialNumber: '',
    barcode: '',
    model: '',
    manufacturer: '',
    condition: 'GOOD' as AssetCondition,
    location: '',
    purchasePrice: '',
  });

  const fetchAssets = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.category) params.set('category', filters.category);
      if (filters.status) params.set('status', filters.status);

      const res = await fetch(`/api/tenants/${tenantId}/assets?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAssets(data.assets || []);
        setFeatureEnabled(true);
      } else if (res.status === 403) {
        setFeatureEnabled(false);
      }
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    } finally {
      setLoading(false);
    }
  }, [tenantId, filters]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleAddAsset = async () => {
    try {
      const res = await fetch(`/api/tenants/${tenantId}/assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newAsset,
          purchasePrice: newAsset.purchasePrice ? parseFloat(newAsset.purchasePrice) : undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAssets(prev => [data.asset, ...prev]);
        setAddModalOpen(false);
        setNewAsset({
          name: '',
          description: '',
          category: 'OTHER',
          serialNumber: '',
          barcode: '',
          model: '',
          manufacturer: '',
          condition: 'GOOD',
          location: '',
          purchasePrice: '',
        });
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to add asset');
      }
    } catch (error) {
      console.error('Failed to add asset:', error);
      alert('Failed to add asset');
    }
  };

  const handleCheckout = async (assetId: string, action: 'checkout' | 'checkin') => {
    try {
      const res = await fetch(`/api/tenants/${tenantId}/assets/${assetId}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        fetchAssets();
        setDetailModalOpen(false);
      } else {
        const error = await res.json();
        alert(error.error || 'Operation failed');
      }
    } catch (error) {
      console.error('Checkout/checkin failed:', error);
      alert('Operation failed');
    }
  };

  const handleDelete = async (assetId: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;

    try {
      const res = await fetch(`/api/tenants/${tenantId}/assets/${assetId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setAssets(prev => prev.filter(a => a.id !== assetId));
        setDetailModalOpen(false);
      } else {
        alert('Failed to delete asset');
      }
    } catch (error) {
      console.error('Failed to delete asset:', error);
      alert('Failed to delete asset');
    }
  };

  const openDetail = async (asset: Asset) => {
    try {
      const res = await fetch(`/api/tenants/${tenantId}/assets/${asset.id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedAsset(data.asset);
        setDetailModalOpen(true);
      }
    } catch (error) {
      console.error('Failed to fetch asset details:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="h-32 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!featureEnabled) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Asset Management</h2>
          <p className="text-slate-600 mb-6">
            Asset management is not enabled for your community.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Asset Management</h1>
          <p className="text-slate-600">Track and manage community assets</p>
        </div>
        <Button onClick={() => setAddModalOpen(true)}>
          Add Asset
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search assets..."
              value={filters.search}
              onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
            />
          </div>
          <select
            className="px-3 py-2 border border-slate-300 rounded-md"
            value={filters.category}
            onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))}
          >
            <option value="">All Categories</option>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select
            className="px-3 py-2 border border-slate-300 rounded-md"
            value={filters.status}
            onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
          >
            <option value="">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="IN_USE">In Use</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="RESERVED">Reserved</option>
            <option value="RETIRED">Retired</option>
          </select>
        </div>
      </Card>

      {/* Asset List */}
      {assets.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-slate-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">No assets found</h3>
          <p className="text-slate-600 mb-4">Add your first asset to get started.</p>
          <Button onClick={() => setAddModalOpen(true)}>Add Asset</Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => (
            <div key={asset.id} className="cursor-pointer hover:shadow-md transition-shadow rounded-xl" onClick={() => openDetail(asset)}>
              <Card className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">{asset.name}</h3>
                    <p className="text-sm text-slate-500">{CATEGORY_LABELS[asset.category]}</p>
                  </div>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[asset.status]}`}>
                    {asset.status.replace('_', ' ')}
                  </span>
                </div>
                {asset.location && (
                  <p className="text-sm text-slate-600 mt-2">📍 {asset.location}</p>
                )}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-sm">
                  <span className={CONDITION_COLORS[asset.condition]}>{asset.condition}</span>
                  {asset.barcode && <span className="text-slate-400 font-mono text-xs">{asset.barcode}</span>}
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Add Asset Modal */}
      <Modal isOpen={addModalOpen} title="Add New Asset" onClose={() => setAddModalOpen(false)}>
        <div className="space-y-4">
          <Input
            label="Asset Name *"
            placeholder="e.g., Projector, Folding Chair, Van"
            value={newAsset.name}
            onChange={(e) => setNewAsset(prev => ({ ...prev, name: e.target.value }))}
          />
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
              value={newAsset.category}
              onChange={(e) => setNewAsset(prev => ({ ...prev, category: e.target.value as AssetCategory }))}
            >
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Serial Number"
              placeholder="Optional"
              value={newAsset.serialNumber}
              onChange={(e) => setNewAsset(prev => ({ ...prev, serialNumber: e.target.value }))}
            />
            <Input
              label="Barcode"
              placeholder="Optional"
              value={newAsset.barcode}
              onChange={(e) => setNewAsset(prev => ({ ...prev, barcode: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Manufacturer"
              placeholder="Optional"
              value={newAsset.manufacturer}
              onChange={(e) => setNewAsset(prev => ({ ...prev, manufacturer: e.target.value }))}
            />
            <Input
              label="Model"
              placeholder="Optional"
              value={newAsset.model}
              onChange={(e) => setNewAsset(prev => ({ ...prev, model: e.target.value }))}
            />
          </div>

          <Input
            label="Location"
            placeholder="Building, room, or area"
            value={newAsset.location}
            onChange={(e) => setNewAsset(prev => ({ ...prev, location: e.target.value }))}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Condition</label>
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                value={newAsset.condition}
                onChange={(e) => setNewAsset(prev => ({ ...prev, condition: e.target.value as AssetCondition }))}
              >
                <option value="EXCELLENT">Excellent</option>
                <option value="GOOD">Good</option>
                <option value="FAIR">Fair</option>
                <option value="POOR">Poor</option>
              </select>
            </div>
            <Input
              label="Purchase Price"
              type="number"
              placeholder="0.00"
              value={newAsset.purchasePrice}
              onChange={(e) => setNewAsset(prev => ({ ...prev, purchasePrice: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
              rows={3}
              placeholder="Optional description..."
              value={newAsset.description}
              onChange={(e) => setNewAsset(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-6 pt-4 border-t">
          <Button variant="secondary" onClick={() => setAddModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddAsset} disabled={!newAsset.name}>
            Add Asset
          </Button>
        </div>
      </Modal>

      {/* Asset Detail Modal */}
      <Modal isOpen={detailModalOpen && !!selectedAsset} title={selectedAsset?.name || 'Asset Details'} onClose={() => setDetailModalOpen(false)}>
        {selectedAsset && (
          <>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${STATUS_COLORS[selectedAsset.status]}`}>
                  {selectedAsset.status.replace('_', ' ')}
                </span>
                <span className={`text-sm font-medium ${CONDITION_COLORS[selectedAsset.condition]}`}>
                  Condition: {selectedAsset.condition}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Category:</span>
                  <p className="font-medium">{CATEGORY_LABELS[selectedAsset.category]}</p>
                </div>
                {selectedAsset.location && (
                  <div>
                    <span className="text-slate-500">Location:</span>
                    <p className="font-medium">{selectedAsset.location}</p>
                  </div>
                )}
                {selectedAsset.serialNumber && (
                  <div>
                    <span className="text-slate-500">Serial:</span>
                    <p className="font-medium font-mono">{selectedAsset.serialNumber}</p>
                  </div>
                )}
                {selectedAsset.barcode && (
                  <div>
                    <span className="text-slate-500">Barcode:</span>
                    <p className="font-medium font-mono">{selectedAsset.barcode}</p>
                  </div>
                )}
              </div>

              {selectedAsset.description && (
                <div>
                  <span className="text-slate-500 text-sm">Description:</span>
                  <p className="text-slate-700">{selectedAsset.description}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-between mt-6 pt-4 border-t">
              <Button variant="danger" onClick={() => handleDelete(selectedAsset.id)}>
                Delete
              </Button>
              <div className="flex gap-2">
                {selectedAsset.status === 'AVAILABLE' && (
                  <Button onClick={() => handleCheckout(selectedAsset.id, 'checkout')}>
                    Check Out
                  </Button>
                )}
                {selectedAsset.status === 'IN_USE' && (
                  <Button onClick={() => handleCheckout(selectedAsset.id, 'checkin')}>
                    Check In
                  </Button>
                )}
                <Button variant="secondary" onClick={() => setDetailModalOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
