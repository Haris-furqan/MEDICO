import { useState } from "react";

export default function NeedsInfoForm({ needsInfo, results, busy, onSubmit }) {
    const [age, setAge] = useState("");
    const [sex, setSex] = useState("");
    const [formError, setFormError] = useState("");

    // A field is required only if some test really needs it
    const requiredFields = new Set(results.flatMap((r) => r.neededMissing || []));

    function handleSubmit(e) {
        e.preventDefault();
        const demographics = {};

        if (needsInfo.includes("age") && age !== "") {
            const n = Number(age);
            if (!Number.isInteger(n) || n < 0 || n > 120) {
                setFormError("Age must be a whole number between 0 and 120.");
                return;
            }
            demographics.age = n;
        }
        if (needsInfo.includes("sex") && sex) {
            demographics.sex = sex;
        }

        for (const field of needsInfo) {
            if (requiredFields.has(field) && demographics[field] === undefined) {
                setFormError(`Please provide ${field}. It is needed to choose the right range.`);
                return;
            }
        }
        if (Object.keys(demographics).length === 0) {
            setFormError("Please fill in at least one field.");
            return;
        }

        setFormError("");
        onSubmit(demographics);
    }

    return (
        <form className="card needs-info" onSubmit={handleSubmit}>
            <h3>
                <span className="card-icon" aria-hidden="true">ℹ</span>
                More information needed
            </h3>
            <p className="small">
                The right normal range can't be chosen without this. What you type here
                is not saved. It only re-runs the analysis.
            </p>

            <div className="form-row">
                {needsInfo.includes("age") && (
                    <label>
                        Age{" "}
                        <span style={{ fontWeight: 400, color: "var(--clr-text-faint)" }}>
                            {requiredFields.has("age") ? "(required)" : "(optional)"}
                        </span>
                        <input
                            type="number"
                            min="0"
                            max="120"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                        />
                    </label>
                )}
                {needsInfo.includes("sex") && (
                    <label>
                        Sex{" "}
                        <span style={{ fontWeight: 400, color: "var(--clr-text-faint)" }}>
                            {requiredFields.has("sex") ? "(required)" : "(optional)"}
                        </span>
                        <select value={sex} onChange={(e) => setSex(e.target.value)}>
                            <option value="">Select...</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                    </label>
                )}
                <button type="submit" disabled={busy}>
                    {busy ? (
                        <>Updating...</>
                    ) : (
                        <><span aria-hidden="true">&#8635;</span> Update results</>
                    )}
                </button>
            </div>
            {formError && (
                <p className="error" style={{ marginTop: 10, fontSize: 13 }}>
                    {formError}
                </p>
            )}
        </form>
    );
}
