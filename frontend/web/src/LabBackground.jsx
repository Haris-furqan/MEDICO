import { useEffect, useRef } from "react";

// Decorative 3D medical-lab backdrop. Purely visual: no data, no API.
const RUNGS = Array.from({ length: 16 }, (_, i) => i);
const BUBBLES = Array.from({ length: 14 }, (_, i) => i);

function Flask({ className }) {
  return (
    <svg className={"lab-flask " + className} viewBox="0 0 120 160" fill="none">
      <defs>
        <linearGradient id={"liq-" + className} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2dd4bf" stopOpacity=".85" />
          <stop offset="1" stopColor="#0891b2" stopOpacity=".9" />
        </linearGradient>
        <clipPath id={"clip-" + className}>
          <path d="M45 10h30v40l35 85a12 12 0 0 1-11 17H21a12 12 0 0 1-11-17l35-85z" />
        </clipPath>
      </defs>
      <g clipPath={"url(#clip-" + className + ")"}>
        <g className="lab-liquid">
          <path d="M0 95q15-10 30 0t30 0t30 0t30 0V170H0z" fill={"url(#liq-" + className + ")"} />
        </g>
      </g>
      <path
        d="M45 10h30v40l35 85a12 12 0 0 1-11 17H21a12 12 0 0 1-11-17l35-85z"
        stroke="#67e8f9"
        strokeWidth="2.5"
        strokeLinejoin="round"
        fill="rgba(103,232,249,.07)"
      />
      <path d="M40 10h40" stroke="#67e8f9" strokeWidth="4" strokeLinecap="round" />
      <path d="M30 118l8-20" stroke="#fff" strokeOpacity=".35" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function TestTubes({ className }) {
  return (
    <svg className={"lab-tubes " + className} viewBox="0 0 150 150" fill="none">
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${12 + i * 46} 0) rotate(${i === 1 ? 0 : i === 0 ? -8 : 8} 18 75)`}>
          <path d="M4 8h28v100a14 14 0 0 1-28 0z" stroke="#67e8f9" strokeWidth="2.5" fill="rgba(103,232,249,.07)" />
          <path
            d={`M4 ${70 - i * 12}h28v38a14 14 0 0 1-28 0z`}
            fill={["#2dd4bf", "#38bdf8", "#a3e635"][i]}
            fillOpacity=".7"
          />
          <path d="M0 8h36" stroke="#67e8f9" strokeWidth="4" strokeLinecap="round" />
        </g>
      ))}
    </svg>
  );
}

export default function LabBackground() {
  const ref = useRef(null);

  // Gentle pointer parallax (CSS variables only)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    function move(e) {
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      el.style.setProperty("--mx", x.toFixed(3));
      el.style.setProperty("--my", y.toFixed(3));
    }
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);

  return (
    <div className="lab-bg" ref={ref} aria-hidden="true">
      <div className="lab-glow lab-glow-a" />
      <div className="lab-glow lab-glow-b" />
      <div className="lab-floor"><div className="lab-grid" /></div>

      <div className="lab-layer lab-layer-far">
        <Flask className="flask-a" />
        <TestTubes className="tubes-a" />
      </div>
      <div className="lab-layer lab-layer-near">
        <Flask className="flask-b" />
        <div className="helix">
          {RUNGS.map((i) => (
            <div className="rung" key={i} style={{ "--i": i }}>
              <span className="dot dot-l" />
              <span className="bar" />
              <span className="dot dot-r" />
            </div>
          ))}
        </div>
      </div>

      <div className="bubbles">
        {BUBBLES.map((i) => (
          <span
            key={i}
            style={{
              left: `${(i * 37) % 100}%`,
              "--s": `${6 + ((i * 7) % 14)}px`,
              "--d": `${12 + ((i * 5) % 14)}s`,
              "--dl": `${-(i * 2.3)}s`,
            }}
          />
        ))}
      </div>
      <div className="lab-vignette" />
    </div>
  );
}
