import { useRef, useState } from "react";

const TEXT_TYPES = /\.(txt|csv|tsv|md|log|json|xml|html?|rtf)$/i;
const MAX_BYTES = 1024 * 1024; // 1 MB

export default function PasteReport({ onSubmit }) {
    const [text, setText] = useState("");
    const [fileName, setFileName] = useState("");
    const [fileError, setFileError] = useState("");
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef(null);

    async function handleFile(file) {
        if (!file) return;
        setFileError("");
        if (file.size > MAX_BYTES) {
            setFileError("That file is too large. Please choose a file under 1 MB.");
            return;
        }
        if (/\.pdf$/i.test(file.name) || file.type === "application/pdf" || file.type.startsWith("image/")) {
            setFileError(
                "PDF and image files can't be read yet. Please upload a text-based report (.txt, .csv, .json…) or paste the text below."
            );
            return;
        }
        if (!TEXT_TYPES.test(file.name) && !file.type.startsWith("text/")) {
            setFileError("Unsupported file type. Please upload a text-based report (.txt, .csv, .json…).");
            return;
        }
        try {
            const content = await file.text();
            if (!content.trim()) {
                setFileError("That file looks empty.");
                return;
            }
            setText(content);
            setFileName(file.name);
            onSubmit(content); // same call as pasting: { reportText }
        } catch {
            setFileError("Could not read that file. Please try again.");
        }
    }

    function onDrop(e) {
        e.preventDefault();
        setDragging(false);
        handleFile(e.dataTransfer.files?.[0]);
    }

    return (
        <div className="paste-box">
            <h3>
                <span className="card-icon" aria-hidden="true">🧪</span>
                Upload or paste a report
            </h3>

            <div
                className={"dropzone" + (dragging ? " dragging" : "")}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
            >
                <input
                    ref={inputRef}
                    id="report-file"
                    type="file"
                    className="file-input"
                    accept=".txt,.csv,.tsv,.md,.log,.json,.xml,.html,.htm,.rtf,text/*"
                    onChange={(e) => {
                        handleFile(e.target.files?.[0]);
                        e.target.value = "";
                    }}
                />
                <span className="dropzone-icon" aria-hidden="true">⬆</span>
                <div className="dropzone-text">
                    <strong>Drop a report document here</strong>
                    <span className="small">or</span>
                </div>
                <button type="button" className="upload-btn" onClick={() => inputRef.current?.click()}>
                    <span aria-hidden="true">📄</span> Choose document
                </button>
                {fileName && !fileError && (
                    <div className="file-chip">
                        <span aria-hidden="true">✔</span> {fileName}
                    </div>
                )}
            </div>
            {fileError && (
                <p className="error file-error" role="alert">
                    <span aria-hidden="true">⚠ </span>{fileError}
                </p>
            )}

            <div className="or-line"><span>or paste text</span></div>

            <textarea
                rows={6}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste the lab report text here..."
            />
            <button disabled={!text.trim()} onClick={() => onSubmit(text)}>
                <span aria-hidden="true">🔍</span> Analyze pasted report
            </button>
        </div>
    );
}
