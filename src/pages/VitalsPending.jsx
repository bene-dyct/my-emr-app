import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db, logFirebaseEvent } from "../firebaseConfig";
import VitalForm from "../components/VitalForm";

export default function VitalsPending() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Log page view
  useEffect(() => {
    logFirebaseEvent("page_view", {
      page_name: "VitalsPending",
      admin_level: "tier1",
      timestamp: new Date().toISOString()
    });
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const q = query(collection(db, "users"), orderBy("firstName", "asc"));
      const snap = await getDocs(q);
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      
      // Filter users who don't have vitals data
      const pending = all.filter((user) => {
        return !user.vitals || user.vitals.length === 0;
      });
      
      setUsers(pending);
    } catch (err) {
      setError("Failed to fetch users.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSaveVitals = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      // Remove user from local state immediately for better UX
      setUsers((prev) => prev.filter((u) => u.id !== selected.id));

      logFirebaseEvent("vitals_added_to_pending_user", {
        user_id: selected.id,
        page: "VitalsPending",
        timestamp: new Date().toISOString()
      });
      
      // Refresh users list to ensure data consistency
      await fetchUsers();
      
      // Clear selection
      setSelected(null);
    } catch (err) {
      console.error(err);
      setError("Failed to save vitals. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-[#56CFE1]">
      <h1 className="text-2xl font-semibold mb-6">Vitals Pending</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: users list */}
        <div className="md:col-span-1 bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-medium mb-3">Pending users</h2>

          {loading ? (
            <div className="text-sm text-gray-500">Loading users...</div>
          ) : error ? (
            <div className="text-sm text-red-600">{error}</div>
          ) : users.length === 0 ? (
            <div className="text-sm text-gray-500">No users pending vitals.</div>
          ) : (
            <ul className="space-y-2">
              {users.map((u) => (
                <li key={u.id}>
                  <button
                    onClick={() => setSelected(u)}
                    className={`w-full cursor-pointer text-left p-3 rounded border transition ${
                      selected && selected.id === u.id
                        ? "bg-[#80FFDB] border-blue-300"
                        : "bg-white hover:bg-[#80FFDB] border-gray-200"
                    }`}
                  >
                    <div className="font-medium">
                      {u.firstName} {u.middleName} {u.lastName}
                    </div>
                    <div className="text-xs text-gray-500">{u.gender}, {u.age}</div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right: Vital form area */}
        <div className="md:col-span-2 bg-white rounded-lg shadow p-6 min-h-[320px]">
          {!selected ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <div className="text-lg font-medium mb-2">Select a user</div>
              <div className="text-sm">Click a user on the left to open the vital form.</div>
            </div>
          ) : (
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold">
                    Add Vitals for {selected.firstName} {selected.middleName} {selected.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">{selected.email}</p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="text-sm cursor-pointer text-red-600 hover:underline"
                >
                  Close
                </button>
              </div>

              <VitalForm
                userId={selected.id}
                onSave={handleSaveVitals}
                saving={saving}
              />

              {saving && <div className="mt-3 text-sm text-gray-600">Saving vitals...</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}