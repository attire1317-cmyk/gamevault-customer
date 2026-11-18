import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import ProfileClient from '@/components/ProfileClient';

export const metadata = { title: 'Profile' };
export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect('/login?next=/profile');
  return <ProfileClient />;
}
