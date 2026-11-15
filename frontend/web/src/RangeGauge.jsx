// Draws WHERE a value sits on the normal range the API returned.
// It never decides a status: the status badge (from the API) stays the source of truth.
export default function RangeGauge({ range, value, status }) {
  if (
    !range ||
    typeof range.min !== "number" ||
    typeof range.max !== "number" ||
    typeof value !== "number" ||
    range.max <= range.min
  )
    return null;

  const span = range.max - range.min;
  const lo = range.min - span * 0.75;
  const hi = range.max + span * 0.75;
  const pct = (v) => Math.min(100, Math.max(0, ((v - lo) / (hi - lo)) * 100));
  const a = pct(range.min);
  const b = pct(range.max);
  const pos = pct(value);

  return (
    <div className="gauge" aria-hidden="true">
      <div className="gauge-track">
        <span className="gauge-band" style={{ left: a + "%", width: b - a + "%" }} />
        <span className={"gauge-marker gm-" + status} style={{ left: pos + "%" }} />
      </div>
      <div className="gauge-scale">
        <span style={{ left: a + "%" }}>{range.min}</span>
        <span style={{ left: b + "%" }}>{range.max}</span>
      </div>
    </div>
  );
}
