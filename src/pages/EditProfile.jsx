import { useState, useEffect } from "react";
import { db, logFirebaseEvent } from "../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import EditUserTable from "../components/EditUserTable";

export default function EditProfile() {
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [vitals, setVitals] = useState([]);
  const navigate = useNavigate();
  const { userId } = useParams();

  // Log page view
  useEffect(() => {
    logFirebaseEvent("page_view", {
      page_name: "EditProfile",
      user_id: userId,
      admin_level: "tier2",
      timestamp: new Date().toISOString()
    });
  }, [userId]);

  // Add helper function to handle date format conversion
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';

    try {
      // Check if date is in DD-MM-YYYY format
      if (dateString.includes('-')) {
        const [day, month, year] = dateString.split('-');
        if (day && month && year) {
          // Convert to YYYY-MM-DD for input
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }

      // If it's already a valid date string, format it
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (err) {
      console.error('Date parsing error:', err);
    }

    return '';
  };

  const calculateAge = (isoDob) => {
  if (!isoDob) return "";
  const d = new Date(isoDob);
  if (isNaN(d)) return "";
  
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) {
    age--;
  }
  return age;
};

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          const data = userDoc.data();

          setFormData({
            id: userDoc.id,
            ...data,
            // Convert date format for the input
            dob: formatDateForInput(data.dob),
            // Remove units from weight and height
            weight: parseFloat(data.weight) || '',
            height: parseFloat(data.height) || '',
          });
        } else {
          setError("User not found");
        }
      } catch (err) {
        console.error("Error fetching user:", err);
        setError("Error loading user data");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const handleChange = (e) => {
  const { name, value } = e.target;

  setFormData((prev) => {
    let updated = { ...prev, [name]: value };

    if (name === "dob") {
      // automatically compute age from YYYY-MM-DD
      const age = calculateAge(value);
      updated.age = age ? String(age) : "";
    }

    return updated;
  });
};

  // Format values before submitting
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const userRef = doc(db, "users", userId);

      // Format the date back to DD-MM-YYYY before saving
      const formattedDate = formData.dob ? new Date(formData.dob).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).replace(/\//g, '-') : '';

       // ✅ Helper to capitalize words properly
    const capitalizeWords = (str) =>
      str
        .split(" ")
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(" ");

    // ✅ Capitalize first & last names and gender
    const capitalizedFirstName = formData.firstName
      ? capitalizeWords(formData.firstName.trim())
      : "";
    const capitalizedLastName = formData.lastName
      ? capitalizeWords(formData.lastName.trim())
      : "";
    const capitalizedGender = formData.gender
      ? formData.gender.charAt(0).toUpperCase() +
        formData.gender.slice(1).toLowerCase()
      : "";

      // ✅ Prepare formatted data
      const dataToUpdate = {
        ...formData,
        firstName: capitalizedFirstName,
        lastName: capitalizedLastName,
        gender: capitalizedGender,
        dob: formattedDate,
        weight: `${formData.weight} kg`,
        height: `${formData.height} cm`,
      };
      delete dataToUpdate.id;

      // Transform vitals data
      const transformedVitals = vitals.map((v) => ({
        dateAdded: v.dateAdded,
        systolic: { value: Number(v.systolicValue), unit: v.systolicUnit },
        diastolic: { value: Number(v.diastolicValue), unit: v.diastolicUnit },
        pulse: { value: Number(v.pulseValue), unit: v.pulseUnit },
        bloodSugar: { value: Number(v.bloodSugarValue), unit: v.bloodSugarUnit },
      }));

      // ✅ Save to Firestore
      await updateDoc(userRef, {
        ...dataToUpdate,
        vitals: transformedVitals,
      });

      logFirebaseEvent("user_profile_updated", {
        user_id: userId,
        updated_fields: Object.keys(dataToUpdate),
        timestamp: new Date().toISOString()
      });

      navigate(-1);
    } catch (err) {
      console.error("Error updating user:", err);
      setError("Failed to update user data");
    } finally {
      setSaving(false);
    }
  };

  // Handle vitals changes from EditUserTable
  const handleVitalsChange = (updatedVitals) => {
    setVitals(updatedVitals);
  };

  if (loading) return <div className="text-center p-4">Loading...</div>;
  if (error) return <div className="text-center text-red-600 p-4">{error}</div>;
  if (!formData) return <div className="text-center p-4">No user data found</div>;

  return (
    <div className="min-h-screen p-8 bg-[#56CFE1]">
      <form onSubmit={handleSubmit} className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Edit Profile</h1>
          <div className="space-x-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 cursor-pointer text-white rounded bg-red-500 hover:bg-red-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 cursor-pointer bg-[#6930C3] hover:bg-[#7400B8] text-white rounded disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Personal Information */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-600 mb-1">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName || ""}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName || ""}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ""}
                    onChange={handleChange}
                    disabled
                    className="w-full p-2 border rounded text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone || ""}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">Gender</label>
                  <select
                    name="gender"
                    value={formData.gender || ""}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Medical Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-600 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob || ""}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">Age</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age || ""}
                    onChange={handleChange}
                    disabled
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight || ""}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">Height (cm)</label>
                  <input
                    type="number"
                    name="height"
                    value={formData.height || ""}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Add EditUserTable */}
          <div className="col-span-2">
            <EditUserTable userId={userId} onVitalsChange={handleVitalsChange} />
          </div>
        </div>
      </form>
    </div>
  );
}