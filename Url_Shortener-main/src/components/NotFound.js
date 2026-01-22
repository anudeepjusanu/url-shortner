import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import '../App.css';

const NotFound = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const content = {
    en: {
      title: '404',
      heading: 'Page Not Found',
      description: 'The page you\'re looking for doesn\'t exist or has been moved. This could be a broken short link or an invalid URL.',
      goBack: 'Go Back',
      goHome: 'Go Home',
      needHelp: 'Need help?',
      contactSupport: 'Contact support'
    },
    ar: {
      title: '404',
      heading: 'الصفحة غير موجودة',
      description: 'الصفحة التي تبحث عنها غير موجودة أو تم نقلها. قد يكون هذا رابطًا مختصرًا معطلاً أو عنوان URL غير صالح.',
      goBack: 'رجوع',
      goHome: 'الصفحة الرئيسية',
      needHelp: 'هل تحتاج مساعدة؟',
      contactSupport: 'تواصل مع الدعم'
    }
  };

  const lang = localStorage.getItem('language') || 'en';
  const currentContent = content[lang];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '600px',
        width: '100%',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '30px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '80px',
            height: '80px',
            background: '#dbeafe',
            borderRadius: '50%',
            marginBottom: '24px'
          }}>
            <svg 
              style={{ width: '40px', height: '40px', color: '#2563eb' }}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
          </div>
          <h1 style={{
            fontSize: '72px',
            fontWeight: 'bold',
            color: '#1f2937',
            margin: '0 0 16px 0'
          }}>
            {currentContent.title}
          </h1>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '600',
            color: '#374151',
            margin: '0 0 16px 0'
          }}>
            {currentContent.heading}
          </h2>
          <p style={{
            color: '#6b7280',
            fontSize: '16px',
            lineHeight: '1.6',
            marginBottom: '32px'
          }}>
            {currentContent.description}
          </p>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: window.innerWidth < 640 ? 'column' : 'row',
          gap: '16px',
          justifyContent: 'center',
          marginBottom: '48px'
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '500',
              color: '#2563eb',
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#f9fafb';
              e.target.style.borderColor = '#d1d5db';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'white';
              e.target.style.borderColor = '#e5e7eb';
            }}
          >
            <svg 
              style={{ width: '16px', height: '16px', marginRight: '8px' }}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M10 19l-7-7m0 0l7-7m-7 7h18" 
              />
            </svg>
            {currentContent.goBack}
          </button>
          
          <button
            onClick={() => navigate('/')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '500',
              color: 'white',
              background: '#2563eb',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#1d4ed8';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#2563eb';
            }}
          >
            <svg 
              style={{ width: '16px', height: '16px', marginRight: '8px' }}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
              />
            </svg>
            {currentContent.goHome}
          </button>
        </div>

        <div style={{
          paddingTop: '32px',
          borderTop: '1px solid #e5e7eb'
        }}>
          <p style={{
            fontSize: '14px',
            color: '#6b7280'
          }}>
            {currentContent.needHelp}{' '}
            <a 
              href="/contact" 
              style={{
                color: '#2563eb',
                fontWeight: '500',
                textDecoration: 'none'
              }}
            >
              {currentContent.contactSupport}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
