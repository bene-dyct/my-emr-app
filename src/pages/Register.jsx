import { useState } from "react";
import { db, logFirebaseEvent } from "../firebaseConfig";
import { setDoc, doc } from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function Register() {
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("");
  const [dobInput, setDobInput] = useState(""); // YYYY-MM-DD
  const [dob, setDob] = useState(""); // DD-MM-YYYY
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Log page visit
  useState(() => {
    logFirebaseEvent("page_view", {
      page_name: "Register",
      timestamp: new Date().toISOString()
    });
  }, []);

  // Capitalize function
  const capitalizeWords = (str) => {
    return str
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Generate unique user ID
      const timestamp = new Date().getTime();
      const shortId = timestamp.toString().slice(-4);
      const customUserId = `${firstName.toLowerCase()}_${lastName.toLowerCase()}_${shortId}`;

      // Capitalize text fields
      const capitalizedFirstName = capitalizeWords(firstName.trim());
      const capitalizedMiddleName = capitalizeWords(middleName.trim());
      const capitalizedLastName = capitalizeWords(lastName.trim());
      const capitalizedGender =
        gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();

      // Save to Firestore
      await setDoc(doc(db, "users", customUserId), {
        firstName: capitalizedFirstName,
        middleName: capitalizedMiddleName,
        lastName: capitalizedLastName,
        gender: capitalizedGender,
        dob,
        age,
        weight: weight ? `${weight} kg` : "",
        height: height ? `${height} cm` : "",
        phone,
        createdAt: new Date().toISOString(),
      });

      // Log successful registration
      logFirebaseEvent("user_registration", {
        first_name: capitalizedFirstName,
        middle_name: capitalizedMiddleName,
        last_name: capitalizedLastName,
        age: age,
        gender: capitalizedGender,
        timestamp: new Date().toISOString()
      });

      alert(
        `Registration successful!`
      );
       // Reset all fields
      setFirstName("");
      setMiddleName("");
      setLastName("");
      setGender("");
      setDob("");
      setDobInput("");
      setAge("");
      setWeight("");
      setHeight("");
      setPhone("");

    } catch (error) {
      logFirebaseEvent("registration_error", {
        error_message: error.message,
        timestamp: new Date().toISOString()
      });
      alert("Error saving registration data. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div
        className="w-full flex flex-col items-center justify-center min-h-screen p-5"
        style={{
          backgroundImage: "url('https://ik.imagekit.io/myownImagekit/myemrapp/registerpc.png')",
          backgroundRepeat: "no-repeat",
          width: "100%",
          alignItems: "center",
          objectFit: "cover",
          backgroundPosition: "center",
          backgroundSize: "cover",
          justifyContent: "center",
        }}
      >
        <p className="mt-25">
          Already registered?{" "}
          <span className="text-lg text-white md:text-blue-700">
            <Link to="/login">Log In Here</Link>
          </span>
        </p>

        <h2 className="text-2xl font-bold py-3 mt-10 md:w-1/2 md:ml-auto flex items-center text-center justify-center">
          Register
        </h2>
        <p className="font-bold py-3 md:w-1/2 md:ml-auto flex items-center text-center justify-center">
          Fill in your personal details here to register on myVitalApp. We’ll
          store this information securely for you.
        </p>

        <form
          onSubmit={handleRegister}
          className="md:w-1/2 md:ml-auto space-y-2 md:pr-5 p-5 bg-white/80 rounded-lg"
        >
          <div className="flex flex-col md:flex-row gap-2">
            <input
              type="text"
              placeholder="First name"
              className="w-full md:w-1/2 p-2 border rounded"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Middle name"
              className="w-full md:w-1/2 p-2 border rounded"
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Last name"
              className="w-full md:w-1/2 p-2 border rounded"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>

          <select
            className="w-full p-2 border rounded"
            value={gender}
            required
            onChange={(e) => setGender(e.target.value)}
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>

          <div className="flex items-center gap-2">
            <input
              type="date"
              className="flex-1 p-2 border rounded"
              value={dobInput}
              required
              onChange={(e) => {
                const iso = e.target.value; // YYYY-MM-DD
                setDobInput(iso);

                const d = new Date(iso);
                if (!isNaN(d.getTime())) {
                  const dd = String(d.getDate()).padStart(2, "0");
                  const mm = String(d.getMonth() + 1).padStart(2, "0");
                  const yyyy = d.getFullYear();

                  setDob(`${dd}-${mm}-${yyyy}`);

                  const today = new Date();
                  let a = today.getFullYear() - d.getFullYear();
                  const m = today.getMonth() - d.getMonth();
                  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) a--;
                  setAge(String(a));
                }
              }}
            />

            <input
              type="number"
              placeholder="Age"
              className="w-27 p-2 border rounded"
              value={age}
              readOnly
            />
          </div>

          <input
            type="tel"
            placeholder="Phone number"
            className="w-full p-2 border rounded"
            value={phone}
            required
            onChange={(e) => setPhone(e.target.value)}
          />

          <div className="flex gap-2">
            <div className="flex-1 flex items-center">
              <input
                type="number"
                placeholder="Weight"
                className="w-26 flex-1 p-2 border rounded"
                value={weight}
                required
                onChange={(e) => setWeight(e.target.value)}
              />
              <span className="ml-2">kg</span>
            </div>
            <div className="flex-1 flex items-center">
              <input
                type="number"
                placeholder="Height"
                className="w-26 flex-1 p-2 border rounded"
                value={height}
                required
                onChange={(e) => setHeight(e.target.value)}
              />
              <span className="ml-2">cm</span>
            </div>
          </div>

          <button
            className="w-full bg-[#6930C3] hover:bg-[#7400B8] text-white py-2 rounded cursor-pointer"
            disabled={loading}
          >
            {loading ? "Please wait..." : "Register"}
          </button>
        </form>
      </div>
    </>
  );
}
