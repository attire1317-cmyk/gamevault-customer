import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import AccountClient from '@/components/AccountClient';

export const metadata = { title: 'My rentals' };
export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login?next=/account');
  return <AccountClient name={user.name} />;
}
