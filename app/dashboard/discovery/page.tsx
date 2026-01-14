import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import DiscoveryClient from './components/DiscoveryClient';
import PageContainer from '../components/PageContainer';
import Breadcrumbs from '../components/Breadcrumbs';

export const dynamic = 'force-dynamic';

export default async function DiscoveryPage() {
  // Check auth + admin role
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const userRole = (session.user as { role?: string }).role?.toLowerCase();
  if (userRole !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <PageContainer>
      <div className="mb-6">
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Discovery', href: '/dashboard/discovery' },
            { label: 'Manual' },
          ]}
        />
        <h1 className="text-3xl font-bold text-gray-900">
          Manual Discovery
        </h1>
        <p className="text-gray-600 mt-1">
          Run targeted discovery using predefined intent templates
        </p>
      </div>

      <DiscoveryClient />
    </PageContainer>
  );
}
