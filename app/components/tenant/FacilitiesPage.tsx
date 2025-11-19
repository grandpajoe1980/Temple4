import Link from 'next/link';
import Card from './ui/Card';
import type { Facility } from '@/types';

interface FacilitiesPageProps {
  tenant: { id: string; name: string };
  facilities: Facility[];
  isMember: boolean;
}

const typeLabels: Record<string, string> = {
  ROOM: 'Room',
  HALL: 'Hall',
  EQUIPMENT: 'Equipment',
  VEHICLE: 'Vehicle',
  OTHER: 'Other',
};

export default function FacilitiesPage({ tenant, facilities, isMember }: FacilitiesPageProps) {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold text-gray-900">Facilities at {tenant.name}</h1>
        <p className="text-gray-600 max-w-3xl">
          Explore the rooms, halls, and resources available at {tenant.name}. Select a facility to check details and request a
          booking.
        </p>
      </div>

      {!isMember && (
        <div className="rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          <p>
            You may need an approved membership to request bookings.{' '}
            <Link href={`/tenants/${tenant.id}/contact`} className="font-semibold text-blue-700 hover:underline">
              Contact the team
            </Link>{' '}
            if you have questions.
          </p>
        </div>
      )}

      {facilities.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <p className="text-lg font-semibold text-gray-700">No facilities are published yet.</p>
            <p className="mt-2 text-gray-500">Please check back soon or reach out for availability.</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {facilities.map((facility) => (
            <Card key={facility.id}>
              <div className="flex flex-col h-full gap-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <span>{typeLabels[facility.type] ?? facility.type}</span>
                  {!facility.isActive && <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[11px]">Inactive</span>}
                </div>
                <h3 className="text-xl font-semibold text-gray-900">{facility.name}</h3>
                {facility.description && <p className="text-gray-600">{facility.description}</p>}
                <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                  {facility.location && <span className="rounded-full bg-gray-100 px-3 py-1">{facility.location}</span>}
                  {typeof facility.capacity === 'number' && (
                    <span className="rounded-full bg-gray-100 px-3 py-1">Capacity: {facility.capacity}</span>
                  )}
                </div>
                <div className="mt-2 flex gap-3">
                  <Link
                    href={`/tenants/${tenant.id}/facilities/${facility.id}`}
                    className="text-sm font-semibold text-amber-600 hover:text-amber-700"
                  >
                    View availability →
                  </Link>
                  <Link
                    href={`/tenants/${tenant.id}/facilities/${facility.id}`}
                    className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-700"
                  >
                    Request booking
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
