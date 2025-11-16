import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminTier2() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

// Device detection to restrict mobile access
const [allowed, setAllowed] = useState(null);

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();

    const isMobile =
      /iphone|ipad|ipod|android|blackberry|mini|windows\sce|palm/i.test(
        userAgent
      );

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


  // Admin credentials - in a real app, these should be stored securely
  const ADMIN_USERNAME = 'admin456';
  const ADMIN_PASSWORD = 'adminPass456!';

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // Set admin authentication state
      sessionStorage.setItem('isAdminTier2Authenticated', 'true');
      navigate('/dashboard-tier-2');
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="max-lg:hidden flex flex-col items-center justify-center min-h-screen bg-[#56CFE1]">
      <div className="w-96 p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">Admin Tier 2 Login</h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-100 rounded">
              {error}
            </div>
          )}
          
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
            className="w-full py-2 px-4 cursor-pointer bg-[#6930C3] hover:bg-[#7400B8] text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}