const BASE = import.meta.env.VITE_API_URL;

export async function getPatients() {
    const res = await fetch(`${BASE}/patients`);
    if (!res.ok) throw new Error("Could not load patients");
    const data = await res.json();
    return data.patients;
}