import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../contexts/LanguageContext";
import logo from '../assets/logo.png';
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import LanguageSelector from "./LanguageSelector";
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
        <span>{t('landing.banner.text')}</span>
      </div>

      {/* Navigation Header */}
      <nav className={cn("sticky top-0 z-[100] border-b transition-colors overflow-visible", darkMode ? "bg-slate-900/95 backdrop-blur-lg border-slate-800" : "bg-white/95 backdrop-blur-lg border-slate-200")}>
        <div className="container mx-auto px-6 max-w-4xl overflow-visible">
          <div className="flex items-center justify-between h-20 overflow-visible">
            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
              <img src={logo} alt="Logo" className={cn("h-9 w-auto transition-all", darkMode && "brightness-0 invert")} />
              <span className={cn("text-xl font-bold transition-colors", darkMode ? "text-white" : "text-slate-900")}>{t('common.brandName')}</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8 relative">
              <a href="#features" className={cn("text-sm font-medium transition-colors", darkMode ? "text-slate-300 hover:text-white" : "text-slate-700 hover:text-slate-900")}>
                {t('header.features')}
              </a>
              <a href="#integrations" className={cn("text-sm font-medium transition-colors", darkMode ? "text-slate-300 hover:text-white" : "text-slate-700 hover:text-slate-900")}>
                {t('landing.navigation.integrations') || 'Integrations'}
              </a>
              <a href="#pricing" className={cn("text-sm font-medium transition-colors", darkMode ? "text-slate-300 hover:text-white" : "text-slate-700 hover:text-slate-900")}>
                {t('header.pricing')}
              </a>
              <div className="relative">
                <LanguageSelector className="scale-90" />
              </div>
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
                  {t('landing.navigation.integrations') || 'Integrations'}
                </a>
                <a href="#pricing" className={cn("block py-2 text-sm font-medium", darkMode ? "text-slate-300" : "text-slate-700")}>
                  {t('header.pricing')}
                </a>
                <div className="py-2">
                  <LanguageSelector />
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={toggleDarkMode}
                  className="w-full justify-start"
                >
                  {darkMode ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                  {darkMode ? t('header.theme.light') : t('header.theme.dark')}
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
              {t('landing.hero.mainHeading')}
            </h1>
            
            <p className={cn("text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed transition-colors", darkMode ? "text-slate-300" : "text-slate-600")}>
              {t('landing.hero.longDescription')}
            </p>
            
            {/* CTA Button */}
            <div className="flex justify-center mb-12">
              <Button 
                size="lg" 
                className="h-14 px-10 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => navigate("/register")}
              >
                {t('landing.hero.createFreeAccount')}
              </Button>
            </div>

            {/* Trust Badge */}
            <div className={cn("flex items-center justify-center gap-2 text-sm mb-12 transition-colors", darkMode ? "text-slate-400" : "text-slate-600")}>
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="ml-2 font-medium">{t('landing.trust.trustpilot')}</span>
            </div>

            {/* URL Shortener Demo */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-2xl mx-auto"
            >
              <div className={cn("rounded-2xl shadow-2xl border p-6 md:p-8 transition-colors", darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200")}>
                <h3 className={cn("text-lg font-semibold mb-5 text-left transition-colors", darkMode ? "text-white" : "text-slate-900")}>{t('landing.hero.formTitle')}</h3>
                <div className="flex flex-col sm:flex-row gap-3 mb-5">
                  <Input 
                    placeholder={t('landing.hero.urlPlaceholder')}
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className={cn("h-12 text-base flex-1 transition-colors", darkMode ? "bg-slate-700 border-slate-600 text-white placeholder:text-slate-400" : "")}
                  />
                  <Button 
                    size="lg" 
                    className="h-12 px-8 shrink-0 bg-blue-600 hover:bg-blue-700 text-white font-semibold" 
                    onClick={handleShortenUrl}
                  >
                    {t('landing.hero.shortenButton')}
                  </Button>
                </div>
                <div className={cn("rounded-lg p-4 border transition-colors", darkMode ? "bg-slate-700 border-slate-600" : "bg-slate-50 border-slate-200")}>
                  <p className={cn("text-sm mb-2 transition-colors", darkMode ? "text-slate-400" : "text-slate-600")}>{t('landing.hero.yourShortLink')}</p>
                  <div className="flex items-center justify-between gap-4">
                    <code className="text-blue-600 font-mono text-sm break-all">https://abc1234.short.gy/my-link</code>
                    <Button variant="ghost" size="sm" className="text-blue-600 shrink-0">
                      {t('myLinks.actions.copy')}
                    </Button>
                  </div>
                </div>
                <p className={cn("text-sm mt-5 text-center transition-colors", darkMode ? "text-slate-400" : "text-slate-500")}>
                  {t('landing.hero.wantOwnDomain')} <button onClick={() => navigate("/register")} className="text-blue-600 hover:underline font-medium">{t('landing.hero.createFreeAccount')}</button>
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
              { icon: <Sparkles className="h-5 w-5" />, textKey: 'landing.features.pills.freePlan', subtextKey: 'landing.features.pills.freePlan' },
              { icon: <Globe2 className="h-5 w-5" />, textKey: 'landing.features.pills.customDomain', subtextKey: 'landing.features.pills.customDomain' },
              { icon: <Shield className="h-5 w-5" />, textKey: 'landing.features.pills.noCard', subtextKey: 'landing.features.pills.noCard' },
              { icon: <BarChart3 className="h-5 w-5" />, textKey: 'landing.features.pills.richAnalytics', subtextKey: 'landing.features.pills.richAnalytics' }
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
                <h4 className={cn("font-semibold text-sm mb-1 transition-colors", darkMode ? "text-white" : "text-slate-900")}>{t(feature.textKey)}</h4>
                <p className={cn("text-xs transition-colors", darkMode ? "text-slate-400" : "text-slate-600")}>{t(feature.subtextKey)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof with More Spacing */}
      <section className={cn("py-12 md:py-14 transition-colors", darkMode ? "bg-slate-800" : "bg-slate-50")}>
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center max-w-3xl mx-auto">
            <p className={cn("text-sm mb-6 transition-colors", darkMode ? "text-slate-400" : "text-slate-600")}>{t('landing.trust.socialProof')}</p>
            <div className="flex flex-wrap items-center justify-center gap-8 opacity-50">
              {/* Placeholder for company logos */}
              <div className={cn("text-sm font-semibold transition-colors", darkMode ? "text-slate-500" : "text-slate-400")}>{t('landing.trust.clientConfidentiality')}</div>
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
                {t('landing.features.sectionTitle')}
              </h2>
              <p className={cn("text-lg md:text-xl transition-colors", darkMode ? "text-slate-300" : "text-slate-600")}>
                {t('landing.features.sectionDescription')}
              </p>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-3xl mx-auto">
            {[
              {
                icon: <BarChart3 className="h-6 w-6" />,
                titleKey: 'landing.features.analytics.titleAlt',
                descKey: 'landing.features.analytics.descriptionAlt'
              },
              {
                icon: <Globe2 className="h-6 w-6" />,
                titleKey: 'landing.features.customDomain.titleAlt',
                descKey: 'landing.features.customDomain.descriptionAlt'
              },
              {
                icon: <Users className="h-6 w-6" />,
                titleKey: 'landing.features.teamCollaboration.title',
                descKey: 'landing.features.teamCollaboration.description'
              },
              {
                icon: <QrCode className="h-6 w-6" />,
                titleKey: 'landing.features.qrCode.title',
                descKey: 'landing.features.qrCode.descriptionAlt'
              },
              {
                icon: <Code className="h-6 w-6" />,
                titleKey: 'landing.features.apiAccess.title',
                descKey: 'landing.features.apiAccess.description'
              },
              {
                icon: <Layers className="h-6 w-6" />,
                titleKey: 'landing.features.linkManagement.title',
                descKey: 'landing.features.linkManagement.description'
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
                  <h3 className={cn("text-xl font-bold mb-3 transition-colors", darkMode ? "text-white" : "text-slate-900")}>{t(feature.titleKey)}</h3>
                  <p className={cn("leading-relaxed mb-4 transition-colors", darkMode ? "text-slate-300" : "text-slate-600")}>
                    {t(feature.descKey)}
                  </p>
                  <button className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                    {t('landing.features.learnMore')} <ChevronRight className="h-4 w-4" />
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
              {t('landing.integrations.title')}
            </h2>
            <p className={cn("text-lg transition-colors", darkMode ? "text-slate-300" : "text-slate-600")}>
              {t('landing.integrations.subtitle')}
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
              {t('landing.integrations.viewAll')} <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Built for Every Team */}
      <section className={cn("py-20 md:py-32 transition-colors", darkMode ? "bg-slate-900" : "bg-white")}>
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className={cn("text-3xl md:text-4xl font-bold tracking-tight mb-4 transition-colors", darkMode ? "text-white" : "text-slate-900")}>
              {t('landing.teams.title')}
            </h2>
            <p className={cn("text-lg transition-colors", darkMode ? "text-slate-300" : "text-slate-600")}>
              {t('landing.teams.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {[
              {
                titleKey: "landing.teams.marketing.title",
                descriptionKey: "landing.teams.marketing.description",
                features: ["landing.teams.marketing.feature1", "landing.teams.marketing.feature2", "landing.teams.marketing.feature3", "landing.teams.marketing.feature4"]
              },
              {
                titleKey: "landing.teams.sales.title",
                descriptionKey: "landing.teams.sales.description",
                features: ["landing.teams.sales.feature1", "landing.teams.sales.feature2", "landing.teams.sales.feature3", "landing.teams.sales.feature4"]
              },
              {
                titleKey: "landing.teams.infrastructure.title",
                descriptionKey: "landing.teams.infrastructure.description",
                features: ["landing.teams.infrastructure.feature1", "landing.teams.infrastructure.feature2", "landing.teams.infrastructure.feature3", "landing.teams.infrastructure.feature4"]
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
                <h3 className={cn("text-2xl font-bold mb-3 transition-colors", darkMode ? "text-white" : "text-slate-900")}>{t(team.titleKey)}</h3>
                <p className={cn("mb-6 transition-colors", darkMode ? "text-slate-300" : "text-slate-600")}>{t(team.descriptionKey)}</p>
                <ul className="space-y-3">
                  {team.features.map((featureKey, fidx) => (
                    <li key={fidx} className={cn("flex items-center gap-2 transition-colors", darkMode ? "text-slate-300" : "text-slate-700")}>
                      <Check className="h-5 w-5 text-green-600 shrink-0" />
                      <span>{t(featureKey)}</span>
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
              {t('landing.trust.title')}
            </h2>
            <p className={cn("text-lg transition-colors", darkMode ? "text-slate-300" : "text-slate-600")}>
              {t('landing.trust.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
            {[
              { valueKey: "landing.stats.linksCreatedValue", labelKey: "landing.stats.linksCreatedAlt" },
              { valueKey: "landing.stats.clicksTrackedValue", labelKey: "landing.stats.clicksTracked" },
              { valueKey: "landing.stats.activeUsersValue", labelKey: "landing.stats.activeUsers" },
              { valueKey: "landing.stats.yearsOnMarketValue", labelKey: "landing.stats.yearsOnMarket" }
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className={cn("text-4xl md:text-5xl font-bold mb-2 transition-colors", darkMode ? "text-blue-400" : "text-blue-600")}>{t(stat.valueKey)}</div>
                <div className={cn("text-sm md:text-base transition-colors", darkMode ? "text-slate-300" : "text-slate-600")}>{t(stat.labelKey)}</div>
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
              {t('landing.faq.title')}
            </h2>
            <p className={cn("text-lg transition-colors", darkMode ? "text-slate-300" : "text-slate-600")}>
              {t('landing.faq.subtitle')}
            </p>
          </div>

          <div className="space-y-4 max-w-3xl mx-auto">
            {[
              { questionKey: 'landing.faq.q1.question', answerKey: 'landing.faq.q1.answer' },
              { questionKey: 'landing.faq.q2.question', answerKey: 'landing.faq.q2.answer' },
              { questionKey: 'landing.faq.q3.question', answerKey: 'landing.faq.q3.answer' },
              { questionKey: 'landing.faq.q4.question', answerKey: 'landing.faq.q4.answer' },
              { questionKey: 'landing.faq.q5.question', answerKey: 'landing.faq.q5.answer' },
              { questionKey: 'landing.faq.q6.question', answerKey: 'landing.faq.q6.answer' }
            ].map((faq, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true }}
                className={cn("rounded-xl border p-6 hover:shadow-lg transition-all", darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200")}
              >
                <h3 className={cn("text-lg font-bold mb-3 transition-colors", darkMode ? "text-white" : "text-slate-900")}>{t(faq.questionKey)}</h3>
                <p className={cn("leading-relaxed transition-colors", darkMode ? "text-slate-300" : "text-slate-600")}>{t(faq.answerKey)}</p>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className={cn("mb-4 transition-colors", darkMode ? "text-slate-300" : "text-slate-600")}>{t('faqs.stillHaveQuestions')}</p>
            <Button variant="outline" onClick={() => navigate("/contact")} className={darkMode ? "border-slate-600 text-slate-300 hover:bg-slate-800" : ""}>
              {t('faqs.contactSupport')}
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
              {t('landing.cta.readyToStart')}
            </h2>
            <p className="text-lg md:text-xl text-blue-100 mb-10">
              {t('landing.cta.joinUsers')}
            </p>
            <Button 
              size="lg" 
              className="h-14 px-10 text-lg bg-white text-blue-600 hover:bg-slate-100 font-semibold"
              onClick={() => navigate("/register")}
            >
              {t('landing.cta.getStartedFree')}
            </Button>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-blue-100">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5" />
                <span>{t('landing.cta.noCardRequired')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5" />
                <span>{t('landing.cta.freePlanForever')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5" />
                <span>{t('landing.cta.upgradeAnytime')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5" />
                <span>{t('landing.cta.fastSupport')}</span>
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
                   {t('footer.description')}
                 </p>
              </div>
              
              <div>
                 <h4 className="text-white font-bold mb-4 text-sm">{t('footer.product')}</h4>
                 <ul className="space-y-2 text-sm">
                    <li><a href="#features" className="hover:text-white transition-colors">{t('footer.features')}</a></li>
                    <li><a href="#integrations" className="hover:text-white transition-colors">{t('footer.integrations')}</a></li>
                    <li><a href="#pricing" className="hover:text-white transition-colors">{t('footer.pricing')}</a></li>
                    <li><a href="/api-docs" className="hover:text-white transition-colors">{t('footer.api')}</a></li>
                 </ul>
              </div>

              <div>
                 <h4 className="text-white font-bold mb-4 text-sm">{t('footer.company')}</h4>
                 <ul className="space-y-2 text-sm">
                    <li><a href="#about" className="hover:text-white transition-colors">{t('footer.about')}</a></li>
                    <li><a href="#contact" className="hover:text-white transition-colors">{t('footer.contact')}</a></li>
                    <li><a href="/blog" className="hover:text-white transition-colors">{t('footer.blog')}</a></li>
                 </ul>
              </div>

              <div>
                 <h4 className="text-white font-bold mb-4 text-sm">{t('footer.legal')}</h4>
                 <ul className="space-y-2 text-sm">
                    <li><a href="/privacy-policy" className="hover:text-white transition-colors">{t('footer.privacy')}</a></li>
                    <li><a href="/terms-and-conditions" className="hover:text-white transition-colors">{t('footer.terms')}</a></li>
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
