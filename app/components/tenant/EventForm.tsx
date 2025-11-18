"use client";

import React, { useState, useMemo } from 'react';
import type { Event } from '@/types';
import Input from '../ui/Input';
import Button from '../ui/Button';
import ToggleSwitch from '../ui/ToggleSwitch';
import Calendar from '../ui/Calendar';

interface EventFormProps {
  onSubmit: (eventData: Omit<Event, 'id' | 'tenantId' | 'createdByUserId'>) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const EventForm: React.FC<EventFormProps> = ({ onSubmit, onCancel, isSubmitting = false }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  now.setSeconds(0, 0);
  oneHourFromNow.setSeconds(0, 0);

  const [startDate, setStartDate] = useState(now);
  const [endDate, setEndDate] = useState(oneHourFromNow);
  
  const formatTime = (date: Date) => date.toTimeString().slice(0, 5);

  const [startTime, setStartTime] = useState(formatTime(now));
  const [endTime, setEndTime] = useState(formatTime(oneHourFromNow));

  const [locationText, setLocationText] = useState('');
  const [isOnline, setIsOnline] = useState(false);
  const [onlineUrl, setOnlineUrl] = useState('');
  
  const [activeDateSelection, setActiveDateSelection] = useState<'start' | 'end'>('start');

  const selectedDateForCalendar = useMemo(() => {
    return activeDateSelection === 'start' ? startDate : endDate;
  }, [activeDateSelection, startDate, endDate]);

  const handleDateSelect = (date: Date) => {
    if (activeDateSelection === 'start') {
      setStartDate(date);
      if (date.getTime() > endDate.getTime()) {
        setEndDate(date);
      }
    } else {
      setEndDate(date);
      if (date.getTime() < startDate.getTime()) {
        setStartDate(date);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      alert('Please fill in an event title.');
      return;
    }
    
    const combineDateTime = (date: Date, time: string): Date => {
        const newDate = new Date(date);
        const [hours, minutes] = time.split(':').map(Number);
        newDate.setHours(hours, minutes, 0, 0);
        return newDate;
    };

    const finalStartDate = combineDateTime(startDate, startTime);
    const finalEndDate = combineDateTime(endDate, endTime);

    if (finalEndDate.getTime() <= finalStartDate.getTime()) {
        alert('The event\'s end time must be after its start time.');
        return;
    }

    onSubmit({
      title,
      description,
      startDateTime: finalStartDate,
      endDateTime: finalEndDate,
      isOnline,
      onlineUrl,
      locationText,
    });
  };

  const formatDateForDisplay = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Event Title"
        id="title"
        name="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        disabled={isSubmitting}
      />

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-white text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isSubmitting}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          onClick={() => !isSubmitting && setActiveDateSelection('start')}
          className={`p-3 rounded-lg cursor-pointer border-2 transition-colors ${
            activeDateSelection === 'start' ? 'border-amber-500 bg-amber-50' : 'border-gray-200 bg-white hover:bg-gray-50'
          } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <p className="text-xs font-bold text-gray-500 uppercase">Start Date</p>
          <p className="font-semibold text-gray-800">{formatDateForDisplay(startDate)}</p>
        </div>
        <div
          onClick={() => !isSubmitting && setActiveDateSelection('end')}
          className={`p-3 rounded-lg cursor-pointer border-2 transition-colors ${
            activeDateSelection === 'end' ? 'border-amber-500 bg-amber-50' : 'border-gray-200 bg-white hover:bg-gray-50'
          } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <p className="text-xs font-bold text-gray-500 uppercase">End Date</p>
          <p className="font-semibold text-gray-800">{formatDateForDisplay(endDate)}</p>
        </div>
      </div>
      
      <Calendar selectedDate={selectedDateForCalendar} onDateSelect={handleDateSelect} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
          <input 
            type="time" 
            id="startTime" 
            name="startTime" 
            value={startTime} 
            onChange={e => setStartTime(e.target.value)} 
            required 
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-white text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
          <input 
            type="time" 
            id="endTime" 
            name="endTime" 
            value={endTime} 
            onChange={e => setEndTime(e.target.value)} 
            required 
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-white text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          />
        </div>
      </div>
      
      <ToggleSwitch 
        label="This is an online event"
        enabled={isOnline}
        onChange={setIsOnline}
      />
      
      {isOnline ? (
        <Input
          label="Online URL (e.g., Zoom, Google Meet)"
          id="onlineUrl"
          name="onlineUrl"
          type="url"
          value={onlineUrl}
          onChange={(e) => setOnlineUrl(e.target.value)}
          placeholder="https://..."
          disabled={isSubmitting}
        />
      ) : (
        <Input
          label="Location"
          id="locationText"
          name="locationText"
          value={locationText}
          onChange={(e) => setLocationText(e.target.value)}
          placeholder="e.g., Main Sanctuary"
          disabled={isSubmitting}
        />
      )}
      
      <div className="flex justify-end items-center space-x-4 pt-4 border-t border-gray-200">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating Event...' : 'Create Event'}
        </Button>
      </div>
    </form>
  );
};

export default EventForm;