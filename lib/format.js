const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
export const money = (n) => inr.format(n || 0);

const DAY = 86_400_000;
const HOUR = 3_600_000;
const MIN = 60_000;

function span(ms) {
  const d = Math.floor(ms / DAY);
  const h = Math.floor((ms % DAY) / HOUR);
  const m = Math.floor((ms % HOUR) / MIN);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// Remaining time for a rental. `now` is a ms timestamp already corrected to the server clock.
export function remaining(dueAt, startedAt, now) {
  const due = Date.parse(dueAt);
  const ms = due - now;
  const overdue = ms < 0;
  const total = Math.max(1, due - Date.parse(startedAt));
  return {
    overdue,
    daysLeft: overdue ? 0 : Math.ceil(ms / DAY),
    detail: overdue ? `Overdue by ${span(-ms)}` : `${span(ms)} remaining`,
    state: overdue ? 'overdue' : ms < DAY ? 'soon' : 'ok',
    elapsed: Math.min(1, Math.max(0, 1 - ms / total)),
  };
}

export function untilEnd(endsAt, now) {
  const ms = Date.parse(endsAt) - now;
  return ms <= 0 ? 'Ended' : `Ends in ${span(ms)}`;
}

export const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

export const fmtDateTime = (iso) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

// <input type="datetime-local"> wants local time without a zone suffix.
export function toLocalInput(iso) {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}
