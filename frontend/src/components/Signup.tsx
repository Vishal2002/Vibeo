import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signup } from '../api/apiService';
import { toast } from 'react-toastify';
const Signup = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async(e: React.FormEvent) => {
    e.preventDefault();
    const data= await signup(username,email,password);
    if(data){
      toast.success("Successfully signed up!!")
      navigate('/signin');
    }
    else{
      toast.error("Error sign up");
    }
  };

  return (
    <>
    
    <div className='flex flex-col min-h-screen justify-center items-center bg-gray-50'>
    <span className='mb-2 text-xl font-bold' >Sign up</span>
      <div className='w-full max-w-md p-6 bg-white rounded-lg shadow-md'>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={username}
            autoComplete='username'
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            required
            className="w-full p-2 border rounded"
          />
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
          <button type="submit" className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
            Sign Up
          </button>
        </form>
      </div>
    </div>
    </>
  );
}

export default Signup;