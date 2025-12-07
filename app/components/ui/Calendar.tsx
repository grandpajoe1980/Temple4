"use client"

import React, { useState } from 'react';

interface CalendarProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
}

const Calendar: React.FC<CalendarProps> = ({ selectedDate, onDateSelect }) => {
  const [viewDate, setViewDate] = useState(selectedDate || new Date());

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const endOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
  const startDay = startOfMonth.getDay();
  const daysInMonth = endOfMonth.getDate();

  const prevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleDateClick = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    onDateSelect(newDate);
  };

  const isSameDay = (d1: Date | null, d2: Date | null) => {
    if (!d1 || !d2) return false;
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };
    

  const days = [];
  for (let i = 0; i < startDay; i++) {
    days.push(<div key={`empty-${i}`} className="w-10 h-10"></div>);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), i);
    const isSelected = isSameDay(date, selectedDate);
    const isToday = isSameDay(date, today);

    const dayClasses = `w-10 h-10 flex items-center justify-center rounded-full cursor-pointer transition-colors text-sm ${
      isSelected
        ? 'tenant-bg-600 text-[color:var(--primary-foreground)] font-bold'
        : isToday
        ? 'tenant-bg-100 tenant-text-primary'
        : 'text-gray-700 hover:bg-gray-100'
    }`;
    days.push(
      <div key={i} className="flex justify-center items-center">
        <div className={dayClasses} onClick={() => handleDateClick(i)}>
            {i}
        </div>
      </div>
    );
  }

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <button type="button" onClick={prevMonth} className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="font-semibold text-gray-800">
          {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </div>
        <button type="button" onClick={nextMonth} className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 font-medium">
        {weekdays.map(day => <div key={day} className="h-10 flex items-center justify-center">{day}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1 mt-1">
        {days}
      </div>
    </div>
  );
};

export default Calendar;