import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, logFirebaseEvent } from "../firebaseConfig";
import Navbar from "../components/Navbar";

export default function Admin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminType, setAdminType] = useState("tier1"); 
  const [error, setError] = useState("");
  const [allowed, setAllowed] = useState(null);
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate();

  // Restrict mobile users
  useEffect(() => {
    const isMobile = /iphone|ipad|ipod|android|blackberry|mini|windows\sce|palm/i
      .test(navigator.userAgent.toLowerCase());
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

  // Tier emails (no longer using env variables)
  const TIER1_EMAIL = "tier1@myvitalapp.com";
  const TIER2_EMAIL = "tier2@myvitalapp.com";

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (
      (adminType === "tier1" && email !== TIER1_EMAIL) ||
      (adminType === "tier2" && email !== TIER2_EMAIL)
    ) {
      setError("Incorrect email for selected admin tier.");
      setLoading(false); // ✅ Stop loading on validation error
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);

      // Save session
      sessionStorage.setItem("isAdminAuthenticated", "true");
      sessionStorage.setItem("adminLevel", adminType);

      logFirebaseEvent("admin_login", {
        tier: adminType,
        email,
        time: new Date().toISOString(),
      });

      navigate(adminType === "tier1" ? "/dashboard" : "/dashboard-tier-2");

    } catch (err) {
      console.error(err);
      
      // Map Firebase error codes to user-friendly messages
      let msg = "Invalid email or password.";
      switch (err.code) {
        case "auth/user-not-found":
          msg = "No account found with this email.";
          break;
        case "auth/wrong-password":
          msg = "Incorrect password.";
          break;
        case "auth/invalid-credential":
          msg = "Invalid email or password.";
          break;
        case "auth/too-many-requests":
          msg = "Too many failed attempts. Please try again later.";
          break;
        default:
          msg = "Login failed. Please try again.";
      }
      
      setError(msg);
      setLoading(false); // ✅ Stop loading on auth error
    }
  };

  // submit label mapping — does not change auth/route logic
  const submitLabel = adminType === "tier1" ? "Login as Attendant" : "Login as Supervisor";

  return (
    <>
      <Navbar />
      <div className="max-lg:hidden flex flex-col items-center justify-center min-h-screen bg-[#56CFE1] relative">

        <div className="w-96 p-8 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-center mb-6">Admin Login</h1>

          {/* Toggle Tier */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => {
                setAdminType("tier1");
                setError("");
                setEmail("");
                setPassword("");
              }}
              className={`flex-1 py-2 px-4 rounded cursor-pointer ${
                adminType === "tier1"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Tier 1 Admin
            </button>

            <button
              onClick={() => {
                setAdminType("tier2");
                setError("");
                setEmail("");
                setPassword("");
              }}
              className={`flex-1 py-2 px-4 rounded cursor-pointer ${
                adminType === "tier2"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Tier 2 Admin
            </button>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-100 rounded">
                {error}
              </div>
            )}

            <div>
              <label className="block text-gray-700 mb-2">Admin Email</label>
              <input
                type="email"
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
                placeholder={
                  adminType === "tier1"
                    ? TIER1_EMAIL
                    : TIER2_EMAIL
                }
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                required
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>

            <button
              type="submit"
              className={`w-full py-2 px-4 text-white rounded cursor-pointer ${
                adminType === "tier1"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-purple-600 hover:bg-purple-700"
              }`}
              disabled={loading}
            >
              {loading ? "Logging in..." : submitLabel}
              
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
