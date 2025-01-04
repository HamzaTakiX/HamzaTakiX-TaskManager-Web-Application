'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import Cookies from 'js-cookie'
import api from '../_utils/axiosConfig'

// Create axios instance with base URL
// const api = axios.create({
//   baseURL: 'http://localhost:9000/api',
//   headers: {
//     'Content-Type': 'application/json'
//   }
// });

// Add request interceptor to include token
// api.interceptors.request.use((config) => {
//   const token = Cookies.get('token');
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// }, (error) => {
//   return Promise.reject(error);
// });

const UserContext = createContext()

export function UserProvider({ children }) {
  const [profileImage, setProfileImage] = useState(null)
  const [bannerImage, setBannerImage] = useState(null)
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userJob, setUserJob] = useState('')
  const [userPhone, setUserPhone] = useState('')
  const [userLanguages, setUserLanguages] = useState('')
  const [userLocation, setUserLocation] = useState('Casablanca, Morocco')
  const [userAbout, setUserAbout] = useState('')
  const [userSkills, setUserSkills] = useState([])
  const [joinedDate, setJoinedDate] = useState('')

  useEffect(() => {
    // First try to load from localStorage
    const loadFromLocalStorage = () => {
      try {
        const storedImage = localStorage.getItem('profileImage')
        const storedBannerImage = localStorage.getItem('bannerImage')
        const storedName = localStorage.getItem('userName')
        const storedEmail = localStorage.getItem('userEmail')
        const storedJob = localStorage.getItem('userJob')
        const storedPhone = localStorage.getItem('userPhone')
        const storedLanguages = localStorage.getItem('userLanguages')
        const storedLocation = localStorage.getItem('userLocation')
        const storedAbout = localStorage.getItem('userAbout')
        const storedSkills = JSON.parse(localStorage.getItem('userSkills') || '[]')
        const storedJoinedDate = localStorage.getItem('joinedDate')

        
        if (storedImage && storedImage !== 'null' && storedImage !== 'undefined' && storedImage !== 'none') {
          setProfileImage(storedImage)
        }
        if (storedBannerImage && storedBannerImage !== 'null' && storedBannerImage !== 'undefined' && storedBannerImage !== 'none') {
          setBannerImage(storedBannerImage)
        }
        if (storedName && storedName !== '') setUserName(storedName)
        if (storedEmail && storedEmail !== '') setUserEmail(storedEmail)
        if (storedJob && storedJob !== '') setUserJob(storedJob)
        if (storedPhone) setUserPhone(storedPhone)
        if (storedLanguages) setUserLanguages(storedLanguages)
        if (storedLocation && storedLocation !== '') setUserLocation(storedLocation)
        if (storedAbout && storedAbout !== '') setUserAbout(storedAbout)
        if (storedSkills && storedSkills.length > 0) setUserSkills(storedSkills)
        if (storedJoinedDate) setJoinedDate(storedJoinedDate)

        // After loading from localStorage, try to get fresh data from the server
        const token = Cookies.get('token')
        if (token) {
          api.get('/users/me')
            .then(response => {
              if (response.data.state) {
                const userData = response.data.user
                if (userData.profileImage) setProfileImage(userData.profileImage)
                if (userData.bannerImage) setBannerImage(userData.bannerImage)
                if (userData.fullName) setUserName(userData.fullName)
                if (userData.email) setUserEmail(userData.email)
                if (userData.job) setUserJob(userData.job)
                if (userData.phoneNumber) setUserPhone(userData.phoneNumber)
                if (userData.languages) setUserLanguages(userData.languages)
                if (userData.location) setUserLocation(userData.location)
                if (userData.about) setUserAbout(userData.about)
                if (userData.skills) setUserSkills(userData.skills)
                if (userData.joinedDate) {
                  setJoinedDate(userData.joinedDate)
                  localStorage.setItem('joinedDate', userData.joinedDate)
                }
              }
            })
            .catch(error => {
              console.error('Error fetching user data:', error)
            })
        }
      } catch (error) {
        console.error('Error loading from localStorage:', error)
      }
    }

    // Only run on client-side and only on initial mount
    if (typeof window !== 'undefined') {
      loadFromLocalStorage()
    }
  }, []) // Empty dependency array means this only runs once on mount

  const updateProfileImage = async (newImage) => {
    try {
      if (newImage && newImage !== 'none') {
        setProfileImage(newImage)
        localStorage.setItem('profileImage', newImage)
      } else {
        setProfileImage(null)
        localStorage.removeItem('profileImage')
        // Don't reload other user data when removing image
      }
    } catch (error) {
      console.error('Error updating profile image:', error)
    }
  }

  const updateBannerImage = async (newImage) => {
    try {
      if (newImage && newImage !== 'none') {
        setBannerImage(newImage)
        localStorage.setItem('bannerImage', newImage)
      } else {
        setBannerImage(null)
        localStorage.removeItem('bannerImage')
        // Don't reload other user data when removing image
      }
    } catch (error) {
      console.error('Error updating banner image:', error)
    }
  }

  const updateUserName = (newName) => {
    try {
      setUserName(newName)
      if (newName) {
        localStorage.setItem('userName', newName)
      } else {
        localStorage.removeItem('userName')
      }
    } catch (error) {
      console.error('Error updating user name:', error)
    }
  }

  const updateUserEmail = (newEmail) => {
    try {
      setUserEmail(newEmail)
      if (newEmail) {
        localStorage.setItem('userEmail', newEmail)
      } else {
        localStorage.removeItem('userEmail')
      }
    } catch (error) {
      console.error('Error updating user email:', error)
    }
  }

  const updateUserJob = (newJob) => {
    try {
      setUserJob(newJob)
      if (newJob) {
        localStorage.setItem('userJob', newJob)
      } else {
        localStorage.removeItem('userJob')
      }
    } catch (error) {
      console.error('Error updating user job:', error)
    }
  }

  const updateUserPhone = async (newPhone) => {
    try {
      // Ensure we're not setting undefined or null
      const phoneValue = newPhone || ''
      console.log('Setting phone number in context:', phoneValue)
      setUserPhone(phoneValue)
      
      // Only save to localStorage if we have a value
      if (phoneValue) {
        localStorage.setItem('userPhone', phoneValue)
        console.log('Saved phone to localStorage:', phoneValue)
      } else {
        localStorage.removeItem('userPhone')
        console.log('Removed phone from localStorage')
      }
    } catch (error) {
      console.error('Error updating user phone:', error)
    }
  }

  const updateUserLanguages = (newLanguages) => {
    try {
      setUserLanguages(newLanguages)
      if (newLanguages) {
        localStorage.setItem('userLanguages', newLanguages)
      } else {
        localStorage.removeItem('userLanguages')
      }
    } catch (error) {
      console.error('Error updating user languages:', error)
    }
  }

  const updateUserLocation = (newLocation) => {
    try {
      setUserLocation(newLocation)
      if (newLocation) {
        localStorage.setItem('userLocation', newLocation)
      } else {
        localStorage.removeItem('userLocation')
      }
    } catch (error) {
      console.error('Error updating user location:', error)
    }
  }

  const updateUserAbout = async (newAbout) => {
    try {
      const token = Cookies.get('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await api.put('/users/update-profile', {
        about: newAbout
      });
      
      if (response.data.state) {
        setUserAbout(newAbout);
        localStorage.setItem('userAbout', newAbout);
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error('Error updating about:', error);
      throw error;
    }
  }

  const updateUserSkills = async (newSkills) => {
    try {
      console.log('Attempting to update skills to:', newSkills); // Debug log
      const token = Cookies.get('token')
      if (!token) {
        throw new Error('Authentication required')
      }

      const response = await api.put('/users/update-profile', {
        skills: newSkills
      })

      console.log('Server response:', response.data); // Debug log

      if (response.data.state) {
        setUserSkills(newSkills)
        localStorage.setItem('userSkills', JSON.stringify(newSkills))
        console.log('Skills updated successfully:', newSkills); // Debug log
        return true
      } else {
        throw new Error(response.data.message)
      }
    } catch (error) {
      console.error('Skills update error:', error)
      throw error
    }
  }

  const updateUserJoinedDate = (newJoinedDate) => {
    try {
      setJoinedDate(newJoinedDate)
      if (newJoinedDate) {
        localStorage.setItem('joinedDate', newJoinedDate)
      } else {
        localStorage.removeItem('joinedDate')
      }
    } catch (error) {
      console.error('Error updating joined date:', error)
    }
  }

  const deleteAccount = async () => {
    try {
      const token = Cookies.get('token')
      if (!token) {
        throw new Error('Authentication required')
      }

      const response = await api.delete('/users/delete-account')

      if (response.data.state) {
        // Clear all local storage
        localStorage.clear()
        // Clear all cookies
        Cookies.remove('token')
        // Reset all state
        setProfileImage(null)
        setBannerImage(null)
        setUserName('')
        setUserEmail('')
        setUserJob('')
        setUserPhone('')
        setUserLanguages('')
        setUserLocation('Casablanca, Morocco')
        setUserAbout('')
        setUserSkills([])
        setJoinedDate('')
        
        // Redirect to login page with correct path
        window.location.href = '/auth/login'
        return true
      } else {
        throw new Error(response.data.message)
      }
    } catch (error) {
      console.error('Error deleting account:', error)
      throw error
    }
  }

  return (
    <UserContext.Provider
      value={{
        profileImage,
        bannerImage,
        userName,
        userEmail,
        userJob,
        userPhone,
        userLanguages,
        userLocation,
        userAbout,
        userSkills,
        joinedDate,
        updateProfileImage,
        updateBannerImage,
        updateUserName,
        updateUserEmail,
        updateUserJob,
        updateUserPhone,
        updateUserLanguages,
        updateUserLocation,
        updateUserAbout,
        updateUserSkills,
        updateUserJoinedDate,
        deleteAccount
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
