import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../contexts/LanguageContext";
import logo from '../assets/logo.png';
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { 
  ArrowRight, Check, CheckCircle2, Shield, Zap, BarChart3, Globe2, Link as LinkIcon,
  QrCode, Users, TrendingUp, Lock, Menu, X, Globe, ChevronRight, Star, Sparkles,
  Target, Code, Layers, Activity, Moon, Sun, Mail, Smartphone
} from "lucide-react";
import { cn } from "../lib/utils";
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleShortenUrl = () => {
    navigate("/register");
  };

  return (
    <div className={cn("min-h-screen font-sans transition-colors duration-300", darkMode ? "dark bg-slate-900 text-slate-100" : "bg-white text-slate-900")}>
      {/* Top Banner */}
      <div className={cn("text-center py-3 px-4 text-sm font-medium transition-colors", darkMode ? "bg-gradient-to-r from-blue-700 to-purple-700 text-white" : "bg-gradient-to-r from-blue-600 to-purple-600 text-white")}>
        <span>Free plan available • No credit card required</span>
      </div>

      {/* Navigation Header */}
      <nav className={cn("sticky top-0 z-50 border-b transition-colors", darkMode ? "bg-slate-900/95 backdrop-blur-lg border-slate-800" : "bg-white/95 backdrop-blur-lg border-slate-200")}>
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
              <img src={logo} alt="Logo" className={cn("h-9 w-auto transition-all", darkMode && "brightness-0 invert")} />
              <span className={cn("text-xl font-bold transition-colors", darkMode ? "text-white" : "text-slate-900")}>{t('common.brandName')}</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className={cn("text-sm font-medium transition-colors", darkMode ? "text-slate-300 hover:text-white" : "text-slate-700 hover:text-slate-900")}>
                {t('header.features')}
              </a>
              <a href="#integrations" className={cn("text-sm font-medium transition-colors", darkMode ? "text-slate-300 hover:text-white" : "text-slate-700 hover:text-slate-900")}>
                Integrations
              </a>
              <a href="#pricing" className={cn("text-sm font-medium transition-colors", darkMode ? "text-slate-300 hover:text-white" : "text-slate-700 hover:text-slate-900")}>
                {t('header.pricing')}
              </a>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => changeLanguage(currentLanguage === 'en' ? 'ar' : 'en')}
                className={darkMode ? "text-slate-300 hover:text-white" : "text-slate-600"}
              >
                <Globe className="mr-2 h-4 w-4" />
                {currentLanguage === 'en' ? 'AR' : 'EN'}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleDarkMode}
                className={darkMode ? "text-slate-300 hover:text-white" : "text-slate-600"}
              >
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
                {t('header.signIn')}
              </Button>
              <Button size="sm" onClick={() => navigate("/register")} className="bg-blue-600 hover:bg-blue-700 text-white">
                {t('header.signUp')}
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={cn("md:hidden border-t transition-colors", darkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white")}
            >
              <div className="container mx-auto px-6 py-4 space-y-3">
                <a href="#features" className={cn("block py-2 text-sm font-medium", darkMode ? "text-slate-300" : "text-slate-700")}>
                  {t('header.features')}
                </a>
                <a href="#integrations" className={cn("block py-2 text-sm font-medium", darkMode ? "text-slate-300" : "text-slate-700")}>
                  Integrations
                </a>
                <a href="#pricing" className={cn("block py-2 text-sm font-medium", darkMode ? "text-slate-300" : "text-slate-700")}>
                  {t('header.pricing')}
                </a>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => changeLanguage(currentLanguage === 'en' ? 'ar' : 'en')}
                  className="w-full justify-start"
                >
                  <Globe className="mr-2 h-4 w-4" />
                  {currentLanguage === 'en' ? 'العربية' : 'English'}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={toggleDarkMode}
                  className="w-full justify-start"
                >
                  {darkMode ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                  {darkMode ? 'Light Mode' : 'Dark Mode'}
                </Button>
                <div className="pt-3 space-y-2">
                  <Button variant="outline" className="w-full" onClick={() => navigate("/login")}>
                    {t('header.signIn')}
                  </Button>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={() => navigate("/register")}>
                    {t('header.signUp')}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section - Short.io Style with More White Space */}
      <section className={cn("relative overflow-hidden pt-20 pb-28 md:pt-28 md:pb-36 transition-colors", darkMode ? "bg-gradient-to-b from-slate-800 to-slate-900" : "bg-gradient-to-b from-slate-50 to-white")}>
        <div className="container mx-auto px-6 max-w-4xl relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            {/* Main Heading */}
            <h1 className={cn("text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight transition-colors", darkMode ? "text-white" : "text-slate-900")}>
              URL shortener with{" "}
              <span className="text-blue-600">custom domains</span>
            </h1>
            
            <p className={cn("text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed transition-colors", darkMode ? "text-slate-300" : "text-slate-600")}>
              Create branded short links with your custom domain or use ours. Free link shortener with detailed analytics, QR codes, and API. Track every click, run A/B tests, and optimize your campaigns.
            </p>
            
            {/* CTA Button */}
            <div className="flex justify-center mb-12">
              <Button 
                size="lg" 
                className="h-14 px-10 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => navigate("/register")}
              >
                Create free account
              </Button>
            </div>

            {/* Trust Badge */}
            <div className={cn("flex items-center justify-center gap-2 text-sm mb-12 transition-colors", darkMode ? "text-slate-400" : "text-slate-600")}>
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="ml-2 font-medium">Trustpilot</span>
            </div>

            {/* URL Shortener Demo */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-2xl mx-auto"
            >
              <div className={cn("rounded-2xl shadow-2xl border p-6 md:p-8 transition-colors", darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200")}>
                <h3 className={cn("text-lg font-semibold mb-5 text-left transition-colors", darkMode ? "text-white" : "text-slate-900")}>Shorten your link</h3>
                <div className="flex flex-col sm:flex-row gap-3 mb-5">
                  <Input 
                    placeholder="Paste your long URL here..." 
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className={cn("h-12 text-base flex-1 transition-colors", darkMode ? "bg-slate-700 border-slate-600 text-white placeholder:text-slate-400" : "")}
                  />
                  <Button 
                    size="lg" 
                    className="h-12 px-8 shrink-0 bg-blue-600 hover:bg-blue-700 text-white font-semibold" 
                    onClick={handleShortenUrl}
                  >
                    Shorten
                  </Button>
                </div>
                <div className={cn("rounded-lg p-4 border transition-colors", darkMode ? "bg-slate-700 border-slate-600" : "bg-slate-50 border-slate-200")}>
                  <p className={cn("text-sm mb-2 transition-colors", darkMode ? "text-slate-400" : "text-slate-600")}>Your short link:</p>
                  <div className="flex items-center justify-between gap-4">
                    <code className="text-blue-600 font-mono text-sm break-all">https://abc1234.short.gy/my-link</code>
                    <Button variant="ghost" size="sm" className="text-blue-600 shrink-0">
                      Copy
                    </Button>
                  </div>
                </div>
                <p className={cn("text-sm mt-5 text-center transition-colors", darkMode ? "text-slate-400" : "text-slate-500")}>
                  Want your own domain? <button onClick={() => navigate("/register")} className="text-blue-600 hover:underline font-medium">Create free account</button>
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Feature Pills with More Spacing */}
      <section className={cn("py-14 md:py-16 border-y transition-colors", darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200")}>
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 max-w-3xl mx-auto">
            {[
              { icon: <Sparkles className="h-5 w-5" />, text: "Free forever plan", subtext: "Up to 1,000 branded links" },
              { icon: <Globe2 className="h-5 w-5" />, text: "Custom domain support", subtext: "Use your own domain name" },
              { icon: <Shield className="h-5 w-5" />, text: "No credit card required", subtext: "Start creating links instantly" },
              { icon: <BarChart3 className="h-5 w-5" />, text: "Rich analytics included", subtext: "Track clicks and performance" }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="flex flex-col items-center text-center"
              >
                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors", darkMode ? "bg-blue-900 text-blue-400" : "bg-blue-100 text-blue-600")}>
                  {feature.icon}
                </div>
                <h4 className={cn("font-semibold text-sm mb-1 transition-colors", darkMode ? "text-white" : "text-slate-900")}>{feature.text}</h4>
                <p className={cn("text-xs transition-colors", darkMode ? "text-slate-400" : "text-slate-600")}>{feature.subtext}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof with More Spacing */}
      <section className={cn("py-12 md:py-14 transition-colors", darkMode ? "bg-slate-800" : "bg-slate-50")}>
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center max-w-3xl mx-auto">
            <p className={cn("text-sm mb-6 transition-colors", darkMode ? "text-slate-400" : "text-slate-600")}>Used by Fortune 500 companies and startups worldwide</p>
            <div className="flex flex-wrap items-center justify-center gap-8 opacity-50">
              {/* Placeholder for company logos */}
              <div className={cn("text-sm font-semibold transition-colors", darkMode ? "text-slate-500" : "text-slate-400")}>Client confidentiality</div>
            </div>
          </div>
        </div>
      </section>

      {/* Everything You Need Section with More Spacing */}
      <section id="features" className={cn("py-20 md:py-32 transition-colors", darkMode ? "bg-slate-900" : "bg-white")}>
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 className={cn("text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-5 transition-colors", darkMode ? "text-white" : "text-slate-900")}>
                Everything you need to manage links
              </h2>
              <p className={cn("text-lg md:text-xl transition-colors", darkMode ? "text-slate-300" : "text-slate-600")}>
                Advanced link management tools that help you track performance and optimize campaigns
              </p>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-3xl mx-auto">
            {[
              {
                icon: <BarChart3 className="h-6 w-6" />,
                title: "Advanced analytics",
                description: "Track clicks, conversions, and user behavior with detailed insights and real-time reporting",
                link: "Learn more"
              },
              {
                icon: <Globe2 className="h-6 w-6" />,
                title: "Custom domains",
                description: "Use your own branded domain to create professional short links that build trust",
                link: "Learn more"
              },
              {
                icon: <Users className="h-6 w-6" />,
                title: "Team collaboration",
                description: "Work together with your team, manage permissions, and share link analytics",
                link: "Learn more"
              },
              {
                icon: <QrCode className="h-6 w-6" />,
                title: "QR codes",
                description: "Generate dynamic QR codes that can be edited anytime without reprinting",
                link: "Learn more"
              },
              {
                icon: <Code className="h-6 w-6" />,
                title: "API access",
                description: "Integrate into your applications with our powerful REST API",
                link: "Learn more"
              },
              {
                icon: <Layers className="h-6 w-6" />,
                title: "Link management",
                description: "Organize, edit, and manage thousands of links with bulk operations and tags",
                link: "Learn more"
              }
            ].map((feature, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="group"
              >
                <div className={cn("h-full p-6 rounded-xl border hover:shadow-xl transition-all duration-300", darkMode ? "bg-slate-800 border-slate-700 hover:border-blue-600" : "bg-white border-slate-200 hover:border-blue-300")}>
                  <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center mb-5 transition-colors", darkMode ? "bg-blue-900 text-blue-400 group-hover:bg-blue-600 group-hover:text-white" : "bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white")}>
                    {feature.icon}
                  </div>
                  <h3 className={cn("text-xl font-bold mb-3 transition-colors", darkMode ? "text-white" : "text-slate-900")}>{feature.title}</h3>
                  <p className={cn("leading-relaxed mb-4 transition-colors", darkMode ? "text-slate-300" : "text-slate-600")}>
                    {feature.description}
                  </p>
                  <button className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                    {feature.link} <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section id="integrations" className={cn("py-20 md:py-32 transition-colors", darkMode ? "bg-slate-800" : "bg-slate-50")}>
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-12 max-w-3xl mx-auto">
            <h2 className={cn("text-3xl md:text-4xl font-bold tracking-tight mb-5 transition-colors", darkMode ? "text-white" : "text-slate-900")}>
              Connect with your favorite tools
            </h2>
            <p className={cn("text-lg transition-colors", darkMode ? "text-slate-300" : "text-slate-600")}>
              Connect {t('common.brandName')} to your existing tools with ready-made integrations and API access
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6 max-w-3xl mx-auto">
            {[
              { name: "Zapier", icon: <Zap className="h-8 w-8" /> },
              { name: "Slack", icon: <Users className="h-8 w-8" /> },
              { name: "Google Analytics", icon: <BarChart3 className="h-8 w-8" /> },
              { name: "Meta Pixel", icon: <Target className="h-8 w-8" /> },
              { name: "Mailchimp", icon: <Mail className="h-8 w-8" /> },
              { name: "Google Ads", icon: <TrendingUp className="h-8 w-8" /> },
              { name: "Chrome", icon: <Globe2 className="h-8 w-8" /> },
              { name: "WordPress", icon: <Code className="h-8 w-8" /> },
              { name: "iOS", icon: <Smartphone className="h-8 w-8" /> },
              { name: "Make", icon: <Layers className="h-8 w-8" /> },
              { name: "Android", icon: <Smartphone className="h-8 w-8" /> },
              { name: "Segment", icon: <Activity className="h-8 w-8" /> }
            ].map((integration, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                viewport={{ once: true }}
                className={cn("aspect-square rounded-xl border hover:shadow-lg hover:scale-105 transition-all duration-300 flex flex-col items-center justify-center p-4 gap-2", darkMode ? "bg-slate-800 border-slate-700 hover:border-blue-600" : "bg-white border-slate-200 hover:border-blue-300")}
              >
                <div className={cn("transition-colors", darkMode ? "text-slate-400" : "text-slate-600")}>
                  {integration.icon}
                </div>
                <span className={cn("text-xs font-medium text-center transition-colors", darkMode ? "text-slate-300" : "text-slate-700")}>{integration.name}</span>
              </motion.div>
            ))}
          </div>
          
          <div className="text-center mt-10">
            <button className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 mx-auto">
              View all integrations <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Built for Every Team */}
      <section className={cn("py-20 md:py-32 transition-colors", darkMode ? "bg-slate-900" : "bg-white")}>
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className={cn("text-3xl md:text-4xl font-bold tracking-tight mb-4 transition-colors", darkMode ? "text-white" : "text-slate-900")}>
              Built for every team
            </h2>
            <p className={cn("text-lg transition-colors", darkMode ? "text-slate-300" : "text-slate-600")}>
              See how different teams use {t('common.brandName')} to achieve their goals
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {[
              {
                title: "Marketing teams",
                description: "Track campaign performance and optimize conversions",
                features: ["Campaign tracking", "A/B testing", "ROI measurement", "Conversion optimization"]
              },
              {
                title: "Sales teams",
                description: "Personalize outreach and track engagement",
                features: ["Personalized links", "Engagement tracking", "Lead scoring", "CRM integration"]
              },
              {
                title: "Infrastructure teams",
                description: "Enterprise-grade features for large-scale deployment",
                features: ["SSO authentication", "API access", "System integration", "Unlimited plans"]
              }
            ].map((team, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true }}
                className={cn("rounded-xl border p-8 hover:shadow-xl transition-all", darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200")}
              >
                <h3 className={cn("text-2xl font-bold mb-3 transition-colors", darkMode ? "text-white" : "text-slate-900")}>{team.title}</h3>
                <p className={cn("mb-6 transition-colors", darkMode ? "text-slate-300" : "text-slate-600")}>{team.description}</p>
                <ul className="space-y-3">
                  {team.features.map((feature, fidx) => (
                    <li key={fidx} className={cn("flex items-center gap-2 transition-colors", darkMode ? "text-slate-300" : "text-slate-700")}>
                      <Check className="h-5 w-5 text-green-600 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted at Scale */}
      <section className={cn("py-20 md:py-32 transition-colors", darkMode ? "bg-slate-800" : "bg-slate-50")}>
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-12 max-w-3xl mx-auto">
            <h2 className={cn("text-3xl md:text-4xl font-bold tracking-tight mb-4 transition-colors", darkMode ? "text-white" : "text-slate-900")}>
              Trusted at scale
            </h2>
            <p className={cn("text-lg transition-colors", darkMode ? "text-slate-300" : "text-slate-600")}>
              Marketing teams, developers, and businesses worldwide rely on {t('common.brandName')} to track what matters
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
            {[
              { value: "50,000+", label: "Links created" },
              { value: "2.5M+", label: "Clicks tracked" },
              { value: "10,000+", label: "Active users" },
              { value: "3+", label: "Years on the market" }
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className={cn("text-4xl md:text-5xl font-bold mb-2 transition-colors", darkMode ? "text-blue-400" : "text-blue-600")}>{stat.value}</div>
                <div className={cn("text-sm md:text-base transition-colors", darkMode ? "text-slate-300" : "text-slate-600")}>{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="pricing" className={cn("py-20 md:py-32 transition-colors", darkMode ? "bg-slate-900" : "bg-white")}>
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-12 max-w-3xl mx-auto">
            <h2 className={cn("text-3xl md:text-4xl font-bold tracking-tight mb-4 transition-colors", darkMode ? "text-white" : "text-slate-900")}>
              Frequently asked questions
            </h2>
            <p className={cn("text-lg transition-colors", darkMode ? "text-slate-300" : "text-slate-600")}>
              Can't find what you're looking for?
            </p>
          </div>

          <div className="space-y-4 max-w-3xl mx-auto">
            {[
              {
                question: "How do I get started with " + t('common.brandName') + "?",
                answer: "Getting started is easy! Simply sign up for a free account, and you can start shortening links immediately. No credit card required for the free plan."
              },
              {
                question: "Can I use my own domain?",
                answer: "Yes! You can connect your own custom domain to create branded short links. This helps build trust and recognition with your audience."
              },
              {
                question: "What analytics are available?",
                answer: "We provide comprehensive analytics including click tracking, geographic data, device types, referrers, and conversion tracking. All data is available in real-time."
              },
              {
                question: "Is there an API available?",
                answer: "Yes, we offer a powerful REST API that allows you to integrate " + t('common.brandName') + " into your applications. You can create, manage, and track links programmatically."
              },
              {
                question: "How secure are my links?",
                answer: "We take security seriously. All links are served over HTTPS, and we offer password protection, expiration dates, and advanced security features for your links."
              },
              {
                question: "What's included in the free plan?",
                answer: "The free plan includes 1,000 branded links, basic analytics, QR codes, and API access. Perfect for individuals and small projects."
              }
            ].map((faq, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true }}
                className={cn("rounded-xl border p-6 hover:shadow-lg transition-all", darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200")}
              >
                <h3 className={cn("text-lg font-bold mb-3 transition-colors", darkMode ? "text-white" : "text-slate-900")}>{faq.question}</h3>
                <p className={cn("leading-relaxed transition-colors", darkMode ? "text-slate-300" : "text-slate-600")}>{faq.answer}</p>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className={cn("mb-4 transition-colors", darkMode ? "text-slate-300" : "text-slate-600")}>Still have questions?</p>
            <Button variant="outline" onClick={() => navigate("/contact")} className={darkMode ? "border-slate-600 text-slate-300 hover:bg-slate-800" : ""}>
              Contact Support
            </Button>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className={cn("py-20 md:py-32 text-white transition-colors", darkMode ? "bg-gradient-to-br from-blue-700 to-purple-700" : "bg-gradient-to-br from-blue-600 to-purple-600")}>
        <div className="container mx-auto px-6 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Ready to get started?
            </h2>
            <p className="text-lg md:text-xl text-blue-100 mb-10">
              Join over 1.2 million users shortening links with {t('common.brandName')}
            </p>
            <Button 
              size="lg" 
              className="h-14 px-10 text-lg bg-white text-blue-600 hover:bg-slate-100 font-semibold"
              onClick={() => navigate("/register")}
            >
              Get started for free
            </Button>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-blue-100">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5" />
                <span>Free plan forever</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5" />
                <span>Upgrade anytime</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5" />
                <span>Fast support response</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className={cn("text-slate-300 py-12 md:py-16 transition-colors", darkMode ? "bg-slate-950" : "bg-slate-900")}>
        <div className="container mx-auto px-6 max-w-4xl">
           <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12 max-w-3xl mx-auto">
              <div className="col-span-2 md:col-span-1">
                 <div className="flex items-center gap-2 mb-6">
                   <img src={logo} alt="Logo" className="h-8 w-auto brightness-0 invert" />
                   <span className="text-xl font-bold text-white">{t('common.brandName')}</span>
                 </div>
                 <p className="text-sm leading-relaxed opacity-70 mb-6">
                   Professional URL shortening with advanced analytics and custom domains.
                 </p>
              </div>
              
              <div>
                 <h4 className="text-white font-bold mb-4 text-sm">Product</h4>
                 <ul className="space-y-2 text-sm">
                    <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                    <li><a href="#integrations" className="hover:text-white transition-colors">Integrations</a></li>
                    <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                    <li><a href="/api-docs" className="hover:text-white transition-colors">API</a></li>
                 </ul>
              </div>

              <div>
                 <h4 className="text-white font-bold mb-4 text-sm">Company</h4>
                 <ul className="space-y-2 text-sm">
                    <li><a href="#about" className="hover:text-white transition-colors">About</a></li>
                    <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
                    <li><a href="/blog" className="hover:text-white transition-colors">Blog</a></li>
                 </ul>
              </div>

              <div>
                 <h4 className="text-white font-bold mb-4 text-sm">Legal</h4>
                 <ul className="space-y-2 text-sm">
                    <li><a href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</a></li>
                    <li><a href="/terms-and-conditions" className="hover:text-white transition-colors">Terms of Service</a></li>
                 </ul>
              </div>
           </div>
           
           <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center text-sm opacity-60 max-w-3xl mx-auto">
              <p>&copy; {new Date().getFullYear()} {t('common.brandName')}. All rights reserved.</p>
              <div className="mt-4 md:mt-0 flex gap-6">
                 <Button 
                   variant="ghost" 
                   size="sm" 
                   onClick={() => changeLanguage(currentLanguage === 'en' ? 'ar' : 'en')}
                   className="text-slate-400 hover:text-white h-auto p-0"
                 >
                   <Globe className="mr-2 h-4 w-4" />
                   {currentLanguage === 'en' ? 'العربية' : 'English'}
                 </Button>
              </div>
           </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
