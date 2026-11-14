export default function UrgentBanner({ warnings }) {
    const lines =
        warnings && warnings.length > 0
            ? warnings
            : ["One or more results are urgent. Please see a doctor today."];

    return (
        <div className="urgent-banner" role="alert">
            <span className="urgent-icon" aria-hidden="true">⚠</span>
            <div>
                {lines.map((w, i) => (
                    <div key={i}>{w}</div>
                ))}
            </div>
        </div>
    );
}