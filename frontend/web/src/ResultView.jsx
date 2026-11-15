import { useState } from "react";
import ResultsTable from "./ResultsTable";
import StatusSummary from "./StatusSummary";
import Icon from "./Icons";
import UrgentBanner from "./UrgentBanner";
import NeedsInfoForm from "./NeedsInfoForm";
import ChatBox from "./ChatBox";
import { PlainLanguage, DoctorQuestions, Disclaimer } from "./Explanation";

export default function ResultView({ data, busy, onRerun }) {
    const [filter, setFilter] = useState(null); // visual filter for the table only
    const p = data.patient;
    const ex = data.explanation; // can be null
    const questions = <DoctorQuestions questions={ex?.doctorQuestions} />;

    return (
        <section className="result-view">
            {data.hasUrgent && <UrgentBanner warnings={ex?.warnings} />}

            {/* Patient header */}
            <div className="result-header">
                <div>
                    <h2>{p.name}</h2>
                    <div className="patient-info-pill">
                        <span>Age:</span> {p.age ?? "Not provided"}
                        {" · "}
                        <span>Sex:</span> {p.sex ?? "Not provided"}
                        {p.mrn && (
                            <>
                                {" · "}
                                <span>MRN:</span> {p.mrn}
                            </>
                        )}
                    </div>
                </div>
            </div>

            <StatusSummary results={data.results} active={filter} onChange={setFilter} />

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

            <ResultsTable results={data.results} filter={filter} />

            {ex && <PlainLanguage explanation={ex} status={data.explanationStatus} />}
            {!data.hasUrgent && questions}

            {/* key = patient id, so the chat starts fresh when you switch patients */}
            {p.id ? (
                <ChatBox key={p.id} patientId={p.id} />
            ) : (
                <p className="notice">
                    <Icon name="chat" size={18} />
                    Chat is only available for the sample patients, not for pasted reports.
                </p>
            )}

            <Disclaimer text={ex?.disclaimer} />
        </section>
    );
}
