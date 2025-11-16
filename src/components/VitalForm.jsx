import { useState } from "react";
import { db } from "../firebaseConfig";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";

export default function VitalForm({ userId, onSave, saving }) {
  const [vitalsList, setVitalsList] = useState([
    { systolic: "", diastolic: "", pulse: "", bloodSugar: "", dateAdded: "" }
  ]);
  const [loading, setLoading] = useState(false)

  const handleChange = (index, e) => {
    const { name, value } = e.target;
    const updatedList = [...vitalsList];
    updatedList[index][name] = value;
    setVitalsList(updatedList);
  };

  const addVitalEntry = () => {
    setVitalsList([
      ...vitalsList,
      { systolic: "", diastolic: "", pulse: "", bloodSugar: "", dateAdded: "" }
    ]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (!userId) return alert("No user selected");

    try {
      const userRef = doc(db, "users", userId);

      // Convert each entry to include value + unit
      const formattedVitals = vitalsList.map(vital => {
  const selectedDate = new Date(vital.dateAdded);
  const now = new Date();

  // Combine selected date with current local time
  const combinedDateTime = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    selectedDate.getDate(),
    now.getHours(),
    now.getMinutes(),
    now.getSeconds()
  );

  // Helper to format YYYY-MM-DD HH:mm:ss in local time
  const formatLocalISO = (date) => {
    const pad = (n) => n.toString().padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  };

  return {
    systolic: { value: Number(vital.systolic), unit: "mmHg" },
    diastolic: { value: Number(vital.diastolic), unit: "mmHg" },
    pulse: { value: Number(vital.pulse), unit: "bpm" },
    bloodSugar: { value: Number(vital.bloodSugar), unit: "mg/dL" },
    dateAdded: formatLocalISO(combinedDateTime), // ✅ consistent ISO-like local timestamp
  };
});


      // Upload using arrayUnion (preserves existing entries)
      await updateDoc(userRef, {
        vitals: arrayUnion(...formattedVitals),
        lastUpdated: new Date().toISOString(),
      });

      if (onSave) onSave(formattedVitals);

      // Reset UI form
      setVitalsList([
        { systolic: "", diastolic: "", pulse: "", bloodSugar: "", dateAdded: "" }
      ]);

    } catch (error) {
      console.error("Error saving vitals:", error);
      alert("Failed to save vitals. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded-md bg-white">
      <h3 className="text-xl font-semibold mb-3">Enter Vitals</h3>

      {vitalsList.map((vital, index) => (
        <div key={index} className="mb-4">

           {/* DATE */}
          <input
            type="date"
            name="dateAdded"
            className="border p-2 w-full mb-2"
            value={vital.dateAdded}
            onChange={(e) => handleChange(index, e)}
            required
            disabled={saving}
          />

          {/* SYSTOLIC */}
          <input
            type="number"
            name="systolic"
            placeholder="Systolic (mmHg)"
            className="border p-2 w-full mb-2"
            value={vital.systolic}
            onChange={(e) => handleChange(index, e)}
            required
            disabled={saving}
          />

          {/* DIASTOLIC */}
          <input
            type="number"
            name="diastolic"
            placeholder="Diastolic (mmHg)"
            className="border p-2 w-full mb-2"
            value={vital.diastolic}
            onChange={(e) => handleChange(index, e)}
            required
            disabled={saving}
          />

          {/* PULSE */}
          <input
            type="number"
            name="pulse"
            placeholder="Pulse (bpm)"
            className="border p-2 w-full mb-2"
            value={vital.pulse}
            onChange={(e) => handleChange(index, e)}
            required
            disabled={saving}
          />

          {/* BLOOD SUGAR */}
          <input
            type="number"
            name="bloodSugar"
            placeholder="Blood Sugar (mg/dL)"
            className="border p-2 w-full mb-2"
            value={vital.bloodSugar}
            onChange={(e) => handleChange(index, e)}
            required
            disabled={saving}
          />

        </div>
      ))}

      <button
        type="button"
        onClick={addVitalEntry}
        className="bg-[#6930C3] cursor-pointer hover:bg-[#7400B8] text-white px-4 py-2 rounded mb-4"
      >
        Add Vitals
      </button>

      <button
        className="bg-green-600 cursor-pointer text-white px-4 py-2 rounded w-full"
        disabled={loading}
      >
        {loading ? "Saving..." : "Save Vitals"}
      </button>
    </form>
  );
}
