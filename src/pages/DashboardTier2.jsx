import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AdminBadge from "../components/AdminBadge";
import { auth, logFirebaseEvent } from "../firebaseConfig";
import { signOut } from "firebase/auth";

export default function DashboardTier2() {
 const [now, setNow] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    logFirebaseEvent("page_view", {
      page_name: "Dashboard_Tier2",
      admin_level: "tier2",
      timestamp: new Date().toISOString()
    });
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleLogout = async () => {
    try {
      logFirebaseEvent("admin_logout", {
        admin_level: "tier2",
        timestamp: new Date().toISOString()
      });

      if (auth) {
        // signOut expects the auth instance
        await signOut(auth);
      } else {
        // when firebase not initialized, just clear session (dev safety)
        console.debug("Auth instance not available — clearing session only.");
      }

      sessionStorage.removeItem("isAdminAuthenticated");
      sessionStorage.removeItem("adminLevel");
      sessionStorage.removeItem("isAdminTier2Authenticated");
      navigate("/admin");
    } catch (err) {
      console.error("Logout error:", err);
      alert("Failed to log out. Please try again.");
    }
  };

  return (
    <>
      <AdminBadge />
      <div className="min-h-screen p-8 bg-gradient-to-br from-slate-900 via-indigo-700 to-sky-600 text-white">
        <div className="max-w-6xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold">Admin — Tier 2 Dashboard</h1>
            <p className="text-sm text-slate-200 mt-1">Tier 2 administrative tools & advanced features</p>

            <div className="flex gap-3 mt-4">
              <button
                onClick={handleLogout}
                className="py-2 px-4 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Logout
              </button>

              <button className="py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded">
                <Link to="/searchprofile-tier-2">Search Profile</Link>
              </button>
            </div>
          </header>

          <main className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              to="/search-profile"
              className="md:col-span-2 block rounded-xl shadow-lg transform transition hover:-translate-y-1 focus:-translate-y-1 focus:outline-none"
              aria-label="Search for a Profile"
            >
              <div className="h-40 md:h-48 flex items-center justify-center bg-purple-600 rounded-xl p-6">
                <div className="text-center">
                  <span className="text-2xl md:text-3xl font-semibold drop-shadow">Search for a Profile</span>
                  <p className="mt-2 text-sm opacity-90">Find and open any user profile</p>
                </div>
              </div>
            </Link>

            <Link to="/searchprofile-tier-2">
              <div className="col-span-1 rounded-xl p-6 bg-white/5 flex items-center justify-center transform transition hover:-translate-y-1 focus:-translate-y-1 focus:outline-none">
                <div className="text-center">
                  <h3 className="text-lg font-semibold">Tier-2 Tools</h3>
                  <p className="text-sm mt-2 text-slate-200/80">Employ advanced admin actions and reports.</p>
                </div>
              </div>
            </Link>

            <Link to="/export-all-users">
              <div className="col-span-1 rounded-xl p-6 bg-white/5 flex items-center justify-center transform transition hover:-translate-y-1 focus:-translate-y-1 focus:outline-none">
                <div className="text-center">
                  <h3 className="text-lg font-semibold">Reports</h3>
                  <p className="text-sm mt-2 text-slate-200/80">Generate and export system reports.</p>
                </div>
              </div>
            </Link>
          </main>

          <footer className="mt-8 text-sm text-slate-200 flex justify-between items-center">
            <div>© MyVitalApp</div>
            <div className="font-mono bg-white/10 px-3 py-1 rounded">
              {now.toLocaleDateString()} {now.toLocaleTimeString()}
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}