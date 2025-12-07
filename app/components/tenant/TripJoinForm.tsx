import React, { useEffect, useState } from 'react';

export interface TripJoinFormValues {
  personalInfo: {
    fullLegalName: string;
    preferredName: string;
    dateOfBirth: string;
    gender?: string;
    address?: string;
    phone?: string;
    guardianPhone?: string;
    email: string;
    emergencyContact: {
      name: string;
      relationship?: string;
      phone?: string;
      email?: string;
    };
  };
  medical: {
    allergies?: string;
    conditions?: string;
    medications?: string;
    dietaryRestrictions?: string;
    accessibilityNeeds?: string;
    physicianName?: string;
    physicianPhone?: string;
    insuranceProvider?: string;
    insurancePolicyNumber?: string;
    consentFirstAid: boolean;
    consentEmergencyCare: boolean;
  };
  passport: {
    passportNumber?: string;
    passportExpiration?: string;
    passportCountry?: string;
    passportCopyUrl?: string;
  };
  guardian: {
    guardianName?: string;
    guardianContact?: string;
    permissionTravel: boolean;
    permissionWithLeader: boolean;
    guardianSignature?: string;
    guardianSignatureDate?: string;
  };
  waiver?: {
    tripName?: string;
    tripDates?: string;
    participantName?: string;
  };
  agreements: {
    conduct: boolean;
    followInstructions: boolean;
    substanceFree: boolean;
    curfew: boolean;
    expectations: boolean;
    mediaReleaseOptOutInitials?: string;
  };
  waiverAccepted: boolean;
}

interface TripJoinFormProps {
  user: any;
  tripName?: string;
  submitting?: boolean;
  onSubmit: (values: TripJoinFormValues) => void;
  onCancel?: () => void;
}

const defaultValues: TripJoinFormValues = {
  personalInfo: {
    fullLegalName: '',
    preferredName: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    phone: '',
    guardianPhone: '',
    email: '',
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
      email: '',
    },
  },
  medical: {
    allergies: '',
    conditions: '',
    medications: '',
    dietaryRestrictions: '',
    accessibilityNeeds: '',
    physicianName: '',
    physicianPhone: '',
    insuranceProvider: '',
    insurancePolicyNumber: '',
    consentFirstAid: true,
    consentEmergencyCare: true,
  },
  passport: {
    passportNumber: '',
    passportExpiration: '',
    passportCountry: '',
    passportCopyUrl: '',
  },
  guardian: {
    guardianName: '',
    guardianContact: '',
    permissionTravel: true,
    permissionWithLeader: true,
    guardianSignature: '',
    guardianSignatureDate: '',
  },
  waiver: {
    tripName: '',
    tripDates: '',
    participantName: '',
  },
  agreements: {
    conduct: true,
    followInstructions: true,
    substanceFree: true,
    curfew: true,
    expectations: true,
    mediaReleaseOptOutInitials: '',
  },
  waiverAccepted: false,
};

export default function TripJoinForm({ user, tripName, submitting, onSubmit, onCancel }: TripJoinFormProps) {
  const [form, setForm] = useState<TripJoinFormValues>(defaultValues);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        fullLegalName: user?.profile?.displayName || prev.personalInfo.fullLegalName,
        preferredName: user?.profile?.displayName || prev.personalInfo.preferredName,
        email: user?.email || prev.personalInfo.email,
      },
      waiver: {
        ...prev.waiver,
        tripName: tripName || prev.waiver?.tripName || '',
        participantName: user?.profile?.displayName || prev.waiver?.participantName || '',
      },
    }));
  }, [user, tripName]);

  const update = <K extends keyof TripJoinFormValues>(section: K, values: Partial<TripJoinFormValues[K]>) => {
    setForm((prev) => ({
      ...prev,
      [section]: { ...(prev as any)[section], ...values },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.waiverAccepted) {
      alert('Please accept the waiver to join the trip.');
      return;
    }
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-6 overflow-y-auto pr-2">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">A. Personal Information</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-gray-700">Full legal name</label>
            <input
              required
              value={form.personalInfo.fullLegalName}
              onChange={(e) => update('personalInfo', { fullLegalName: e.target.value })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Preferred name</label>
            <input
              value={form.personalInfo.preferredName}
              onChange={(e) => update('personalInfo', { preferredName: e.target.value })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Date of birth</label>
            <input
              type="date"
              value={form.personalInfo.dateOfBirth}
              onChange={(e) => update('personalInfo', { dateOfBirth: e.target.value })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Gender (optional)</label>
            <input
              value={form.personalInfo.gender || ''}
              onChange={(e) => update('personalInfo', { gender: e.target.value })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-700">Address</label>
            <input
              value={form.personalInfo.address || ''}
              onChange={(e) => update('personalInfo', { address: e.target.value })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Phone (participant)</label>
            <input
              value={form.personalInfo.phone || ''}
              onChange={(e) => update('personalInfo', { phone: e.target.value })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Phone (parent/guardian if minor)</label>
            <input
              value={form.personalInfo.guardianPhone || ''}
              onChange={(e) => update('personalInfo', { guardianPhone: e.target.value })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              required
              type="email"
              value={form.personalInfo.email}
              onChange={(e) => update('personalInfo', { email: e.target.value })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700">Emergency contact name</label>
              <input
                required
                value={form.personalInfo.emergencyContact.name}
                onChange={(e) =>
                  update('personalInfo', { emergencyContact: { ...form.personalInfo.emergencyContact, name: e.target.value } })
                }
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Relationship</label>
              <input
                value={form.personalInfo.emergencyContact.relationship || ''}
                onChange={(e) =>
                  update('personalInfo', {
                    emergencyContact: { ...form.personalInfo.emergencyContact, relationship: e.target.value },
                  })
                }
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Emergency contact phone</label>
              <input
                value={form.personalInfo.emergencyContact.phone || ''}
                onChange={(e) =>
                  update('personalInfo', { emergencyContact: { ...form.personalInfo.emergencyContact, phone: e.target.value } })
                }
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Emergency contact email</label>
              <input
                type="email"
                value={form.personalInfo.emergencyContact.email || ''}
                onChange={(e) =>
                  update('personalInfo', { emergencyContact: { ...form.personalInfo.emergencyContact, email: e.target.value } })
                }
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">C. Medical Information</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-gray-700">Allergies (food, medication, environmental)</label>
            <textarea
              value={form.medical.allergies || ''}
              onChange={(e) => update('medical', { allergies: e.target.value })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Existing medical conditions</label>
            <textarea
              value={form.medical.conditions || ''}
              onChange={(e) => update('medical', { conditions: e.target.value })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Current medications + dosage</label>
            <textarea
              value={form.medical.medications || ''}
              onChange={(e) => update('medical', { medications: e.target.value })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Dietary restrictions</label>
            <textarea
              value={form.medical.dietaryRestrictions || ''}
              onChange={(e) => update('medical', { dietaryRestrictions: e.target.value })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Mobility or accessibility needs</label>
            <textarea
              value={form.medical.accessibilityNeeds || ''}
              onChange={(e) => update('medical', { accessibilityNeeds: e.target.value })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Physician name & phone</label>
            <input
              value={form.medical.physicianName || ''}
              onChange={(e) => update('medical', { physicianName: e.target.value })}
              placeholder="Name"
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              value={form.medical.physicianPhone || ''}
              onChange={(e) => update('medical', { physicianPhone: e.target.value })}
              placeholder="Phone"
              className="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Medical insurance provider</label>
            <input
              value={form.medical.insuranceProvider || ''}
              onChange={(e) => update('medical', { insuranceProvider: e.target.value })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              value={form.medical.insurancePolicyNumber || ''}
              onChange={(e) => update('medical', { insurancePolicyNumber: e.target.value })}
              placeholder="Policy number"
              className="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.medical.consentFirstAid}
                onChange={(e) => update('medical', { consentFirstAid: e.target.checked })}
              />
              Consent to administer first aid
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.medical.consentEmergencyCare}
                onChange={(e) => update('medical', { consentEmergencyCare: e.target.checked })}
              />
              Consent to seek emergency medical care
            </label>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">D. Passport / ID (for international trips)</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-gray-700">Passport number</label>
            <input
              value={form.passport.passportNumber || ''}
              onChange={(e) => update('passport', { passportNumber: e.target.value })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Expiration date</label>
            <input
              type="date"
              value={form.passport.passportExpiration || ''}
              onChange={(e) => update('passport', { passportExpiration: e.target.value })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Country of issue</label>
            <input
              value={form.passport.passportCountry || ''}
              onChange={(e) => update('passport', { passportCountry: e.target.value })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Upload / link passport ID page</label>
            <input
              type="url"
              placeholder="Link to uploaded copy (optional)"
              value={form.passport.passportCopyUrl || ''}
              onChange={(e) => update('passport', { passportCopyUrl: e.target.value })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">E. Parent / Guardian Authorization (for minors)</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-gray-700">Printed name of parent/guardian</label>
            <input
              value={form.guardian.guardianName || ''}
              onChange={(e) => update('guardian', { guardianName: e.target.value })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Contact information</label>
            <input
              value={form.guardian.guardianContact || ''}
              onChange={(e) => update('guardian', { guardianContact: e.target.value })}
              placeholder="Phone or email"
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.guardian.permissionTravel}
              onChange={(e) => update('guardian', { permissionTravel: e.target.checked })}
            />
            Permission for minor to travel
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.guardian.permissionWithLeader}
              onChange={(e) => update('guardian', { permissionWithLeader: e.target.checked })}
            />
            Permission for minor to travel with the group leader(s)
          </label>
          <div>
            <label className="text-sm font-medium text-gray-700">Signature (type name)</label>
            <input
              value={form.guardian.guardianSignature || ''}
              onChange={(e) => update('guardian', { guardianSignature: e.target.value })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Signature date</label>
            <input
              type="date"
              value={form.guardian.guardianSignatureDate || ''}
              onChange={(e) => update('guardian', { guardianSignatureDate: e.target.value })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">F. Behavioral Agreements</h3>
        <div className="grid gap-2">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.agreements.conduct}
              onChange={(e) => update('agreements', { conduct: e.target.checked })}
            />
            Participant code of conduct
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.agreements.followInstructions}
              onChange={(e) => update('agreements', { followInstructions: e.target.checked })}
            />
            Agreement to follow all instructions from leaders
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.agreements.substanceFree}
              onChange={(e) => update('agreements', { substanceFree: e.target.checked })}
            />
            Substance prohibition agreement
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.agreements.curfew}
              onChange={(e) => update('agreements', { curfew: e.target.checked })}
            />
            Curfew / attendance compliance
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.agreements.expectations}
              onChange={(e) => update('agreements', { expectations: e.target.checked })}
            />
            Commitment to group expectations (service, performance, safety)
          </label>
          <div>
            <label className="text-sm font-medium text-gray-700">Media release opt-out initials (optional)</label>
            <input
              value={form.agreements.mediaReleaseOptOutInitials || ''}
              onChange={(e) => update('agreements', { mediaReleaseOptOutInitials: e.target.value })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2 rounded border p-3 text-sm text-gray-800" style={{ borderColor: 'color-mix(in srgb, var(--primary) 20%, transparent)', backgroundColor: 'color-mix(in srgb, var(--primary) 8%, transparent)'}}>
        <h3 className="text-base font-semibold text-gray-900">Participant Release & Liability Waiver</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="text-xs font-semibold text-gray-600">Trip name</label>
            <input
              value={form.waiver?.tripName || ''}
              onChange={(e) => setForm((prev) => ({ ...prev, waiver: { ...(prev.waiver || {}), tripName: e.target.value } }))}
              className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600">Trip dates</label>
            <input
              value={form.waiver?.tripDates || ''}
              onChange={(e) => setForm((prev) => ({ ...prev, waiver: { ...(prev.waiver || {}), tripDates: e.target.value } }))}
              placeholder="e.g., 2025-06-01 to 2025-06-10"
              className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600">Participant full name</label>
            <input
              value={form.waiver?.participantName || ''}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, waiver: { ...(prev.waiver || {}), participantName: e.target.value } }))
              }
              className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm"
            />
          </div>
        </div>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            <strong>Assumption of Risk</strong><br />
            I understand that participation in this trip may involve travel by plane, bus, van, or car; lodging in unfamiliar environments; physical activities; volunteer work; exposure to new foods; and conditions that may differ from those at home. I acknowledge that travel—domestic or international—carries inherent risks, including but not limited to illness, injury, accidents, theft, weather, political unrest, and delayed or cancelled transportation. I voluntarily assume all risks associated with this trip.
          </li>
          <li>
            <strong>Release of Liability</strong><br />
            In consideration for being allowed to participate, I hereby release and hold harmless: [Organization Name], its directors, officers, employees, volunteers, agents, leaders, and representatives from any and all liability, claims, demands, causes of action, or expenses arising out of or related to any loss, damage, illness, injury, or death that may occur during or as a result of participation in this trip, whether caused by negligence or otherwise.
          </li>
          <li>
            <strong>Medical Authorization</strong><br />
            If I am injured or become ill and am unable to make decisions, I authorize the trip leaders to seek medical treatment on my behalf. I assume full responsibility for any medical costs incurred. I certify that I have disclosed all relevant medical conditions and medications.
          </li>
          <li>
            <strong>Behavioral Agreement</strong><br />
            I agree to follow all rules and directions given by leaders. I understand that failure to comply may result in my removal from the trip at my own expense.
          </li>
          <li>
            <strong>Media Release (Optional)</strong><br />
            I grant permission for photographs or video taken during the trip to be used for organizational purposes. (If you wish to opt out, initial here: ________)
          </li>
          <li>
            <strong>Travel Documentation (International Trips)</strong><br />
            I certify that my passport and visa (if required) are valid. I understand that I am responsible for any immigration, customs, or travel-related issues arising from incomplete or incorrect documentation.
          </li>
          <li>
            <strong>Indemnification</strong><br />
            I agree to indemnify and hold harmless the organization from any claims arising from my conduct or actions during the trip.
          </li>
          <li>
            <strong>Acknowledgment</strong><br />
            I have read and understood this waiver. I sign it voluntarily.
          </li>
        </ol>
        <label className="mt-3 inline-flex items-center gap-2 font-semibold text-gray-900">
          <input
            type="checkbox"
            checked={form.waiverAccepted}
            onChange={(e) => setForm((prev) => ({ ...prev, waiverAccepted: e.target.checked }))}
            required
          />
          I have read and agree to the Participant Release & Liability Waiver.
        </label>
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            Print form & waiver
          </button>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        ) : null}
        <button
          type="submit"
          disabled={submitting}
          className="rounded px-4 py-2 text-sm font-semibold text-white shadow bg-[color:var(--primary)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Submitting…' : 'Submit & Join Trip'}
        </button>
      </div>
    </form>
  );
}
