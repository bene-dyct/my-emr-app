import { useState, useEffect, useRef } from "react";
import { auth, db, logFirebaseEvent } from "../firebaseConfig";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import UserTable from "../components/UserTable";
import ProfileExportButtons from "../components/ProfileExportButtons";
import Navbarwhite from "../components/Navbarwhite";

export default function Profile() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { userId } = useParams();
  const contentRef = useRef();

  // ✅ FIX: Check adminLevel === "tier2" instead of isAdminTier2Authenticated
  const isTier2 = sessionStorage.getItem("adminLevel") === "tier2";

  useEffect(() => {
    logFirebaseEvent("page_view", {
      page_name: "Profile",
      user_id: userId || "current_user",
      is_admin_view: !!userId,
      is_tier2_admin: isTier2,
      timestamp: new Date().toISOString()
    });
  }, [userId, isTier2]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        let userDocData;

        if (userId) {
          const userDoc = await getDoc(doc(db, "users", userId));
          if (userDoc.exists()) userDocData = { id: userDoc.id, ...userDoc.data() };
        } else {
          const user = auth.currentUser;
          if (!user) {
            navigate("/login");
            return;
          }
          const q = query(collection(db, "users"), where("authUID", "==", user.uid));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            userDocData = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
          }
        }

        setUserData(userDocData || null);
        if (!userDocData) setError("No user data found");
      } catch (err) {
        console.error("Error fetching user data:", err);
        logFirebaseEvent("profile_load_error", {
          error_message: err.message,
          user_id: userId || "current_user",
          timestamp: new Date().toISOString()
        });
        setError("Error loading user data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, navigate]);

  if (loading)
    return <div className="flex justify-center items-center h-screen">Loading...</div>;

  if (error)
    return <div className="flex justify-center items-center h-screen text-red-600">{error}</div>;

  if (!userData)
    return <div className="flex justify-center items-center h-screen">No user data found</div>;

  return (
    <>
      <Navbarwhite />
      <div className="min-h-screen p-8 bg-[#56CFE1]">
        <h1 className="text-2xl font-bold mb-6 mt-20">
          {userId
            ? `Profile: ${userData.firstName} ${userData.middleName || ""} ${userData.lastName}`
            : `Welcome, ${userData.firstName} ${userData.lastName}`}
        </h1>

        {/* Export & Print Buttons — only visible to Tier-2 admins */}
        {isTier2 && <ProfileExportButtons targetRef={contentRef} userData={userData} />}

        {/* Capture Content */}
        <div ref={contentRef}>
          <div className="max-w-7xl mx-auto grid grid-cols-2 gap-8 pdf-section" data-title="User Information">
            {/* Personal Information */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
              <div className="space-y-3">
                <p><b>Full Name:</b> {userData.firstName} {userData.middleName || ""} {userData.lastName}</p>
                <p><b>Phone:</b> {userData.phone}</p>
                <p><b>Gender:</b> <span className="capitalize">{userData.gender}</span></p>
              </div>
            </div>

            {/* Medical Information */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Medical Information</h2>
              <div className="space-y-3">
                <p><b>Date of Birth:</b> {userData.dob}</p>
                <p><b>Age:</b> {userData.age} years</p>
                <p><b>Weight:</b> {userData.weight}</p>
                <p><b>Height:</b> {userData.height}</p>
              </div>
            </div>

            {/* Vitals and Charts */}
            <div className="col-span-2 pdf-section" data-title="Vitals & Charts">
              <UserTable userId={userData.id} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
