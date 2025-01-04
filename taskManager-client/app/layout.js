'use client'

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from './_context/ThemeContext'
import { TaskProvider } from './_context/TaskContext'
import { UserProvider } from './_context/UserContext'
import { Toaster } from 'react-hot-toast'
import { SettingsProvider } from './_context/SettingsContext'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <UserProvider>
            <TaskProvider>
              <SettingsProvider>
                <Toaster position="top-center" />
                {children}
              </SettingsProvider>
            </TaskProvider>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
