import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const OtpVerification: React.FC = () => {
  const [otp, setOtp] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would verify the OTP with your backend
    // For this example, we'll just check if it's "1234"
    if (otp === '1234') {
      const pendingUser = JSON.parse(localStorage.getItem('pendingUser') || '{}');
      localStorage.setItem('user', JSON.stringify(pendingUser));
      localStorage.removeItem('pendingUser');
      navigate('/');
    } else {
      alert('Invalid OTP');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        placeholder="Enter OTP"
        required
        className="w-full p-2 border rounded"
      />
      <button type="submit" className="w-full p-2 bg-blue-500 text-white rounded">
        Verify OTP
      </button>
    </form>
  );
};

export default OtpVerification;