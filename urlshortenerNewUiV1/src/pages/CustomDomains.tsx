import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Globe, Trash2, Plus, CheckCircle, Clock, Eye, Copy, Check, ShieldCheck, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDomains, useDeleteDomain, useVerifyDomain } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";
import amplitudeService from "@/services/amplitude";

type DomainStatus = "verified" | "pending";

interface DomainEntry {
  _id: string;
  domain: string;
  status: DomainStatus;
  verificationStatus: 'pending' | 'verified' | 'failed';
  createdAt: string;
  isDefault?: boolean;
  cnameTarget?: string;
  verificationRecord?: { type: string; name: string; value: string; verified: boolean };
  setupInstructions?: { type: string; name: string; value: string; description: string };
}

const CustomDomains = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dnsDialog, setDnsDialog] = useState<DomainEntry | null>(null);
  const [showVerified, setShowVerified] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string; domain: string }>({
    open: false, id: "", domain: "",
  });

  const { data: domainsData, isLoading, isError } = useDomains();
  const deleteDomain = useDeleteDomain();
  const verifyDomain = useVerifyDomain();

  const domains: DomainEntry[] = domainsData?.data?.domains || [];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDelete = async () => {
    try {
      await deleteDomain.mutateAsync(deleteDialog.id);
      try {
        amplitudeService.trackCustomDomainDeleted(deleteDialog.domain);
      } catch (trackError) {
        console.error('Analytics error:', trackError);
      }
      setDeleteDialog({ open: false, id: "", domain: "" });
      toast({
        title: t("Domain deleted", "تم حذف الدومين"),
      });
    } catch (error: any) {
      toast({
        title: t("Error", "خطأ"),
        description: error.message || t("Failed to delete domain", "فشل حذف الدومين"),
        variant: "destructive",
      });
    }
  };

  const handleVerify = async (id: string) => {
    setVerifyingId(id);
    try {
      const response = await verifyDomain.mutateAsync(id);
      // Check if verification was successful
      if (response?.success && response?.data?.verified) {
        const verifiedDomain = domains.find((d) => d._id === id)?.domain || id;
        try {
          amplitudeService.trackCustomDomainVerified(verifiedDomain);
        } catch (trackError) {
          console.error('Analytics error:', trackError);
        }
        setShowVerified(true);
        toast({
          title: t("Success", "نجح"),
          description: t("Domain verified successfully", "تم التحقق من الدومين بنجاح"),
        });
      } else {
        // Verification API call succeeded but DNS records not found yet
        toast({
          title: t("Verification Pending", "التحقق قيد الانتظار"),
          description: t("DNS records not found yet. Please wait and try again.", "لم يتم العثور على سجلات DNS بعد. انتظر وحاول مرة أخرى."),
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: t("Error", "خطأ"),
        description: error.message || t("Failed to verify domain", "فشل التحقق من الدومين"),
        variant: "destructive",
      });
    } finally {
      setVerifyingId(null);
    }
  };

  const getDnsRecords = (domainEntry: DomainEntry) => {
    const cnameValue =
      domainEntry.verificationRecord?.value ||
      domainEntry.setupInstructions?.value ||
      domainEntry.cnameTarget ||
      "proxy.lovable.app";
    return [
      { type: "CNAME", name: domainEntry.domain, value: cnameValue, description: t("Domain pointer", "توجيه الدومين") },
    ];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(t("en-US", "ar-SA"), { 
      month: "short", 
      day: "numeric", 
      year: "numeric" 
    });
  };

  return (
    <DashboardLayout>
      {/* Delete confirmation */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((d) => ({ ...d, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Delete Domain", "حذف الدومين")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                `Are you sure you want to delete "${deleteDialog.domain}"? This action cannot be undone.`,
                `هل أنت متأكد من حذف "${deleteDialog.domain}"؟ لا يمكن التراجع عن هذا الإجراء.`
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancel", "إلغاء")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("Delete", "حذف")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-2xl font-display font-bold text-foreground">
          {t("Custom Domains", "الدومينات المخصصة")}
        </h1>
        <Button className="bg-primary text-primary-foreground text-xs sm:text-sm" size="sm" onClick={() => navigate("/dashboard/domains/add")}>
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 me-1.5" />
          {t("Add Domain", "أضف دومين")}
        </Button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error */}
      {isError && !isLoading && (
        <div className="text-center py-12">
          <p className="text-sm text-destructive font-body">
            {t("Failed to load domains. Please try again.", "فشل تحميل الدومينات. حاول مرة أخرى.")}
          </p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && domains.length === 0 && (
        <button
          onClick={() => navigate("/dashboard/domains/add")}
          className="w-full border border-dashed border-border rounded-xl p-8 text-center hover:border-primary/40 hover:bg-muted/30 transition-colors group"
        >
          <Globe className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40 group-hover:text-primary/40" />
          <p className="text-sm text-muted-foreground font-body">
            {t("No custom domains yet. Add your first domain!", "لا توجد دومينات مخصصة بعد. أضف دومينك الأول!")}
          </p>
        </button>
      )}

      {/* Domains */}
      {!isLoading && !isError && domains.length > 0 && (
        <div className="space-y-3 sm:space-y-4">
          {domains.map((d) => (
            <div key={d._id} className="bg-background border border-border rounded-xl p-4 sm:p-5 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 ${d.verificationStatus === "verified" ? "bg-primary/10" : "bg-muted"}`}>
                    <Globe className={`w-4 h-4 sm:w-5 sm:h-5 ${d.verificationStatus === "verified" ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display font-semibold text-foreground text-sm sm:text-base">{d.domain}</h3>
                      {d.verificationStatus === "verified" ? (
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-0 text-[10px] px-2 py-0.5">
                          <CheckCircle className="w-3 h-3 me-1" />
                          {t("Verified", "مُثبت")}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                          <Clock className="w-3 h-3 me-1" />
                          {t("Pending", "قيد الانتظار")}
                        </Badge>
                      )}
                      {d.isDefault && (
                        <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/10 border-0 text-[10px] px-2 py-0.5">
                          {t("Default", "افتراضي")}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] sm:text-xs text-muted-foreground font-body mt-0.5">
                      {t("Added", "أُضيف")} {formatDate(d.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ms-12 sm:ms-0">
                  <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => setDnsDialog(d)}>
                    <Eye className="w-3 h-3 me-1" />
                    {d.verificationStatus !== "verified"
                      ? t("Verify & View DNS", "تحقق وعرض DNS")
                      : t("View DNS", "عرض DNS")}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs h-8"
                    onClick={() => setDeleteDialog({ open: true, id: d._id, domain: d.domain })}
                    disabled={deleteDomain.isPending}
                  >
                    <Trash2 className="w-3 h-3 me-1" />
                    {t("Remove", "إزالة")}
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {/* Add domain hint */}
          <button
            onClick={() => navigate("/dashboard/domains/add")}
            className="w-full border border-dashed border-border rounded-xl p-5 sm:p-6 text-center hover:border-primary/40 hover:bg-muted/30 transition-colors group"
          >
            <Globe className="w-7 h-7 sm:w-8 sm:h-8 mx-auto mb-2 text-muted-foreground/40 group-hover:text-primary/40" />
            <p className="text-xs sm:text-sm text-muted-foreground font-body">
              {t("Add a custom domain like go.yourstore.sa", "أضف دومين مخصص مثل go.متجرك.sa")}
            </p>
          </button>
        </div>
      )}

      {/* DNS Records Dialog */}
      <Dialog open={!!dnsDialog} onOpenChange={(open) => { if (!open) { setDnsDialog(null); setShowVerified(false); } }}>
        <DialogContent className="max-w-md p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-sm sm:text-base">
              {t("DNS Records for", "سجلات DNS لـ")} {dnsDialog?.domain}
            </DialogTitle>
          </DialogHeader>
          {dnsDialog && !showVerified && (
            <div className="space-y-3">
              <p className="text-[11px] sm:text-xs text-muted-foreground font-body">
                {dnsDialog.status === "verified"
                  ? t("Your domain is verified. Here are the DNS records for reference.", "دومينك مُثبت. هذه سجلات DNS للاطلاع.")
                  : t("Add these records at your domain registrar. DNS propagation can take up to 72 hours.", "أضف هذه السجلات عند مزود الدومين. قد يستغرق التحديث حتى 72 ساعة.")}
              </p>
              <div className="space-y-2">
                {getDnsRecords(dnsDialog).map((record) => (
                  <div
                    key={record.name + record.type}
                    className="border border-border rounded-lg p-3 bg-muted/30"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                          {record.type}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-body">
                          {record.description}
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopy(record.value, record.type + record.name)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {copied === record.type + record.name ? (
                          <Check className="w-3.5 h-3.5 text-primary" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <div className="grid grid-cols-[50px_1fr] sm:grid-cols-[70px_1fr] gap-1.5 text-[11px] sm:text-xs font-body">
                      <span className="text-muted-foreground">{t("Name:", "الاسم:")}</span>
                      <code className="text-foreground font-mono break-all">{record.name}</code>
                      <span className="text-muted-foreground">{t("Value:", "القيمة:")}</span>
                      <code className="text-foreground font-mono break-all">{record.value}</code>
                    </div>
                  </div>
                ))}
              </div>
              <Button 
                className="w-full h-9 sm:h-10 bg-primary text-primary-foreground text-xs sm:text-sm" 
                onClick={() => handleVerify(dnsDialog._id)}
                disabled={verifyingId === dnsDialog._id}
              >
                {verifyingId === dnsDialog._id ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 me-1.5 animate-spin" />
                    {t("Verifying...", "جاري التحقق...")}
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 me-1.5" />
                    {t("Verify DNS", "تحقق من DNS")}
                  </>
                )}
              </Button>
            </div>
          )}
          {dnsDialog && showVerified && (
            <div className="text-center py-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
              </div>
              <h3 className="font-display font-bold text-foreground text-base sm:text-lg mb-2">
                {t("Domain Submitted!", "تم إرسال الدومين!")}
              </h3>
              <p className="text-sm text-primary font-semibold mb-2">{dnsDialog.domain}</p>
              <p className="text-xs sm:text-sm text-muted-foreground font-body mb-6 max-w-md mx-auto">
                {t(
                  "We're verifying your DNS records. This usually takes a few minutes but can take up to 72 hours.",
                  "نتحقق الآن من سجلات DNS. عادةً يستغرق دقائق لكن قد يصل إلى 72 ساعة."
                )}
              </p>
              <Button variant="outline" onClick={() => { setDnsDialog(null); setShowVerified(false); }}>
                {t("Close", "إغلاق")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default CustomDomains;