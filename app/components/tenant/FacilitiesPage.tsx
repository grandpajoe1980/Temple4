import Link from 'next/link';
import Card from '../ui/Card';
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

const fallbackImages: Record<string, string> = {
  ROOM: 'https://images.unsplash.com/photo-1529333166433-8a58c0c3d1e1?auto=format&fit=crop&w=800&q=80',
  HALL: 'https://images.unsplash.com/photo-1524230572899-a752b3835840?auto=format&fit=crop&w=800&q=80',
  EQUIPMENT: 'https://images.unsplash.com/photo-1454165205744-3b78555e5572?auto=format&fit=crop&w=800&q=80',
  VEHICLE: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80',
  OTHER: 'https://images.unsplash.com/photo-1503264116251-35a269479413?auto=format&fit=crop&w=800&q=80',
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
              <div className="flex flex-col h-full gap-4">
                <div className="relative h-40 w-full overflow-hidden rounded-lg bg-gray-100">
                  <img
                    src={facility.imageUrl || fallbackImages[facility.type] || fallbackImages.OTHER}
                    alt={facility.name}
                    className="h-full w-full object-cover"
                  />
                  {!facility.isActive && (
                    <div className="absolute left-3 top-3 rounded-full bg-white/80 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-700">
                      Inactive
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <span>{typeLabels[facility.type] ?? facility.type}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-xl font-semibold text-gray-900">{facility.name}</h3>
                  </div>
                  {facility.description && <p className="text-gray-600">{facility.description}</p>}
                  <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                    {facility.location && <span className="rounded-full bg-gray-100 px-3 py-1">{facility.location}</span>}
                    {typeof facility.capacity === 'number' && (
                      <span className="rounded-full bg-gray-100 px-3 py-1">Capacity: {facility.capacity}</span>
                    )}
                  </div>
                </div>
                <div className="mt-auto flex flex-wrap gap-3">
                  <Link
                    href={`/tenants/${tenant.id}/facilities/${facility.id}`}
                    className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-700"
                  >
                    Use this facility
                  </Link>
                  <Link
                    href={`/tenants/${tenant.id}/facilities/${facility.id}`}
                    className="text-sm font-semibold text-amber-600 hover:text-amber-700"
                  >
                    View availability
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
