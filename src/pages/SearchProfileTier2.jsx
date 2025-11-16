import React, { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, doc, deleteDoc } from "firebase/firestore";
import { db, logFirebaseEvent } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import Fuse from "fuse.js";

export default function SearchProfileTier2() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState({});
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const navigate = useNavigate();

  // Log page view
  useEffect(() => {
    logFirebaseEvent("page_view", {
      page_name: "SearchProfile_Tier2",
      admin_level: "tier2",
      timestamp: new Date().toISOString()
    });
  }, []);

  // Define filter ranges
  const filterRanges = {
    age: [
      { label: "20 to 40", min: 20, max: 40 },
      { label: "41 to 60", min: 41, max: 60 },
      { label: "61 to 80", min: 61, max: 80 },
      { label: "81 to 100", min: 81, max: 100 },
      { label: "Above 100", min: 101, max: Infinity }
    ],
    weight: [
      { label: "40 to 60", min: 40, max: 60 },
      { label: "61 to 80", min: 61, max: 80 },
      { label: "81 to 100", min: 81, max: 100 },
      { label: "100 to 120", min: 100, max: 120 },
      { label: "Above 120", min: 121, max: Infinity }
    ],
    systolic: [
      { label: "85 to 100", min: 85, max: 100 },
      { label: "101 to 120", min: 101, max: 120 },
      { label: "121 to 140", min: 121, max: 140 },
      { label: "141 to 160", min: 141, max: 160 },
      { label: "161 to 180", min: 161, max: 180 },
      { label: "Above 180", min: 181, max: Infinity }
    ],
    bloodSugar: [
      { label: "Below 40", min: 0, max: 40 },
      { label: "41 to 70", min: 41, max: 70 },
      { label: "71 to 90", min: 71, max: 90 },
      { label: "91 to 115", min: 91, max: 115 },
      { label: "Above 115", min: 116, max: Infinity }
    ],
    dateCreated: [
      { label: "Jan-Jun 2025", min: "2025-01-01", max: "2025-06-30" },
      { label: "Jul-Dec 2025", min: "2025-07-01", max: "2025-12-31" },
      { label: "Jan-Jun 2026", min: "2026-01-01", max: "2026-06-30" },
      { label: "Jul-Dec 2026", min: "2026-07-01", max: "2026-12-31" },
      { label: "Jan-Jun 2027", min: "2027-01-01", max: "2027-06-30" },
      { label: "Jul-Dec 2027", min: "2027-07-01", max: "2027-12-31" }
    ]
  };

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "users"), orderBy("firstName", "asc"));
        const snapshot = await getDocs(q);
        const userData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(userData);
        setFilteredUsers(userData);
      } catch (err) {
        setError("Failed to fetch users");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Setup Fuse search with useMemo to prevent recreating on every render
  const fuse = React.useMemo(
    () => new Fuse(users, {
      keys: ['firstName', 'lastName'],
      threshold: 0.3
    }),
    [users]
  );

  // Apply filters with useCallback to prevent recreating on every render
  const applyFilters = React.useCallback((userList) => {
    let filtered = [...userList];

    Object.entries(activeFilters).forEach(([key, range]) => {
      filtered = filtered.filter(user => {
        if (key === 'dateCreated') {
          const userDate = new Date(user.dateCreated);
          return userDate >= new Date(range.min) && userDate <= new Date(range.max);
        }

        let value;
        if (key === 'systolic' && user.vitals?.length > 0) {
          value = user.vitals[user.vitals.length - 1].systolic;
        } else if (key === 'bloodSugar' && user.vitals?.length > 0) {
          value = user.vitals[user.vitals.length - 1].bloodSugar;
        } else {
          value = parseFloat(user[key]);
        }

        return value >= range.min && value <= range.max;
      });
    });

    setFilteredUsers(filtered);
  }, [activeFilters]);

  // Handle search with all dependencies included
  useEffect(() => {
    if (searchTerm) {
      const results = fuse.search(searchTerm);
      setFilteredUsers(results.map(result => result.item));
    } else {
      applyFilters(users);
    }
  }, [searchTerm, fuse, applyFilters, users]);

  // Handle filter selection
  const handleFilterSelect = (filterType, range) => {
    const newFilters = {
      ...activeFilters,
      [filterType]: range
    };
    setActiveFilters(newFilters);
    applyFilters(users);
  };

  // Clear filters
  const clearFilters = () => {
    setActiveFilters({});
    setFilteredUsers(users);

    // Log clear filters action
    logFirebaseEvent("search_filter_applied", {
      filter_type: filterType,
      filter_range: range.label,
      page: "SearchProfile_Tier2",
      timestamp: new Date().toISOString()
    });
  };

  const handleDelete = async (userId) => {
    try {
      await deleteDoc(doc(db, "users", userId));
      setUsers(users.filter(user => user.id !== userId));
      setFilteredUsers(filteredUsers.filter(user => user.id !== userId));

      logFirebaseEvent("user_profile_deleted", {
        deleted_user_id: userId,
        deleted_by_admin: "tier2",
        timestamp: new Date().toISOString()
      });
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (err) {
      console.error("Error deleting user:", err);
      setError("Failed to delete user");
    }
  };

  return (
    <div className="min-h-screen p-6 bg-[#56CFE1]">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold">User Profiles</h1>
        <input
          type="search"
          placeholder="Search users..."
          className="px-4 py-2 border rounded-lg"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Filter navbar */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow flex items-center justify-between">
        {Object.entries(filterRanges).map(([filterType, ranges]) => (
          <div key={filterType} className="relative group">
            <button className="cursor-pointer px-4 py-2 text-gray-700 hover:text-white hover:bg-[#7400BB] rounded">
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </button>
            <div className="hidden group-hover:block absolute z-10 w-48 bg-white cursor-pointer border rounded-lg shadow-lg">
              {ranges.map((range) => (
                <button
                  key={range.label}
                  className={`block w-full text-left px-4 py-2 hover:bg-[#5390D9] ${
                    activeFilters[filterType]?.label === range.label ? 'bg-[#5390D9]' : ''
                  }`}
                  onClick={() => handleFilterSelect(filterType, range)}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        ))}
        <button
          onClick={clearFilters}
          className="cursor-pointer px-4 py-2 text-red-600 hover:bg-red-300 rounded"
        >
          Clear Filters
        </button>
      </div>

      {/* Users list */}
      {loading ? (
        <div className="text-center">Loading...</div>
      ) : error ? (
        <div className="text-red-600 text-center">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => (
            <div key={user.id} className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div 
                  onClick={() => navigate(`/profile/${user.id}`)}
                  className="cursor-pointer"
                >
                  <h3 className="font-medium">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/edit-profile/${user.id}`);
                    }}
                    className="p-2 cursor-pointer hover:bg-[#80FFDB] rounded-full transition-colors"
                    title="Edit this profile"
                  >
                    <FiEdit2 size={18} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setUserToDelete(user);
                      setShowDeleteModal(true);
                    }}
                    className="p-2 cursor-pointer text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    title="Delete this profile"
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="mb-6">
              Are you sure you want to delete {userToDelete.firstName} {userToDelete.lastName}'s profile? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserToDelete(null);
                }}
                className="px-4 cursor-pointer py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(userToDelete.id)}
                className="px-4 cursor-pointer py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}