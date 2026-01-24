import React from 'react';
import Navbar from './Navbar';
import { cn } from '../lib/utils';
// Keeping legacy CSS imports if they are needed for inner components, 
// but we ultimately want to rely on Tailwind.
// import './Analytics.css'; 

const Layout = ({ children, className }) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans transition-colors duration-300">
      <Navbar />
      <main className={cn("flex-1 w-full max-w-[75%] mx-auto px-4 sm:px-6 lg:px-8 py-8", className)}>
        {children}
      </main>
    </div>
  );
};

export default Layout;