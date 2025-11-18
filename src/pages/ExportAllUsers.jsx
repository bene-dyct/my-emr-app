import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db, logFirebaseEvent } from "../firebaseConfig";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function ExportAllUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateRange, setDateRange] = useState("all");

  // Log page view
  useEffect(() => {
    logFirebaseEvent("page_view", {
      page_name: "ExportAllUsers",
      admin_level: "tier2",
      timestamp: new Date().toISOString()
    });
  }, []);

  // Fetch users + vitals
  useEffect(() => {
    const fetchData = async () => {
      try {
        const snapshot = await getDocs(collection(db, "users"));
        const allUsers = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(allUsers);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("Failed to fetch user data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Utility: filter vitals by date range
  const filterVitalsByRange = (vitals = [], range) => {
    if (range === "all" || !vitals.length) return vitals;

    const today = new Date();
    let cutoff = new Date();

    switch (range) {
      case "7":
        cutoff.setDate(today.getDate() - 7);
        break;
      case "30":
        cutoff.setDate(today.getDate() - 30);
        break;
      case "90":
        cutoff.setDate(today.getDate() - 90);
        break;
      case "120":
        cutoff.setDate(today.getDate() - 120);
        break;
      case "over120":
        cutoff = new Date(0); // keep all (handled separately below)
        break;
      default:
        cutoff = new Date(0);
    }

    return vitals.filter((v) => {
      // robust date parsing for many formats
      const d = new Date(v?.dateAdded || v?.date || "");
      if (Number.isNaN(d.getTime())) return false;
      if (range === "over120") {
        const over120 = new Date();
        over120.setDate(today.getDate() - 120);
        return d < over120;
      }
      return d >= cutoff;
    });
  };

  // Return numeric/primitive value if present
  const readRawValue = (entry, key) => {
    if (!entry) return "";
    if (entry[key] !== undefined && entry[key] !== null) {
      const v = entry[key];
      if (typeof v === "object" && v !== null && "value" in v) return v.value;
      return v;
    }
    const alt = `${key}Value`;
    if (entry[alt] !== undefined && entry[alt] !== null) return entry[alt];
    return "";
  };

  // Return unit if present in various shapes
  const readUnit = (entry, key, fallback) => {
    if (!entry) return fallback || "";
    const obj = entry[key];
    if (obj && typeof obj === "object" && "unit" in obj) return obj.unit || fallback || "";
    if (entry[`${key}Unit`]) return entry[`${key}Unit`] || fallback || "";
    return fallback || "";
  };

  // Compose "value unit" string similar to weight/height formatting
  const getVitalString = (entry, key, defaultUnit) => {
    const val = readRawValue(entry, key);
    if (val === "" || val === null || val === undefined) return "";
    const unit = readUnit(entry, key, defaultUnit);
    // If value already contains unit (string like "120 mmHg"), return as-is
    if (typeof val === "string" && /\d+\s*[a-zA-Z%/]+/.test(val)) return val;
    return `${val}${unit ? " " + unit : ""}`;
  };

  // Normalize a vital record so export consistently reads fields
  const normalizeVitalRecord = (v) => {
    const dateAdded = v?.dateAdded ?? v?.date ?? "";
    return {
      DateAdded: dateAdded,
      Systolic: getVitalString(v, "systolic", "mmHg"),
      Diastolic: getVitalString(v, "diastolic", "mmHg"),
      Pulse: getVitalString(v, "pulse", "bpm"),
      BloodSugar: getVitalString(v, "bloodSugar", "mg/dL"),
    };
  };

  // Sort users by id (used for ordering) but do not include id in exported rows
  const getSortedUsers = () => {
    return [...users].sort((a, b) => {
      if (!a.id || !b.id) return 0;
      return a.id.localeCompare(b.id);
    });
  };

  // Export all users into ONE Excel sheet
  const exportAllToOneSheet = async () => {
    try {
      if (!users.length) return alert("No user data found");

      const allData = [];
      const sorted = getSortedUsers();

      sorted.forEach((user) => {
        const filteredVitals = filterVitalsByRange(user.vitals || [], dateRange);

        const userBase = {
          Name: `${user.firstName || ""} ${user.middleName || ""} ${user.lastName || ""}`.trim(),
          Gender: user.gender || "",
          DOB: user.dob || "",
          Age: user.age || "",
          Weight: user.weight || "",
          Height: user.height || "",
          Phone: user.phone || "",
        };

        if (filteredVitals && filteredVitals.length) {
          filteredVitals.forEach((v) => {
            const norm = normalizeVitalRecord(v);
            allData.push({
              ...userBase,
              DateAdded: norm.DateAdded,
              Systolic: norm.Systolic,
              Diastolic: norm.Diastolic,
              Pulse: norm.Pulse,
              BloodSugar: norm.BloodSugar,
            });
          });
        } else {
          allData.push({
            ...userBase,
            DateAdded: "No data",
            Systolic: "",
            Diastolic: "",
            Pulse: "",
            BloodSugar: "",
          });
        }
      });

      const ws = XLSX.utils.json_to_sheet(allData);
      //automatic column width adjustment
  ws["!cols"] = [
  { wch: 40 }, // Name
  { wch: 6 }, // Gender
  { wch: 10 }, // DOB
  { wch: 5 }, // Age
  { wch: 7 }, // Weight
  { wch: 7 },  // Height
  { wch: 14 }, // Phone
  { wch: 16 }, // Date
  { wch: 10 }, // Systolic (with unit)
  { wch: 10 }, // Diastolic (with unit)
  { wch: 8 }, // Pulse (with unit)
  { wch: 12 }, // BloodSugar (with unit)
];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "All_Users");

      logFirebaseEvent("export_initiated", {
        export_type: "all_users_one_sheet",
        date_range: dateRange,
        user_count: users.length,
        timestamp: new Date().toISOString()
      });

      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      saveAs(new Blob([wbout], { type: "application/octet-stream" }), "All_Users_Data.xlsx");
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export data");
    }
  };

  // Export each user into their own Excel sheet (one workbook)
  const exportEachUserSeparateSheet = async () => {
    try {
      if (!users.length) return alert("No user data found");

      const workbook = XLSX.utils.book_new();
      const sorted = getSortedUsers();

      sorted.forEach((user, index) => {
        const filteredVitals = filterVitalsByRange(user.vitals || [], dateRange);

        const userBase = {
          Name: `${user.firstName || ""} ${user.middleName || ""} ${user.lastName || ""}`.trim(),
          Gender: user.gender || "",
          DOB: user.dob || "",
          Age: user.age || "",
          Weight: user.weight || "",
          Height: user.height || "",
          Phone: user.phone || "",
        };

        const flattened =
          filteredVitals && filteredVitals.length
            ? filteredVitals.map((v) => {
                const norm = normalizeVitalRecord(v);
                return {
                  ...userBase,
                  DateAdded: norm.DateAdded,
                  Systolic: norm.Systolic,
                  Diastolic: norm.Diastolic,
                  Pulse: norm.Pulse,
                  BloodSugar: norm.BloodSugar,
                };
              })
            : [
                {
                  ...userBase,
                  DateAdded: "No vitals data available",
                  Systolic: "",
                  Diastolic: "",
                  Pulse: "",
                  BloodSugar: "",
                },
              ];

        const ws = XLSX.utils.json_to_sheet(flattened);
        //automatic column width adjustment
  ws["!cols"] = [
  { wch: 40 }, // Name
  { wch: 6 }, // Gender
  { wch: 10 }, // DOB
  { wch: 5 }, // Age
  { wch: 7 }, // Weight
  { wch: 7 },  // Height
  { wch: 14 }, // Phone
  { wch: 16 }, // Date
  { wch: 10 }, // Systolic (with unit)
  { wch: 10 }, // Diastolic (with unit)
  { wch: 8 }, // Pulse (with unit)
  { wch: 12 }, // BloodSugar (with unit)
];

        // Safe unique sheet name (limit length to avoid Excel sheet name limits)
        let safeName = `${user.firstName || "User"}_${user.lastName || ""}`.replace(/[^A-Za-z0-9_]/g, "_");
        safeName = (safeName || `User_${index + 1}`).slice(0, 28) + `_${index + 1}`;

        XLSX.utils.book_append_sheet(workbook, ws, safeName);
      });

      logFirebaseEvent("export_initiated", {
        export_type: "each_user_separate_sheet",
        date_range: dateRange,
        user_count: users.length,
        timestamp: new Date().toISOString()
      });

      const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      saveAs(new Blob([wbout], { type: "application/octet-stream" }), "Users_By_Sheet.xlsx");
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export data");
    }
  };

  // Render UI
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">Export All Users & Vitals</h1>

        <div className="flex items-center gap-4 mb-6">
          <label htmlFor="range" className="font-medium">Filter by Date Range:</label>
          <select
            id="range"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="120">Last 120 Days</option>
            <option value="over120">Over 120 Days</option>
            <option value="all">All Data</option>
          </select>
        </div>

        {loading ? (
          <div className="text-gray-500">Loading user data...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <div className="flex flex-wrap gap-4">
            <button
              onClick={exportAllToOneSheet}
              className="bg-blue-600 cursor-pointer hover:bg-blue-700 text-white px-6 py-2 rounded"
            >
              Export All in One Sheet
            </button>

            <button
              onClick={exportEachUserSeparateSheet}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 cursor-pointer rounded"
            >
              Export Each User in Separate Sheet
            </button>
          </div>
        )}
      </div>
    </div>
  );
}