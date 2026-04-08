import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";

const features = [
  "Unlimited links",
  "Advanced analytics",
  "QR code generation",
  "API access",
  "Custom domains",
  "Team members",
  "Forever data retention",
  "Hosted in Saudi Arabia",
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
            Completely free.
            <br />
            No catch.
          </h2>
          <p className="text-muted-foreground font-body text-lg">
            Everything you need to shorten, track, and manage your links, forever free.
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <div className="rounded-xl p-8 bg-card border border-border">
            <div className="text-center mb-6">
              <span className="font-display text-4xl font-bold text-foreground">Free</span>
              <p className="text-muted-foreground font-body text-sm mt-1">Forever. No credit card required.</p>
            </div>

            <ul className="space-y-3 mb-8">
              {features.map((f, i) => (
                <li key={i} className="flex items-center gap-2.5">
                  <Check size={14} className="text-primary shrink-0" />
                  <span className="font-body text-sm text-foreground">{f}</span>
                </li>
              ))}
            </ul>

            <Button className="w-full bg-primary text-primary-foreground font-body font-medium">
              Get Started Free
              <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
