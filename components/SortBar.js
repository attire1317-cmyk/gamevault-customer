'use client';
import { motion } from 'framer-motion';
import { CaretDown, CheckCircle, Tag } from '@phosphor-icons/react';
import { spring } from './motion';

function Toggle({ on, onClick, icon: Icon, children }) {
  return (
    <button type="button" className={`chip ${on ? 'is-on' : ''}`} aria-pressed={on} onClick={onClick}>
      {on && <motion.span className="chip-pill" initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={spring} />}
      <span className="chip-label chip-inline">
        <Icon size={16} weight={on ? 'fill' : 'bold'} /> {children}
      </span>
    </button>
  );
}

export default function SortBar({ sort, onSort, options, deals, onDeals, stock, onStock }) {
  return (
    <div className="sortbar" role="group" aria-label="Sort and filter">
      <label className="select-wrap">
        <span className="sr-only">Sort by</span>
        <select value={sort} onChange={(e) => onSort(e.target.value)}>
          {options.map(([v, label]) => (
            <option key={v} value={v}>
              {label}
            </option>
          ))}
        </select>
        <CaretDown size={14} weight="bold" aria-hidden="true" />
      </label>
      <Toggle on={deals} onClick={() => onDeals(!deals)} icon={Tag}>
        Deals only
      </Toggle>
      <Toggle on={stock} onClick={() => onStock(!stock)} icon={CheckCircle}>
        In stock
      </Toggle>
    </div>
  );
}
