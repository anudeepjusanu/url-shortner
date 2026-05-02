import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, Link2 } from "lucide-react";
import ManualWizard from "@/components/bio-wizard/manual/ManualWizard";
import { BioDraft, DraftLink, emptyDraft, uid, buildBlocksFromDraft, buildThemeFromDraft } from "@/components/bio-wizard/draftTypes";
import { BioBlock } from "@/types/bio";
import { bioPageAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";

const blocksToDraft = (blocks: BioBlock[]): Pick<BioDraft, "profile" | "links"> => {
  let profile = { ...emptyDraft.profile };
  const links: DraftLink[] = [];

  for (const b of blocks) {
    if (b.type === "profile") {
      profile = {
        displayName: b.data?.name || b.data?.nameEn || "",
        bio: b.data?.bio || b.data?.bioEn || "",
        photo: b.data?.avatar || emptyDraft.profile.photo,
        location: "",
      };
    } else if (b.type === "social") {
      const platforms: any[] = b.data?.platforms || [];
      for (const p of platforms) {
        if (p.platform === "whatsapp") {
          links.push({
            id: uid(),
            type: "whatsapp",
            title: p.label || "WhatsApp",
            phone: p.username || "",
            url: p.username || "",
            message: "",
            displayType: p.displayType,
          });
        } else {
          links.push({
            id: uid(),
            type: "social",
            platform: p.platform,
            title: p.label || p.platform || "",
            url: p.username || p.url || "",
            displayType: p.displayType,
            useBrandColors: p.useBrandColors !== false,
          });
        }
      }
    } else if (b.type === "link") {
      links.push({
        id: uid(),
        type: "link",
        title: b.data?.title || b.data?.titleEn || "Link",
        titleEn: b.data?.titleEn || b.data?.title,
        url: b.data?.url || "",
        icon: b.data?.icon,
        iconImage: b.data?.iconImage,
        displayType: b.data?.displayType || "button",
      });
    } else if (b.type === "whatsapp") {
      links.push({
        id: uid(),
        type: "whatsapp",
        title: b.data?.title || b.data?.titleEn || "WhatsApp",
        titleEn: b.data?.titleEn,
        url: b.data?.phone || "",
        phone: b.data?.phone || "",
        message: b.data?.message || "",
        messageEn: b.data?.messageEn,
      });
    } else if (b.type === "text") {
      links.push({
        id: uid(),
        type: "header",
        title: b.data?.text || b.data?.textEn || "",
        titleEn: b.data?.textEn,
        url: "",
        sectionStyle: b.data?.sectionStyle || (b.data?.variant === "section" ? "text" : "text-line"),
        lineColor: b.data?.lineColor,
        textColor: b.data?.textColor,
        fontSize: b.data?.fontSize,
        fontFamily: b.data?.fontFamily,
        textAlign: b.data?.textAlign,
        bold: b.data?.bold,
        italic: b.data?.italic,
        underline: b.data?.underline,
      });
    } else if (b.type === "divider") {
      links.push({ id: uid(), type: "divider", title: "", url: "" });
    }
  }

  return { profile, links };
};

const BioBuilder = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<BioDraft>({ ...emptyDraft });
  const [originalUsername, setOriginalUsername] = useState("");
  const [pageId, setPageId] = useState<string>(id || "");

  useEffect(() => {
    if (!id) { setNotFound(true); setLoading(false); return; }
    (async () => {
      try {
        const res = await bioPageAPI.get(id) as any;
        const page = res?.data;
        if (!page) { setNotFound(true); return; }

        const fromBlocks = page.blocks?.length
          ? blocksToDraft(page.blocks)
          : { profile: emptyDraft.profile, links: [] as DraftLink[] };

        const hydrated: BioDraft = {
          ...emptyDraft,
          profile: {
            ...fromBlocks.profile,
            displayName: fromBlocks.profile.displayName || page.title || "",
            photo: fromBlocks.profile.photo || page.avatarUrl || emptyDraft.profile.photo,
          },
          links: fromBlocks.links,
          settings: {
            ...emptyDraft.settings,
            username: page.username || "",
          },
          design: page.design
            ? { ...emptyDraft.design, ...page.design }
            : emptyDraft.design,
        };

        setDraft(hydrated);
        setOriginalUsername(page.username || "");
        setPageId(page._id || id);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const updateDraft = (patch: Partial<BioDraft>) =>
    setDraft((d) => ({ ...d, ...patch }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const blocks = buildBlocksFromDraft(draft);
      const bioTheme = buildThemeFromDraft(draft);
      const payload = {
        username: draft.settings.username,
        title: draft.profile.displayName,
        description: draft.profile.bio,
        avatarUrl: draft.profile.photo,
        blocks,
        design: draft.design,
        bioTheme,
        isPublished: true,
      };
      await bioPageAPI.update(pageId, payload);
      toast({
        title: t("Changes saved", "تم حفظ التغييرات"),
        description: t("Your bio page has been updated.", "تم تحديث صفحة البايو الخاصة بك."),
      });
      navigate("/dashboard/bio-pages");
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: t("Save failed", "فشل الحفظ"),
        description: err?.response?.data?.message || err?.message || "Something went wrong",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const blocks = buildBlocksFromDraft(draft);
      const bioTheme = buildThemeFromDraft(draft);
      const payload = {
        username: draft.settings.username,
        title: draft.profile.displayName,
        description: draft.profile.bio,
        avatarUrl: draft.profile.photo,
        blocks,
        design: draft.design,
        bioTheme,
        isPublished: false,
      };
      await bioPageAPI.update(pageId, payload);
      toast({ title: t("Draft saved", "تم حفظ المسودة") });
      navigate("/dashboard/bio-pages");
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: t("Save failed", "فشل الحفظ"),
        description: err?.response?.data?.message || err?.message || "Something went wrong",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || saving) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background text-center px-4">
        <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center">
          <Link2 className="w-10 h-10 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          {t("Page Not Found", "الصفحة غير موجودة")}
        </h1>
        <Link
          to="/dashboard/bio-pages"
          className="mt-2 px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          {t("Back to Bio Pages", "العودة لصفحات البايو")}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
        <ManualWizard
          draft={draft}
          onUpdate={updateDraft}
          onBack={() => navigate("/dashboard/bio-pages")}
          onPublish={handleSave}
          onSaveDraft={handleSaveDraft}
          originalUsername={originalUsername}
          isEdit
        />
      </motion.div>
    </div>
  );
};

export default BioBuilder;
