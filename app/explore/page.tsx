import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { getTenants } from '@/lib/data';
import ExplorePage from '../components/explore/ExplorePage';

export default async function Page() {
  const session = await getServerSession(authOptions);
  const tenants = await getTenants();

  return (
    <ExplorePage 
      initialSearchTerm="" 
      tenants={tenants}
    />
  );
}
