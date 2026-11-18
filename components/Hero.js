'use client';
import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, CalendarCheck, Lightning, Tag } from '@phosphor-icons/react';
import { Stagger, Item } from './motion';

const CHIPS = [
  { icon: CalendarCheck, text: 'Rent by the day', cls: 'chip-a', dur: 5.2 },
  { icon: Lightning, text: 'Live stock', cls: 'chip-b', dur: 6.4 },
  { icon: Tag, text: 'Weekly deals', cls: 'chip-c', dur: 5.8 },
];

// Original controller artwork, drawn inline so it needs no image download and stays sharp on every screen.
function Controller() {
  return (
    <svg className="pad" viewBox="0 0 400 270" role="img" aria-label="A game controller" focusable="false">
      <defs>
        <linearGradient id="padBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7b5cff" />
          <stop offset="1" stopColor="#4a2fd6" />
        </linearGradient>
        <linearGradient id="padShine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.38" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="92" y="38" width="62" height="20" rx="10" fill="#cfc6ff" />
      <rect x="246" y="38" width="62" height="20" rx="10" fill="#cfc6ff" />
      <path
        d="M118 58h164c30 0 48 22 62 72l20 78c8 30-14 46-38 38-18-6-30-22-42-44l-12-22H128l-12 22c-12 22-24 38-42 44-24 8-46-8-38-38l20-78c14-50 32-72 62-72Z"
        fill="url(#padBody)"
      />
      <path d="M118 58h164c30 0 48 22 62 72l6 22c-30-30-70-46-150-46s-120 16-150 46l6-22c14-50 32-72 62-72Z" fill="url(#padShine)" />
      <g fill="#fff">
        <rect x="104" y="98" width="16" height="48" rx="5" />
        <rect x="88" y="114" width="48" height="16" rx="5" />
      </g>
      <circle cx="276" cy="92" r="9" fill="#ffb199" />
      <circle cx="298" cy="114" r="9" fill="#fff" />
      <circle cx="276" cy="136" r="9" fill="#ffd36a" />
      <circle cx="254" cy="114" r="9" fill="#9be8c3" />
      <circle cx="162" cy="158" r="22" fill="#3a22b8" />
      <circle cx="162" cy="158" r="13" fill="#6a4cff" />
      <circle cx="238" cy="158" r="22" fill="#3a22b8" />
      <circle cx="238" cy="158" r="13" fill="#6a4cff" />
      <rect x="176" y="96" width="20" height="9" rx="4.5" fill="#cfc6ff" />
      <rect x="204" y="96" width="20" height="9" rx="4.5" fill="#cfc6ff" />
    </svg>
  );
}

export default function Hero() {
  const root = useRef(null);
  const { scrollYProgress } = useScroll({ target: root, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '-8%']);
  const tilt = useTransform(scrollYProgress, [0, 1], [0, -6]);

  return (
    <section className="hero" ref={root}>
      <div className="container hero-grid">
        <Stagger className="hero-copy">
          <Item as="p" className="eyebrow">
            Rent. Play. Return.
          </Item>
          <Item as="h1">Your next game is one tap away.</Item>
          <Item as="p" className="hero-sub">
            Rent for a few days or buy outright. Prices and stock update live, with every due date counted down.
          </Item>
          <Item className="hero-cta">
            <Link href="/games" className="btn btn-primary btn-lg">
              Browse games <ArrowRight size={18} weight="bold" />
            </Link>
            <a href="#offers" className="btn btn-ghost btn-lg">
              See offers
            </a>
          </Item>
        </Stagger>

        <motion.div className="hero-media" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}>
          <span className="stage-glow" aria-hidden="true" />
          <motion.div className="pad-wrap" style={{ y, rotate: tilt }}>
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}>
              <Controller />
            </motion.div>
          </motion.div>
          {CHIPS.map(({ icon: Icon, text, cls, dur }, i) => (
            <motion.span
              key={text}
              className={`stage-chip ${cls}`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: [0, -7, 0] }}
              transition={{ opacity: { delay: 0.5 + i * 0.12, duration: 0.5 }, y: { delay: 0.5 + i * 0.12, duration: dur, repeat: Infinity, ease: 'easeInOut' } }}
            >
              <Icon size={16} weight="fill" /> {text}
            </motion.span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
