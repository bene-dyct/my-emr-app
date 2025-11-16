import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AdminBadge from "../components/AdminBadge";
import { logFirebaseEvent } from "../firebaseConfig";

export default function Dashboard() {
  const [now, setNow] = useState(new Date());
  const navigate = useNavigate(); 


   useEffect(() => {
    logFirebaseEvent("page_view", {
      page_name: "Dashboard_Tier1",
      admin_level: "tier1",
      timestamp: new Date().toISOString()
    });
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleLogout = () => {
    logFirebaseEvent("admin_logout", {
      admin_level: "tier1",
      timestamp: new Date().toISOString()
    });
    sessionStorage.removeItem("isAdminAuthenticated");
    sessionStorage.removeItem("adminLevel");
    sessionStorage.removeItem("isAdminTier2Authenticated");
    navigate("/admin");
  };

  return (
    <>
    <AdminBadge/>
    <div className="min-h-screen p-8 bg-gradient-to-br from-slate-900 via-indigo-700 to-sky-600 text-white">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold">Dashboard</h1>
          <p className="text-sm text-slate-200 mt-1">Admin control panel</p>
          <div className="flex flex-row justify-between">
            <button
            onClick={handleLogout}
            className="mt-4 py-2 cursor-pointer px-4 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Logout
          </button>
          </div>
          
        </header>

        <main className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            to="/vitals-pending"
            className="group block rounded-xl shadow-lg transform transition hover:-translate-y-1 focus:-translate-y-1 focus:outline-none"
            aria-label="Vitals Pending"
          >
            <div className="h-40 md:h-56 flex items-center justify-center bg-red-500 rounded-xl p-6">
              <div className="text-center">
                <span className="text-2xl md:text-3xl font-semibold drop-shadow">
                  Vitals Pending
                </span>
                <p className="mt-2 text-sm opacity-90">View and manage pending vitals</p>
              </div>
            </div>
          </Link>

          <Link
            to="/vitals-filed"
            className="group block rounded-xl shadow-lg transform transition hover:-translate-y-1 focus:-translate-y-1 focus:outline-none"
            aria-label="Vitals Filed"
          >
            <div className="h-40 md:h-56 flex items-center justify-center bg-green-500 rounded-xl p-6">
              <div className="text-center">
                <span className="text-2xl md:text-3xl font-semibold drop-shadow">
                  Vitals Filed
                </span>
                <p className="mt-2 text-sm opacity-90">Browse filed vitals records</p>
              </div>
            </div>
          </Link>

          <Link
            to="/search-profile"
            className="md:col-span-2 block rounded-xl shadow-lg transform transition hover:-translate-y-1 focus:-translate-y-1 focus:outline-none"
            aria-label="Search for a Profile"
          >
            <div className="h-40 md:h-48 flex items-center justify-center bg-blue-600 rounded-xl p-6">
              <div className="text-center">
                <span className="text-2xl md:text-3xl font-semibold drop-shadow">
                  Search for a Profile
                </span>
                <p className="mt-2 text-sm opacity-90">Find and open any user profile</p>
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