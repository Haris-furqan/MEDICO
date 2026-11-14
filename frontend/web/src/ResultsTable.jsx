import { useState } from "react";
import StatusBadge from "./StatusBadge";

function formatRange(range) {
    if (!range) return "No range available";
    if (range.expected !== undefined) return `Expected: ${range.expected}`;
    return `${range.min} – ${range.max} ${range.unit} (${range.sex})`;
}

function ResultRow({ r }) {
    const [open, setOpen] = useState(false);

    const name = r.analyte ?? r.rawName;
    const showRawName = r.analyte && r.rawName !== r.analyte;
    // Show the converted value only when it is different from the printed one
    const converted =
        r.standardValue !== undefined && r.standardValue !== r.value;

    return (
        <>
            <tr className={"row-" + r.status}>
                <td data-label="Test">
                    <strong>{name}</strong>
                    {showRawName && (
                        <div className="small">printed as "{r.rawName}"</div>
                    )}
                    {r.reason && (
                        <div className="small reason">{r.reason}</div>
                    )}
                </td>
                <td className="mono" data-label="Value">
                    {r.value} {r.unit}
                    {converted && (
                        <div className="small">
                            = {r.standardValue} {r.standardUnit}
                        </div>
                    )}
                </td>
                <td data-label="Status">
                    <StatusBadge status={r.status} />
                </td>
                <td className="small" data-label="Normal range" style={{ color: "var(--clr-text)" }}>
                    {formatRange(r.range)}
                </td>
                <td>
                    <button
                        className="link-btn"
                        onClick={() => setOpen(!open)}
                        aria-expanded={open}
                    >
                        <span aria-hidden="true">{open ? "▴" : "▾"}</span>
                        {open ? "Hide" : "How we got this"}
                    </button>
                </td>
            </tr>

            {open && (
                <tr className="steps-row">
                    <td colSpan={5}>
                        <div className="steps-panel">
                            <strong>Steps:</strong>
                            <ol>
                                {r.steps.map((s, i) => (
                                    <li key={i}>{s}</li>
                                ))}
                            </ol>
                            <div className="steps-source">
                                <span aria-hidden="true">📋</span>
                                Source:{" "}
                                {r.source
                                    ? r.source
                                    : "No source (no range was chosen)"}
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

export default function ResultsTable({ results }) {
    return (
        <div className="table-wrap">
            <table className="results">
                <thead>
                    <tr>
                        <th>Test</th>
                        <th>Value</th>
                        <th>Status</th>
                        <th>Normal range</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {results.map((r, i) => (
                        <ResultRow key={i} r={r} />
                    ))}
                </tbody>
            </table>
        </div>
    );
}
