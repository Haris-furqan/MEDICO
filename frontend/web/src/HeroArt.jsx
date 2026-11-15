import StatusBadge from "./StatusBadge";
import RangeGauge from "./RangeGauge";

// Decorative hero scene: soft clouds + frosted lab glassware. Illustration only (no data).
const GLASS_PATH = "M255 120H345V270L490 540Q502 585 455 585H145Q98 585 110 540L255 270Z";

export default function HeroArt() {
  return (
    <div className="scene-wrap" aria-hidden="false">
      <span className="cloud c1" aria-hidden="true" />
      <span className="cloud c2" aria-hidden="true" />
      <span className="cloud c3" aria-hidden="true" />
      <span className="sun" aria-hidden="true" />

      <div className="scene">
        <svg viewBox="0 0 720 700" aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id="gl" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#fff" stopOpacity=".55" />
              <stop offset=".45" stopColor="#fff" stopOpacity=".08" />
              <stop offset="1" stopColor="#fff" stopOpacity=".35" />
            </linearGradient>
            <linearGradient id="lq" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#a8ecf7" stopOpacity=".92" />
              <stop offset="1" stopColor="#3b86cf" stopOpacity=".95" />
            </linearGradient>
            <linearGradient id="lq2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#c8f0d8" stopOpacity=".9" />
              <stop offset="1" stopColor="#4aa58f" stopOpacity=".95" />
            </linearGradient>
            <linearGradient id="lq3" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#d9e4ff" stopOpacity=".9" />
              <stop offset="1" stopColor="#6a7fe0" stopOpacity=".95" />
            </linearGradient>
            <clipPath id="flaskClip"><path d={GLASS_PATH} /></clipPath>
            <filter id="soft"><feGaussianBlur stdDeviation="14" /></filter>
          </defs>

          <ellipse cx="360" cy="600" rx="300" ry="20" fill="#0b2a4a" opacity=".28" filter="url(#soft)" />

          {/* Erlenmeyer flask */}
          <g className="float-a">
            <g clipPath="url(#flaskClip)">
              <g className="slosh">
                <path d="M60 420q30-16 60 0t60 0t60 0t60 0t60 0t60 0t60 0t60 0V620H60z" fill="url(#lq)" />
              </g>
              <circle className="bub b1" cx="230" cy="540" r="9" fill="#fff" fillOpacity=".55" />
              <circle className="bub b2" cx="300" cy="520" r="6" fill="#fff" fillOpacity=".5" />
              <circle className="bub b3" cx="370" cy="545" r="11" fill="#fff" fillOpacity=".45" />
              <circle className="bub b4" cx="420" cy="525" r="5" fill="#fff" fillOpacity=".55" />
            </g>
            <path d={GLASS_PATH} fill="url(#gl)" stroke="#fff" strokeOpacity=".85" strokeWidth="3" strokeLinejoin="round" />
            <rect x="240" y="100" width="120" height="24" rx="12" fill="url(#gl)" stroke="#fff" strokeOpacity=".9" strokeWidth="3" />
            <path d="M272 140V282L134 546" fill="none" stroke="#fff" strokeOpacity=".75" strokeWidth="6" strokeLinecap="round" />
            <path d="M326 150v100" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="4" strokeLinecap="round" />
            <path d="M200 400h30M210 440h20M220 480h14" stroke="#fff" strokeOpacity=".55" strokeWidth="3" strokeLinecap="round" />
          </g>

          {/* Test tubes */}
          {[
            { x: 520, top: 240, fill: "lq2", lvl: 380, cls: "float-b" },
            { x: 585, top: 200, fill: "lq3", lvl: 340, cls: "float-c" },
            { x: 650, top: 270, fill: "lq", lvl: 420, cls: "float-b" },
          ].map((t) => (
            <g key={t.x} className={t.cls}>
              <clipPath id={"tc" + t.x}>
                <path d={`M${t.x} ${t.top}h50v${560 - t.top - 25}a25 25 0 0 1-50 0z`} />
              </clipPath>
              <g clipPath={"url(#tc" + t.x + ")"}>
                <rect x={t.x} y={t.lvl} width="50" height="260" fill={"url(#" + t.fill + ")"} />
              </g>
              <path d={`M${t.x} ${t.top}h50v${560 - t.top - 25}a25 25 0 0 1-50 0z`} fill="url(#gl)" stroke="#fff" strokeOpacity=".85" strokeWidth="3" />
              <rect x={t.x - 4} y={t.top - 8} width="58" height="14" rx="7" fill="url(#gl)" stroke="#fff" strokeOpacity=".9" strokeWidth="3" />
              <path d={`M${t.x + 11} ${t.top + 16}v${t.lvl - t.top - 10}`} stroke="#fff" strokeOpacity=".7" strokeWidth="4" strokeLinecap="round" />
            </g>
          ))}
        </svg>

        <div className="hero-card" role="img" aria-label="Example result card (illustration)">
          <div className="hero-card-label">Example · illustration</div>
          <div className="hero-card-row">
            <div><strong>Hemoglobin</strong><span>13.8 g/dL</span></div>
            <StatusBadge status="normal" />
          </div>
          <RangeGauge range={{ min: 12.1, max: 15.1 }} value={13.8} status="normal" />
        </div>
      </div>
    </div>
  );
}
