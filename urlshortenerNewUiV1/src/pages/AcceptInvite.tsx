import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProject } from "@/contexts/ProjectContext";
import { accountMembersAPI } from "@/services/api";
import { useBrandMetaTags } from "@/hooks/useBrandMetaTags";

const AcceptInvite = () => {
  useBrandMetaTags();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refresh } = useProject();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage(t("Missing invitation token", "رمز الدعوة مفقود"));
      return;
    }

    accountMembersAPI
      .acceptInvitation(token)
      .then(async (response) => {
        if (response.success) {
          await refresh();
          setStatus("success");
        } else {
          setStatus("error");
          setErrorMessage(response.message || "");
        }
      })
      .catch((error) => {
        setStatus("error");
        setErrorMessage(error?.message || "");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <DashboardLayout>
      <div className="max-w-md mx-auto text-center py-20">
        {status === "loading" && (
          <>
            <Loader2 className="w-10 h-10 mx-auto animate-spin text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {t("Accepting invitation…", "جارٍ قبول الدعوة…")}
            </p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 className="w-10 h-10 mx-auto text-green-600 mb-4" />
            <h1 className="text-lg font-semibold text-foreground mb-2">
              {t("You're in!", "لقد انضممت!")}
            </h1>
            <p className="text-muted-foreground mb-6">
              {t(
                "You now have access to the shared projects you were invited to.",
                "أصبح لديك الآن حق الوصول إلى المشاريع المشتركة التي تمت دعوتك إليها.",
              )}
            </p>
            <Button onClick={() => navigate("/dashboard")}>
              {t("Go to Dashboard", "الذهاب إلى لوحة التحكم")}
            </Button>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="w-10 h-10 mx-auto text-destructive mb-4" />
            <h1 className="text-lg font-semibold text-foreground mb-2">
              {t("Couldn't accept invitation", "تعذر قبول الدعوة")}
            </h1>
            <p className="text-muted-foreground mb-6">{errorMessage}</p>
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              {t("Go to Dashboard", "الذهاب إلى لوحة التحكم")}
            </Button>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AcceptInvite;
