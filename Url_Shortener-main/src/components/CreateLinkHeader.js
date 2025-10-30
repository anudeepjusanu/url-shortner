import React from "react";
import "./CreateLinkHeader.css";

const CreateLinkHeader = () => {
  return (
    <header className="create-link-header">
      <div className="create-link-header-content">
        <div className="create-link-header-left">
          <div className="create-link-logo-section">
            <div className="create-link-logo-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="16"
                viewBox="0 0 20 16"
                fill="none"
              >
                <g clip-path="url(#clip0_775_195)">
                  <path
                    d="M18.1188 8.36562C19.8845 6.6 19.8845 3.74062 18.1188 1.975C16.5563 0.412497 14.0938 0.209372 12.297 1.49375L12.247 1.52812C11.797 1.85 11.6938 2.475 12.0157 2.92187C12.3376 3.36875 12.9626 3.475 13.4095 3.15312L13.4595 3.11875C14.4626 2.40312 15.8345 2.51562 16.7032 3.3875C17.6876 4.37187 17.6876 5.96562 16.7032 6.95L13.197 10.4625C12.2126 11.4469 10.6188 11.4469 9.63447 10.4625C8.7626 9.59062 8.6501 8.21875 9.36572 7.21875L9.4001 7.16875C9.72197 6.71875 9.61572 6.09375 9.16885 5.775C8.72197 5.45625 8.09385 5.55937 7.7751 6.00625L7.74072 6.05625C6.45322 7.85 6.65635 10.3125 8.21885 11.875C9.98447 13.6406 12.8438 13.6406 14.6095 11.875L18.1188 8.36562ZM1.88135 7.63437C0.115723 9.4 0.115723 12.2594 1.88135 14.025C3.44385 15.5875 5.90635 15.7906 7.70322 14.5062L7.75322 14.4719C8.20322 14.15 8.30635 13.525 7.98447 13.0781C7.6626 12.6312 7.0376 12.525 6.59072 12.8469L6.54072 12.8812C5.5376 13.5969 4.16572 13.4844 3.29697 12.6125C2.3126 11.625 2.3126 10.0312 3.29697 9.04687L6.80322 5.5375C7.7876 4.55312 9.38135 4.55312 10.3657 5.5375C11.2376 6.40937 11.3501 7.78125 10.6345 8.78437L10.6001 8.83437C10.2782 9.28437 10.3845 9.90937 10.8313 10.2281C11.2782 10.5469 11.9063 10.4437 12.2251 9.99687L12.2595 9.94687C13.547 8.15 13.3438 5.6875 11.7813 4.125C10.0157 2.35937 7.15635 2.35937 5.39072 4.125L1.88135 7.63437Z"
                    fill="white"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_775_195">
                    <path d="M0 0H20V16H0V0Z" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </div>
            <span className="create-link-logo-text">LinkSA</span>
          </div>
        </div>
        <div className="create-link-header-right">
          <div className="create-link-language-toggle">
            <button className="create-link-lang-btn active">EN</button>
            <button className="create-link-lang-btn">AR</button>
          </div>
          <div className="create-link-user-profile">
            <div className="create-link-user-avatar">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face&auto=format"
                alt="Ahmed Al-Rashid"
              />
            </div>
            <span className="create-link-user-name">Ahmed Al-Rashid</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default CreateLinkHeader;
