import Link from 'next/link';
import Card from '../ui/Card';
import { SERVICE_CATEGORY_OPTIONS } from '@/constants';
import FacilitiesPage from './FacilitiesPage';
import type { ServiceOffering, ServiceCategory, Facility } from '@/types';

interface ServicesPageProps {
  tenant: {
    id: string;
    name: string;
  };
  services: ServiceOffering[];
  facilities?: Facility[];
  selectedCategory?: ServiceCategory;
  isMember: boolean;
  showChips?: boolean;
}

const ServicesPage = ({ tenant, services, facilities, selectedCategory, isMember, showChips = true }: ServicesPageProps) => {
  const activeCategory = selectedCategory ?? null;

  // The chips are rendered by the tenant navigation; do not duplicate them here.
  const chips = null;

  return (
    <div className="space-y-8">
      {/* Chips are shown in the tenant nav; duplicate chips removed from page. */}
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold text-gray-900">Services at {tenant.name}</h1>
        <p className="text-gray-600 max-w-3xl">
          Explore the ceremonies, classes, facilities, and care opportunities available through {tenant.name}. Select a
          category to narrow the list or choose a service to read more and request information.
        </p>
      </div>

      {activeCategory === 'FACILITY' ? (
        <FacilitiesPage tenant={tenant} facilities={facilities ?? []} isMember={isMember} />
      ) : (
        <>
          {!isMember && (
            <div className="rounded-md border p-4 text-sm" style={{ borderColor: 'color-mix(in srgb, var(--primary) 20%, transparent)', backgroundColor: 'color-mix(in srgb, var(--primary) 8%, transparent)', color: 'color-mix(in srgb, var(--primary) 90%, black)'}}>
              <p>
                Some services may be reserved for members.{' '}
                <Link href={`/tenants/${tenant.id}/contact`} className="font-semibold text-[color:var(--primary)] hover:underline">
                  Contact the team
                </Link>{' '}
                to learn more about membership options.
              </p>
            </div>
          )}

          {services.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <p className="text-lg font-semibold text-gray-700">No services found in this category.</p>
                <p className="text-gray-500 mt-2">Check back soon or reach out to the team for more details.</p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {services.map((service) => (
                <Card key={service.id}>
                  <div className="flex flex-col h-full">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                        <span>{getCategoryLabel(service.category)}</span>
                        {!service.isPublic && <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[11px]">Members Only</span>}
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">{service.name}</h3>
                      <p className="text-gray-600">{service.description}</p>
                      <p className="text-sm font-semibold text-gray-800">
                        {service.pricing ? `Cost: ${service.pricing}` : 'No cost listed'}
                      </p>
                      {service.requiresBooking && (
                        <p className="text-sm tenant-text-primary">Booking is required. Our team will help you schedule next steps.</p>
                      )}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link
                        href={`/tenants/${tenant.id}/services/${service.id}`}
                        className="text-sm font-semibold text-[color:var(--primary)] hover:opacity-90"
                      >
                        View details →
                      </Link>
                      <Link
                        href={`/tenants/${tenant.id}/contact?service=${encodeURIComponent(service.name)}`}
                        className="rounded-md px-4 py-2 text-sm font-semibold text-white transition-colors bg-[color:var(--primary)] hover:opacity-90"
                      >
                        Request info
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

interface CategoryChipProps {
  href: string;
  label: string;
  description?: string;
  active: boolean;
}

const CategoryChip = ({ href, label, description, active }: CategoryChipProps) => (
  <Link
    href={href}
    className={`rounded-full border px-4 py-2 text-sm transition-colors ${
      active ? 'border-[color:var(--primary)] tenant-bg-100 tenant-text-primary' : 'border-gray-200 text-gray-600 hover:border-[color:var(--primary)]'
    }`}
    title={description}
  >
    {label}
  </Link>
);

function getCategoryLabel(category: ServiceCategory): string {
  return SERVICE_CATEGORY_OPTIONS.find((option) => option.value === category)?.label ?? category;
}

export default ServicesPage;
