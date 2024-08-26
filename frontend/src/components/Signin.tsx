import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/apiService';
import {toast} from 'react-toastify'
import { useAuth } from '../context/Auth';
const Signin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const {Authlogin}=useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
     const data=await login(email, password);
     console.log(data);
    if (data.token){
      Authlogin(data.token,data.freeTrialsRemaining);
      toast.success('Signin succesfyul.');
      navigate('/');
    }
    else{
      toast.error('An unexpected error occurred. Please try again.');
    }
      
    } catch (err) {
    
    }
  };

  return (
    <div className='flex flex-col min-h-screen justify-center items-center bg-gray-50'>
    <span className='mb-2 text-xl font-bold' >Sign in</span>
      <div style={{boxShadow: "rgba(14, 30, 37, 0.12) 0px 2px 4px 0px, rgba(14, 30, 37, 0.32) 0px 2px 16px 0px"}}  className='w-full max-w-md p-6 bg-white rounded-lg'>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full p-2 border rounded"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="w-full p-2 border rounded"
          />
          <div className='w-full flex justify-center'>
          <button type="submit" className=" w-1/3  p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
            Sign in
          </button>
          </div>
        
        </form>
      </div>
    </div>
  );
};

export default Signin;