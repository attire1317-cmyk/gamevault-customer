'use client';
import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from '@phosphor-icons/react';
import { Stagger, Item } from './motion';

export default function Hero() {
  const root = useRef(null);
  const { scrollYProgress } = useScroll({ target: root, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '-7%']);

  return (
    <section className="hero" ref={root}>
      <div className="container hero-grid">
        <Stagger className="hero-copy">
          <Item as="h1">Console games, rented or owned.</Item>
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
        <motion.div
          className="hero-media"
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        >
          <motion.img
            className="hero-img"
            style={{ y }}
            src="https://picsum.photos/seed/neon-console-controller/1000/1200"
            alt="A game controller"
            width="1000"
            height="1200"
            fetchPriority="high"
            decoding="async"
          />
        </motion.div>
      </div>
    </section>
  );
}
