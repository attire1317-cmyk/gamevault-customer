'use client';
import { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { HandPointing, CalendarCheck, ArrowUUpLeft } from '@phosphor-icons/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const PANELS = [
  { icon: HandPointing, title: 'Pick a game', body: 'Choose rent or buy. Offers are applied for you and stock is shown as it is right now.' },
  { icon: CalendarCheck, title: 'Choose your days', body: 'Rent from one to thirty days. Your return date and total are shown before you confirm.' },
  { icon: ArrowUUpLeft, title: 'Return on time', body: 'My rentals counts down the days left, and the shop sees the same number you do.' },
];

export default function HowItWorks() {
  const root = useRef(null);

  // Pinned sequence on larger screens: scrolling advances the story (storytelling).
  // On phones and under reduced motion the three panels simply stack.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
        const panels = gsap.utils.toArray('.how-panel');
        gsap.set(panels, { autoAlpha: 0, y: 36 });
        gsap.set(panels[0], { autoAlpha: 1, y: 0 });
        const tl = gsap.timeline({
          scrollTrigger: { trigger: root.current, start: 'top top', end: '+=200%', pin: true, scrub: 0.6, anticipatePin: 1 },
        });
        tl.fromTo('.how-bar', { scaleX: 0 }, { scaleX: 1, ease: 'none', duration: panels.length - 1 }, 0);
        panels.slice(1).forEach((p, i) => {
          tl.to(panels[i], { autoAlpha: 0, y: -36, duration: 0.4, ease: 'power2.in' }, i + 0.6).to(
            p,
            { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out' },
            i + 0.75
          );
        });
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <section className="how" ref={root} id="how">
      <div className="container how-inner">
        <h2 className="section-title">Renting, start to finish</h2>
        <div className="how-track">
          <span className="how-bar" />
        </div>
        <div className="how-panels">
          {PANELS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="how-panel">
              <Icon size={40} weight="duotone" />
              <h3>{title}</h3>
              <p>{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
