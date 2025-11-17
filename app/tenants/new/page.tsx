import CreateTenantForm from '@/app/components/tenant/CreateTenantForm';

export default function CreateTenantPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Create a New Community</h1>
      <CreateTenantForm />
    </div>
  );
}
