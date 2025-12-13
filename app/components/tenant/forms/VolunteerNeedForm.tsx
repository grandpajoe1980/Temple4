"use client"

import React, { useState } from 'react';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import useTranslation from '@/app/hooks/useTranslation';

interface VolunteerNeedFormProps {
  onSubmit: (data: { title: string; description: string; date: Date; slotsNeeded: number; location?: string }) => void;
  onCancel: () => void;
}

const VolunteerNeedForm: React.FC<VolunteerNeedFormProps> = ({ onSubmit, onCancel }) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [slotsNeeded, setSlotsNeeded] = useState(1);
  const [location, setLocation] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || slotsNeeded < 1) {
      alert(t('forms.requiredFields'));
      return;
    }
    onSubmit({
      title,
      description,
      date: new Date(date),
      slotsNeeded,
      location,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label={t('forms.volunteer.opportunityTitle')}
        id="title"
        name="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          {t('common.description')}
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[color:var(--primary)] focus:border-[color:var(--primary)] sm:text-sm bg-white text-gray-900"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <Input
        label={t('forms.volunteer.location')}
        id="location"
        name="location"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        required={false}
      />

      <div className="grid grid-cols-2 gap-6">
        <Input
          label={t('forms.volunteer.date')}
          id="date"
          name="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
        <Input
          label={t('forms.volunteer.slotsNeeded')}
          id="slotsNeeded"
          name="slotsNeeded"
          type="number"
          min="1"
          value={slotsNeeded}
          onChange={(e) => setSlotsNeeded(parseInt(e.target.value, 10))}
          required
        />
      </div>
      <div className="flex justify-end items-center space-x-4 pt-4 border-t border-gray-200">
        <Button type="button" variant="secondary" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="submit">
          {t('forms.volunteer.createNeed')}
        </Button>
      </div>
    </form>
  );
};

export default VolunteerNeedForm;
