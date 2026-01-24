import React from "react";
import { useTranslation } from 'react-i18next';
import { CheckCircle2, AlertTriangle, CreditCard, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

const SubscriptionPage = () => {
  const { t } = useTranslation();

  const plans = [
    {
       name: t('subscription.starterPlan'),
       price: '$9',
       period: t('subscription.perMonth'),
       features: [t('subscription.feature5kLinks'), t('subscription.featureBasicAnalytics'), t('subscription.featureQrCodes')],
       buttonText: t('subscription.downgradeButton'),
       buttonVariant: 'outline',
       current: false
    },
    {
       name: t('subscription.professionalPlan'),
       price: '$29',
       period: t('subscription.perMonth'),
       features: [t('subscription.feature50kLinks'), t('subscription.featureAdvancedAnalytics'), t('subscription.featureCustomDomains10')],
       buttonText: t('subscription.currentPlanButton'),
       buttonVariant: 'secondary',
       current: true,
       badge: t('subscription.currentBadge')
    },
    {
       name: t('subscription.enterprisePlan'),
       price: '$99',
       period: t('subscription.perMonth'),
       features: [t('subscription.featureUnlimitedLinks'), t('subscription.featureAdvancedAnalytics'), t('subscription.featureUnlimitedDomains')],
       buttonText: t('subscription.upgradeButton'),
       buttonVariant: 'default',
       current: false
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">{t('subscription.pageTitle')}</h1>
        <p className="text-muted-foreground">{t('subscription.pageSubtitle')}</p>
      </div>

      {/* Current Plan Overview */}
      <Card className="border-blue-200 bg-blue-50/50">
         <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between gap-6">
               <div className="space-y-4">
                  <div className="flex items-center gap-3">
                     <h2 className="text-2xl font-bold text-blue-900">{t('subscription.professionalPlan')}</h2>
                     <Badge className="bg-green-500 hover:bg-green-600">{t('subscription.activeStatus')}</Badge>
                  </div>
                  <p className="text-blue-700 max-w-xl">{t('subscription.professionalFeaturesSummary')}</p>
                  <div className="flex gap-8 text-sm text-blue-800">
                     <div>
                        <span className="block font-bold text-lg">12,450</span>
                        <span className="opacity-80">{t('subscription.linksCreated')}</span>
                     </div>
                     <div>
                        <span className="block font-bold text-lg">3 / 10</span>
                        <span className="opacity-80">{t('subscription.customDomains')}</span>
                     </div>
                  </div>
               </div>
               <div className="text-right">
                  <div className="text-3xl font-bold text-blue-900">$29<span className="text-lg font-normal text-blue-700">/mo</span></div>
                  <p className="text-sm text-blue-600 mt-1">{t('subscription.nextBilling')} <b>Dec 15, 2024</b></p>
               </div>
            </div>
         </CardContent>
      </Card>

      {/* Plans Grid */}
      <section>
         <h3 className="text-lg font-semibold mb-4">{t('subscription.availablePlans')}</h3>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
               <Card key={i} className={plan.current ? "border-blue-500 shadow-md ring-1 ring-blue-500" : ""}>
                  <CardHeader>
                     {plan.badge && <Badge className="w-fit mb-2">{plan.badge}</Badge>}
                     <CardTitle>{plan.name}</CardTitle>
                     <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-3xl font-bold">{plan.price}</span>
                        <span className="text-muted-foreground text-sm">{plan.period}</span>
                     </div>
                  </CardHeader>
                  <CardContent>
                     <ul className="space-y-3 mb-6">
                        {plan.features.map((f, j) => (
                           <li key={j} className="flex gap-2 text-sm">
                              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                              {f}
                           </li>
                        ))}
                     </ul>
                     <Button className="w-full" variant={plan.buttonVariant} disabled={plan.current}>
                        {plan.buttonText}
                     </Button>
                  </CardContent>
               </Card>
            ))}
         </div>
      </section>

      {/* Billing Info & Cancel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <Card>
            <CardHeader>
               <CardTitle>{t('subscription.billingInformation')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="flex justify-between items-start">
                  <div className="space-y-1">
                     <p className="font-medium text-sm text-muted-foreground">{t('subscription.paymentMethod')}</p>
                     <div className="flex items-center gap-2">
                        <span className="bg-blue-900 text-white text-xs font-bold px-1.5 py-0.5 rounded">VISA</span>
                        <span>•••• 4242</span>
                     </div>
                     <p className="text-xs text-muted-foreground">{t('subscription.expires')} 12/26</p>
                  </div>
                  <Button variant="link" size="sm">{t('subscription.updatePaymentMethod')}</Button>
               </div>
               <div className="flex justify-between items-start pt-4 border-t">
                   <div className="space-y-1">
                     <p className="font-medium text-sm text-muted-foreground">{t('subscription.billingAddress')}</p>
                     <p className="text-sm">John Doe<br/>123 Main St<br/>New York, NY 10001</p>
                   </div>
                   <Button variant="link" size="sm">{t('subscription.updateBillingAddress')}</Button>
               </div>
            </CardContent>
         </Card>

         <Card>
            <CardHeader>
               <CardTitle className="text-red-600">{t('subscription.cancelSubscriptionTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
               <p className="text-sm text-muted-foreground mb-4">{t('subscription.cancelSubscriptionDesc')}</p>
               <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4 flex gap-3 text-sm text-amber-800">
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                  <div>
                     <p className="font-bold mb-1">{t('subscription.whatYouWillLose')}</p>
                     <ul className="list-disc pl-4 space-y-0.5">
                        <li>{t('subscription.loseAdvancedAnalytics')}</li>
                        <li>{t('subscription.loseCustomDomains')}</li>
                     </ul>
                  </div>
               </div>
               <div className="flex gap-2 justify-end">
                  <Button variant="outline">{t('subscription.pauseFor3Months')}</Button>
                  <Button variant="destructive">{t('subscription.cancelSubscriptionButton')}</Button>
               </div>
            </CardContent>
         </Card>
      </div>
    </div>
  );
};

export default SubscriptionPage;
