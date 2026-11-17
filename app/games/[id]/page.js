import GameDetail from '@/components/GameDetail';

export const metadata = { title: 'Game details' };

export default async function GamePage({ params }) {
  const { id } = await params;
  return <GameDetail id={Number(id)} />;
}
