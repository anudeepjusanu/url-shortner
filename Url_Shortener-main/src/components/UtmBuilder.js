import React from "react";
import Sidebar from "./Sidebar";
import MainHeader from "./MainHeader";
import "./Analytics.css";

const UTMBuilder = () => {
  return (
    <div className="analytics-container">
      <MainHeader />
      <div className="analytics-layout">
        <Sidebar />
        <div className="analytics-main">
          <div className="analytics-content">
            <h2>UTM Builder</h2>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UTMBuilder;
