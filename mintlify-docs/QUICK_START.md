# Quick Start - Mintlify Documentation

## 🚀 Get Started in 3 Steps

### Step 1: Preview Locally (Optional)

```bash
cd url-shortner/mintlify-docs
npm install -g mintlify
mintlify dev
```

Open http://localhost:3000

### Step 2: Deploy to Mintlify

#### Via GitHub (Easiest)

```bash
# Push to GitHub
git add .
git commit -m "Add Mintlify documentation"
git push origin main

# Then:
# 1. Go to mintlify.com
# 2. Sign in with GitHub
# 3. Create new project
# 4. Select your repo
# 5. Set path: mintlify-docs
# 6. Deploy!
```

#### Via CLI

```bash
cd mintlify-docs
mintlify login
mintlify deploy
```

### Step 3: Share Your Docs! 🎉

Your docs will be live at:
- `https://your-project.mintlify.app`
- Or custom domain: `https://docs.snip.sa`

## 📝 What You Get

✅ 25+ documentation pages
✅ Interactive API playground
✅ Code examples in 4 languages
✅ Search functionality
✅ Dark/light mode
✅ Mobile responsive
✅ Auto-deploy from GitHub

## 🎨 Customize (Optional)

### Add Your Logo

Place files in `logo/`:
- `light.svg` - Light mode logo
- `dark.svg` - Dark mode logo

### Change Colors

Edit `mint.json`:
```json
{
  "colors": {
    "primary": "#YOUR_COLOR"
  }
}
```

## 📚 Documentation Includes

- **Get Started**: Introduction, Quickstart, Authentication
- **API Reference**: 19 endpoints with examples
- **Guides**: 6 comprehensive tutorials
- **Error Handling**: Complete error documentation

## 🔗 Useful Links

- Mintlify Docs: https://mintlify.com/docs
- Your Support: support@nawah.sa
- Full Guide: See DEPLOYMENT.md

## ⚡ Commands

```bash
# Preview locally
mintlify dev

# Deploy
mintlify deploy

# Install CLI
npm install -g mintlify
```

That's it! Your API documentation is ready to go live. 🚀
