# URL Shortener - New UI (v1)

## 🎉 Backend Integration Complete!

This is the new modern UI for the URL Shortener application, fully integrated with the existing backend API.

## ✨ Features

- 🔗 URL Shortening with custom aliases
- 📊 Real-time Analytics Dashboard
- 🎨 QR Code Generation & Management
- 🌐 Custom Domain Support
- 👥 User Management (Admin)
- 🔐 Secure Authentication (Email/Password + OTP)
- 🌍 Multi-language Support (English/Arabic)
- 📱 Fully Responsive Design
- 🎯 Role-Based Access Control

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- Backend API running on `http://localhost:3015`

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd urlshortenerNewUiV1

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

### Environment Configuration

Edit `.env` file:

```env
VITE_API_URL=http://localhost:3015/api
```

For production:

```env
VITE_API_URL=https://laghhu.link/api
```

## 📚 Documentation

- **[Backend Integration Guide](./BACKEND_INTEGRATION_COMPLETE.md)** - Complete integration details
- **[Developer Guide](./DEVELOPER_GUIDE.md)** - How to work with the API
- **[Migration Checklist](./MIGRATION_CHECKLIST.md)** - Testing and deployment checklist

## 🏗️ Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── dashboard/   # Dashboard-specific components
│   ├── landing/     # Landing page components
│   └── ui/          # Base UI components (shadcn)
├── contexts/        # React contexts (Auth, Language)
├── hooks/           # Custom React hooks (API hooks)
├── pages/           # Page components
├── services/        # API service layer
├── types/           # TypeScript type definitions
├── lib/             # Utility functions
└── data/            # Static data (blog posts, etc.)
```

## 🔌 API Integration

All pages are fully integrated with the backend API:

### Integrated Pages
- ✅ Dashboard - Real-time stats and quick actions
- ✅ My Links - URL management with search/sort
- ✅ Create Link - URL creation with custom domains
- ✅ Analytics - Detailed link analytics
- ✅ QR Codes - QR code generation and download
- ✅ Custom Domains - Domain management and verification
- ✅ Profile - User profile management
- ✅ User Management - Admin user management
- ✅ URL Management - Admin URL management

### API Endpoints Used
- `/auth/*` - Authentication & authorization
- `/urls/*` - URL CRUD operations
- `/domains/*` - Custom domain management
- `/analytics/*` - Analytics data
- `/qr-codes/*` - QR code operations
- `/admin/*` - Admin operations
- `/roles/*` - Role & permission management

## 🛠️ Technologies

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI)
- **State Management**: TanStack Query (React Query)
- **HTTP Client**: Fetch API
- **Routing**: React Router v6
- **Forms**: React Hook Form (where applicable)
- **Icons**: Lucide React
- **Charts**: Recharts
- **i18n**: Custom language context

## 🧪 Testing

```sh
# Run tests (if configured)
npm test

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📦 Deployment

### Build

```sh
npm run build
```

The build output will be in the `dist/` directory.

### Deploy to Lovable

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share → Publish.

### Deploy to Other Platforms

The built files in `dist/` can be deployed to:
- Vercel
- Netlify
- AWS S3 + CloudFront
- Any static hosting service

## 🔐 Authentication

The app uses JWT-based authentication:

1. User logs in with email/password or OTP
2. Backend returns access token and refresh token
3. Tokens stored in localStorage
4. Access token sent with every API request
5. Automatic token refresh on expiry

## 🌍 Internationalization

Supports English and Arabic with RTL layout for Arabic.

Switch language using the language selector in the header.

## 🎨 Theming

The app uses CSS variables for theming. Customize colors in `src/index.css`.

## 📱 Responsive Design

Fully responsive with breakpoints:
- Mobile: 320px+
- Tablet: 768px+
- Desktop: 1024px+
- Large: 1920px+

## 🐛 Troubleshooting

### API Connection Issues

1. Ensure backend is running on correct port
2. Check VITE_API_URL in .env file
3. Verify CORS is enabled on backend
4. Check browser console for errors

### Authentication Issues

1. Clear localStorage and try logging in again
2. Check if tokens are being stored
3. Verify backend authentication endpoints are working

### Build Issues

1. Delete node_modules and package-lock.json
2. Run `npm install` again
3. Clear Vite cache: `rm -rf node_modules/.vite`

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

[Your License Here]

## 👥 Team

- **Frontend**: [Your Team]
- **Backend**: [Backend Team]
- **Design**: [Design Team]

## 📞 Support

For issues or questions:
- Check the documentation files
- Review the Developer Guide
- Contact the development team

---

**Status**: ✅ Production Ready
**Last Updated**: 2026-04-07
**Version**: 1.0.0
