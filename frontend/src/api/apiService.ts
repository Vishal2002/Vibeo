import axios from 'axios';
import { toast } from 'react-toastify';


const BASE_URL=import.meta.env.VITE_APP_API_BASE_URL_LIVE;

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
});

const setAuthToken = (token: string) => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
};

export const signup = async (username: string, email: string, password: string) => {
    try {
        const response = await api.post('auth/signup', { username, email, password });
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw error.response?.data || error.message;
        }
        throw error;
    }
};

export const login = async (email: string, password: string) => {
    try {
        const response = await api.post('auth/login', { email, password });
        const { token } = response.data;
        setAuthToken(token);
        localStorage.setItem('token', token);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw error.response?.data || error.message;
        }
        throw error;
    }
};

export const logout = () => {
    localStorage.removeItem('token');
    setAuthToken('');
};

export const getVideo=async(videoId:string)=>{
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    setAuthToken(token);
    const {data}=await api.get(`/video/${videoId}`);
    return data;
    
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw error.response?.data || error.message;
    }
    throw error;
  }
}

export const upload = async (file: File, onProgress: (progress: number) => void) => {
  const formData = new FormData();
  formData.append('video', file);
  try{
  const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    setAuthToken(token);

    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent: any) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      }
    });
    console.log(response.data);
    return response.data;
  } 
  catch (error) {
    if (axios.isAxiosError(error)) {
      throw error.response?.data || error.message;
    }
    throw error;
  }

};