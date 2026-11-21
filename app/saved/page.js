import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import SavedClient from '@/components/SavedClient';

export const metadata = { title: 'Saved' };
export const dynamic = 'force-dynamic';

export default async function SavedPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login?next=/saved');
  return (
    <main>
      <SavedClient />
    </main>
  );
}
