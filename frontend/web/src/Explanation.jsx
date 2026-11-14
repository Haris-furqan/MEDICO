import StatusBadge from "./StatusBadge";

export function PlainLanguage({ explanation, status }) {
    return (
        <section className="card">
            <h3>
                <span className="card-icon" style={{ background: "rgba(21,128,61,.12)" }} aria-hidden="true">📋</span>
                In simple words
            </h3>
            {status === "fallback" && (
                <p className="notice">
                    <span aria-hidden="true">⚡</span>
                    Simplified explanation: the AI helper is unavailable right now. The
                    results table is still fully correct.
                </p>
            )}
            <p style={{ marginTop: 8, lineHeight: 1.65 }}>{explanation.summary}</p>
            {explanation.perTest.map((t, i) => (
                <div className="per-test" key={i}>
                    <div className="per-test-header">
                        <strong>{t.analyte}</strong>
                        <StatusBadge status={t.status} />
                    </div>
                    <p>{t.whatItMeasures}</p>
                    <p>{t.whatItMeans}</p>
                </div>
            ))}
        </section>
    );
}

export function DoctorQuestions({ questions }) {
    if (!questions || questions.length === 0) return null;
    return (
        <section className="card questions">
            <h3>
                <span className="card-icon" aria-hidden="true">💬</span>
                Questions to ask your doctor
            </h3>
            <ul>
                {questions.map((q, i) => (
                    <li key={i}>{q}</li>
                ))}
            </ul>
        </section>
    );
}

export function Disclaimer({ text }) {
    return (
        <p className="disclaimer">
            <span className="disclaimer-icon" aria-hidden="true">ℹ</span>
            {text ||
                "This explains numbers only. It is not a diagnosis. Only a licensed doctor can diagnose conditions."}
        </p>
    );
}
