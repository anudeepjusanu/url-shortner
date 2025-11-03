import React from "react";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import "../App.css";
import "./LandingPage.css";

const LandingPage = () => {
  const navigate = useNavigate();

  const handleShortenUrl = () => {
    // For now, just navigate to register page
    // In a real app, this would handle the URL shortening
    navigate("/register");
  };

  // Icon SVGs as components
  const CheckIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M13.5 5L6 12.5L2.5 9"
        stroke="#10B981"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const ShortenIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M8 2L8 14M2 8L14 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );

  return (
    <div className="landing-page">
      {/* Header */}
      <Header isLanding={true} onGetStarted={() => navigate("/login")} />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background-text">Track</div>
        <div className="hero-bottom-cta">
          <button
            className="bottom-cta-btn"
            onClick={() => navigate("/register")}
          >
            Get Started Free
          </button>
        </div>
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                <span className="title-main">Shorten, Brand, </span>
                <span className="title-accent">Track</span>
              </h1>
              <p className="hero-subtitle">
                Your Links, Optimized for Saudi Arabia
              </p>
              <p className="hero-description">
                Fast, secure, and compliant URL shortening with advanced
                analytics and branded domains.
              </p>
              <div className="hero-buttons">
                <button
                  className="btn-primary"
                  onClick={() => navigate("/register")}
                >
                  Get Started Free
                </button>
                <button className="btn-secondary">Watch Demo</button>
              </div>
            </div>

            <div className="hero-form">
              <h3 className="form-title">
                Try it now - Shorten your first link
              </h3>
              <div className="form-container">
                <input
                  type="text"
                  placeholder="Paste your long URL here..."
                  className="url-input"
                />
                <button className="shorten-btn" onClick={handleShortenUrl}>
                  <ShortenIcon />
                  Shorten URL
                </button>
              </div>
              <div className="compliance-notice">
                <p>✓ PDPL Compliant • Data stored in KSA</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2>Powerful Features for Modern Marketers</h2>
            <p>Everything you need to manage, track, and optimize your links</p>
          </div>

          <div className="features-grid">
            <div className="feature-card blue-card">
              <div className="feature-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="30"
                  height="24"
                  viewBox="0 0 30 24"
                  fill="none"
                >
                  <g clip-path="url(#clip0_775_2686)">
                    <path
                      d="M27.178 12.5484C29.8265 9.90001 29.8265 5.61095 27.178 2.96251C24.8343 0.618761 21.1405 0.314073 18.4452 2.24064L18.3702 2.2922C17.6952 2.77501 17.5405 3.71251 18.0233 4.38282C18.5062 5.05314 19.4437 5.21251 20.114 4.7297L20.189 4.67814C21.6937 3.6047 23.7515 3.77345 25.0546 5.08126C26.5312 6.55782 26.5312 8.94845 25.0546 10.425L19.7952 15.6938C18.3187 17.1703 15.928 17.1703 14.4515 15.6938C13.1437 14.3859 12.9749 12.3281 14.0483 10.8281L14.0999 10.7531C14.5827 10.0781 14.4233 9.14064 13.753 8.66251C13.0827 8.18439 12.1405 8.33907 11.6624 9.00939L11.6108 9.08439C9.67959 11.775 9.98428 15.4688 12.328 17.8125C14.9765 20.461 19.2655 20.461 21.914 17.8125L27.178 12.5484ZM2.82178 11.4516C0.17334 14.1 0.17334 18.3891 2.82178 21.0375C5.16553 23.3813 8.85928 23.686 11.5546 21.7594L11.6296 21.7078C12.3046 21.225 12.4593 20.2875 11.9765 19.6172C11.4937 18.9469 10.5562 18.7875 9.88584 19.2703L9.81084 19.3219C8.30615 20.3953 6.24834 20.2266 4.94522 18.9188C3.46865 17.4375 3.46865 15.0469 4.94522 13.5703L10.2046 8.30626C11.6812 6.8297 14.0718 6.8297 15.5483 8.30626C16.8562 9.61407 17.0249 11.6719 15.9515 13.1766L15.8999 13.2516C15.4171 13.9266 15.5765 14.8641 16.2468 15.3422C16.9171 15.8203 17.8593 15.6656 18.3374 14.9953L18.389 14.9203C20.3202 12.225 20.0155 8.53126 17.6718 6.18751C15.0233 3.53907 10.7343 3.53907 8.08584 6.18751L2.82178 11.4516Z"
                      fill="white"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_775_2686">
                      <path d="M0 0H30V24H0V0Z" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
              </div>
              <h3>URL Shortening</h3>
              <p>
                Create short, memorable links instantly with our advanced
                algorithm
              </p>
            </div>

            <div className="feature-card green-card">
              <div className="feature-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="27"
                  height="24"
                  viewBox="0 0 27 24"
                  fill="none"
                >
                  <g clip-path="url(#clip0_775_2689)">
                    <path
                      d="M14.4844 4.96875C15.0188 4.64062 15.375 4.04531 15.375 3.375C15.375 2.33906 14.5359 1.5 13.5 1.5C12.4641 1.5 11.625 2.33906 11.625 3.375C11.625 4.05 11.9812 4.64062 12.5156 4.96875L9.82969 10.3406C9.40312 11.1938 8.29688 11.4375 7.55156 10.8422L3.375 7.5C3.60938 7.18594 3.75 6.79688 3.75 6.375C3.75 5.33906 2.91094 4.5 1.875 4.5C0.839062 4.5 0 5.33906 0 6.375C0 7.41094 0.839062 8.25 1.875 8.25C1.88437 8.25 1.89844 8.25 1.90781 8.25L4.05 20.0344C4.30781 21.4594 5.55 22.5 7.00312 22.5H19.9969C21.4453 22.5 22.6875 21.4641 22.95 20.0344L25.0922 8.25C25.1016 8.25 25.1156 8.25 25.125 8.25C26.1609 8.25 27 7.41094 27 6.375C27 5.33906 26.1609 4.5 25.125 4.5C24.0891 4.5 23.25 5.33906 23.25 6.375C23.25 6.79688 23.3906 7.18594 23.625 7.5L19.4484 10.8422C18.7031 11.4375 17.5969 11.1938 17.1703 10.3406L14.4844 4.96875Z"
                      fill="white"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_775_2689">
                      <path d="M0 0H27V24H0V0Z" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
              </div>
              <h3>Branded Domains</h3>
              <p>
                Use your own domain for professional, trustworthy short links
              </p>
            </div>

            <div className="feature-card purple-card">
              <div className="feature-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path d="M24 24H0V0H24V24Z" stroke="#E5E7EB" />
                  <path
                    d="M3 3C3 2.17031 2.32969 1.5 1.5 1.5C0.670312 1.5 0 2.17031 0 3V18.75C0 20.8219 1.67812 22.5 3.75 22.5H22.5C23.3297 22.5 24 21.8297 24 21C24 20.1703 23.3297 19.5 22.5 19.5H3.75C3.3375 19.5 3 19.1625 3 18.75V3ZM22.0594 7.05938C22.6453 6.47344 22.6453 5.52188 22.0594 4.93594C21.4734 4.35 20.5219 4.35 19.9359 4.93594L15 9.87656L12.3094 7.18594C11.7234 6.6 10.7719 6.6 10.1859 7.18594L4.93594 12.4359C4.35 13.0219 4.35 13.9734 4.93594 14.5594C5.52188 15.1453 6.47344 15.1453 7.05938 14.5594L11.25 10.3734L13.9406 13.0641C14.5266 13.65 15.4781 13.65 16.0641 13.0641L22.0641 7.06406L22.0594 7.05938Z"
                    fill="white"
                  />
                </svg>
              </div>
              <h3>UTM Builder</h3>
              <p>
                Track campaign performance with built-in UTM parameter
                generation
              </p>
            </div>

            <div className="feature-card orange-card">
              <div className="feature-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="21"
                  height="24"
                  viewBox="0 0 21 24"
                  fill="none"
                >
                  <g clip-path="url(#clip0_775_2695)">
                    <path
                      d="M0 3.75C0 2.50781 1.00781 1.5 2.25 1.5H6.75C7.99219 1.5 9 2.50781 9 3.75V8.25C9 9.49219 7.99219 10.5 6.75 10.5H2.25C1.00781 10.5 0 9.49219 0 8.25V3.75ZM3 4.5V7.5H6V4.5H3ZM0 15.75C0 14.5078 1.00781 13.5 2.25 13.5H6.75C7.99219 13.5 9 14.5078 9 15.75V20.25C9 21.4922 7.99219 22.5 6.75 22.5H2.25C1.00781 22.5 0 21.4922 0 20.25V15.75ZM3 16.5V19.5H6V16.5H3ZM14.25 1.5H18.75C19.9922 1.5 21 2.50781 21 3.75V8.25C21 9.49219 19.9922 10.5 18.75 10.5H14.25C13.0078 10.5 12 9.49219 12 8.25V3.75C12 2.50781 13.0078 1.5 14.25 1.5ZM18 4.5H15V7.5H18V4.5ZM12 14.25C12 13.8375 12.3375 13.5 12.75 13.5H15.75C16.1625 13.5 16.5 13.8375 16.5 14.25C16.5 14.6625 16.8375 15 17.25 15H18.75C19.1625 15 19.5 14.6625 19.5 14.25C19.5 13.8375 19.8375 13.5 20.25 13.5C20.6625 13.5 21 13.8375 21 14.25V18.75C21 19.1625 20.6625 19.5 20.25 19.5H17.25C16.8375 19.5 16.5 19.1625 16.5 18.75C16.5 18.3375 16.1625 18 15.75 18C15.3375 18 15 18.3375 15 18.75V21.75C15 22.1625 14.6625 22.5 14.25 22.5H12.75C12.3375 22.5 12 22.1625 12 21.75V14.25ZM17.25 22.5C17.0511 22.5 16.8603 22.421 16.7197 22.2803C16.579 22.1397 16.5 21.9489 16.5 21.75C16.5 21.5511 16.579 21.3603 16.7197 21.2197C16.8603 21.079 17.0511 21 17.25 21C17.4489 21 17.6397 21.079 17.7803 21.2197C17.921 21.3603 18 21.5511 18 21.75C18 21.9489 17.921 22.1397 17.7803 22.2803C17.6397 22.421 17.4489 22.5 17.25 22.5ZM20.25 22.5C20.0511 22.5 19.8603 22.421 19.7197 22.2803C19.579 22.1397 19.5 21.9489 19.5 21.75C19.5 21.5511 19.579 21.3603 19.7197 21.2197C19.8603 21.079 20.0511 21 20.25 21C20.4489 21 20.6397 21.079 20.7803 21.2197C20.921 21.3603 21 21.5511 21 21.75C21 21.9489 20.921 22.1397 20.7803 22.2803C20.6397 22.421 20.4489 22.5 20.25 22.5Z"
                      fill="white"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_775_2695">
                      <path d="M0 0H21V24H0V0Z" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
              </div>
              <h3>QR Code Generation</h3>
              <p>Generate beautiful QR codes for offline marketing campaigns</p>
            </div>

            <div className="feature-card cyan-card">
              <div className="feature-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <g clip-path="url(#clip0_775_2698)">
                    <path
                      d="M7.33594 20.9859L6.74531 22.3688C5.86875 21.9234 5.0625 21.375 4.33125 20.7328L5.39531 19.6688C5.98125 20.1797 6.63281 20.625 7.33594 20.9859ZM1.90312 12.75H0.398438C0.464062 13.7437 0.651563 14.7047 0.946875 15.6141L2.34375 15.0563C2.11406 14.3203 1.95937 13.5469 1.90312 12.75ZM1.90312 11.25C1.96875 10.3687 2.14688 9.51562 2.42344 8.71406L1.04063 8.12344C0.689063 9.10781 0.46875 10.1578 0.398438 11.25H1.90312ZM3.01406 7.33594C3.37969 6.6375 3.82031 5.98594 4.33125 5.39062L3.26719 4.32656C2.625 5.05781 2.07187 5.86406 1.63125 6.74063L3.01406 7.33594ZM18.6094 19.6688C17.9578 20.2313 17.2312 20.7141 16.4484 21.0938L17.0062 22.4906C17.9766 22.0266 18.8719 21.4313 19.6734 20.7281L18.6094 19.6688ZM5.39062 4.33125C6.04219 3.76875 6.76875 3.28594 7.55156 2.90625L6.99375 1.50938C6.02344 1.97344 5.12813 2.56875 4.33125 3.27188L5.39062 4.33125ZM20.9859 16.6641C20.6203 17.3625 20.1797 18.0141 19.6688 18.6094L20.7328 19.6734C21.375 18.9422 21.9281 18.1313 22.3688 17.2594L20.9859 16.6641ZM22.0969 12.75C22.0312 13.6313 21.8531 14.4844 21.5766 15.2859L22.9594 15.8766C23.3109 14.8875 23.5312 13.8375 23.5969 12.7453H22.0969V12.75ZM15.0563 21.6562C14.3203 21.8906 13.5469 22.0406 12.75 22.0969V23.6016C13.7437 23.5359 14.7047 23.3484 15.6141 23.0531L15.0563 21.6562ZM11.25 22.0969C10.3687 22.0312 9.51562 21.8531 8.71406 21.5766L8.12344 22.9594C9.1125 23.3109 10.1625 23.5312 11.2547 23.5969V22.0969H11.25ZM21.6562 8.94375C21.8906 9.67969 22.0406 10.4531 22.0969 11.25H23.6016C23.5359 10.2563 23.3484 9.29531 23.0531 8.38594L21.6562 8.94375ZM4.33125 18.6094C3.76875 17.9578 3.28594 17.2312 2.90625 16.4484L1.50938 17.0062C1.97344 17.9766 2.56875 18.8719 3.27188 19.6734L4.33125 18.6094ZM12.75 1.90312C13.6313 1.96875 14.4797 2.14688 15.2859 2.42344L15.8766 1.04063C14.8922 0.689063 13.8422 0.46875 12.75 0.398438V1.90312ZM8.94375 2.34375C9.67969 2.10938 10.4531 1.95937 11.25 1.90312V0.398438C10.2563 0.464062 9.29531 0.651563 8.38594 0.946875L8.94375 2.34375ZM20.7328 4.32656L19.6688 5.39062C20.2313 6.04219 20.7141 6.76875 21.0984 7.55156L22.4953 6.99375C22.0312 6.02344 21.4359 5.12813 20.7328 4.32656ZM18.6094 4.33125L19.6734 3.26719C18.9422 2.625 18.1359 2.07187 17.2594 1.63125L16.6688 3.01406C17.3625 3.37969 18.0187 3.82031 18.6094 4.33125Z"
                      fill="white"
                    />
                    <path
                      d="M12 18.375C12.7249 18.375 13.3125 17.7874 13.3125 17.0625C13.3125 16.3376 12.7249 15.75 12 15.75C11.2751 15.75 10.6875 16.3376 10.6875 17.0625C10.6875 17.7874 11.2751 18.375 12 18.375Z"
                      fill="white"
                    />
                    <path
                      d="M12.361 14.625H11.611C11.3017 14.625 11.0485 14.3719 11.0485 14.0625C11.0485 10.7344 14.6767 11.0672 14.6767 9.00937C14.6767 8.07187 13.8423 7.125 11.986 7.125C10.622 7.125 9.90948 7.575 9.21104 8.47031C9.02823 8.70469 8.69073 8.75156 8.45167 8.58281L7.8376 8.15156C7.5751 7.96875 7.51417 7.59844 7.71573 7.34531C8.70948 6.07031 9.89073 5.25 11.9907 5.25C14.4423 5.25 16.5564 6.64687 16.5564 9.00937C16.5564 12.1781 12.9282 11.9859 12.9282 14.0625C12.9235 14.3719 12.6704 14.625 12.361 14.625Z"
                      fill="white"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_775_2698">
                      <path d="M0 0H24V24H0V0Z" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
              </div>
              <h3>Advanced Analytics</h3>
              <p>Real-time insights on clicks, geography, devices, and more</p>
            </div>

            <div className="feature-card emerald-card">
              <div className="feature-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <g clip-path="url(#clip0_775_2705)">
                    <path
                      d="M12 0C12.2156 0 12.4313 0.046875 12.6281 0.135938L21.4547 3.88125C22.486 4.31719 23.2547 5.33438 23.25 6.5625C23.2266 11.2125 21.3141 19.7203 13.2375 23.5875C12.4547 23.9625 11.5453 23.9625 10.7625 23.5875C2.68596 19.7203 0.773459 11.2125 0.750021 6.5625C0.745334 5.33438 1.51408 4.31719 2.54533 3.88125L11.3766 0.135938C11.5688 0.046875 11.7844 0 12 0ZM12 3.13125V20.85C18.4688 17.7188 20.2078 10.7859 20.25 6.62813L12 3.13125Z"
                      fill="white"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_775_2705">
                      <path d="M0 0H24V24H0V0Z" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
              </div>
              <h3>PDPL Compliance</h3>
              <p>Full data residency in KSA with enterprise-grade security</p>
            </div>

            <div className="feature-card indigo-card">
              <div className="feature-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <g clip-path="url(#clip0_775_2708)">
                    <path
                      d="M15.75 16.5C20.3062 16.5 24 12.8062 24 8.25C24 3.69375 20.3062 0 15.75 0C11.1938 0 7.5 3.69375 7.5 8.25C7.5 9.12656 7.63594 9.975 7.88906 10.7672L0.328125 18.3281C0.117188 18.5391 0 18.825 0 19.125V22.875C0 23.4984 0.501562 24 1.125 24H4.875C5.49844 24 6 23.4984 6 22.875V21H7.875C8.49844 21 9 20.4984 9 19.875V18H10.875C11.175 18 11.4609 17.8828 11.6719 17.6719L13.2328 16.1109C14.025 16.3641 14.8734 16.5 15.75 16.5ZM17.625 4.5C18.1223 4.5 18.5992 4.69754 18.9508 5.04917C19.3025 5.40081 19.5 5.87772 19.5 6.375C19.5 6.87228 19.3025 7.34919 18.9508 7.70083C18.5992 8.05246 18.1223 8.25 17.625 8.25C17.1277 8.25 16.6508 8.05246 16.2992 7.70083C15.9475 7.34919 15.75 6.87228 15.75 6.375C15.75 5.87772 15.9475 5.40081 16.2992 5.04917C16.6508 4.69754 17.1277 4.5 17.625 4.5Z"
                      fill="white"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_775_2708">
                      <path d="M0 0H24V24H0V0Z" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
              </div>
              <h3>Authintica Integration</h3>
              <p>
                Secure authentication with Saudi Arabia's trusted identity
                platform
              </p>
            </div>

            <div className="feature-card pink-card">
              <div className="feature-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="30"
                  height="24"
                  viewBox="0 0 30 24"
                  fill="none"
                >
                  <path d="M30 24H0V0H30V24Z" stroke="#E5E7EB" />
                  <path
                    d="M0 6C0 4.34531 1.34531 3 3 3H12H14.25H15H27C28.6547 3 30 4.34531 30 6V18C30 19.6547 28.6547 21 27 21H15H14.25H12H3C1.34531 21 0 19.6547 0 18V6ZM15 6V18H27V6H15ZM8.35781 8.24531C8.20781 7.90781 7.87031 7.6875 7.5 7.6875C7.12969 7.6875 6.79219 7.90781 6.64219 8.24531L3.64219 14.9953C3.43125 15.4688 3.64688 16.0219 4.12031 16.2328C4.59375 16.4437 5.14688 16.2281 5.35781 15.7547L5.775 14.8125H9.225L9.64219 15.7547C9.85312 16.2281 10.4062 16.4391 10.8797 16.2328C11.3531 16.0266 11.5641 15.4688 11.3578 14.9953L8.35781 8.24531ZM7.5 10.9312L8.39062 12.9375H6.60938L7.5 10.9312ZM21 7.6875C21.5156 7.6875 21.9375 8.10938 21.9375 8.625V8.8125H24H24.75C25.2656 8.8125 25.6875 9.23438 25.6875 9.75C25.6875 10.2656 25.2656 10.6875 24.75 10.6875H24.6562L24.5813 10.8984C24.1641 12.0422 23.5312 13.0828 22.725 13.9641C22.7672 13.9922 22.8094 14.0156 22.8516 14.0391L23.7375 14.5687C24.1828 14.8359 24.3234 15.4125 24.0609 15.8531C23.7984 16.2938 23.2172 16.4391 22.7766 16.1766L21.8906 15.6469C21.6797 15.5203 21.4781 15.3891 21.2766 15.2484C20.7797 15.6 20.25 15.9047 19.6828 16.1578L19.5141 16.2328C19.0406 16.4437 18.4875 16.2281 18.2766 15.7547C18.0656 15.2812 18.2812 14.7281 18.7547 14.5172L18.9234 14.4422C19.2234 14.3063 19.5141 14.1562 19.7906 13.9828L19.2188 13.4109C18.8531 13.0453 18.8531 12.45 19.2188 12.0844C19.5844 11.7187 20.1797 11.7187 20.5453 12.0844L21.2297 12.7687L21.2531 12.7922C21.8344 12.1781 22.3078 11.4656 22.65 10.6828H21H17.625C17.1094 10.6828 16.6875 10.2609 16.6875 9.74531C16.6875 9.22969 17.1094 8.80781 17.625 8.80781H20.0625V8.62031C20.0625 8.10469 20.4844 7.68281 21 7.68281V7.6875Z"
                    fill="white"
                  />
                </svg>
              </div>
              <h3>Bilingual UI</h3>
              <p>Seamless Arabic and English interface with RTL support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="why-section">
        <div className="container">
          <div className="section-header">
            <h2>Why Businesses Choose LinkSA</h2>
            <p>The smart choice for Saudi marketers and businesses</p>
          </div>

          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon blue-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="30"
                  height="30"
                  viewBox="0 0 30 30"
                  fill="none"
                >
                  <g clip-path="url(#clip0_775_2714)">
                    <path
                      d="M9.17584 22.5528L7.36529 20.7422C6.86724 20.2442 6.69146 19.5235 6.91412 18.8555C7.0899 18.334 7.32428 17.6543 7.60553 16.875H1.40631C0.902401 16.875 0.433651 16.6055 0.181697 16.166C-0.0702557 15.7266 -0.0643963 15.1875 0.193416 14.7539L3.26959 9.56839C4.03131 8.28519 5.40826 7.50003 6.89654 7.50003H11.7188C11.8594 7.26566 12.0001 7.04886 12.1407 6.83792C16.9395 -0.240201 24.0879 -0.474576 28.3536 0.31058C29.0333 0.433627 29.5606 0.966831 29.6895 1.64652C30.4747 5.918 30.2344 13.0606 23.1622 17.8594C22.9571 18 22.7344 18.1407 22.5001 18.2813V23.1035C22.5001 24.5918 21.7149 25.9746 20.4317 26.7305L15.2462 29.8067C14.8126 30.0645 14.2735 30.0703 13.834 29.8184C13.3946 29.5664 13.1251 29.1035 13.1251 28.5938V22.3125C12.2989 22.5996 11.5782 22.834 11.0333 23.0098C10.377 23.2207 9.66217 23.0391 9.16998 22.5528H9.17584ZM22.5001 9.84378C23.1217 9.84378 23.7178 9.59685 24.1573 9.15732C24.5969 8.71778 24.8438 8.12163 24.8438 7.50003C24.8438 6.87843 24.5969 6.28229 24.1573 5.84275C23.7178 5.40321 23.1217 5.15628 22.5001 5.15628C21.8785 5.15628 21.2823 5.40321 20.8428 5.84275C20.4032 6.28229 20.1563 6.87843 20.1563 7.50003C20.1563 8.12163 20.4032 8.71778 20.8428 9.15732C21.2823 9.59685 21.8785 9.84378 22.5001 9.84378Z"
                      fill="white"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_775_2714">
                      <path d="M0 0H30V30H0V0Z" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
              </div>
              <h3>Launch Campaigns Faster</h3>
              <p>
                Create branded short links in seconds. Our UTM builder helps you
                track every campaign from day one, giving you the insights you
                need to optimize performance.
              </p>
              <div className="stat-card">
                <p className="stat-label">Average setup time</p>
                <p className="stat-value blue">2 minutes</p>
              </div>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon green-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="30"
                  height="30"
                  viewBox="0 0 30 30"
                  fill="none"
                >
                  <g clip-path="url(#clip0_775_2721)">
                    <path
                      d="M9.16992 26.2324L8.43164 27.9609C7.33594 27.4043 6.32812 26.7188 5.41406 25.916L6.74414 24.5859C7.47656 25.2246 8.29102 25.7812 9.16992 26.2324ZM2.37891 15.9375H0.498047C0.580078 17.1797 0.814453 18.3809 1.18359 19.5176L2.92969 18.8203C2.64258 17.9004 2.44922 16.9336 2.37891 15.9375ZM2.37891 14.0625C2.46094 12.9609 2.68359 11.8945 3.0293 10.8926L1.30078 10.1543C0.861328 11.3848 0.585938 12.6973 0.498047 14.0625H2.37891ZM3.76758 9.16992C4.22461 8.29688 4.77539 7.48242 5.41406 6.73828L4.08398 5.4082C3.28125 6.32227 2.58984 7.33008 2.03906 8.42578L3.76758 9.16992ZM23.2617 24.5859C22.4473 25.2891 21.5391 25.8926 20.5605 26.3672L21.2578 28.1133C22.4707 27.5332 23.5898 26.7891 24.5918 25.9102L23.2617 24.5859ZM6.73828 5.41406C7.55273 4.71094 8.46094 4.10742 9.43945 3.63281L8.74219 1.88672C7.5293 2.4668 6.41016 3.21094 5.41406 4.08984L6.73828 5.41406ZM26.2324 20.8301C25.7754 21.7031 25.2246 22.5176 24.5859 23.2617L25.916 24.5918C26.7188 23.6777 27.4102 22.6641 27.9609 21.5742L26.2324 20.8301ZM27.6211 15.9375C27.5391 17.0391 27.3164 18.1055 26.9707 19.1074L28.6992 19.8457C29.1387 18.6094 29.4141 17.2969 29.4961 15.9316H27.6211V15.9375ZM18.8203 27.0703C17.9004 27.3633 16.9336 27.5508 15.9375 27.6211V29.502C17.1797 29.4199 18.3809 29.1855 19.5176 28.8164L18.8203 27.0703ZM14.0625 27.6211C12.9609 27.5391 11.8945 27.3164 10.8926 26.9707L10.1543 28.6992C11.3906 29.1387 12.7031 29.4141 14.0684 29.4961V27.6211H14.0625ZM27.0703 11.1797C27.3633 12.0996 27.5508 13.0664 27.6211 14.0625H29.502C29.4199 12.8203 29.1855 11.6191 28.8164 10.4824L27.0703 11.1797ZM5.41406 23.2617C4.71094 22.4473 4.10742 21.5391 3.63281 20.5605L1.88672 21.2578C2.4668 22.4707 3.21094 23.5898 4.08984 24.5918L5.41406 23.2617ZM15.9375 2.37891C17.0391 2.46094 18.0996 2.68359 19.1074 3.0293L19.8457 1.30078C18.6152 0.861328 17.3027 0.585938 15.9375 0.498047V2.37891ZM11.1797 2.92969C12.0996 2.63672 13.0664 2.44922 14.0625 2.37891V0.498047C12.8203 0.580078 11.6191 0.814453 10.4824 1.18359L11.1797 2.92969ZM25.916 5.4082L24.5859 6.73828C25.2891 7.55273 25.8926 8.46094 26.373 9.43945L28.1191 8.74219C27.5391 7.5293 26.7949 6.41016 25.916 5.4082ZM23.2617 5.41406L24.5918 4.08398C23.6777 3.28125 22.6699 2.58984 21.5742 2.03906L20.8359 3.76758C21.7031 4.22461 22.5234 4.77539 23.2617 5.41406Z"
                      fill="white"
                    />
                    <path
                      d="M15 22.9688C15.9061 22.9688 16.6406 22.2342 16.6406 21.3281C16.6406 20.422 15.9061 19.6875 15 19.6875C14.0939 19.6875 13.3594 20.422 13.3594 21.3281C13.3594 22.2342 14.0939 22.9688 15 22.9688Z"
                      fill="white"
                    />
                    <path
                      d="M15.4512 18.2812H14.5137C14.127 18.2812 13.8106 17.9648 13.8106 17.5781C13.8106 13.418 18.3458 13.834 18.3458 11.2617C18.3458 10.0898 17.3028 8.90625 14.9825 8.90625C13.2774 8.90625 12.3868 9.46875 11.5137 10.5879C11.2852 10.8809 10.8633 10.9395 10.5645 10.7285L9.79694 10.1895C9.46882 9.96094 9.39265 9.49805 9.6446 9.18164C10.8868 7.58789 12.3633 6.5625 14.9883 6.5625C18.0528 6.5625 20.6954 8.30859 20.6954 11.2617C20.6954 15.2227 16.1602 14.9824 16.1602 17.5781C16.1544 17.9648 15.838 18.2812 15.4512 18.2812Z"
                      fill="white"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_775_2721">
                      <path d="M0 0H30V30H0V0Z" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
              </div>
              <h3>Trust & Compliance First</h3>
              <p>
                Built specifically for Saudi businesses with full PDPL
                compliance. Your data stays in KSA, and your customers trust
                links from Saudi domains.
              </p>
              <div className="stat-card">
                <p className="stat-label">Data residency</p>
                <p className="stat-value green">
                  <svg
                    width="16"
                    height="12"
                    viewBox="0 0 16 12"
                    fill="none"
                    className="flag-icon"
                  >
                    <rect width="16" height="12" fill="#006C35" />
                    <rect x="0" y="4" width="16" height="4" fill="white" />
                  </svg>
                  100% KSA
                </p>
              </div>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon pink-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="30"
                  height="30"
                  viewBox="0 0 30 30"
                  fill="none"
                >
                  <g clip-path="url(#clip0_775_2733)">
                    <path
                      d="M3.75 3.75C3.75 2.71289 2.91211 1.875 1.875 1.875C0.837891 1.875 0 2.71289 0 3.75V23.4375C0 26.0273 2.09766 28.125 4.6875 28.125H28.125C29.1621 28.125 30 27.2871 30 26.25C30 25.2129 29.1621 24.375 28.125 24.375H4.6875C4.17188 24.375 3.75 23.9531 3.75 23.4375V3.75ZM27.5742 8.82422C28.3066 8.0918 28.3066 6.90234 27.5742 6.16992C26.8418 5.4375 25.6523 5.4375 24.9199 6.16992L18.75 12.3457L15.3867 8.98242C14.6543 8.25 13.4648 8.25 12.7324 8.98242L6.16992 15.5449C5.4375 16.2773 5.4375 17.4668 6.16992 18.1992C6.90234 18.9316 8.0918 18.9316 8.82422 18.1992L14.0625 12.9668L17.4258 16.3301C18.1582 17.0625 19.3477 17.0625 20.0801 16.3301L27.5801 8.83008L27.5742 8.82422Z"
                      fill="white"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_775_2733">
                      <path d="M0 0H30V30H0V0Z" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
              </div>
              <h3>Actionable Analytics</h3>
              <p>
                Get real-time insights on clicks, geography, devices, and
                campaign performance. Make data-driven decisions with our
                comprehensive analytics dashboard.
              </p>
              <div className="stat-card">
                <p className="stat-label">Click tracking accuracy</p>
                <p className="stat-value purple">99.9%</p>
              </div>
            </div>
          </div>

          {/* Perfect for Saudi Marketers Card */}
          <div className="marketers-card">
            <div className="marketers-content">
              <div className="marketers-text">
                <h3>Perfect for Saudi Marketers</h3>
                <ul className="features-list">
                  <li>
                    <CheckIcon /> Custom .sa domain support
                  </li>
                  <li>
                    <CheckIcon /> Arabic & English interface with RTL support
                  </li>
                  <li>
                    <CheckIcon /> QR codes for offline campaigns
                  </li>
                  <li>
                    <CheckIcon /> Authintica integration for secure access
                  </li>
                  <li>
                    <CheckIcon /> Local support in Arabic & English
                  </li>
                </ul>
              </div>
              <div className="marketers-stats">
                <div className="stats-card">
                  <div className="main-stat">50,000+</div>
                  <div className="stat-subtitle">
                    Links created by Saudi businesses
                  </div>
                  <div className="stats-row">
                    <div className="stat-item">
                      <div className="stat-number">98%</div>
                      <div className="stat-text">Uptime</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-number">2.5M+</div>
                      <div className="stat-text">Clicks tracked</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-number">24/7</div>
                      <div className="stat-text">Support</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <h2>Trusted by Saudi Businesses</h2>
            <p>See what our customers say about LinkSA</p>
          </div>

          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-header">
                <div className="avatar">
                  <img
                    src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=48&h=48&fit=crop&crop=face"
                    alt="Sarah Al-Rashid"
                  />
                </div>
                <div className="testimonial-info">
                  <h4>Sarah Al-Rashid</h4>
                  <p>Marketing Director, TechCorp KSA</p>
                </div>
              </div>
              <p className="testimonial-text">
                "LinkSA's PDPL compliance gives us peace of mind. The analytics
                are incredibly detailed and help us optimize our campaigns."
              </p>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-header">
                <div className="avatar">
                  <img
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=48&h=48&fit=crop&crop=face"
                    alt="Ahmed Mohammed"
                  />
                </div>
                <div className="testimonial-info">
                  <h4>Ahmed Mohammed</h4>
                  <p>Digital Marketing Manager</p>
                </div>
              </div>
              <p className="testimonial-text">
                "The bilingual interface is perfect for our diverse team. We
                love the branded domains feature!"
              </p>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-header">
                <div className="avatar">
                  <img
                    src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=48&h=48&fit=crop&crop=face"
                    alt="Fatima Al-Zahra"
                  />
                </div>
                <div className="testimonial-info">
                  <h4>Fatima Al-Zahra</h4>
                  <p>E-commerce Director</p>
                </div>
              </div>
              <p className="testimonial-text">
                "LinkSA has revolutionized how we track our social media
                campaigns. The QR codes are a game-changer!"
              </p>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-header">
                <div className="avatar">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=48&h=48&fit=crop&crop=face"
                    alt="Omar Hassan"
                  />
                </div>
                <div className="testimonial-info">
                  <h4>Omar Hassan</h4>
                  <p>Startup Founder</p>
                </div>
              </div>
              <p className="testimonial-text">
                "Fast, reliable, and secure. Everything we need for our growing
                business in Saudi Arabia."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <div className="footer-brand">
                <div className="brand-logo">
                  <div className="logo-icon">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="23"
                      height="18"
                      viewBox="0 0 23 18"
                      fill="none"
                    >
                      <g clip-path="url(#clip0_775_2784)">
                        <path
                          d="M20.3836 9.41141C22.37 7.42509 22.37 4.20829 20.3836 2.22196C18.6258 0.464147 15.8555 0.235631 13.834 1.68055L13.7778 1.71922C13.2715 2.08133 13.1555 2.78446 13.5176 3.28719C13.8797 3.78993 14.5829 3.90946 15.0856 3.54735L15.1418 3.50868C16.2704 2.7036 17.8137 2.83016 18.7911 3.81102C19.8985 4.91844 19.8985 6.71141 18.7911 7.81883L14.8465 11.7704C13.7391 12.8778 11.9461 12.8778 10.8387 11.7704C9.85786 10.7895 9.7313 9.24618 10.5364 8.12118L10.575 8.06493C10.9372 7.55868 10.8176 6.85555 10.3149 6.49696C9.81216 6.13837 9.10552 6.25438 8.74692 6.75712L8.70825 6.81337C7.25981 8.83134 7.48833 11.6016 9.24614 13.3595C11.2325 15.3458 14.4493 15.3458 16.4356 13.3595L20.3836 9.41141ZM2.11646 8.58876C0.130127 10.5751 0.130127 13.7919 2.11646 15.7782C3.87427 17.536 6.64458 17.7645 8.66606 16.3196L8.72231 16.2809C9.22857 15.9188 9.34458 15.2157 8.98247 14.713C8.62036 14.2102 7.91724 14.0907 7.4145 14.4528L7.35825 14.4915C6.22974 15.2966 4.68638 15.17 3.70903 14.1891C2.60161 13.0782 2.60161 11.2852 3.70903 10.1778L7.65356 6.22977C8.76099 5.12235 10.554 5.12235 11.6614 6.22977C12.6422 7.21063 12.7688 8.75399 11.9637 9.88251L11.925 9.93876C11.5629 10.445 11.6825 11.1481 12.1852 11.5067C12.6879 11.8653 13.3946 11.7493 13.7532 11.2466L13.7918 11.1903C15.2403 9.16883 15.0118 6.39852 13.254 4.64071C11.2676 2.65438 8.05083 2.65438 6.0645 4.64071L2.11646 8.58876Z"
                          fill="white"
                        />
                      </g>
                      <defs>
                        <clipPath id="clip0_775_2784">
                          <path d="M0 0H22.5V18H0V0Z" fill="white" />
                        </clipPath>
                      </defs>
                    </svg>
                  </div>
                  <span className="brand-name">LinkSA</span>
                </div>
                <p className="footer-description">
                  The most trusted URL shortener in Saudi Arabia, built for
                  modern businesses.
                </p>
                <div className="social-links">
                  <a href="#" className="social-link">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M16 8.05A8.02 8.02 0 008.05 16v-5.61h1.62l.31-2h-1.93V6.75c0-.44.22-.87.91-.87h.87V4.29s-.79-.13-1.54-.13c-1.57 0-2.6.95-2.6 2.68v1.51H3.84v2h1.85V16A8.02 8.02 0 0016 8.05z"
                        fill="currentColor"
                      />
                    </svg>
                  </a>
                  <a href="#" className="social-link">
                    <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
                      <path
                        d="M14 2.4c-.5.2-1.1.4-1.6.4.6-.4 1-.9 1.2-1.6-.5.3-1.1.5-1.8.7C11.3.9 10.5.5 9.7.5c-1.6 0-2.9 1.3-2.9 2.9 0 .2 0 .4.1.6C4.5 3.8 2.4 2.7.98 1c-.2.4-.3.8-.3 1.3 0 1 .5 1.9 1.3 2.4-.5 0-.9-.2-1.3-.4v.04c0 1.4 1 2.6 2.3 2.8-.2.1-.5.1-.8.1-.2 0-.4 0-.6-.1.4 1.3 1.6 2.2 3 2.2-1.1.9-2.5 1.4-4 1.4-.3 0-.5 0-.8-.04C1.4 11.2 3.1 11.7 5 11.7c6 0 9.3-5 9.3-9.3v-.4c.6-.5 1.2-1.1 1.7-1.8z"
                        fill="currentColor"
                      />
                    </svg>
                  </a>
                  <a href="#" className="social-link">
                    <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
                      <path
                        d="M12.8 0H1.2C.5 0 0 .5 0 1.2v13.6c0 .7.5 1.2 1.2 1.2h13.6c.7 0 1.2-.5 1.2-1.2V1.2c0-.7-.5-1.2-1.2-1.2zM4.7 13.6H2.4V6h2.4v7.6zM3.6 5c-.8 0-1.4-.7-1.4-1.4S2.8 2.1 3.6 2.1s1.4.7 1.4 1.4-.6 1.5-1.4 1.5zm8.8 8.6H10V9.9c0-.9 0-2-1.2-2s-1.4.9-1.4 1.9v3.8H5V6h2.3v1c.3-.6 1.1-1.2 2.2-1.2 2.4 0 2.8 1.6 2.8 3.6v4.2z"
                        fill="currentColor"
                      />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            <div className="footer-section">
              <h4>Product</h4>
              <ul>
                <li>
                  <a href="#">Features</a>
                </li>
                <li>
                  <a href="#">Pricing</a>
                </li>
                <li>
                  <a href="#">API</a>
                </li>
                <li>
                  <a href="#">Integrations</a>
                </li>
              </ul>
            </div>

            <div className="footer-section">
              <h4>Company</h4>
              <ul>
                <li>
                  <a href="#">About Us</a>
                </li>
                <li>
                  <a href="#">Careers</a>
                </li>
                <li>
                  <a href="#">Blog</a>
                </li>
                <li>
                  <a href="#">Contact</a>
                </li>
              </ul>
            </div>

            <div className="footer-section">
              <h4>Legal</h4>
              <ul>
                <li>
                  <a href="#">Privacy Policy</a>
                </li>
                <li>
                  <a href="#">Terms of Service</a>
                </li>
                <li>
                  <a href="#">PDPL Compliance</a>
                </li>
                <li>
                  <a href="#">Security</a>
                </li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p>
              © 2024 LinkSA. All rights reserved. Made with ❤️ in Saudi Arabia.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
