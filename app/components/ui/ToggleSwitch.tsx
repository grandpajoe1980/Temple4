"use client"


import React from 'react';

interface ToggleSwitchProps {
  label: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  description?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ label, enabled, onChange, description }) => {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex-grow flex flex-col">
        <span className="text-sm font-semibold text-slate-900">{label}</span>
        {description && <span className="text-sm text-slate-500">{description}</span>}
      </span>
      <button
        type="button"
        className={`${
          enabled ? 'bg-amber-500 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.4)]' : 'bg-slate-300 shadow-inner'
        } relative inline-flex flex-shrink-0 h-6 w-11 border border-slate-200 rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-amber-500`}
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
      >
        <span
          aria-hidden="true"
          className={`${
            enabled ? 'translate-x-5' : 'translate-x-0'
          } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md transform ring-1 ring-black/5 transition ease-in-out duration-200`}
        />
      </button>
    </div>
  );
};

export default ToggleSwitch;
