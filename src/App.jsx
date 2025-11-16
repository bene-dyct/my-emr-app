import './App.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import AdminRoute from './components/AdminRoute';
import AdminTier2Route from './components/AdminTier2Route';
import Home from './pages/Home';
import VitalsPending from './pages/VitalsPending';
import VitalsFiled from './pages/VitalsFiled';
import SearchProfile from './pages/SearchProfile';
import UserTable from './components/UserTable';
import DashboardTier2 from './pages/DashboardTier2';
import SearchProfileTier2 from './pages/SearchProfileTier2';
import EditProfile from './pages/EditProfile';
import ExportAllUsers from './pages/ExportAllUsers';

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Admin />} />

        {/* Public (user) profile - uses auth.currentUser inside Profile */}
        <Route path="/profile" element={<Profile />} />

        {/* Admin-only access to any user's profile */}
        <Route
          path="/profile/:userId"
          element={
            <AdminRoute>
              <Profile />
            </AdminRoute>
          }
        />

        {/* Protected admin sections (Tier-1) */}
        <Route
          path="/dashboard"
          element={
            <AdminRoute>
              <Dashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/search-profile"
          element={
            <AdminRoute>
              <SearchProfile />
            </AdminRoute>
          }
        />
        <Route
          path="/user-table/:userId"
          element={
            <AdminRoute>
              <UserTable />
            </AdminRoute>
          }
        />
        <Route
          path="/vitals-filed"
          element={
            <AdminRoute>
              <VitalsFiled />
            </AdminRoute>
          }
        />
        <Route
          path="/vitals-pending"
          element={
            <AdminRoute>
              <VitalsPending />
            </AdminRoute>
          }
        />



        {/* Protected Tier-2 sections (require Tier-2 login) */}
        <Route
          path="/dashboard-tier-2"
          element={
            <AdminTier2Route>
              <DashboardTier2 />
            </AdminTier2Route>
          }
        />

        <Route
          path="/searchprofile-tier-2"
          element={
            <AdminTier2Route>
              <SearchProfileTier2 />
            </AdminTier2Route>
          }
        />

        <Route
          path="/export-all-users"
          element={
            <AdminTier2Route>
              <ExportAllUsers />
            </AdminTier2Route>
          }
        />

        <Route
          path="/edit-profile/:userId"
          element={
            <AdminTier2Route>
              <EditProfile />
            </AdminTier2Route>
          }
        />

      </Routes>
    </Router>
  );
}

export default App;
