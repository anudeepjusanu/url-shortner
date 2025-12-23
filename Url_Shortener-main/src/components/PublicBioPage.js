import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { bioPagesAPI } from '../services/api';
import './PublicBioPage.css';

const PublicBioPage = () => {
  const { username } = useParams();
  const [bioPage, setBioPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBioPage();
  }, [username]);

  const fetchBioPage = async () => {
    try {
      setLoading(true);
      // Remove @ symbol if present in the username
      const cleanUsername = username.startsWith('@') ? username.slice(1) : username;
      const response = await bioPagesAPI.getBySlug(cleanUsername);
      if (response.success) {
        setBioPage(response.data.bioPage);
      } else {
        setError('Bio page not found');
      }
    } catch (err) {
      setError(err.message || 'Failed to load bio page');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkClick = async (linkId) => {
    try {
      await bioPagesAPI.trackClick(bioPage.slug, linkId);
    } catch (err) {
      console.error('Failed to track click:', err);
    }
  };

  if (loading) {
    return (
      <div className="public-bio-loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (error || !bioPage) {
    return (
      <div className="public-bio-error">
        <h1>404</h1>
        <p>{error || 'Bio page not found'}</p>
      </div>
    );
  }

  const theme = bioPage.theme || {};
  const customStyles = {
    backgroundColor: theme.backgroundColor || '#ffffff',
    color: theme.textColor || '#111827',
    fontFamily: theme.fontFamily || 'Inter, sans-serif'
  };

  return (
    <div className="public-bio-page" style={customStyles}>
      <div className="bio-container">
        {/* Profile Section */}
        <div className="bio-profile">
          {bioPage.profileImage && (
            <img 
              src={bioPage.profileImage} 
              alt={bioPage.title}
              className="bio-avatar"
            />
          )}
          <h1 className="bio-title">{bioPage.title}</h1>
          {bioPage.bio && <p className="bio-description">{bioPage.bio}</p>}
        </div>

        {/* Links Section */}
        <div className="bio-links">
          {bioPage.links && bioPage.links.map((link) => (
            <a
              key={link._id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bio-link"
              style={{
                backgroundColor: theme.buttonColor || '#3B82F6',
                color: theme.buttonTextColor || '#ffffff',
                borderRadius: theme.buttonStyle === 'rounded' ? '24px' : '8px'
              }}
              onClick={() => handleLinkClick(link._id)}
            >
              {link.icon && <span className="link-icon">{link.icon}</span>}
              <span className="link-title">{link.title}</span>
            </a>
          ))}
        </div>

        {/* Social Links */}
        {bioPage.socialLinks && bioPage.socialLinks.length > 0 && (
          <div className="bio-social">
            {bioPage.socialLinks.map((social, index) => (
              <a
                key={index}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
                aria-label={social.platform}
              >
                {getSocialIcon(social.platform)}
              </a>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="bio-footer">
          <p>Powered by Snip</p>
        </div>
      </div>
    </div>
  );
};

const getSocialIcon = (platform) => {
  const icons = {
    twitter: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
      </svg>
    ),
    instagram: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" fill="white"/>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="white" strokeWidth="2"/>
      </svg>
    ),
    linkedin: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/>
        <circle cx="4" cy="4" r="2"/>
      </svg>
    ),
    facebook: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
      </svg>
    ),
    youtube: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.33z"/>
        <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="white"/>
      </svg>
    ),
    github: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"/>
      </svg>
    ),
    tiktok: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 12a4 4 0 104 4V4a5 5 0 005 5"/>
      </svg>
    )
  };
  
  return icons[platform.toLowerCase()] || icons.twitter;
};

export default PublicBioPage;
