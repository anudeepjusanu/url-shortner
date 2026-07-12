import { useState, useEffect, useCallback } from "react";
import amplitudeService from "@/services/amplitude";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  Trash2,
  Loader2,
  BookOpen,
  ExternalLink,
} from "lucide-react";
import { profileService } from "@/services/jwtService";
import { useToast } from "@/hooks/use-toast";
import { useProject } from "@/contexts/ProjectContext";

const MINTLIFY_DOCS_URL = "https://docs.snip.sa";

const ApiDocs = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { canEdit, activeProject, isLoading: isProjectLoading } = useProject();

  // ── API Key ──────────────────────────────────────────────────────────────────
  const [isLoadingKey, setIsLoadingKey] = useState(true);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [isRegeneratingKey, setIsRegeneratingKey] = useState(false);
  const [regenConfirmOpen, setRegenConfirmOpen] = useState(false);
  const [isDeletingKey, setIsDeletingKey] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const loadApiKey = useCallback(async () => {
    setIsLoadingKey(true);
    try {
      // Enterprise RBAC: the active project's role governs whether this
      // account's key can be revealed here — a Viewer is denied.
      const res = await profileService
        .getApiKey(activeProject?.id)
        .catch(() => null);
      if (res?.apiKey) setApiKey(res.apiKey);
    } finally {
      setIsLoadingKey(false);
    }
  }, [activeProject?.id]);

  useEffect(() => {
    if (isProjectLoading) return;
    loadApiKey();
  }, [loadApiKey, isProjectLoading]);

  const handleRegenerateKey = async () => {
    setRegenConfirmOpen(false);
    setIsRegeneratingKey(true);
    try {
      const res = await profileService.regenerateApiKey(activeProject?.id);
      if (res?.apiKey) {
        setApiKey(res.apiKey);
        setShowKey(true);
        amplitudeService.track("generate API Key");
        toast({ title: t("API key regenerated", "تم إعادة إنشاء مفتاح API") });
      }
    } catch (err: any) {
      toast({
        title: t("Failed to regenerate key", "فشل إعادة إنشاء المفتاح"),
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsRegeneratingKey(false);
    }
  };

  const handleDeleteKey = async () => {
    setDeleteConfirmOpen(false);
    setIsDeletingKey(true);
    try {
      await profileService.deleteApiKey(activeProject?.id);
      setApiKey(null);
      setShowKey(false);
      toast({ title: t("API key deleted", "تم حذف مفتاح API") });
    } catch (err: any) {
      toast({
        title: t("Failed to delete key", "فشل حذف المفتاح"),
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsDeletingKey(false);
    }
  };

  const handleCopyKey = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleOpenDocs = () => {
    amplitudeService.track("API view");
    window.open(MINTLIFY_DOCS_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <DashboardLayout>
      {/* Regen confirm */}
      <AlertDialog open={regenConfirmOpen} onOpenChange={setRegenConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("Regenerate API Key", "إعادة إنشاء مفتاح API")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "Your current API key will be invalidated. Any apps using it will stop working. Continue?",
                "سيتم إلغاء مفتاح API الحالي. أي تطبيقات تستخدمه ستتوقف عن العمل. هل تريد المتابعة؟",
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancel", "إلغاء")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleRegenerateKey}>
              {t("Regenerate", "إعادة إنشاء")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirm */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("Delete API Key", "حذف مفتاح API")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "Your current API key will be permanently removed. Any apps using it will stop working. Continue?",
                "سيتم إزالة مفتاح API الحالي نهائيًا. أي تطبيقات تستخدمه ستتوقف عن العمل. هل تريد المتابعة؟",
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancel", "إلغاء")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteKey}>
              {t("Delete", "حذف")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="max-w-3xl mx-auto space-y-5 sm:space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-lg sm:text-2xl font-display font-bold text-foreground">
            {t("API Access", "الوصول إلى API")}
          </h1>
          <p className="text-muted-foreground font-body text-xs sm:text-sm mt-1">
            {t(
              "Manage your API key and view documentation.",
              "إدارة مفتاح API وعرض المستندات.",
            )}
          </p>
        </div>

        {/* API Key */}
        <Card>
          <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 sm:pb-4">
            <CardTitle className="text-sm sm:text-base font-display flex items-center gap-2">
              <Key className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
              {t("API Key", "مفتاح API")}
            </CardTitle>
            <CardDescription className="font-body text-xs sm:text-sm">
              {t(
                "Use your API key to integrate with our REST API. Keep it secret.",
                "استخدم مفتاح API لربط تطبيقاتك بواجهة البرمجة. حافظ على سريته.",
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            {isLoadingKey ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : !apiKey ? (
              <div className="text-center py-4 sm:py-6 space-y-3 sm:space-y-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                  <Key className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-foreground font-body font-medium">
                    {t("No API key yet", "لا يوجد مفتاح API بعد")}
                  </p>
                  <p className="text-[11px] sm:text-xs text-muted-foreground font-body mt-1">
                    {t(
                      "Generate an API key to start using our REST API for link shortening, QR codes, and analytics.",
                      "أنشئ مفتاح API للبدء باستخدام واجهة البرمجة لاختصار الروابط وأكواد QR والتحليلات.",
                    )}
                  </p>
                </div>
                {canEdit && (
                  <Button
                    className="font-body text-sm"
                    disabled={isRegeneratingKey}
                    onClick={() => setRegenConfirmOpen(true)}
                  >
                    {isRegeneratingKey ? (
                      <Loader2 className="w-4 h-4 me-1.5 animate-spin" />
                    ) : (
                      <Key className="w-4 h-4 me-1.5" />
                    )}
                    {t("Generate API Key", "إنشاء مفتاح API")}
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Input
                      readOnly
                      value={
                        canEdit && showKey
                          ? apiKey
                          : "sk_•••••••••••••••••••••••••••••••••"
                      }
                      className="font-mono text-xs sm:text-sm pe-20"
                    />
                    {canEdit && (
                      <div className="absolute end-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setShowKey(!showKey)}
                        >
                          {showKey ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={handleCopyKey}
                        >
                          {copiedKey ? (
                            <Check className="w-3.5 h-3.5 text-green-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                  {canEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="font-body text-xs shrink-0"
                      disabled={isRegeneratingKey || isDeletingKey}
                      onClick={() => setRegenConfirmOpen(true)}
                    >
                      {isRegeneratingKey ? (
                        <Loader2 className="w-3 h-3 me-1 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3 h-3 me-1" />
                      )}
                      {t("Regenerate", "إعادة إنشاء")}
                    </Button>
                  )}
                  {canEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="font-body text-xs shrink-0 text-destructive hover:text-destructive"
                      disabled={isRegeneratingKey || isDeletingKey}
                      onClick={() => setDeleteConfirmOpen(true)}
                    >
                      {isDeletingKey ? (
                        <Loader2 className="w-3 h-3 me-1 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3 me-1" />
                      )}
                      {t("Delete", "حذف")}
                    </Button>
                  )}
                </div>
                <div className="rounded-lg bg-muted/50 p-3 border border-border">
                  <p className="text-[11px] sm:text-xs text-muted-foreground font-body leading-relaxed">
                    ⚠️{" "}
                    {t(
                      "Keep your API key secure. Do not share it publicly or commit it to version control. If compromised, regenerate it immediately.",
                      "حافظ على سرية مفتاح API. لا تشاركه علنًا أو تضعه في الكود المصدري. إذا تم اختراقه، أعد إنشاءه فورًا.",
                    )}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documentation */}
        <Card>
          <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 sm:pb-4">
            <CardTitle className="text-sm sm:text-base font-display flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
              {t("Documentation", "المستندات")}
            </CardTitle>
            <CardDescription className="font-body text-xs sm:text-sm">
              {t(
                "Full API reference, examples, and integration guides are hosted on our docs site.",
                "المرجع الكامل لواجهة البرمجة، الأمثلة، ودلائل الربط متوفرة على موقع المستندات.",
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <Button className="font-body text-sm" onClick={handleOpenDocs}>
              {t("Open API Documentation", "فتح مستندات API")}
              <ExternalLink className="w-3.5 h-3.5 ms-1.5" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ApiDocs;
