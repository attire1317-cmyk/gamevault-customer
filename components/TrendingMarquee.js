'use client';
import { useLayoutEffect, useRef, useState } from 'react';
import { animate, motion, useAnimationFrame, useMotionValue, useReducedMotion } from 'framer-motion';
import GameCard from './GameCard';

const SPEED = 45; // pixels per second, moving left to right

// Endless, smooth carousel. Slides drift left to right on their own, ease to a stop while the
// pointer or keyboard focus is on them, and ease back up to speed when it leaves.
// Visitors who prefer reduced motion get a plain swipeable row instead.
export default function TrendingMarquee({ games, onAct }) {
  const reduce = useReducedMotion();
  const viewRef = useRef(null);
  const groupRef = useRef(null);
  const setW = useRef(0); // width of one full set; x loops between -setW and 0
  const x = useMotionValue(0);
  const speed = useMotionValue(SPEED);
  const [rep, setRep] = useState(1); // copies of the game list per set, enough to fill the screen

  useLayoutEffect(() => {
    if (reduce) return;
    const view = viewRef.current;
    const group = groupRef.current;
    if (!view || !group) return;
    const measure = () => {
      const gw = group.getBoundingClientRect().width;
      if (!gw) return;
      const r = Math.min(8, Math.max(1, Math.ceil(view.clientWidth / gw)));
      setRep(r);
      const w = gw * r;
      setW.current = w;
      const v = x.get();
      if (!(v >= -w && v < 0)) x.set(-w);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(view);
    ro.observe(group);
    return () => ro.disconnect();
  }, [reduce, games.length, x]);

  useAnimationFrame((_, delta) => {
    const w = setW.current;
    if (!w || reduce) return;
    let next = x.get() + speed.get() * (Math.min(delta, 64) / 1000);
    if (next >= 0) next -= w; // jump back one set: identical content, so the loop is invisible
    x.set(next);
  });

  const slow = (stop) => animate(speed, stop ? 0 : SPEED, { duration: 0.5, ease: 'easeOut' });
  const mouseOnly = (fn) => (e) => {
    if (e.pointerType === 'mouse') fn();
  };

  if (reduce) {
    return (
      <div className="marquee marquee-static" role="region" aria-label="Trending games">
        <div className="marquee-group">
          {games.map((g) => (
            <div className="marquee-item" key={g.id}>
              <GameCard flat game={g} onAct={onAct} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="marquee"
      ref={viewRef}
      role="region"
      aria-label="Trending games"
      onPointerEnter={mouseOnly(() => slow(true))}
      onPointerLeave={mouseOnly(() => slow(false))}
      onFocus={() => slow(true)}
      onBlur={() => slow(false)}
    >
      <motion.div className="marquee-track" style={{ x }}>
        {Array.from({ length: rep * 2 }).map((_, gi) => (
          <div className="marquee-group" key={gi} ref={gi === 0 ? groupRef : undefined}>
            {games.map((g) => (
              <div className="marquee-item" key={g.id}>
                <GameCard flat clone={gi > 0} game={g} onAct={onAct} />
              </div>
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
