import { useEffect, useState } from "react";

export default function AdminBadge() {
  const [adminLevel, setAdminLevel] = useState(null);

  useEffect(() => {
    const level = sessionStorage.getItem("adminLevel");
    setAdminLevel(level);
  }, []);

  if (!adminLevel) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div
        className={`px-4 py-2 rounded-full text-white font-semibold text-sm ${
          adminLevel === "tier1" ? "bg-blue-600" : "bg-purple-600"
        }`}
      >
        {adminLevel === "tier1" ? "🔒 Tier 1 Admin" : "👑 Tier 2 Admin"}
      </div>
    </div>
  );
}