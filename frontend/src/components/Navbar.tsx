import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/float.png'
import credit from '../assets/credit.gif'

const Navbar: React.FC = () => {
  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex-shrink-0 flex gap-2 items-center">
            <img src={logo} alt="" className='h-7'/> 
            <Link to="/" className="text-2xl font-bold text-gray-800 font-cabin dark:text-white">Vibeo</Link>
          </div>
          <div className="flex items-center">
          <div className='flex  hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md gap-1 h-6 '>
              <img className="" src={credit} alt="" />
              <span className='text-white font-cabin '>5</span>
            </div>
            <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
              <Link to="/pricing" className="text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 px-3 font-cabin py-2 rounded-md text-sm font-medium">Pricing</Link>
              <Link to="/signin" className="text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 px-3 font-cabin py-2 rounded-md text-sm font-medium">Sign In</Link>
              <Link to="/signup" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium font-cabin">Try Now</Link>
            </div>
           
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;