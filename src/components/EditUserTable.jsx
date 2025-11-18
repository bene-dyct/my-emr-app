import React, { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useParams } from "react-router-dom";

/* ----------- DATE HELPERS (bullet-proof) ----------- */

function parseToDate(value) {
  if (!value) return null;

  // Firestore Timestamp
  if (typeof value === "object" && value.seconds) {
    return new Date(value.seconds * 1000);
  }

  if (typeof value === "string") {
    const s = value.trim();

    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      return new Date(s + "T00:00");
    }

    // YYYY-MM-DDTHH:mm
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)) {
      return new Date(s);
    }

    // DD-MM-YYYY
    if (/^\d{2}-\d{2}-\d{4}$/.test(s)) {
      const [dd, mm, yyyy] = s.split("-");
      return new Date(`${yyyy}-${mm}-${dd}T00:00`);
    }

    // fallback
    const d = new Date(s);
    return isNaN(d) ? null : d;
  }

  return null;
}

function formatForDateTimeLocal(date) {
  if (!date) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return (
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    "T" +
    pad(date.getHours()) +
    ":" +
    pad(date.getMinutes())
  );
}

/* --------------------------------------------------- */

export default function EditUserTable({ userId: propUserId, onVitalsChange }) {
  const params = useParams();
  const userId = propUserId || params.userId;

  const [vitals, setVitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function load() {
      if (!userId) {
        setError("No user ID");
        setLoading(false);
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", userId));
        if (!snap.exists()) {
          setError("User not found");
          setLoading(false);
          return;
        }

        const data = snap.data();
        const arr = Array.isArray(data.vitals) ? data.vitals : [];

        // Normalize ALL formats
        const normalized = arr.map((v, i) => {
          const d = parseToDate(v.dateAdded) || new Date(); // fallback safe
          return {
            _idx: i,
            dateAdded: formatForDateTimeLocal(d),

            systolicValue: v?.systolic?.value ?? v?.systolic ?? "",
            diastolicValue: v?.diastolic?.value ?? v?.diastolic ?? "",
            pulseValue: v?.pulse?.value ?? v?.pulse ?? "",
            bloodSugarValue: v?.bloodSugar?.value ?? v?.bloodSugar ?? "",

            systolicUnit: v?.systolic?.unit ?? "mmHg",
            diastolicUnit: v?.diastolic?.unit ?? "mmHg",
            pulseUnit: v?.pulse?.unit ?? "bpm",
            bloodSugarUnit: v?.bloodSugar?.unit ?? "mg/dL",
          };
        });

        // Sort correctly
        normalized.sort((a, b) => {
          return new Date(b.dateAdded) - new Date(a.dateAdded);
        });

        if (isMounted) {
          setVitals(normalized);
          onVitalsChange?.(normalized);
        }
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setError("Failed to load vitals");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => (isMounted = false);
  }, [userId]);

  const updateValue = (i, field, value) => {
    const updated = vitals.map((v, idx) => (i === idx ? { ...v, [field]: value } : v));
    setVitals(updated);
    onVitalsChange?.(updated);
  };

  if (loading) return <div className="text-center p-4">Loading vitals...</div>;
  if (error) return <div className="text-center text-red-600 p-4">{error}</div>;
  if (!vitals.length) return <div className="text-center p-4">No vitals recorded.</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Edit Vitals History</h2>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left font-medium text-gray-600">Date Added</th>
              <th className="px-6 py-3 text-left font-medium text-gray-600">Systolic</th>
              <th className="px-6 py-3 text-left font-medium text-gray-600">Diastolic</th>
              <th className="px-6 py-3 text-left font-medium text-gray-600">Pulse</th>
              <th className="px-6 py-3 text-left font-medium text-gray-600">Blood Sugar</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {vitals.map((v, i) => (
              <tr key={i}>
                <td className="px-6 py-4">
                  <input
                    type="datetime-local"
                    value={v.dateAdded}
                    onChange={(e) => updateValue(i, "dateAdded", e.target.value)}
                    className="border rounded px-2 py-1 w-full"
                    required
                  />
                </td>

                <td className="px-6 py-4">
                  <input
                    type="number"
                    value={v.systolicValue}
                    onChange={(e) => updateValue(i, "systolicValue", e.target.value)}
                    className="border rounded px-2 py-1 w-full"
                    required
                  />
                </td>

                <td className="px-6 py-4">
                  <input
                    type="number"
                    value={v.diastolicValue}
                    onChange={(e) => updateValue(i, "diastolicValue", e.target.value)}
                    className="border rounded px-2 py-1 w-full"
                    required
                  />
                </td>

                <td className="px-6 py-4">
                  <input
                    type="number"
                    value={v.pulseValue}
                    onChange={(e) => updateValue(i, "pulseValue", e.target.value)}
                    className="border rounded px-2 py-1 w-full"
                    required
                  />
                </td>

                <td className="px-6 py-4">
                  <input
                    type="number"
                    value={v.bloodSugarValue}
                    onChange={(e) => updateValue(i, "bloodSugarValue", e.target.value)}
                    className="border rounded px-2 py-1 w-full"
                    required
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

