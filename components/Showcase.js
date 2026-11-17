'use client';
import Link from 'next/link';
import { ArrowRight, Fire } from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { untilEnd } from '@/lib/format';
import { useLive, useNow } from './hooks';
import { useShop } from './useShop';
import { GridSkeleton } from './GameCard';
import TrendingMarquee from './TrendingMarquee';
import { Stagger, Item } from './motion';

export default function Showcase() {
  const { data } = useLive(() => api('/api/games'));
  const now = useNow(data?.serverNow);
  const { act, sheet } = useShop(data, now);
  const offers = data?.offers || [];
  // Only games the shop owner added in Admin > Trending, newest first.
  const trending = (data?.games || []).filter((g) => g.trending).sort((a, b) => String(b.trendingAt).localeCompare(String(a.trendingAt)))
    .slice(0, 4); // the shop shows at most 4 trending games

  return (
    <>
      {offers.length > 0 && (
        <section className="section" id="offers">
          <div className="container">
            <h2 className="section-title">Offers on now</h2>
            <Stagger className="offer-row">
              {offers.map((o, i) => (
                <Item key={o.id} className={`offer ${i === 0 ? 'offer-lead' : ''}`}>
                  <span className="offer-pct">{o.percent}%</span>
                  <div>
                    <strong>{o.title}</strong>
                    <p>
                      {o.gameTitle ? o.gameTitle : 'Every game'}
                      {o.appliesTo === 'both' ? '' : o.appliesTo === 'rent' ? ', rentals only' : ', purchases only'}
                    </p>
                    <span className="offer-end">{untilEnd(o.endsAt, now)}</span>
                  </div>
                </Item>
              ))}
            </Stagger>
          </div>
        </section>
      )}

      <section className="section" id="trending">
        <div className="container">
          <div className="section-head">
            <h2 className="section-title">
              <Fire size={28} weight="fill" className="fire" /> Trending now
            </h2>
            <Link href="/games" className="btn btn-ghost">
              View all games <ArrowRight size={16} weight="bold" />
            </Link>
          </div>
          {!data ? (
            <GridSkeleton n={4} />
          ) : trending.length === 0 ? (
            <div className="empty">
              <p>Picks of the week will appear here soon.</p>
              <Link href="/games" className="btn btn-primary">
                Browse all games
              </Link>
            </div>
          ) : (
            <TrendingMarquee games={trending} onAct={act} />
          )}
        </div>
      </section>
      {sheet}
    </>
  );
}
