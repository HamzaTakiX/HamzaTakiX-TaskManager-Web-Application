"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { MdEmail, MdLockReset, MdSecurity, MdLock, MdMailOutline } from 'react-icons/md';
import { IoArrowBack } from 'react-icons/io5';
import { motion } from 'framer-motion';
import { HiKey } from 'react-icons/hi';
import { RiShieldKeyholeLine } from 'react-icons/ri';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');
    setPreviewUrl('');

    try {
      console.log('Sending forgot password request...');
      const response = await axios.post('/api/users/forgot-password', { email });
      console.log('Server response:', response.data);

      if (response.data.state) {
        setMessage('Password reset instructions have been sent to your email.');
        
        if (response.data.previewUrl) {
          console.log('Preview URL received:', response.data.previewUrl);
          setPreviewUrl(response.data.previewUrl);
          // Try to open in new window
          try {
            window.open(response.data.previewUrl, '_blank', 'noopener,noreferrer');
          } catch (err) {
            console.error('Error opening preview URL:', err);
          }
        } else {
          console.log('No preview URL in response');
        }
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.response?.data?.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex w-screen flex-wrap text-slate-800">
      <div className="flex w-full flex-col md:w-1/2">
        <div className="flex justify-center pt-12 md:justify-start md:pl-12">
          <Link href="/" className="text-2xl font-bold text-[#074799]">Star Company</Link>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="my-auto mx-auto flex flex-col justify-center px-6 pt-8 md:justify-start lg:w-[28rem]"
        >
          <div className="text-center md:text-left">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex justify-center md:justify-start"
            >
              <MdLockReset className="h-24 w-24 text-[#074799]" />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-6 text-3xl font-bold md:text-5xl"
            >
              Forgot Password
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-6 text-base text-gray-600"
            >
              Enter your email address and we'll send you instructions to reset your password.
            </motion.p>
          </div>

          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex flex-col items-stretch pt-3 md:pt-8"
            onSubmit={handleSubmit}
          >
            <div className="flex flex-col pt-4">
              <div className="relative flex overflow-hidden rounded-md border-2 transition focus-within:border-[#074799]">
                <div className="flex items-center pl-4">
                  <MdEmail className="text-gray-400 h-6 w-6" />
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full flex-shrink appearance-none border-gray-300 bg-white py-2 px-4 text-base text-gray-700 placeholder-gray-400 focus:outline-none"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 text-center text-sm text-red-500"
              >
                {error}
              </motion.div>
            )}

            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 text-center text-sm text-green-500"
              >
                {message}
                {previewUrl && (
                  <div className="mt-2">
                    <a 
                      href={previewUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[#074799] hover:underline"
                    >
                      Click here to view the email
                    </a>
                  </div>
                )}
              </motion.div>
            )}

            <div className="mt-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className={`w-full rounded-lg bg-[#074799] px-4 py-2 text-center text-base font-semibold text-white shadow-md outline-none ring-[#063a7a] ring-offset-2 transition hover:bg-[#063a7a] focus:ring-2 ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="mx-auto h-6 w-6 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  'Send Reset Instructions'
                )}
              </motion.button>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="py-12 text-center"
            >
              <Link 
                href="/auth/login" 
                className="inline-flex items-center gap-2 font-semibold text-[#074799] hover:text-[#063a7a] transition-colors duration-300"
              >
                <IoArrowBack className="h-5 w-5" />
                Back to Login
              </Link>
            </motion.div>
          </motion.form>
        </motion.div>
      </div>

      <div className="relative hidden h-screen select-none bg-[#074799] bg-gradient-to-br md:block md:w-1/2">
        <div className="py-8 px-8 text-white xl:w-[40rem]">
          <span className="rounded-full bg-white px-3 py-1 font-medium text-[#074799]">Password Recovery</span>
          <p className="my-4 text-3xl font-semibold leading-10">Reset your password with <span className="whitespace-nowrap py-2 text-cyan-300">Star Company</span></p>
          <p className="mb-2">We'll help you get back to managing your tasks efficiently with a new secure password.</p>
        </div>

        <div className="relative px-8">
          <div className="absolute inset-0 bg-gradient-to-t from-[#074799] to-transparent" />
          
          {/* Animated Icons Container */}
          <div className="relative grid grid-cols-2 gap-6 max-w-lg mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-6 flex flex-col items-center"
            >
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                  rotateY: [0, 360]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
                className="mb-2"
              >
                <MdMailOutline className="h-16 w-16 text-white" />
              </motion.div>
              <p className="text-white text-center font-medium">Check Your Email</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-6 flex flex-col items-center"
            >
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 4,
                  repeat: Infinity
                }}
                className="mb-2"
              >
                <HiKey className="h-16 w-16 text-white" />
              </motion.div>
              <p className="text-white text-center font-medium">Reset Password</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-6 flex flex-col items-center"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
                className="mb-2"
              >
                <MdSecurity className="h-16 w-16 text-white" />
              </motion.div>
              <p className="text-white text-center font-medium">Secure Access</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-6 flex flex-col items-center"
            >
              <motion.div
                animate={{ 
                  rotateZ: [0, 10, -10, 10, 0],
                  y: [0, -5, 0]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity
                }}
                className="mb-2"
              >
                <RiShieldKeyholeLine className="h-16 w-16 text-white" />
              </motion.div>
              <p className="text-white text-center font-medium">Protected Account</p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
