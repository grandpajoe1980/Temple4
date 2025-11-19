import Link from 'next/link';
import Card from '../ui/Card';
import { SERVICE_CATEGORY_OPTIONS } from '@/constants';
import type { ServiceOffering, ServiceCategory } from '@/types';

interface ServiceDetailPageProps {
  tenant: {
    id: string;
    name: string;
    contactEmail?: string | null;
  };
  service: ServiceOffering;
}

const ServiceDetailPage = ({ tenant, service }: ServiceDetailPageProps) => {
  const categoryLabel = getCategoryLabel(service.category);
  const contactEmail = service.contactEmailOverride || tenant.contactEmail;
  const infoLink = `/tenants/${tenant.id}/contact?service=${encodeURIComponent(service.name)}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href={`/tenants/${tenant.id}/services`} className="hover:text-amber-600">
          ← Back to Services
        </Link>
        <span>/</span>
        <span>{categoryLabel}</span>
      </div>

      <Card>
        <div className="space-y-6">
          {service.imageUrl && (
            <img
              src={service.imageUrl}
              alt={service.name}
              className="h-60 w-full rounded-md object-cover"
              loading="lazy"
            />
          )}

          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
              <span className="font-semibold uppercase tracking-wide">{categoryLabel}</span>
              {!service.isPublic && <span className="rounded-full bg-gray-200 px-3 py-1 text-xs">Members Only</span>}
              {service.requiresBooking && <span className="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-800">Booking required</span>}
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{service.name}</h1>
            <p className="text-gray-700 whitespace-pre-line">{service.description}</p>
            {service.pricing && (
              <div className="rounded-md bg-amber-50 p-4 text-amber-900">
                <p className="font-semibold">Suggested Contribution</p>
                <p>{service.pricing}</p>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-5 space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Ready to Learn More?</h2>
            <p className="text-gray-600">
              {contactEmail
                ? `Email us at ${contactEmail} or use the request form below to start the conversation.`
                : 'Use the request button below and a team member will reach out with next steps.'}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href={infoLink}
                className="rounded-md bg-amber-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-700"
              >
                Request info about {service.name}
              </Link>
              <a
                href={contactEmail ? `mailto:${contactEmail}` : infoLink}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-amber-500"
              >
                {contactEmail ? 'Email the team' : 'Open contact form'}
              </a>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

function getCategoryLabel(category: ServiceCategory): string {
  return SERVICE_CATEGORY_OPTIONS.find((option) => option.value === category)?.label ?? category;
}

export default ServiceDetailPage;
