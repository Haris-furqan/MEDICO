const STATUS = {
  normal:           { icon: "✔", label: "Normal" },
  low:              { icon: "▼", label: "Low" },
  high:             { icon: "▲", label: "High" },
  urgent:           { icon: "⚠", label: "Urgent" },
  abnormal:         { icon: "!", label: "Abnormal" },
  needs_info:       { icon: "ℹ", label: "Needs info" },
  cannot_classify:  { icon: "?", label: "Cannot classify" },
};

export default function StatusBadge({ status }) {
  const s = STATUS[status] || { icon: "?", label: status };
  return (
    <span className={"badge badge-" + status}>
      <span className="badge-icon" aria-hidden="true">{s.icon}</span>
      {s.label}
    </span>
  );
}
