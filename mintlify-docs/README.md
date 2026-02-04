# Snip API Documentation

This directory contains the Mintlify documentation for Snip URL Shortener API.

## Setup Instructions

### 1. Install Mintlify CLI

```bash
npm i -g mintlify
```

### 2. Preview Documentation Locally

```bash
cd mintlify-docs
mintlify dev
```

This will start a local server at `http://localhost:3000`

### 3. Deploy to Mintlify

#### Option A: GitHub Integration (Recommended)

1. Push this directory to your GitHub repository
2. Go to [mintlify.com](https://mintlify.com) and sign in
3. Connect your GitHub repository
4. Select the `mintlify-docs` directory
5. Deploy!

#### Option B: Manual Deployment

1. Go to [mintlify.com](https://mintlify.com)
2. Create a new project
3. Upload the contents of this directory
4. Deploy!

## Documentation Structure

```
mintlify-docs/
├── mint.json                 # Main configuration
├── introduction.mdx          # Homepage
├── quickstart.mdx           # Quick start guide
├── authentication.mdx       # Auth documentation
├── rate-limits.mdx          # Rate limiting info
├── errors.mdx               # Error handling
├── api-reference/           # API endpoints
│   ├── introduction.mdx
│   ├── urls/               # URL endpoints
│   ├── analytics/          # Analytics endpoints
│   ├── qr-codes/           # QR code endpoints
│   └── domains/            # Domain endpoints
└── guides/                  # User guides
    ├── getting-started.mdx
    ├── custom-domains.mdx
    ├── utm-tracking.mdx
    ├── password-protection.mdx
    ├── geo-restrictions.mdx
    └── webhooks.mdx
```

## Customization

### Update Branding

Edit `mint.json` to customize:
- Logo and favicon
- Color scheme
- Navigation structure
- Social links

### Add New Pages

1. Create a new `.mdx` file
2. Add frontmatter with title and description
3. Add the page to `navigation` in `mint.json`

## Features

- ✅ Interactive API playground
- ✅ Auto-generated code snippets
- ✅ Search functionality
- ✅ Dark/light mode
- ✅ Mobile responsive
- ✅ Version control
- ✅ Analytics

## Support

For questions about the documentation:
- Email: support@nawah.sa
- Mintlify Docs: https://mintlify.com/docs
