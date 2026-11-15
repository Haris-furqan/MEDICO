import { useRef, useState } from "react";
import Icon from "./Icons";

const TEXT_TYPES = /\.(txt|csv|tsv|md|log|json|xml|html?|rtf)$/i;
const MAX_BYTES = 1024 * 1024; // 1 MB

const SAMPLE = `# MEDICO SAMPLE LAB REPORT

## SECTION I: PATIENT DETAILS
* **Patient Full Name:** Jordan Sample
* **Recorded Age:** 42
* **Biological Sex:** Female
* **Medical Record Number (MRN):** MED-0001

## SECTION III: RESULTS
* Hemoglobin: 11.2 g/dL
* Fasting Blood Sugar: 108 mg/dL
* Platelet Count: 250000 cells/mcL
* SGPT: 35 U/L
`;

// Quick, client-side sanity check (advice only; the server stays the judge).
function looksLikeReport(text) {
    if (/^#{1,3}\s*SECTION III/im.test(text)) return true;
    const rows = text.match(/^[\s*\-•|]*\**[A-Za-z][^:|>\n]{1,40}\**\s*(?::|->|\|)\s*\**\s*-?\d/gm);
    return (rows?.length ?? 0) >= 2;
}

function fmtSize(n) {
    return n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} KB`;
}

export default function PasteReport({ onSubmit }) {
    const [text, setText] = useState("");
    const [file, setFile] = useState(null); // { name, size }
    const [fileError, setFileError] = useState("");
    const [warning, setWarning] = useState("");
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef(null);

    function check(content) {
        setWarning(
            looksLikeReport(content)
                ? ""
                : "This doesn't look like a lab report: no test results were found (for example “Hemoglobin: 11.2 g/dL”). A glossary or notes file can't be analyzed."
        );
    }

    async function handleFile(f) {
        if (!f) return;
        setFileError("");
        setWarning("");
        if (f.size > MAX_BYTES) {
            setFileError("That file is too large. Please choose a file under 1 MB.");
            return;
        }
        if (/\.pdf$/i.test(f.name) || f.type === "application/pdf" || f.type.startsWith("image/")) {
            setFileError(
                "PDF and image files can't be read yet. Please upload a text-based report (.txt, .md, .csv…) or paste the text below."
            );
            return;
        }
        if (!TEXT_TYPES.test(f.name) && !f.type.startsWith("text/")) {
            setFileError("Unsupported file type. Please upload a text-based report (.txt, .md, .csv…).");
            return;
        }
        try {
            const content = await f.text();
            if (!content.trim()) {
                setFileError("That file looks empty.");
                return;
            }
            setText(content);
            setFile({ name: f.name, size: f.size });
            if (looksLikeReport(content)) {
                onSubmit(content); // same call as pasting: { reportText }
            } else {
                check(content); // don't send an obvious non-report; let the person decide
            }
        } catch {
            setFileError("Could not read that file. Please try again.");
        }
    }

    function clearAll() {
        setText("");
        setFile(null);
        setFileError("");
        setWarning("");
    }

    function loadSample() {
        setText(SAMPLE);
        setFile({ name: "medico-sample-report.txt", size: SAMPLE.length });
        setFileError("");
        setWarning("");
        onSubmit(SAMPLE);
    }

    return (
        <div className="paste-box">
            <h3>
                <span className="card-icon" aria-hidden="true"><Icon name="flask" size={20} /></span>
                Upload or paste a report
                <button type="button" className="sample-btn" onClick={loadSample}>
                    <Icon name="sparkle" size={16} /> Try a sample
                </button>
            </h3>

            <div
                className={"dropzone" + (dragging ? " dragging" : "")}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    handleFile(e.dataTransfer.files?.[0]);
                }}
            >
                <input
                    ref={inputRef}
                    type="file"
                    className="file-input"
                    accept=".txt,.csv,.tsv,.md,.log,.json,.xml,.html,.htm,.rtf,text/*"
                    onChange={(e) => {
                        handleFile(e.target.files?.[0]);
                        e.target.value = "";
                    }}
                />
                <span className="dropzone-icon" aria-hidden="true"><Icon name="upload" size={26} /></span>
                <div className="dropzone-text">
                    <strong>Drop a report document here</strong>
                    <span className="small">.txt · .md · .csv · .json · up to 1 MB</span>
                </div>
                <button type="button" className="upload-btn" onClick={() => inputRef.current?.click()}>
                    <Icon name="file" size={18} /> Choose document
                </button>
                {file && (
                    <div className={"file-chip" + (warning ? " warn" : "")}>
                        <Icon name={warning ? "alert" : "check"} size={16} />
                        {file.name} <span className="small">({fmtSize(file.size)})</span>
                        <button type="button" className="chip-x" onClick={clearAll} aria-label="Remove file"><Icon name="x" size={12} /></button>
                    </div>
                )}
            </div>

            {fileError && (
                <p className="error file-error" role="alert">
                    <Icon name="alert" size={16} /> {fileError}
                </p>
            )}
            {warning && (
                <div className="warn-box" role="alert">
                    <Icon name="alert" size={22} />
                    <div>
                        {warning}
                        <div className="small">
                            You can still press “Analyze” below, or{" "}
                            <button type="button" className="inline-link" onClick={loadSample}>try the sample report</button>.
                        </div>
                    </div>
                </div>
            )}

            <details className="format-help">
                <summary>What does a readable report look like?</summary>
                <p className="small">
                    It needs a results section with one test per line, like this:
                </p>
                <pre className="mono">{SAMPLE}</pre>
            </details>

            <div className="or-line"><span>or paste text</span></div>

            <textarea
                rows={6}
                value={text}
                onChange={(e) => {
                    setText(e.target.value);
                    setWarning("");
                }}
                placeholder="Paste the lab report text here..."
            />
            <button disabled={!text.trim()} onClick={() => onSubmit(text)}>
                <Icon name="search" size={18} /> Analyze {file ? "report" : "pasted report"}
            </button>
        </div>
    );
}
