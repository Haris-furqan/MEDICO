import { useEffect, useRef, useState } from "react";
import { sendChat } from "./api";

const WELCOME = {
    role: "assistant",
    text: "Hi! Ask me about the results in this report, for example: “What does my hemoglobin mean?”",
};

export default function ChatBox({ patientId }) {
    const [messages, setMessages] = useState([WELCOME]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const bottomRef = useRef(null);

    // Scroll to the newest message
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, sending]);

    async function handleSend(e) {
        e.preventDefault();
        const text = input.trim();
        if (!text || sending) return;

        // History = real conversation only (no welcome, no errors), last 10 turns
        const history = messages
            .filter((m) => m !== WELCOME && !m.isError)
            .slice(-10)
            .map((m) => ({ role: m.role, text: m.text }));

        setMessages((prev) => [...prev, { role: "user", text }]);
        setInput("");
        setSending(true);

        try {
            const res = await sendChat(patientId, text, history);
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    text: res.reply,
                    refused: res.refused,
                    citations: res.citations || [],
                },
            ]);
        } catch (err) {
            const friendly =
                err instanceof TypeError
                    ? "Can't reach the server. Please check that the API is running."
                    : err.message || "Something went wrong. Please try again.";
            setMessages((prev) => [
                ...prev,
                { role: "assistant", text: friendly, isError: true },
            ]);
        } finally {
            setSending(false);
        }
    }

    return (
        <section className="card chat">
            <h3>Ask about this report</h3>
            <p className="small">
                I can only talk about the report that is open. I can't diagnose.
            </p>

            <div className="chat-log" aria-live="polite">
                {messages.map((m, i) => {
                    if (m.refused) {
                        return (
                            <div className="bubble bubble-refused" key={i}>
                                <strong>
                                    <span aria-hidden="true">🔒</span> I can't share that
                                </strong>
                                <div>{m.text}</div>
                                <Citations list={m.citations} />
                            </div>
                        );
                    }
                    if (m.isError) {
                        return (
                            <div className="bubble bubble-error" key={i}>
                                {m.text}
                            </div>
                        );
                    }
                    return (
                        <div
                            className={"bubble " + (m.role === "user" ? "bubble-user" : "bubble-bot")}
                            key={i}
                        >
                            {m.text}
                            {m.role === "assistant" && <Citations list={m.citations} />}
                        </div>
                    );
                })}
                {sending && <div className="bubble bubble-bot typing">Thinking...</div>}
                <div ref={bottomRef} />
            </div>

            <form className="chat-form" onSubmit={handleSend}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your question..."
                    disabled={sending}
                />
                <button type="submit" disabled={sending || !input.trim()}>
                    Send
                </button>
            </form>
        </section>
    );
}

function Citations({ list }) {
    if (!list || list.length === 0) return null;
    return <div className="citations">Source: {list.join(", ")}</div>;
}