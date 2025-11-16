import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { logFirebaseEvent } from "../firebaseConfig";
import Navbar from "../components/Navbar";


export default function Admin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [adminType, setAdminType] = useState("tier1"); // tier1 or tier2
  const navigate = useNavigate();

  // Device detection to restrict mobile access
  const [allowed, setAllowed] = useState(null);

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /iphone|ipad|ipod|android|blackberry|mini|windows\sce|palm/i.test(userAgent);
    setAllowed(!isMobile);
  }, []);

  if (allowed === null) return null;
  if (!allowed) {
    return (
      <div className="flex items-center justify-center w-full h-screen p-6 text-center text-gray-600">
        This page is not available on mobile devices.
      </div>
    );
  }

  // Admin credentials which have been moved to environment variables for security
const ADMIN_TIER1_USERNAME = import.meta.env.VITE_ADMIN_T1_USER;
const ADMIN_TIER1_PASSWORD = import.meta.env.VITE_ADMIN_T1_PASS;
const ADMIN_TIER2_USERNAME = import.meta.env.VITE_ADMIN_T2_USER;
const ADMIN_TIER2_PASSWORD = import.meta.env.VITE_ADMIN_T2_PASS;

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");

    if (adminType === "tier1") {
      if (username === ADMIN_TIER1_USERNAME && password === ADMIN_TIER1_PASSWORD) {
        sessionStorage.setItem("isAdminAuthenticated", "true");
        sessionStorage.setItem("adminLevel", "tier1");
        sessionStorage.removeItem("isAdminTier2Authenticated"); // Clear tier2 flag
        logFirebaseEvent("admin_login", {
      tier: "tier1",
      username: username,
      time: new Date().toISOString()
    });
        navigate("/dashboard");
      } else {
        setError("Invalid Tier-1 admin credentials");
      }
    } else if (adminType === "tier2") {
      if (username === ADMIN_TIER2_USERNAME && password === ADMIN_TIER2_PASSWORD) {
        sessionStorage.setItem("isAdminAuthenticated", "true");
        sessionStorage.setItem("adminLevel", "tier2");
        sessionStorage.setItem("isAdminTier2Authenticated", "true"); // Set tier2 flag for backward compatibility
        logFirebaseEvent("admin_login", {
      tier: "tier2",
      username: username,
      time: new Date().toISOString()
    });
        navigate("/dashboard-tier-2");
      } else {
        setError("Invalid Tier-2 admin credentials");
      }
    }
  };

  return (
    <>
    <Navbar/>
    <div className="max-lg:hidden flex flex-col items-center justify-center min-h-screen bg-[#56CFE1] relative">
      {/* Floating details (you can customize these as needed) */}
      <div className="max-md:hidden absolute top-30 left-10 w-32 h-32 bg-blue-500 rounded-full opacity-30 animate-bounce"></div>
      <div className="max-md:hidden absolute bottom-10 right-10 w-48 h-48 bg-blue-500 rounded-full opacity-30 animate-bounce"></div>
      <div className="max-md:hidden absolute top-40 right-20 w-24 h-24 bg-blue-500 rounded-full opacity-30 animate-bounce"></div>
      <div className="w-96 p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">Admin Login</h1>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => {
              setAdminType("tier1");
              setError("");
              setUsername("");
              setPassword("");
            }}
            className={`flex-1 py-2 px-4 rounded font-medium transition ${
              adminType === "tier1"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Tier 1 Admin
          </button>
          <button
            onClick={() => {
              setAdminType("tier2");
              setError("");
              setUsername("");
              setPassword("");
            }}
            className={`flex-1 py-2 px-4 rounded font-medium transition ${
              adminType === "tier2"
                ? "bg-purple-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Tier 2 Admin
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && <div className="p-3 text-sm text-red-600 bg-red-100 rounded">{error}</div>}

          <div>
            <label className="block text-gray-700 mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

          <button
            type="submit"
            className={`w-full py-2 px-4 text-white rounded font-medium transition ${
              adminType === "tier1"
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-purple-600 hover:bg-purple-700"
            }`}
          >
            Login as {adminType === "tier1" ? "Tier 1 Admin" : "Tier 2 Admin"}
          </button>
        </form>
      </div>
    </div>
    </>
  );
}
