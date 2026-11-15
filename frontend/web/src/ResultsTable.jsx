import { useState } from "react";
import Icon from "./Icons";
import StatusBadge from "./StatusBadge";
import RangeGauge from "./RangeGauge";

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
                <td className="small range-cell" data-label="Normal range" style={{ color: "var(--clr-text)" }}>
                    {formatRange(r.range)}
                    <RangeGauge range={r.range} value={r.standardValue ?? r.value} status={r.status} />
                </td>
                <td>
                    <button
                        className="link-btn"
                        onClick={() => setOpen(!open)}
                        aria-expanded={open}
                    >
                        <Icon name="chevron" size={16} className={open ? "flip" : ""} />
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
                                <Icon name="clipboard" size={16} />
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

export default function ResultsTable({ results, filter }) {
    const rows = results.map((r, i) => ({ r, i })).filter(({ r }) => !filter || r.status === filter);
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
                    {rows.map(({ r, i }) => (
                        <ResultRow key={i} r={r} />
                    ))}
                </tbody>
            </table>
        </div>
    );
}
