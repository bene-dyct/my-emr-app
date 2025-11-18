import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db, logFirebaseEvent } from "../firebaseConfig";
import VitalForm from "../components/VitalForm";
import { Link } from "react-router-dom";

export default function VitalsFiled() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // Log page view
  useEffect(() => {
    logFirebaseEvent("page_view", {
      page_name: "VitalsFiled",
      admin_level: "tier1",
      timestamp: new Date().toISOString()
    });
  }, []);

  const fetchUsersWithVitals = async () => {
    setLoading(true);
    setError("");
    try {
      const q = query(collection(db, "users"), orderBy("firstName", "asc"));
      const snap = await getDocs(q);
      const allUsers = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Filter users who have vitals data
      const usersWithVitals = allUsers.filter((user) => user.vitals && user.vitals.length > 0);
      setUsers(usersWithVitals);
    } catch (err) {
      setError("Failed to fetch users.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersWithVitals();
  }, []);

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setShowAddForm(false);
  };

  // Called after VitalForm successfully appends vitals to Firestore
  const handleAddVitalsSave = (newVitalsList) => {
    if (!selectedUser) return;

    // Create mapped vital objects the same way VitalForm stores them
    const mapped = newVitalsList.map((v) => ({
  systolic: { value: Number(v.systolic), unit: "mmHg" },
  diastolic: { value: Number(v.diastolic), unit: "mmHg" },
  pulse: { value: Number(v.pulse), unit: "bpm" },
  bloodSugar: { value: Number(v.bloodSugar), unit: "mg/dL" },
  dateAdded: v.dateAdded,
}));


    // Update selectedUser locally (append and sort by dateAdded desc)
    const mergedVitals = [...(selectedUser.vitals || []), ...mapped].sort(
      (a, b) => new Date(b.dateAdded) - new Date(a.dateAdded)
    );

    const updatedUser = { ...selectedUser, vitals: mergedVitals };

    // Update users list and selected user in state so UI reflects new vitals immediately
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    setSelectedUser(updatedUser);

    logFirebaseEvent("vitals_added", {
      user_id: selectedUser.id,
      vitals_count: newVitalsList.length,
      page: "VitalsFiled",
      timestamp: new Date().toISOString()
    });

    // hide form after successful save
    setShowAddForm(false);
  };

  return (
    <div className="min-h-screen p-6 bg-[#56CFE1]">
      <h1 className="text-2xl font-semibold mb-6">Users with Vitals</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: users list */}
        <div className="md:col-span-1 bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-medium mb-3">Users</h2>

          {loading ? (
            <div className="text-sm text-gray-500">Loading users...</div>
          ) : error ? (
            <div className="text-sm text-red-600">{error}</div>
          ) : users.length === 0 ? (
            <div className="text-sm text-gray-500">No users with vitals found.</div>
          ) : (
            <ul className="space-y-2">
              {users.map((user) => (
                <li key={user.id}>
                  <button
                    onClick={() => handleUserClick(user)}
                    className="w-full text-left p-3 rounded border transition cursor-pointer bg-white hover:bg-[#80FFDB]"
                  >
                    <div className="font-medium">
                      {user.firstName} {user.middleName} {user.lastName}
                    </div>
                    <div className="text-xs text-gray-500">{user.gender}, {user.age}</div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right: User details area */}
        <div className="md:col-span-2 bg-white rounded-lg shadow p-6 min-h-[320px]">
          {!selectedUser ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <div className="text-lg font-medium mb-2">Select a user</div>
              <div className="text-sm">Click a user on the left to view details.</div>
            </div>
          ) : (
            <div>
              <h3 className="text-xl font-semibold mb-4">
                Details for {selectedUser.firstName} {selectedUser.middleName} {selectedUser.lastName}
              </h3>
              <p><strong>Date of Birth:</strong> {selectedUser.dob}</p>
              <p><strong>Age:</strong> {selectedUser.age}</p>
              <p><strong>Gender:</strong> {selectedUser.gender}</p>
              <p><strong>Weight:</strong> {selectedUser.weight}</p>
              <p><strong>Height:</strong> {selectedUser.height}</p>
              <p><strong>Phone:</strong> {selectedUser.phone}</p>
              

              <h4 className="text-lg font-semibold mt-4">Vitals Data</h4>

              {selectedUser.vitals && selectedUser.vitals.length > 0 ? (
                <ul className="space-y-2">
                  {selectedUser.vitals
                    .slice() // create copy to avoid mutating state
                    .sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded)) // Sort by dateAdded descending
                    .map((vital, index) => (
                      <li key={index} className="border p-3 rounded bg-gray-50">
  <div className="grid grid-cols-2 gap-2">
    <p><strong>Systolic:</strong> {vital.systolic.value} {vital.systolic.unit}</p>
    <p><strong>Diastolic:</strong> {vital.diastolic.value} {vital.diastolic.unit}</p>
    <p><strong>Pulse:</strong> {vital.pulse.value} {vital.pulse.unit}</p>
    <p><strong>Blood Sugar:</strong> {vital.bloodSugar.value} {vital.bloodSugar.unit}</p>
    <p><strong>Date Added:</strong> {vital.dateAdded}</p>
  </div>
</li>
                    ))}
                </ul>
              ) : (
                <p>No vitals data available for this user.</p>
              )}

              <div className="mt-4 justify-between flex">
                <div><button
                  onClick={() => setShowAddForm((s) => !s)}
                  className="bg-[#6930C3] hover:bg-[#7400B8] text-white px-4 py-2 cursor-pointer rounded"
                >
                  {showAddForm ? "Cancel" : "Add Vitals"}
                </button></div>
                
                {/* Pass selected user's id in the route so UserTable can fetch vitals */}
                <div>
                  <Link
                    to={`/user-table/${selectedUser?.id}`}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded ml-auto inline-block"
                  >
                    View Full Data
                  </Link>
                </div>
              </div>

              {showAddForm && (
                <div className="mt-4">
                  <VitalForm
                    userId={selectedUser.id}
                    onSave={handleAddVitalsSave}
                    saving={false}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}