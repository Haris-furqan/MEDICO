import Icon from "./Icons";

const ORDER = [
  ["urgent", "alert", "Urgent"],
  ["high", "up", "High"],
  ["low", "down", "Low"],
  ["abnormal", "bang", "Abnormal"],
  ["normal", "check", "Normal"],
  ["needs_info", "info", "Needs info"],
  ["cannot_classify", "help", "Cannot classify"],
];

// Counts the statuses the API already returned, and lets you filter the table by one.
export default function StatusSummary({ results, active, onChange }) {
  const counts = {};
  results.forEach((r) => {
    counts[r.status] = (counts[r.status] || 0) + 1;
  });
  const present = ORDER.filter(([k]) => counts[k]);
  const total = results.length;

  return (
    <section className="summary" aria-label="Results summary">
      <div className="summary-top">
        <h3>
          {total} result{total === 1 ? "" : "s"} in this report
        </h3>
        {active && (
          <button type="button" className="summary-clear" onClick={() => onChange(null)}>
            Show all
          </button>
        )}
      </div>
      <div className="summary-bar" aria-hidden="true">
        {present.map(([k]) => (
          <span key={k} className={"seg seg-" + k} style={{ flexGrow: counts[k] }} />
        ))}
      </div>
      <div className="summary-chips">
        {present.map(([k, icon, label]) => (
          <button
            type="button"
            key={k}
            className={"chip chip-" + k + (active === k ? " on" : "")}
            aria-pressed={active === k}
            onClick={() => onChange(active === k ? null : k)}
          >
            <Icon name={icon} size={16} />
            <span className="chip-label">{label}</span>
            <span className="chip-count">{counts[k]}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
