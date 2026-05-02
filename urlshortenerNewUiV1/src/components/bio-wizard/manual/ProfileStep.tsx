import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { Camera, Sparkles, Check, X, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { BioDraft, DEFAULT_PROFILE_PHOTO } from "../draftTypes";

interface Props {
  draft: BioDraft;
  onUpdate: (patch: Partial<BioDraft>) => void;
  onContinue: () => void;
  originalUsername?: string;
}

const RESERVED = ["admin", "support", "help", "bio", "test"];
const isAvailable = (u: string) => u.length >= 3 && !RESERVED.includes(u.toLowerCase());

const ProfileStep = ({ draft, onUpdate, onContinue, originalUsername }: Props) => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";
  const fileRef = useRef<HTMLInputElement>(null);
  const [enhancing, setEnhancing] = useState(false);
  const [ackedUsernameChange, setAckedUsernameChange] = useState(false);

  const handleFile = (file?: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = () =>
      onUpdate({ profile: { ...draft.profile, photo: reader.result as string } });
    reader.readAsDataURL(file);
  };

  const usernameValid = isAvailable(draft.settings.username);
  const usernameChanged = Boolean(
    originalUsername && draft.settings.username !== originalUsername,
  );
  const needsAck = usernameChanged && !ackedUsernameChange;
  const canContinue = draft.profile.displayName.trim() && usernameValid && !needsAck;

  const enhanceBio = () => {
    const text = draft.profile.bio.trim();
    if (!text || enhancing) return;
    setEnhancing(true);
    setTimeout(() => {
      const emojis = ["✨", "🌟", "📍", "💎", "🚀"];
      const e = emojis[Math.floor(Math.random() * emojis.length)];
      const loc = draft.profile.location || (isAr ? "السعودية" : "KSA");
      const enhanced = `${text} ${e} | ${loc}`;
      onUpdate({ profile: { ...draft.profile, bio: enhanced.slice(0, 160) } });
      setEnhancing(false);
    }, 600);
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 pb-32" dir={isAr ? "rtl" : "ltr"}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {t("Set up your profile", "ابدأ بهويتك")}
        </h1>
        <p className="text-muted-foreground mb-8">
          {t("Photo, name, and a short bio that grabs attention.", "صورة واسم ونبذة تجذب الانتباه.")}
        </p>
      </motion.div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-soft mb-4">
        <h3 className="font-semibold text-foreground mb-4">
          {t("Profile photo", "صورة البروفايل")}
        </h3>
        <div className="flex items-center gap-4">
          <button
            onClick={() => fileRef.current?.click()}
            className="w-24 h-24 rounded-full border-2 border-dashed border-border hover:border-primary bg-muted/30 flex items-center justify-center overflow-hidden flex-shrink-0 transition-colors"
          >
            {draft.profile.photo ? (
              <img src={draft.profile.photo} alt="profile" className="w-full h-full object-cover" />
            ) : (
              <Camera className="w-7 h-7 text-muted-foreground" />
            )}
          </button>
          <div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileRef.current?.click()}
                className="bg-primary/10 text-primary text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary/15 transition-colors"
              >
                {draft.profile.photo && draft.profile.photo !== DEFAULT_PROFILE_PHOTO
                  ? t("Change", "تغيير")
                  : t("Upload photo", "رفع صورة")}
              </button>
              {draft.profile.photo && draft.profile.photo !== DEFAULT_PROFILE_PHOTO && (
                <button
                  onClick={() =>
                    onUpdate({ profile: { ...draft.profile, photo: DEFAULT_PROFILE_PHOTO } })
                  }
                  className="text-sm text-muted-foreground hover:text-destructive flex items-center gap-1 px-2 py-2 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                  {t("Remove", "إزالة")}
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {t(
                "We'll use a default avatar if you skip.",
                "بنستخدم صورة افتراضية إذا تخطيت."
              )}
            </p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              handleFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-soft mb-4">
        <label className="text-sm font-semibold text-foreground block mb-2">
          {t("Username", "اسم المستخدم")} <span className="text-destructive">*</span>
        </label>
        <div dir="ltr" className="flex items-stretch border border-border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary">
          <span className="px-3 flex items-center text-sm text-muted-foreground bg-muted font-mono">bio/</span>
          <input
            type="text"
            value={draft.settings.username}
            onChange={(e) =>
              onUpdate({
                settings: { ...draft.settings, username: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "") },
              })
            }
            placeholder="yourname"
            className="flex-1 px-3 py-3 bg-background text-sm focus:outline-none font-mono"
            dir="ltr"
          />
          {draft.settings.username.length >= 3 && (
            <span className={`px-3 flex items-center text-xs font-medium ${usernameValid ? "text-green-600" : "text-destructive"}`}>
              {usernameValid ? <><Check className="w-4 h-4 me-1" /> {t("Available", "متاح")}</> : <><X className="w-4 h-4 me-1" /> {t("Taken", "مأخوذ")}</>}
            </span>
          )}
        </div>
        {usernameChanged && (
          <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 p-3 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                {t("Heads up — your page URL will change", "تنبيه — رابط صفحتك راح يتغيّر")}
              </p>
              <p className="text-xs text-amber-800/90 dark:text-amber-300/90 mt-1 break-all">
                {t("Old:", "القديم:")}{" "}
                <code className="font-mono">bio/{originalUsername}</code>
                {" → "}
                {t("New:", "الجديد:")}{" "}
                <code className="font-mono">bio/{draft.settings.username || "…"}</code>
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setAckedUsernameChange(true)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                    ackedUsernameChange
                      ? "bg-amber-600 text-white"
                      : "bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-900 dark:text-amber-100"
                  }`}
                >
                  {ackedUsernameChange
                    ? t("Got it ✓", "تمام ✓")
                    : t("I understand, change it", "فاهم، غيّره")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onUpdate({
                      settings: { ...draft.settings, username: originalUsername || "" },
                    });
                    setAckedUsernameChange(false);
                  }}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-100 hover:bg-amber-100/60 dark:hover:bg-amber-900/40 transition-colors"
                >
                  {t("Keep old username", "الاحتفاظ بالقديم")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-soft mb-4 space-y-4">
        <div>
          <label className="text-sm font-semibold text-foreground block mb-2">
            {t("Display name", "الاسم المعروض")} <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={draft.profile.displayName}
            onChange={(e) => onUpdate({ profile: { ...draft.profile, displayName: e.target.value } })}
            placeholder={t("Your name or brand", "اسمك أو اسم البراند")}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-foreground block mb-2">
            {t("Bio", "نبذة")}
          </label>
          <div className="relative">
            <textarea
              value={draft.profile.bio}
              onChange={(e) => onUpdate({ profile: { ...draft.profile, bio: e.target.value.slice(0, 160) } })}
              rows={3}
              placeholder={t("Tell people what you do", "خبر الزوار وش تسوي")}
              className="w-full px-4 py-3 pb-7 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
            />
            <span className="absolute bottom-2 end-3 text-xs text-muted-foreground pointer-events-none">
              {draft.profile.bio.length}/160
            </span>
          </div>
          <div className="flex items-center justify-end mt-2">
            <button
              onClick={enhanceBio}
              type="button"
              disabled={!draft.profile.bio.trim() || enhancing}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/15 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {enhancing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              {enhancing
                ? t("Enhancing…", "جاري التحسين…")
                : t("Enhance", "تحسين")}
            </button>
          </div>
        </div>
        <div>
          <label className="text-sm font-semibold text-foreground block mb-2">
            {t("Location (optional)", "الموقع (اختياري)")}
          </label>
          <input
            type="text"
            value={draft.profile.location}
            onChange={(e) => onUpdate({ profile: { ...draft.profile, location: e.target.value } })}
            placeholder={t("e.g. Riyadh, KSA", "مثل: الرياض، السعودية")}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
      </div>

      <div className="fixed bottom-0 inset-x-0 bg-background/95 backdrop-blur border-t border-border px-6 py-4 z-20">
        <div className="max-w-2xl mx-auto flex items-center justify-end gap-3" dir="ltr">
          {!canContinue && (
            <span className="text-xs text-muted-foreground">
              {needsAck
                ? t("Confirm the URL change to continue", "أكّد تغيير الرابط للمتابعة")
                : t("Name and valid username required", "الاسم واسم المستخدم مطلوبين")}
            </span>
          )}
          <button
            onClick={onContinue}
            disabled={!canContinue}
            className="bg-primary text-primary-foreground font-semibold px-8 py-3 rounded-xl hover:opacity-90 shadow-elevated disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t("Next", "التالي")} →
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileStep;
