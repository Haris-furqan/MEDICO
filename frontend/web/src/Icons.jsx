// Small line-icon set (stroke = currentColor). Decorative: always aria-hidden.
const P = {
  search: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></>,
  upload: <><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" /></>,
  file: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></>,
  chat: <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />,
  lock: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  clipboard: <><rect x="6" y="4" width="12" height="17" rx="2" /><path d="M9 4h6v3H9zM9 12h6M9 16h4" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
  alert: <><path d="M12 3l10 18H2z" /><path d="M12 10v5M12 18h.01" /></>,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  patient: <><circle cx="10" cy="8" r="4" /><path d="M2.5 21a7.5 7.5 0 0 1 12-6" /><path d="M18 14v6M15 17h6" /></>,
  shield: <><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="M9 12l2 2 4-4" /></>,
  steps: <path d="M4 6h3M4 12h3M4 18h3M10 6h10M10 12h10M10 18h10" />,
  up: <path d="M12 19V5M5 12l7-7 7 7" />,
  down: <path d="M12 5v14M5 12l7 7 7-7" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  chevron: <path d="M6 9l6 6 6-6" />,
  bolt: <path d="M13 2L4 14h7l-1 8 9-12h-7z" />,
  flask: <><path d="M9 3h6M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2.2h12.4A1.5 1.5 0 0 0 19.5 19L14 9V3" /><path d="M7.5 15h9" /></>,
  sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />,
  repeat: <><path d="M20 11a8 8 0 0 0-14-4L4 9M4 4v5h5" /><path d="M4 13a8 8 0 0 0 14 4l2-2M20 20v-5h-5" /></>,
  bang: <><circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 16.5h.01" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01" /></>,
  chevronr: <path d="M9 5l7 7-7 7" />,
  print: <><path d="M7 9V4h10v5" /><path d="M7 17H5a1 1 0 0 1-1-1v-5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5a1 1 0 0 1-1 1h-2" /><rect x="7" y="14" width="10" height="6" rx="1" /></>,
  convert: <><path d="M7 7h12l-3-3M17 17H5l3 3" /></>,
};

export default function Icon({ name, size = 20, className = "" }) {
  return (
    <svg
      className={"icon " + className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {P[name]}
    </svg>
  );
}

export function Mark({ size = 28 }) {
  return (
    <svg className="mark" viewBox="0 0 48 48" width={size} height={size} fill="none" aria-hidden="true">
      <path d="M18 5h12v13h13v12H30v13H18V30H5V18h13z" fill="currentColor" />
    </svg>
  );
}
