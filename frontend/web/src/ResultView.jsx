import ResultsTable from "./ResultsTable";

export default function ResultView({ data }) {
    const p = data.patient;
    return (
        <section className="result-view">
            <h2>{p.name}</h2>
            <p className="small">
                Age: {p.age ?? "Not provided"} · Sex: {p.sex ?? "Not provided"}
                {p.mrn && <> · MRN: {p.mrn}</>}
            </p>
            <ResultsTable results={data.results} />
        </section>
    );
}