import React from 'react';
import MainHeader from './MainHeader';
import Sidebar from './Sidebar';
import './Analytics.css'; // Using existing CSS

const Layout = ({ children }) => {
  return (
    <div className="analytics-container">
      <MainHeader />
      <div className="analytics-layout">
        <Sidebar />
        <div className="analytics-main">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;