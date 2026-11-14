import StatusBadge from "./StatusBadge";

export function PlainLanguage({ explanation, status }) {
    return (
        <section className="card">
            <h3>In simple words</h3>
            {status === "fallback" && (
                <p className="notice">
                    Simplified explanation: the AI helper is unavailable right now. The
                    results table is still fully correct.
                </p>
            )}
            <p>{explanation.summary}</p>
            {explanation.perTest.map((t, i) => (
                <div className="per-test" key={i}>
                    <strong>{t.analyte}</strong> <StatusBadge status={t.status} />
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
        <section className="card">
            <h3>Questions to ask your doctor</h3>
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
            {text ||
                "This explains numbers only. It is not a diagnosis. Only a licensed doctor can diagnose conditions."}
        </p>
    );
}