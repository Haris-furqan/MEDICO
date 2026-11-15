import { useEffect, useState } from "react";
import Icon, { Mark } from "./Icons";
import HeroArt from "./HeroArt";
import SiteHeader from "./SiteHeader";
import PatientPicker from "./PatientPicker";
import PasteReport from "./PasteReport";
import ResultView from "./ResultView";
import { analyze } from "./api";

function friendlyError(err) {
  if (err.code === "NO_RESULTS_FOUND")
    return "We couldn't read any test results from this report. Please check the text and try again.";
  if (err.code === "PATIENT_NOT_FOUND")
    return "That patient could not be found.";
  if (err instanceof TypeError)
    return "Can't reach the server. Please check that the API is running.";
  return err.message || "Something went wrong. Please try again.";
}

function Skeleton() {
  return (
    <div className="skeleton">
      <div className="sk-line wide"></div>
      <div className="sk-line" style={{ width: "80%" }}></div>
      <div className="sk-line" style={{ width: "65%" }}></div>
      <div className="sk-line" style={{ width: "75%" }}></div>
      <div className="sk-line" style={{ width: "55%" }}></div>
    </div>
  );
}

export default function App() {
  const [selection, setSelection] = useState(null); // { patientId } or { reportText }
  const [demographics, setDemographics] = useState(null); // { age?, sex? } or null
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("patients"); // visual only: which input panel is shown

  function choose(newSelection) {
    setDemographics(null); // a new choice starts fresh
    setSelection(newSelection);
  }

  useEffect(() => {
    if (!selection) return;
    let cancelled = false;

    setLoading(true);
    setError("");
    // For a fresh choice, clear the old result.
    // For a re-run with demographics, keep showing the old results meanwhile.
    if (demographics === null) setData(null);

    const body = demographics ? { ...selection, demographics } : selection;

    analyze(body)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((err) => {
        if (!cancelled) setError(friendlyError(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selection, demographics]);

  // Visual only: bring the results into view when a new report is chosen.
  useEffect(() => {
    if (!selection) return;
    const t = setTimeout(() => {
      document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
    return () => clearTimeout(t);
  }, [selection]);

  return (
    <div className="site" id="top">
      <div className="page-bg" aria-hidden="true">
        <span className="orb orb-a" /><span className="orb orb-b" /><span className="orb orb-c" />
      </div>

      <SiteHeader tab={tab} setTab={setTab} />

      <div className="shell">
        {/* Hero */}
        <div className="frame" id="hero">
          <section className="hero">
            <HeroArt />
            <div className="hero-copy">
              <p className="tag-pill"><span className="dot" /> Lab reports, explained</p>
              <h1>
                Smart Lab Results
                <span className="h1-line"><Mark size={64} /> Explained</span>
                In Plain Words
              </h1>
            </div>
            <div className="hero-side">
              <p>
                Medico reads a lab report, marks every value, places it on its normal range and
                explains it in simple words, so you know what to ask your doctor.
              </p>
              <a className="btn-white" href="#start" onClick={() => setTab("upload")}>
                Analyze a report <span className="circle-arrow dark"><Icon name="arrow" size={18} /></span>
              </a>
            </div>
            <div className="hero-stat">
              <span className="stat-icons" aria-hidden="true">
                <span><Icon name="check" size={18} /></span>
                <span><Icon name="down" size={18} /></span>
                <span><Icon name="alert" size={18} /></span>
              </span>
              <span className="stat-text">
                <strong>7 status labels</strong>
                <span>Always a word and an icon</span>
              </span>
            </div>
          </section>
        </div>

        <main>
          {/* Choose a report */}
          <section className="section" id="start">
            <div className="panel glass">
              <div className="panel-head">
                <div>
                  <p className="kicker">Step 1</p>
                  <h2>Choose a report</h2>
                  <p className="sub">
                    Pick a sample patient, or upload or paste your own report.
                  </p>
                </div>
                <div className="seg-tabs" role="tablist" aria-label="Choose a report source">
                  <button type="button" role="tab" aria-selected={tab === "patients"}
                    className={"seg-tab" + (tab === "patients" ? " active" : "")} onClick={() => setTab("patients")}>
                    Sample patients
                  </button>
                  <button type="button" role="tab" aria-selected={tab === "upload"}
                    className={"seg-tab" + (tab === "upload" ? " active" : "")} onClick={() => setTab("upload")}>
                    Upload or paste
                  </button>
                </div>
              </div>

              <div hidden={tab !== "patients"}>
                <PatientPicker
                  selectedId={selection?.patientId}
                  onSelect={(id) => choose({ patientId: id })}
                />
              </div>
              <div hidden={tab !== "upload"}>
                <PasteReport onSubmit={(text) => choose({ reportText: text })} />
              </div>
            </div>
          </section>

          {/* Results */}
          {(loading || error || data) && (
            <section className="section results-section" id="results">
              {loading && !data && <Skeleton />}
              {error && (
                <div className="error-box" role="alert">
                  <Icon name="alert" size={24} className="error-box-icon" />
                  {error}
                </div>
              )}
              {data && (
                <ResultView data={data} busy={loading} onRerun={setDemographics} />
              )}
            </section>
          )}

          {/* How it works */}
          <section className="section" id="how">
            <div className="panel glass">
              <div className="panel-head">
                <div>
                  <p className="kicker">How it works</p>
                  <h2>Three steps to clarity</h2>
                </div>
              </div>
              <div className="steps3">
                <article className="step">
                  <span className="step-num">01</span>
                  <h3>Choose a report</h3>
                  <p>A sample patient, an uploaded file or pasted text.</p>
                </article>
                <article className="step">
                  <span className="step-num">02</span>
                  <h3>See every value</h3>
                  <p>Each result is marked, placed on its normal range and explained.</p>
                </article>
                <article className="step">
                  <span className="step-num">03</span>
                  <h3>Ask your questions</h3>
                  <p>Get questions for your doctor, or chat about the open report.</p>
                </article>
              </div>
            </div>
          </section>

          <section className="section">
            <div className="panel glass">
              <div className="panel-head">
                <div>
                  <p className="kicker">Why Medico</p>
                  <h2>We explain the numbers. We never diagnose.</h2>
                </div>
              </div>
              <ul className="tiles">
                <li><span className="tile-icon"><Icon name="clipboard" size={22} /></span><strong>Plain words</strong><span>Written at a class 8 reading level.</span></li>
                <li><span className="tile-icon"><Icon name="shield" size={22} /></span><strong>Never diagnoses</strong><span>Explains numbers, not conditions.</span></li>
                <li><span className="tile-icon"><Icon name="alert" size={22} /></span><strong>Urgent first</strong><span>Critical values sit at the very top.</span></li>
                <li><span className="tile-icon"><Icon name="steps" size={22} /></span><strong>Shows its working</strong><span>Steps and source for every result.</span></li>
                <li><span className="tile-icon"><Icon name="convert" size={22} /></span><strong>Units converted</strong><span>Both values are shown side by side.</span></li>
                <li><span className="tile-icon"><Icon name="lock" size={22} /></span><strong>Private chat</strong><span>Only about the report that is open.</span></li>
              </ul>
            </div>
          </section>
        </main>

        <footer className="foot-frame" id="disclaimer">
          <div className="foot">
            <div className="foot-brand"><Mark size={30} /> Medico</div>
            <p>
              This explains numbers only. It is not a diagnosis. Only a licensed doctor can
              diagnose conditions.
            </p>
            <a href="#top" className="foot-top">Back to top <span className="circle-arrow light"><Icon name="up" size={16} /></span></a>
          </div>
        </footer>
      </div>
    </div>
  );
}
