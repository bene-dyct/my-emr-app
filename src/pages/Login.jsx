import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
  await signInWithEmailAndPassword(auth, email, password);
navigate("/profile");
  // continue login success...
} catch (error) {
  let msg = "";

  switch (error.code) {
    case "auth/invalid-credential":
      msg = "Incorrect email or password. Please try again.";
      break;

    case "auth/user-not-found":
      msg = "No account found with this email.";
      break;

    case "auth/wrong-password":
      msg = "Incorrect password. Please try again.";
      break;

    case "auth/too-many-requests":
      msg = "Too many failed attempts. Please wait or reset your password.";
      break;

    default:
      msg = "Login failed. Please try again.";
  }

  alert(msg);
}
 finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Navbar/>
    <div className="flex flex-col items-center justify-center h-screen relative p-5 bg-[#56CFE1]">
      <h2 className="text-2xl font-bold mb-4">Login to your Profile</h2>
      <form onSubmit={handleLogin} className="md:w-96 space-y-2">
        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 bg-white rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 bg-white rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          className="w-full bg-[#6930C3] hover:bg-[#7400B8] text-white py-2 rounded cursor-pointer"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Log In"}
        </button>
      </form>

      {/* Floating details (you can customize these as needed) */}
      <div className="max-md:hidden absolute top-30 left-10 w-32 h-32 bg-blue-500 rounded-full opacity-30 animate-bounce"></div>
      <div className="max-md:hidden absolute bottom-10 right-10 w-48 h-48 bg-blue-500 rounded-full opacity-30 animate-bounce"></div>
      <div className="max-md:hidden absolute top-40 right-20 w-24 h-24 bg-blue-500 rounded-full opacity-30 animate-bounce"></div>
    </div>
    </>
  );
}