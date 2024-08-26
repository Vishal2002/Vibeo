
import { Link } from 'react-router-dom';
import notfound from '../assets/notfound.svg'
const NoPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="flex flex-col justify-center">
        <img src={notfound} className='h-80' />
        <p className="text-gray-500 mb-8">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <div className='flex justify-center w-full'>
        <Link 
          to="/" 
          className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition duration-300"
        >
          Go Back Home
        </Link>

        </div>
              </div>
    </div>
  );
};

export default NoPage;