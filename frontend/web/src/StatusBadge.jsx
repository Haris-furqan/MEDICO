import Icon from "./Icons";

// Every status shows a WORD and an ICON, never colour alone.
const STATUS = {
  normal:          { icon: "check", label: "Normal" },
  low:             { icon: "down",  label: "Low" },
  high:            { icon: "up",    label: "High" },
  urgent:          { icon: "alert", label: "Urgent" },
  abnormal:        { icon: "bang",  label: "Abnormal" },
  needs_info:      { icon: "info",  label: "Needs info" },
  cannot_classify: { icon: "help",  label: "Cannot classify" },
};

export default function StatusBadge({ status }) {
  const s = STATUS[status] || { icon: "help", label: status };
  return (
    <span className={"badge badge-" + status}>
      <Icon name={s.icon} size={14} className="badge-icon" />
      {s.label}
    </span>
  );
}
