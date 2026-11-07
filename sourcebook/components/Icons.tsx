// 16px outline icons, 1.5px stroke, one set.
const base = { width: 16, height: 16, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

export const IconQueue = () => (
  <svg {...base}><path d="M2.5 4h11M2.5 8h11M2.5 12h7" /></svg>
);
export const IconLink = () => (
  <svg {...base}><path d="M6.5 9.5l3-3M7 4.5l1-1a2.5 2.5 0 013.5 3.5l-1 1M9 11.5l-1 1A2.5 2.5 0 014.5 9l1-1" /></svg>
);
export const IconThesis = () => (
  <svg {...base}><circle cx="8" cy="8" r="5.5" /><circle cx="8" cy="8" r="2" /></svg>
);
export const IconExport = () => (
  <svg {...base}><path d="M8 2.5v7.5M5 7l3 3 3-3M3 12.5h10" /></svg>
);
export const IconRules = () => (
  <svg {...base}><path d="M4 2.5h6l2.5 2.5v8.5H4zM6 7.5h4M6 10h4" /></svg>
);

/** The product mark: an open bracket around a filled square — a quoted, checked fact. */
export const Mark = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 22 22" aria-hidden="true">
    <rect width="22" height="22" rx="5" fill="#141414" />
    <path d="M8 5.5H6v11h2M14 5.5h2v11h-2" stroke="#fff" strokeWidth="1.6" fill="none" />
    <rect x="9" y="9" width="4" height="4" rx="0.8" fill="#6f9fe6" />
  </svg>
);
