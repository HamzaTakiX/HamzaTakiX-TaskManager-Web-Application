"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { MdLock, MdSecurity } from 'react-icons/md';
import { motion } from 'framer-motion';
import { IoArrowBack } from 'react-icons/io5';

// API base URL
const API_BASE_URL = '/api/users';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link');
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    }
  }, [token, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate password
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter');
      return;
    }

    if (!/[a-z]/.test(password)) {
      setError('Password must contain at least one lowercase letter');
      return;
    }

    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number');
      return;
    }

    if (!/[!@#$%^&*]/.test(password)) {
      setError('Password must contain at least one special character (!@#$%^&*)');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      console.log('Sending reset request with token:', token);
      const response = await axios.post(`${API_BASE_URL}/reset-password`, {
        token,
        newPassword: password
      });

      console.log('Reset response:', response.data);

      if (response.data.state) {
        setMessage('Password has been reset successfully. Redirecting to login...');
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      } else {
        setError(response.data.message || 'Failed to reset password');
      }
    } catch (err) {
      console.error('Reset error:', err);
      setError(err.response?.data?.message || 'An error occurred while resetting your password');
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
              <MdSecurity className="h-24 w-24 text-[#074799]" />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-6 text-3xl font-bold md:text-5xl"
            >
              Reset Password
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-6 text-base text-gray-600"
            >
              Enter your new password below
            </motion.p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-center text-red-500"
            >
              {error}
            </motion.div>
          )}

          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-center text-green-500"
            >
              {message}
            </motion.div>
          )}

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
                  <MdLock className="text-gray-400 h-6 w-6" />
                </div>
                <input
                  type="password"
                  name="password"
                  placeholder="New Password"
                  className="w-full flex-1 appearance-none border-none bg-white px-4 py-3 text-base text-gray-700 placeholder-gray-400 focus:outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col pt-4">
              <div className="relative flex overflow-hidden rounded-md border-2 transition focus-within:border-[#074799]">
                <div className="flex items-center pl-4">
                  <MdLock className="text-gray-400 h-6 w-6" />
                </div>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  className="w-full flex-1 appearance-none border-none bg-white px-4 py-3 text-base text-gray-700 placeholder-gray-400 focus:outline-none"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-6 flex items-center justify-center rounded-md bg-[#074799] px-4 py-3 text-white transition hover:bg-[#074799]/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                'Reset Password'
              )}
            </button>

            <div className="mt-6 text-center">
              <Link
                href="/auth/login"
                className="text-sm text-[#074799] hover:underline"
              >
                Back to Login
              </Link>
            </div>
          </motion.form>
        </motion.div>
      </div>

      <div className="relative hidden h-screen select-none flex-col justify-center bg-[#074799] bg-gradient-to-br md:flex md:w-1/2">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="px-20 pt-40 text-white"
        >
          <h2 className="text-4xl font-bold">Secure Password Reset</h2>
          <p className="mt-4">
            Choose a strong password that you haven't used before. A good password is:
          </p>
          <ul className="mt-4 list-disc pl-6">
            <motion.li
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              At least 8 characters long
            </motion.li>
            <motion.li
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              Contains uppercase and lowercase letters
            </motion.li>
            <motion.li
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              Includes numbers and special characters
            </motion.li>
            <motion.li
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              Not used on other websites
            </motion.li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
