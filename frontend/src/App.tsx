import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Signin from './components/Signin';
import Signup from './components/Signup';
import Pricing from './components/Pricing';
import VideoUpload from './components/VideoUpload';
import NoPage from './components/NoPage';
import { ToastContainer } from 'react-toastify';
import { AuthProvider } from './context/Auth';
import 'react-toastify/dist/ReactToastify.css';

const App: React.FC = () => {
  return (
    <AuthProvider>
     <BrowserRouter>
      <div className=''>
        <Navbar />
        <Routes>
          <Route path="/" element={<VideoUpload/>} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/*" element={<NoPage/>} />
        </Routes>
      </div>
      <ToastContainer position="top-right" autoClose={5000} />
    </BrowserRouter>
    </AuthProvider>
    
  );
};



export default App;