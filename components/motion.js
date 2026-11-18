'use client';
import { motion, MotionConfig } from 'framer-motion';

export const spring = { type: 'spring', stiffness: 380, damping: 32, mass: 0.8 };
const container = { hidden: {}, show: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } } };
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 26 } },
};

// Parent: children with <Item> fade up one after another.
export function Stagger({ as = 'div', ...p }) {
  const C = motion[as];
  return <C variants={container} initial="hidden" animate="show" {...p} />;
}
export function Item({ as = 'div', ...p }) {
  const C = motion[as];
  return <C variants={item} {...p} />;
}

// Respects the device's reduced-motion setting everywhere.
export function Providers({ children }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

// Page-to-page slide used by paginated grids: content travels in the direction you navigate.
export const pageSlide = {
  enter: (d) => ({ opacity: 0, x: d * 48 }),
  center: { opacity: 1, x: 0 },
  exit: (d) => ({ opacity: 0, x: d * -48 }),
};
