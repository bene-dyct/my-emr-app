import React, { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db, logFirebaseEvent } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import Fuse from "fuse.js";

export default function SearchProfile() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState({});
  const [filteredUsers, setFilteredUsers] = useState([]);
  const navigate = useNavigate();

   // Log page view
  useEffect(() => {
    logFirebaseEvent("page_view", {
      page_name: "SearchProfile_Tier1",
      admin_level: "tier1",
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

    // Log filter action
    logFirebaseEvent("search_filter_applied", {
      filter_type: filterType,
      filter_range: range.label,
      page: "SearchProfile_Tier1",
      timestamp: new Date().toISOString()
    });
  };

  // Clear filters
  const clearFilters = () => {
    setActiveFilters({});
    setFilteredUsers(users);
  };

  return (
    <div className="min-h-screen p-6 bg-[#56CFE1]">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold">User Profiles</h1>
        <input
          type="search"
          placeholder="Search users..."
          className="px-4 py-2 border bg-white text-black rounded-lg"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Filter navbar */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow flex items-center justify-between">
        {Object.entries(filterRanges).map(([filterType, ranges]) => (
          <div key={filterType} className="relative group">
            <button className="px-4 py-2 text-gray-700 hover:text-white cursor-pointer hover:bg-[#7400B8] rounded">
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </button>
            <div className="hidden group-hover:block absolute z-10 border w-48 bg-white rounded-lg shadow-2xl">
              {ranges.map((range) => (
                <button
                  key={range.label}
                  className={`block cursor-pointer w-full text-left px-4 py-2 hover:bg-[#5390D9] ${
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
          className="px-4 py-2 cursor-pointer text-red-600 hover:bg-red-300 rounded"
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
            <button
              key={user.id}
              onClick={() => navigate(`/profile/${user.id}`)}
              className="p-4 bg-white rounded-lg shadow hover:shadow-md cursor-pointer hover:bg-[#80FFDB] transition-shadow"
            >
              <h3 className="font-medium">
                {user.firstName} {user.lastName}
              </h3>
              <p className="text-sm text-gray-500">{user.gender}, {user.age}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}