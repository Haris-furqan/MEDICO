import Icon from "./Icons";

export default function UrgentBanner({ warnings }) {
    const lines =
        warnings && warnings.length > 0
            ? warnings
            : ["One or more results are urgent. Please see a doctor today."];

    return (
        <div className="urgent-banner" role="alert">
            <Icon name="alert" size={30} className="urgent-icon" />
            <div className="urgent-banner-body">
                <div className="urgent-banner-title">
                    Urgent — Action Required
                </div>
                {lines.map((w, i) => (
                    <div key={i} className="urgent-banner-line">{w}</div>
                ))}
            </div>
        </div>
    );
}
