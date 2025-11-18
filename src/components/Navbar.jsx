import React, { useEffect, useRef, useState } from 'react'
import { MdMenu, MdMenuOpen } from 'react-icons/md';
import { Link, NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';



 


const Navbar = () => {
     
      const [isOpen, setIsOpen] = useState(false);
        const menuRef = useRef(null);
        const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
   const handleScroll = () => {
     if (window.scrollY === 0) {
       setShowNavbar(true); 
     } else if (window.scrollY < lastScrollY) {
       setShowNavbar(true); 
     } else {
       setShowNavbar(false); 
     }
     setLastScrollY(window.scrollY);
   };
 
   window.addEventListener("scroll", handleScroll);
   return () => window.removeEventListener("scroll", handleScroll);
 }, [lastScrollY]);
  
        
  
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };
  
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

  return (
    <motion.nav
    initial={{ y: -100 }}
      animate={{ y: showNavbar ? 0 : -100 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className='w-full h-[70px] fixed top-0 left-0 text-[#010080] py-2 z-9999 bg-transparent'
    >
      <div
      className="flex flex-row items-center justify-between"
      >
      <div className='inline-block'><Link to="/"><img src='/logo.png' className='w-[118.88px] max-h-[36.19px] md:ml-[10px] inline-block mt-4 pl-3'/></Link></div>
        <ul
                   ref={menuRef} 
                   className={`flex max-lg:flex-col items-center absolute top-15 lg:static text-center gap-7 lg:gap-9 min-lg:bg-none max-lg:text-black font-medium lg:w-auto bg-white lg:flex-row z-9999 ${
                     isOpen ? 'min-h-[50svh] w-full ' : 'h-[0px] w-[60%]'
                   }`}
                 >
                   <li className={`block ${isOpen ? "pt-10" : "max-lg:hidden"} pt-2 justify-between 
                          text-black active:text-indigo-900 hover:text-indigo-900 max-lg:text-black max-lg:hover:text-blue-700`} ><NavLink to="/" className={({ isActive }) => `text-black hover:text-indigo-900 ${isActive ? 'text-indigo-900' : 'lg:text-white'}`}>Home</NavLink></li>

                    <li className={`block ${isOpen ? "" : "max-lg:hidden"} pt-2 justify-between 
                          text-black active:text-indigo-900 hover:text-indigo-900 max-lg:text-black max-lg:hover:text-blue-700`} ><NavLink to="/register" className={({ isActive }) => `text-black hover:text-indigo-900 ${isActive ? 'text-indigo-900' : 'lg:text-white'}`}>Register</NavLink></li>
                   <li className={`block ${isOpen ? "" : "max-lg:hidden"} pt-2 justify-between 
                         text-black active:text-indigo-900 hover:text-indigo-900 max-lg:text-black max-lg:hover:text-blue-700`} ><NavLink to="/profile" className={({ isActive }) => `text-black hover:text-indigo-900 ${isActive ? 'text-indigo-900' : 'lg:text-white'}`}>Profile</NavLink></li>
                   
                 </ul>
        <Link to='/admin'><button className='max-lg:hidden mr-5 h-[48px] cursor-pointer w-[169px] rounded-lg inset-0 bg-[#6930C3] hover:bg-[#7400B8] text-white hover:ring-1 hover:ring-white text-center'>Admin Access</button></Link>
        <button 
          className="block cursor-pointer lg:hidden mr-3"
          onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <MdMenuOpen className='text-3xl' /> : <MdMenu className='text-3xl' />}
        </button>
        </div>
        
    </motion.nav>
  )
}

export default Navbar