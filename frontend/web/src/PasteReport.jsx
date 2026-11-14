import { useState } from "react";

export default function PasteReport({ onSubmit }) {
    const [text, setText] = useState("");

    return (
        <div className="paste-box">
            <h3>Or paste a report</h3>
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
