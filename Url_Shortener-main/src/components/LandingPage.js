import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { motion } from "framer-motion";
import Header from "./Header";
import logo from '../assets/logo.png';
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { 
  ArrowRight, Check, CheckCircle2, Shield, Zap, BarChart3, Globe2, Link as LinkIcon 
} from "lucide-react";
import { cn } from "../lib/utils";

const LandingPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleShortenUrl = () => {
    navigate("/register");
  };

  const features = [
    {
      icon: <LinkIcon className="h-6 w-6 text-blue-600" />,
      title: t('landing.features.urlShortening.title'),
      description: t('landing.features.urlShortening.description'),
      color: "bg-blue-100"
    },
    {
      icon: <Globe2 className="h-6 w-6 text-green-600" />,
      title: t('landing.features.customDomain.title'),
      description: t('landing.features.customDomain.description'),
      color: "bg-green-100"
    },
    {
      icon: <BarChart3 className="h-6 w-6 text-purple-600" />,
      title: t('landing.features.analytics.title'),
      description: t('landing.features.analytics.description'),
      color: "bg-purple-100"
    },
    {
      icon: <Shield className="h-6 w-6 text-indigo-600" />,
      title: t('landing.features.security.title'),
      description: t('landing.features.security.description'),
      color: "bg-indigo-100"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Header isLanding={true} />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -ml-[50%] w-[200%] h-[30%] bg-gradient-to-b from-blue-50 to-transparent pointer-events-none" />
        
        <div className="container mx-auto px-4 max-w-7xl relative z-10 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
              {t('landing.hero.titleMain')} <span className="text-primary">{t('landing.hero.titleAccent')}</span>
            </h1>
            <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              {t('landing.hero.description')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button size="lg" className="h-12 px-8 text-lg" onClick={() => navigate("/register")}>
                {t('landing.hero.cta')} <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              {/* <Button variant="outline" size="lg" className="h-12 px-8 text-lg">
                View Demo
              </Button> */}
            </div>

            {/* Quick Shortener Demo */}
            <div className="max-w-2xl mx-auto bg-white p-2 rounded-xl shadow-xl border border-slate-200 flex flex-col sm:flex-row gap-2">
               <Input 
                 placeholder={t('landing.hero.urlPlaceholder') || "Paste a long link to shorten it"} 
                 className="h-12 text-base border-transparent shadow-none focus-visible:ring-0 bg-transparent"
               />
               <Button size="lg" className="h-12 px-8 shrink-0" onClick={handleShortenUrl}>
                 {t('landing.hero.shortenBtn')}
               </Button>
            </div>
            <p className="text-xs text-slate-500 mt-4">{t('landing.hero.complianceNotice')}</p>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white relative">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">{t('landing.features.title')}</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">{t('landing.features.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-lg transition-all duration-300"
              >
                <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center mb-6", feature.color)}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section id="about" className="py-24 bg-slate-50">
        <div className="container mx-auto px-4 max-w-7xl">
           <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                 <h2 className="text-3xl font-bold tracking-tight mb-6">{t('landing.whyChoose.title')}</h2>
                 <p className="text-lg text-slate-600 mb-8">{t('landing.whyChoose.subtitle')}</p>
                 
                 <div className="space-y-6">
                    <div className="flex gap-4">
                       <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                          <Zap className="h-5 w-5 text-blue-600" />
                       </div>
                       <div>
                          <h3 className="text-xl font-bold mb-2">{t('landing.benefits.launchFaster.title')}</h3>
                          <p className="text-slate-600">{t('landing.benefits.launchFaster.description')}</p>
                       </div>
                    </div>
                    <div className="flex gap-4">
                       <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                          <Shield className="h-5 w-5 text-green-600" />
                       </div>
                       <div>
                          <h3 className="text-xl font-bold mb-2">{t('landing.benefits.trustCompliance.title')}</h3>
                          <p className="text-slate-600">{t('landing.benefits.trustCompliance.description')}</p>
                       </div>
                    </div>
                 </div>
              </div>
              <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
                 <h3 className="text-xl font-bold mb-6">{t('landing.saudiMarketers.title')}</h3>
                 <ul className="space-y-4">
                    {[
                      t('landing.saudiMarketers.feature1'),
                      t('landing.saudiMarketers.feature2'),
                      t('landing.saudiMarketers.feature3'),
                      t('landing.saudiMarketers.feature4')
                    ].map((item, idx) => (
                       <li key={idx} className="flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <span className="text-slate-700">{item}</span>
                       </li>
                    ))}
                 </ul>
                 <div className="mt-8 pt-8 border-t border-slate-100 grid grid-cols-3 gap-4 text-center">
                    <div>
                       <div className="text-2xl font-bold text-primary">{t('landing.stats.linksCreatedValue')}</div>
                       <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">{t('landing.stats.linksCreated')}</div>
                    </div>
                    <div>
                       <div className="text-2xl font-bold text-primary">{t('landing.stats.uptimeValue')}</div>
                       <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">{t('landing.stats.uptime')}</div>
                    </div>
                    <div>
                       <div className="text-2xl font-bold text-primary">{t('landing.stats.clicksTrackedValue')}</div>
                       <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">{t('landing.stats.clicksTracked')}</div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-slate-900 text-slate-300 py-16">
        <div className="container mx-auto px-4 max-w-7xl">
           <div className="grid md:grid-cols-4 gap-8 mb-12">
              <div className="col-span-1 md:col-span-1">
                 <img src={logo} alt="Logo" className="h-8 w-auto mb-6 brightness-0 invert opacity-80" />
                 <p className="text-sm leading-relaxed opacity-70 mb-6">
                   {t('footer.description')}
                 </p>
                 <div className="flex gap-4">
                    {/* Socials */}
                 </div>
              </div>
              
              <div>
                 <h4 className="text-white font-bold mb-4">{t('footer.product')}</h4>
                 <ul className="space-y-2 text-sm">
                    <li><a href="#" className="hover:text-white transition-colors">{t('footer.features')}</a></li>
                    <li><a href="/api-docs" className="hover:text-white transition-colors">{t('footer.api')}</a></li>
                 </ul>
              </div>

              <div>
                 <h4 className="text-white font-bold mb-4">{t('footer.company')}</h4>
                 <ul className="space-y-2 text-sm">
                    <li><a href="#" className="hover:text-white transition-colors">{t('footer.about')}</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">{t('footer.contact')}</a></li>
                 </ul>
              </div>

              <div>
                 <h4 className="text-white font-bold mb-4">{t('footer.legal')}</h4>
                 <ul className="space-y-2 text-sm">
                    <li><a href="/privacy-policy" className="hover:text-white transition-colors">{t('footer.privacy')}</a></li>
                    <li><a href="/terms-and-conditions" className="hover:text-white transition-colors">{t('footer.terms')}</a></li>
                 </ul>
              </div>
           </div>
           
           <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center text-sm opacity-60">
              <p>{t('footer.copyright')}</p>
              <div className="mt-4 md:mt-0">
                 {/* Additional links */}
              </div>
           </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
