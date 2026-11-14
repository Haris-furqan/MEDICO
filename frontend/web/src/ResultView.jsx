import ResultsTable from "./ResultsTable";
import UrgentBanner from "./UrgentBanner";
import NeedsInfoForm from "./NeedsInfoForm";
import ChatBox from "./ChatBox";
import { PlainLanguage, DoctorQuestions, Disclaimer } from "./Explanation";

export default function ResultView({ data, busy, onRerun }) {
    const p = data.patient;
    const ex = data.explanation; // can be null
    const questions = <DoctorQuestions questions={ex?.doctorQuestions} />;

    return (
        <section className="result-view">
            {data.hasUrgent && <UrgentBanner warnings={ex?.warnings} />}

            <h2>{p.name}</h2>
            <p className="small">
                Age: {p.age ?? "Not provided"} · Sex: {p.sex ?? "Not provided"}
                {p.mrn && <> · MRN: {p.mrn}</>}
            </p>

            {/* Urgent: doctor questions come first */}
            {data.hasUrgent && questions}

            {data.needsInfo.length > 0 && (
                <NeedsInfoForm
                    needsInfo={data.needsInfo}
                    results={data.results}
                    busy={busy}
                    onSubmit={onRerun}
                />
            )}

            <ResultsTable results={data.results} />

            {ex && <PlainLanguage explanation={ex} status={data.explanationStatus} />}
            {!data.hasUrgent && questions}

            {/* key = patient id, so the chat starts fresh when you switch patients */}
            {p.id ? (
                <ChatBox key={p.id} patientId={p.id} />
            ) : (
                <p className="notice">
                    Chat is only available for the sample patients, not for pasted reports.
                </p>
            )}

            <Disclaimer text={ex?.disclaimer} />
        </section>
    );
}