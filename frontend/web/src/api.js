const BASE = import.meta.env.VITE_API_URL;

export async function getPatients() {
    const res = await fetch(`${BASE}/patients`);
    if (!res.ok) throw new Error("Could not load patients");
    const data = await res.json();
    return data.patients;
}

// body is { patientId } or { reportText }
export async function analyze(body) {
    const res = await fetch(`${BASE}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
        const err = new Error(data?.error?.message || "Something went wrong");
        err.code = data?.error?.code || "UNKNOWN";
        throw err;
    }
    return data;
}

// history is [{ role: "user" | "assistant", text: "..." }]
export async function sendChat(patientId, message, history) {
    const res = await fetch(`${BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, message, history }),
    });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
        const err = new Error(data?.error?.message || "Something went wrong");
        err.code = data?.error?.code || "UNKNOWN";
        throw err;
    }
    return data; // { reply, refused, refusalReason, citations }
}