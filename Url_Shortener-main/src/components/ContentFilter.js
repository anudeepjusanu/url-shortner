import React, { useState } from "react";
import Sidebar from "./Sidebar";
import MainHeader from "./MainHeader";
import "./Analytics.css";

const ContentFilter = () => {
  const [timeFilter, setTimeFilter] = useState("Last 7 days");

  return (
    <div className="analytics-container">
      <MainHeader />
      <div className="analytics-layout">
        <Sidebar />
        <div className="analytics-main">
          <div className="analytics-content">
            <h2>Content Filter</h2>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentFilter;
