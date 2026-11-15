import { useEffect, useState } from "react";
import { getPatients } from "./api";
import Icon from "./Icons";

export default function PatientPicker({ selectedId, onSelect }) {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [query, setQuery] = useState("");
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        getPatients()
            .then(setPatients)
            .catch(() => setError("Could not load the patient list. Is the API running?"))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="skeleton" style={{ marginTop: 0 }}>
            <div className="sk-line" style={{ height: "60px", borderRadius: "10px", width: "100%" }}></div>
        </div>
    );
    if (error) return <p className="error">{error}</p>;

    const LIMIT = 9;
    const q = query.trim().toLowerCase();
    const filtered = q ? patients.filter((p) => (p.name || "").toLowerCase().includes(q)) : patients;
    const visible = q || showAll ? filtered : filtered.slice(0, LIMIT);

    const initials = (name = "") =>
        name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

    return (
        <div className="picker">
            <label className="search-box">
                <Icon name="search" size={20} />
                <input
                    id="patient-search"
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search patients by name"
                    aria-label="Search patients by name"
                />
            </label>

            {visible.length === 0 ? (
                <p className="empty">No patients match “{query}”.</p>
            ) : (
                <div className="patient-list">
                    {visible.map((p) => (
                        <button
                            key={p.id}
                            className={"patient-card" + (p.id === selectedId ? " selected" : "")}
                            onClick={() => onSelect(p.id)}
                            aria-pressed={p.id === selectedId}
                        >
                            <span className="avatar" aria-hidden="true">{initials(p.name)}</span>
                            <span className="patient-body">
                                <strong className="patient-name">{p.name}</strong>
                                <span className="patient-meta">
                                    Age: {p.age ?? "Not provided"} · Sex: {p.sex ?? "Not provided"}
                                </span>
                                <span className="tags">
                                    {p.hasUrgent && (
                                        <span className="tag urgent"><Icon name="alert" size={13} /> Urgent</span>
                                    )}
                                    {p.needsInfo.length > 0 && (
                                        <span className="tag info"><Icon name="info" size={13} /> Needs info</span>
                                    )}
                                </span>
                            </span>
                            <span className="circle-arrow row-arrow"><Icon name="arrow" size={16} /></span>
                        </button>
                    ))}
                </div>
            )}

            {!q && filtered.length > LIMIT && (
                <div className="more">
                    <button type="button" className="text-link" onClick={() => setShowAll(!showAll)}>
                        {showAll ? "Show fewer patients" : `Show all ${filtered.length} patients`}
                        <Icon name={showAll ? "up" : "chevron"} size={16} />
                    </button>
                </div>
            )}
        </div>
    );
}
