
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { usePermissions } from '../contexts/PermissionContext';
import "./Sidebar.css";
import "./CreateLinkHeader.css"

const Sidebar = ({ activeItem }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { hasRole } = usePermissions();

  const handleNavigation = (path) => {
    navigate(path);
  };

  const isActive = (path) => {
    if (activeItem === "create-link" && path === "/create-link") {
      return true;
    }
    return location.pathname === path;
  };

  return (
    <aside className="sidebar">
      {/* Logo Section */}
        <div className="create-link-header-left" style={{alignItems: "center", display: "flex", justifyContent: "center"}}>
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
            <span className="create-link-logo-text">{t('common.brandName')}</span>
          </div>
        </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {/* Main Section */}
        <div className="nav-section">
          <div className="nav-label">{t('sidebar.main')}</div>
          <div
            className={`nav-item ${isActive("/dashboard") ? "active" : ""}`}
            onClick={() => handleNavigation("/dashboard")}
          >
            <div className="nav-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="16"
                viewBox="0 0 18 16"
                fill="none"
              >
                <g clip-path="url(#clip0_775_404)">
                  <path
                    d="M17.9937 7.98438C17.9937 8.54688 17.525 8.9875 16.9937 8.9875H15.9937L16.0156 13.9937C16.0156 14.0781 16.0094 14.1625 16 14.2469V14.75C16 15.4406 15.4406 16 14.75 16H14.25C14.2156 16 14.1813 16 14.1469 15.9969C14.1031 16 14.0594 16 14.0156 16H13H12.25C11.5594 16 11 15.4406 11 14.75V14V12C11 11.4469 10.5531 11 10 11H8C7.44688 11 7 11.4469 7 12V14V14.75C7 15.4406 6.44063 16 5.75 16H5H4.00313C3.95625 16 3.90937 15.9969 3.8625 15.9937C3.825 15.9969 3.7875 16 3.75 16H3.25C2.55938 16 2 15.4406 2 14.75V11.25C2 11.2219 2 11.1906 2.00312 11.1625V8.9875H1C0.4375 8.9875 0 8.55 0 7.98438C0 7.70312 0.09375 7.45312 0.3125 7.23438L8.325 0.25C8.54375 0.03125 8.79375 0 9.0125 0C9.23125 0 9.48125 0.0625 9.66875 0.21875L17.65 7.23438C17.9 7.45312 18.025 7.70312 17.9937 7.98438Z"
                    fill="gray"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_775_404">
                    <path d="M0 0H18V16H0V0Z" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </div>
            <span>{t('sidebar.dashboard')}</span>
          </div>
          {/* <div
            className={`nav-item ${
              isActive("/create-short-link") || activeItem === "create-link"
                ? "active"
                : ""
            }`}
            onClick={() => handleNavigation("/create-short-link")}
          >
            <div className="nav-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="16"
                viewBox="0 0 14 16"
                fill="none"
              >
                <path d="M14 16H0V0H14V16Z" stroke="#E5E7EB" />
                <path
                  d="M8 2.5C8 1.94687 7.55312 1.5 7 1.5C6.44688 1.5 6 1.94687 6 2.5V7H1.5C0.946875 7 0.5 7.44688 0.5 8C0.5 8.55312 0.946875 9 1.5 9H6V13.5C6 14.0531 6.44688 14.5 7 14.5C7.55312 14.5 8 14.0531 8 13.5V9H12.5C13.0531 9 13.5 8.55312 13.5 8C13.5 7.44688 13.0531 7 12.5 7H8V2.5Z"
                  fill="gray"
                />
              </svg>{" "}
            </div>
            <span>Create Link</span>
          </div> */}
          <div
            className={`nav-item ${isActive("/my-links") ? "active" : ""}`}
            onClick={() => handleNavigation("/my-links")}
          >
            <div className="nav-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="16"
                viewBox="0 0 20 16"
                fill="none"
              >
                <g clip-path="url(#clip0_775_325)">
                  <path
                    d="M18.1187 8.36562C19.8844 6.6 19.8844 3.74062 18.1187 1.975C16.5562 0.412497 14.0938 0.209372 12.2969 1.49375L12.2469 1.52812C11.7969 1.85 11.6938 2.475 12.0156 2.92187C12.3375 3.36875 12.9625 3.475 13.4094 3.15312L13.4594 3.11875C14.4625 2.40312 15.8344 2.51562 16.7031 3.3875C17.6875 4.37187 17.6875 5.96562 16.7031 6.95L13.1969 10.4625C12.2125 11.4469 10.6187 11.4469 9.63437 10.4625C8.7625 9.59062 8.65 8.21875 9.36563 7.21875L9.4 7.16875C9.72187 6.71875 9.61562 6.09375 9.16875 5.775C8.72188 5.45625 8.09375 5.55937 7.775 6.00625L7.74063 6.05625C6.45313 7.85 6.65625 10.3125 8.21875 11.875C9.98438 13.6406 12.8438 13.6406 14.6094 11.875L18.1187 8.36562ZM1.88125 7.63437C0.115625 9.4 0.115625 12.2594 1.88125 14.025C3.44375 15.5875 5.90625 15.7906 7.70313 14.5062L7.75313 14.4719C8.20313 14.15 8.30625 13.525 7.98438 13.0781C7.6625 12.6312 7.0375 12.525 6.59063 12.8469L6.54063 12.8812C5.5375 13.5969 4.16563 13.4844 3.29688 12.6125C2.3125 11.625 2.3125 10.0312 3.29688 9.04687L6.80313 5.5375C7.7875 4.55312 9.38125 4.55312 10.3656 5.5375C11.2375 6.40937 11.35 7.78125 10.6344 8.78437L10.6 8.83437C10.2781 9.28437 10.3844 9.90937 10.8313 10.2281C11.2781 10.5469 11.9062 10.4437 12.225 9.99687L12.2594 9.94687C13.5469 8.15 13.3438 5.6875 11.7812 4.125C10.0156 2.35937 7.15625 2.35937 5.39063 4.125L1.88125 7.63437Z"
                    fill="#6B7280"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_775_325">
                    <path d="M0 0H20V16H0V0Z" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </div>
            <span>{t('sidebar.myLinks')}</span>
          </div>
          <div
            className={`nav-item ${isActive("/analytics") ? "active" : ""}`}
            onClick={() => handleNavigation("/analytics")}
          >
            <div className="nav-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <path d="M16 16H0V0H16V16Z" stroke="#E5E7EB" />
                <path
                  d="M2 2C2 1.44687 1.55313 1 1 1C0.446875 1 0 1.44687 0 2V12.5C0 13.8813 1.11875 15 2.5 15H15C15.5531 15 16 14.5531 16 14C16 13.4469 15.5531 13 15 13H2.5C2.225 13 2 12.775 2 12.5V2ZM14.7063 4.70625C15.0969 4.31563 15.0969 3.68125 14.7063 3.29063C14.3156 2.9 13.6812 2.9 13.2906 3.29063L10 6.58437L8.20625 4.79063C7.81563 4.4 7.18125 4.4 6.79063 4.79063L3.29063 8.29062C2.9 8.68125 2.9 9.31563 3.29063 9.70625C3.68125 10.0969 4.31563 10.0969 4.70625 9.70625L7.5 6.91563L9.29375 8.70938C9.68437 9.1 10.3188 9.1 10.7094 8.70938L14.7094 4.70937L14.7063 4.70625Z"
                  fill="#6B7280"
                />
              </svg>
            </div>
            <span>{t('sidebar.analytics')}</span>
          </div>
          <div
            className={`nav-item ${isActive("/qr-codes") ? "active" : ""}`}
            onClick={() => handleNavigation("/qr-codes")}
          >
            <div className="nav-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="16"
                viewBox="0 0 14 16"
                fill="none"
              >
                <path d="M14 16H0V0H14V16Z" stroke="#E5E7EB" />
                <path
                  d="M0 2.5C0 1.67188 0.671875 1 1.5 1H4.5C5.32812 1 6 1.67188 6 2.5V5.5C6 6.32812 5.32812 7 4.5 7H1.5C0.671875 7 0 6.32812 0 5.5V2.5ZM2 3V5H4V3H2ZM0 10.5C0 9.67188 0.671875 9 1.5 9H4.5C5.32812 9 6 9.67188 6 10.5V13.5C6 14.3281 5.32812 15 4.5 15H1.5C0.671875 15 0 14.3281 0 13.5V10.5ZM2 11V13H4V11H2ZM9.5 1H12.5C13.3281 1 14 1.67188 14 2.5V5.5C14 6.32812 13.3281 7 12.5 7H9.5C8.67188 7 8 6.32812 8 5.5V2.5C8 1.67188 8.67188 1 9.5 1ZM12 3H10V5H12V3ZM8 9.5C8 9.225 8.225 9 8.5 9H10.5C10.775 9 11 9.225 11 9.5C11 9.775 11.225 10 11.5 10H12.5C12.775 10 13 9.775 13 9.5C13 9.225 13.225 9 13.5 9C13.775 9 14 9.225 14 9.5V12.5C14 12.775 13.775 13 13.5 13H11.5C11.225 13 11 12.775 11 12.5C11 12.225 10.775 12 10.5 12C10.225 12 10 12.225 10 12.5V14.5C10 14.775 9.775 15 9.5 15H8.5C8.225 15 8 14.775 8 14.5V9.5ZM11.5 15C11.3674 15 11.2402 14.9473 11.1464 14.8536C11.0527 14.7598 11 14.6326 11 14.5C11 14.3674 11.0527 14.2402 11.1464 14.1464C11.2402 14.0527 11.3674 14 11.5 14C11.6326 14 11.7598 14.0527 11.8536 14.1464C11.9473 14.2402 12 14.3674 12 14.5C12 14.6326 11.9473 14.7598 11.8536 14.8536C11.7598 14.9473 11.6326 15 11.5 15ZM13.5 15C13.3674 15 13.2402 14.9473 13.1464 14.8536C13.0527 14.7598 13 14.6326 13 14.5C13 14.3674 13.0527 14.2402 13.1464 14.1464C13.2402 14.0527 13.3674 14 13.5 14C13.6326 14 13.7598 14.0527 13.8536 14.1464C13.9473 14.2402 14 14.3674 14 14.5C14 14.6326 13.9473 14.7598 13.8536 14.8536C13.7598 14.9473 13.6326 15 13.5 15Z"
                  fill="#6B7280"
                />
              </svg>
            </div>
            <span>{t('sidebar.qrCodes')}</span>
          </div>
        </div>

        {/* Settings Section */}
        <div className="nav-section">
          <div className="nav-label">{t('sidebar.settings')}</div>
          <div
            className={`nav-item ${
              isActive("/custom-domains") ||
              location.pathname === "/custom-domains"
                ? "active"
                : ""
            }`}
            onClick={() => handleNavigation("/custom-domains")}
          >
            <div className="nav-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <g clip-path="url(#clip0_775_341)">
                  <path
                    d="M11 8C11 8.69375 10.9625 9.3625 10.8969 10H5.10313C5.03438 9.3625 5 8.69375 5 8C5 7.30625 5.0375 6.6375 5.10313 6H10.8969C10.9656 6.6375 11 7.30625 11 8ZM11.9 6H15.7469C15.9125 6.64062 16 7.30937 16 8C16 8.69063 15.9125 9.35938 15.7469 10H11.9C11.9656 9.35625 12 8.6875 12 8C12 7.3125 11.9656 6.64375 11.9 6ZM15.4187 5H11.7719C11.4594 3.00312 10.8406 1.33125 10.0437 0.2625C12.4906 0.909375 14.4812 2.68438 15.4156 5H15.4187ZM10.7594 5H5.24062C5.43125 3.8625 5.725 2.85625 6.08437 2.04063C6.4125 1.30313 6.77812 0.76875 7.13125 0.43125C7.48125 0.1 7.77187 0 8 0C8.22812 0 8.51875 0.1 8.86875 0.43125C9.22187 0.76875 9.5875 1.30313 9.91562 2.04063C10.2781 2.85313 10.5687 3.85938 10.7594 5ZM4.22813 5H0.58125C1.51875 2.68438 3.50625 0.909375 5.95625 0.2625C5.15938 1.33125 4.54063 3.00312 4.22813 5ZM0.253125 6H4.1C4.03437 6.64375 4 7.3125 4 8C4 8.6875 4.03437 9.35625 4.1 10H0.253125C0.0875 9.35938 0 8.69063 0 8C0 7.30937 0.0875 6.64062 0.253125 6ZM6.08437 13.9563C5.72187 13.1438 5.43125 12.1375 5.24062 11H10.7594C10.5687 12.1375 10.275 13.1438 9.91562 13.9563C9.5875 14.6938 9.22187 15.2281 8.86875 15.5656C8.51875 15.9 8.22812 16 8 16C7.77187 16 7.48125 15.9 7.13125 15.5688C6.77812 15.2313 6.4125 14.6969 6.08437 13.9594V13.9563ZM4.22813 11C4.54063 12.9969 5.15938 14.6687 5.95625 15.7375C3.50625 15.0906 1.51875 13.3156 0.58125 11H4.22813ZM15.4187 11C14.4812 13.3156 12.4937 15.0906 10.0469 15.7375C10.8438 14.6687 11.4594 12.9969 11.775 11H15.4187Z"
                    fill="#6B7280"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_775_341">
                    <path d="M0 0H16V16H0V0Z" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </div>
            <span>{t('sidebar.customDomains')}</span>
          </div>
          {/* <div
            className={`nav-item ${isActive("/utm-builder") ? "active" : ""}`}
            onClick={() => handleNavigation("/utm-builder")}
          >
            <div className="nav-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="16"
                viewBox="0 0 14 16"
                fill="none"
              >
                <path d="M14 16H0V0H14V16Z" stroke="#E5E7EB" />
                <path
                  d="M0 2.5V7.17187C0 7.70312 0.209375 8.2125 0.584375 8.5875L6.08437 14.0875C6.86562 14.8687 8.13125 14.8687 8.9125 14.0875L13.0844 9.91562C13.8656 9.13437 13.8656 7.86875 13.0844 7.0875L7.58437 1.5875C7.20937 1.2125 6.7 1.00312 6.16875 1.00312H1.5C0.671875 0.999999 0 1.67187 0 2.5ZM3.5 3.5C3.76522 3.5 4.01957 3.60536 4.20711 3.79289C4.39464 3.98043 4.5 4.23478 4.5 4.5C4.5 4.76522 4.39464 5.01957 4.20711 5.20711C4.01957 5.39464 3.76522 5.5 3.5 5.5C3.23478 5.5 2.98043 5.39464 2.79289 5.20711C2.60536 5.01957 2.5 4.76522 2.5 4.5C2.5 4.23478 2.60536 3.98043 2.79289 3.79289C2.98043 3.60536 3.23478 3.5 3.5 3.5Z"
                  fill="#6B7280"
                />
              </svg>
            </div>
            <span>UTM Builder</span>
          </div> */}
          {/* <div             className={`nav-item ${isActive("/content-filter") ? "active" : ""}`}
            onClick={() => handleNavigation("/content-filter")}
>
            <div className="nav-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <g clip-path="url(#clip0_775_351)">
                  <path
                    d="M8 0C8.14375 0 8.2875 0.03125 8.41875 0.090625L14.3031 2.5875C14.9906 2.87813 15.5031 3.55625 15.5 4.375C15.4844 7.475 14.2094 13.1469 8.825 15.725C8.30313 15.975 7.69688 15.975 7.175 15.725C1.79063 13.1469 0.515626 7.475 0.500001 4.375C0.496876 3.55625 1.00938 2.87813 1.69688 2.5875L7.58438 0.090625C7.7125 0.03125 7.85625 0 8 0ZM8 2.0875V13.9C12.3125 11.8125 13.4719 7.19062 13.5 4.41875L8 2.0875Z"
                    fill="#6B7280"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_775_351">
                    <path d="M0 0H16V16H0V0Z" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </div>
            <span>{t('sidebar.contentFilter')}</span>
          </div> */}
        </div>

        {/* Admin Section - Only for admin and super_admin */}
        {hasRole([ 'super_admin']) && (
          <div className="nav-section">
            <div className="nav-label">{t('sidebar.admin') || 'Admin'}</div>
            <div
              className={`nav-item ${isActive("/user-management") ? "active" : ""}`}
              onClick={() => handleNavigation("/user-management")}
            >
              <div className="nav-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <path
                    d="M11 8C11 9.65685 9.65685 11 8 11C6.34315 11 5 9.65685 5 8C5 6.34315 6.34315 5 8 5C9.65685 5 11 6.34315 11 8Z"
                    fill="#6B7280"
                  />
                  <path
                    d="M3 8C3 9.65685 1.65685 11 0 11C-1.65685 11 -3 9.65685 -3 8C-3 6.34315 -1.65685 5 0 5C1.65685 5 3 6.34315 3 8Z"
                    fill="#6B7280"
                  />
                  <path
                    d="M19 8C19 9.65685 17.6569 11 16 11C14.3431 11 13 9.65685 13 8C13 6.34315 14.3431 5 16 5C17.6569 5 19 6.34315 19 8Z"
                    fill="#6B7280"
                  />
                  <path
                    d="M2 13C2 12.4477 2.44772 12 3 12H13C13.5523 12 14 12.4477 14 13V14C14 14.5523 13.5523 15 13 15H3C2.44772 15 2 14.5523 2 14V13Z"
                    fill="#6B7280"
                  />
                </svg>
              </div>
              <span>{t('sidebar.userManagement') || 'User Management'}</span>
            </div>
            <div
              className={`nav-item ${isActive("/admin-urls") ? "active" : ""}`}
              onClick={() => handleNavigation("/admin-urls")}
            >
              <div className="nav-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <path
                    d="M14 2H2C1.44772 2 1 2.44772 1 3V13C1 13.5523 1.44772 14 2 14H14C14.5523 14 15 13.5523 15 13V3C15 2.44772 14.5523 2 14 2Z"
                    stroke="#6B7280"
                    strokeWidth="1.5"
                    fill="none"
                  />
                  <path d="M4 6H12" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M4 9H10" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M4 12H8" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <span>{t('sidebar.urlManagement') || 'URL Management'}</span>
            </div>
            <div
              className={`nav-item ${isActive("/google-analytics") ? "active" : ""}`}
              onClick={() => handleNavigation("/google-analytics")}
            >
              <div className="nav-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <path
                    d="M14 2H2C1.44772 2 1 2.44772 1 3V13C1 13.5523 1.44772 14 2 14H14C14.5523 14 15 13.5523 15 13V3C15 2.44772 14.5523 2 14 2Z"
                    stroke="#6B7280"
                    strokeWidth="1.5"
                    fill="none"
                  />
                  <path
                    d="M4 10V11"
                    stroke="#6B7280"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M7 8V11"
                    stroke="#6B7280"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M10 6V11"
                    stroke="#6B7280"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M13 4V11"
                    stroke="#6B7280"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <span>{t('sidebar.googleAnalytics') || 'Google Analytics'}</span>
            </div>
          </div>
        )}

        {/* Account Section */}
        <div className="nav-section">
          <div className="nav-label">{t('sidebar.account')}</div>
          <div
            className={`nav-item ${isActive("/profile") ? "active" : ""}`}
            onClick={() => handleNavigation("/profile")}
          >
            <div className="nav-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="16"
                viewBox="0 0 14 16"
                fill="none"
              >
                <g clip-path="url(#clip0_775_357)">
                  <path
                    d="M9.5 4C9.5 3.33696 9.23661 2.70107 8.76777 2.23223C8.29893 1.76339 7.66304 1.5 7 1.5C6.33696 1.5 5.70107 1.76339 5.23223 2.23223C4.76339 2.70107 4.5 3.33696 4.5 4C4.5 4.66304 4.76339 5.29893 5.23223 5.76777C5.70107 6.23661 6.33696 6.5 7 6.5C7.66304 6.5 8.29893 6.23661 8.76777 5.76777C9.23661 5.29893 9.5 4.66304 9.5 4ZM3 4C3 2.93913 3.42143 1.92172 4.17157 1.17157C4.92172 0.421427 5.93913 0 7 0C8.06087 0 9.07828 0.421427 9.82843 1.17157C10.5786 1.92172 11 2.93913 11 4C11 5.06087 10.5786 6.07828 9.82843 6.82843C9.07828 7.57857 8.06087 8 7 8C5.93913 8 4.92172 7.57857 4.17157 6.82843C3.42143 6.07828 3 5.06087 3 4ZM1.54062 14.5H12.4594C12.1813 12.5219 10.4813 11 8.42813 11H5.57188C3.51875 11 1.81875 12.5219 1.54062 14.5ZM0 15.0719C0 11.9937 2.49375 9.5 5.57188 9.5H8.42813C11.5063 9.5 14 11.9937 14 15.0719C14 15.5844 13.5844 16 13.0719 16H0.928125C0.415625 16 0 15.5844 0 15.0719Z"
                    fill="#6B7280"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_775_357">
                    <path d="M0 0H14V16H0V0Z" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </div>
            <span>{t('sidebar.profile')}</span>
          </div>
          <a
            href="/api-docs"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-item"
            style={{ textDecoration: 'none' }}
          >
            <div className="nav-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  d="M2 1C2 0.447715 2.44772 0 3 0H10.5858C10.851 0 11.1054 0.105357 11.2929 0.292893L14.7071 3.70711C14.8946 3.89464 15 4.149 15 4.41421V15C15 15.5523 14.5523 16 14 16H3C2.44772 16 2 15.5523 2 15V1Z"
                  fill="#6B7280"
                />
                <path
                  d="M5 7H12"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M5 10H12"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M5 13H9"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span>{t('sidebar.apiDocs') || 'API Docs'}</span>
          </a>
          {/* <div
            className={`nav-item ${isActive("/billing") ? "active" : ""}`}
            onClick={() => handleNavigation("/billing")}
          >
            <div className="nav-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  d="M14 3H2C1.44772 3 1 3.44772 1 4V12C1 12.5523 1.44772 13 2 13H14C14.5523 13 15 12.5523 15 12V4C15 3.44772 14.5523 3 14 3Z"
                  stroke="#6B7280"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                <path
                  d="M1 6.5H15"
                  stroke="#6B7280"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3 9.5H6"
                  stroke="#6B7280"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span>{t('sidebar.billing')}</span>
          </div> */}
          {/* <div
            className={`nav-item ${isActive("/subscription") ? "active" : ""}`}
            onClick={() => handleNavigation("/subscription")}
          >
            <div className="nav-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="16"
                viewBox="0 0 18 16"
                fill="none"
              >
                <path d="M18 16H0V0H18V16Z" stroke="#E5E7EB" />
                <path
                  d="M9.65625 3.3125C10.0125 3.09375 10.25 2.69687 10.25 2.25C10.25 1.55937 9.69063 1 9 1C8.30937 1 7.75 1.55937 7.75 2.25C7.75 2.7 7.9875 3.09375 8.34375 3.3125L6.55312 6.89375C6.26875 7.4625 5.53125 7.625 5.03438 7.22813L2.25 5C2.40625 4.79063 2.5 4.53125 2.5 4.25C2.5 3.55938 1.94062 3 1.25 3C0.559375 3 0 3.55938 0 4.25C0 4.94062 0.559375 5.5 1.25 5.5C1.25625 5.5 1.26562 5.5 1.27188 5.5L2.7 13.3562C2.87188 14.3062 3.7 15 4.66875 15H13.3313C14.2969 15 15.125 14.3094 15.3 13.3562L16.7281 5.5C16.7344 5.5 16.7437 5.5 16.75 5.5C17.4406 5.5 18 4.94062 18 4.25C18 3.55938 17.4406 3 16.75 3C16.0594 3 15.5 3.55938 15.5 4.25C15.5 4.53125 15.5938 4.79063 15.75 5L12.9656 7.22813C12.4688 7.625 11.7312 7.4625 11.4469 6.89375L9.65625 3.3125Z"
                  fill="#6B7280"
                />
              </svg>
            </div>
            <span>{t('sidebar.upgradePlan')}</span>
          </div> */}
        </div>
      </nav>

      {/* Upgrade Card */}
      {/* <div className="upgrade-card">
        <div className="upgrade-content">
          <div className="plan-info">
            <span className="plan-name">{t('sidebar.freePlan')}</span>
            <span className="plan-usage">50/100</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: "50%" }}></div>
          </div>
          <button
            className="upgrade-btn"
            onClick={() => handleNavigation("/subscription")}
          >
            {t('sidebar.upgradeNow')}
          </button>
        </div>
      </div> */}
    </aside>
  );
};

export default Sidebar;
