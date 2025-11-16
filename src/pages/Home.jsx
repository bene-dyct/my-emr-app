import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../index.css';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <>
    <Navbar/>
    <div className="flex flex-col items-center justify-center relative overflow-hidden lg:hidden text-center gap-7"
    style={
      {
        backgroundImage: "url('https://ik.imagekit.io/myownImagekit/myemrapp/heromobile.png')",
        backgroundRepeat: 'no-repeat',
        height: '100vh',
        alignItems: 'center',
        objectFit: 'contain',
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        justifyContent: 'center'
      }
    }>
      <motion.h1
      initial={{ opacity:0, y:40 }}
    whileInView={{ opacity:1, y:0}}
    transition={{
      type: "spring",
      stiffness: 100,
      delay: 0.1,
      damping: 20,
    }}
      className="text-white text-4xl font-bold mt-20 mb-4">Welcome to MyVitalApp</motion.h1>
      
      <motion.h2
      initial={{ opacity:0, y:40 }}
    whileInView={{ opacity:1, y:0}}
    transition={{
      type: "spring",
      stiffness: 100,
      delay: 0.2,
      damping: 20,
    }}
      className="text-white text-2xl mb-2 px-2">Stay Connected to Your Health</motion.h2>
      <motion.h3
      initial={{ opacity:0, y:40 }}
    whileInView={{ opacity:1, y:0}}
    transition={{
      type: "spring",
      stiffness: 100,
      delay: 0.3,
      damping: 20,
    }}
      className="text-white text-base mb-4">Your wellbeing matters and myVitalApp helps you stay in tune with it every day. Simple, smart and made just for you!</motion.h3>
      <motion.div
      initial={{ opacity:0, y:40 }}
    whileInView={{ opacity:1, y:0}}
    transition={{
      type: "spring",
      stiffness: 100,
      delay: 0.4,
      damping: 20,
    }}
      className='flex w-[80%] min-[420px]:w-1/2 px-15 justify-between'>
        <button className="bg-[#6930C3] text-sm hover:bg-[#7400B8] text-white py-2 px-4 cursor-pointer rounded mb-4">
        <Link to="/register">Register</Link>
      </button>
      <button className="bg-white text-sm cursor-pointer text-[#6930C3] py-2 px-4 rounded mb-4">
        <Link to="/login">Log In</Link>
      </button>
      </motion.div>
    </div>

<div className='flex flex-row w-full max-lg:hidden'>
  <div className='w-1/3 bg-white flex flex-col p-5'>
        <motion.h1
        initial={{ opacity:0, y:40 }}
    whileInView={{ opacity:1, y:0}}
    transition={{
      type: "spring",
      stiffness: 100,
      delay: 0.1,
      damping: 20,
    }}
        className="text-black max-[1200px]:text-3xl text-4xl font-bold mb-8 mt-30 min-[1200px]:mt-40">Welcome to <span className='text-[#7400B8]'>MyVitalApp</span></motion.h1>
      
      <motion.h2
      initial={{ opacity:0, y:40 }}
    whileInView={{ opacity:1, y:0}}
    transition={{
      type: "spring",
      stiffness: 100,
      delay: 0.1,
      damping: 20,
    }}
      className="text-black max-[1200px]:text-xl text-2xl mb-2">Stay Connected to Your Health</motion.h2>
      <motion.h3
      initial={{ opacity:0, y:40 }}
    whileInView={{ opacity:1, y:0}}
    transition={{
      type: "spring",
      stiffness: 100,
      delay: 0.2,
      damping: 20,
    }}
      className="text-black text-base mb-4 max-w-4xl">Your wellbeing matters and myVitalApp helps you stay in tune with it every day. Simple, smart and made just for you! In a world full of health data and constant medical information, myVitalApp helps you keep what truly matters right at your fingertips. From tracking vital signs to managing appointments and monitoring progress, we make your wellness journey simpler, smarter, and more personal. Take charge of your health today.</motion.h3>
      <div className='flex flex-row gap-1'>
      <motion.p
      initial={{ opacity:0, y:40 }}
    whileInView={{ opacity:1, y:0}}
    transition={{
      type: "spring",
      stiffness: 100,
      delay: 0.3,
      damping: 20,
    }}
      className='mt-10'>Stay informed.</motion.p>
      <motion.p
      initial={{ opacity:0, y:40 }}
    whileInView={{ opacity:1, y:0}}
    transition={{
      type: "spring",
      stiffness: 100,
      delay: 0.4,
      damping: 20,
    }}
      className='mt-10'>Stay informed.</motion.p>
      <motion.p
      initial={{ opacity:0, y:40 }}
    whileInView={{ opacity:1, y:0}}
    transition={{
      type: "spring",
      stiffness: 100,
      delay: 0.5,
      damping: 20,
    }}
      className='mt-10'>Stay informed.</motion.p>
      </div>
      <motion.div
      initial={{ opacity:0, y:40 }}
    whileInView={{ opacity:1, y:0}}
    transition={{
      type: "spring",
      stiffness: 100,
      delay: 0.5,
      damping: 20,
    }}
      className='flex flex-row max-lg:w-1/3  gap-5 mt-10'>
        <Link to="/register"><button className="bg-[#6930C3] hover:bg-[#7400B8] cursor-pointer text-white py-2 px-4 rounded mb-4">
        Register
      </button></Link>
      <Link to="/login"><button className="bg-[#7400B8] text-white hover:bg-[#6930C3] cursor-pointer hover:text-white py-2 px-4 rounded mb-4">
        Log In
      </button></Link>
      </motion.div>
      </div> 
<div className="flex items-center justify-center overflow-hidden w-2/3"
    style={
      {
        backgroundImage: "url('https://ik.imagekit.io/myownImagekit/myemrapp/heropc.png')",
        backgroundRepeat: 'no-repeat',
        height: '100vh',
        objectFit: 'cover',
        backgroundPosition: 'center 80%',
        backgroundSize: 'cover',
      }
    }></div>
</div> 
    </>
  );
}