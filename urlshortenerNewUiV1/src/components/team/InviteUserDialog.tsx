import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { accountMembersAPI } from "@/services/api";

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableProjects: { id: string; name: string }[];
  assignableRoles: string[];
  onInvited: () => void;
}

const InviteUserDialog = ({
  open,
  onOpenChange,
  availableProjects,
  assignableRoles,
  onInvited,
}: InviteUserDialogProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [projectRoles, setProjectRoles] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const defaultRole = assignableRoles[assignableRoles.length - 1] || "viewer";

  const toggleProject = (id: string) => {
    setProjectRoles((prev) => {
      if (id in prev) {
        const { [id]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: defaultRole };
    });
  };

  const setRoleForProject = (id: string, role: string) => {
    setProjectRoles((prev) => ({ ...prev, [id]: role }));
  };

  const reset = () => {
    setEmail("");
    setProjectRoles({});
  };

  const handleSubmit = async () => {
    const selectedProjectIds = Object.keys(projectRoles);
    if (!email.trim() || selectedProjectIds.length === 0) {
      toast({
        title: t(
          "Email and at least one project are required",
          "البريد الإلكتروني ومشروع واحد على الأقل مطلوبان",
        ),
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await accountMembersAPI.invite(
        email.trim(),
        selectedProjectIds.map((projectId) => ({
          projectId,
          role: projectRoles[projectId],
        })),
      );
      toast({ title: t("Invitation sent", "تم إرسال الدعوة") });
      reset();
      onOpenChange(false);
      onInvited();
    } catch (error: any) {
      toast({
        title: t("Failed to send invitation", "فشل إرسال الدعوة"),
        description: error?.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("Invite user", "دعوة مستخدم")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t("Email", "البريد الإلكتروني")}</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@company.com"
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t("Projects & roles", "المشاريع والأدوار")}</Label>
            <div className="space-y-2 max-h-56 overflow-y-auto border rounded-md p-2">
              {availableProjects.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {t("No projects available", "لا توجد مشاريع متاحة")}
                </p>
              )}
              {availableProjects.map((project) => {
                const checked = project.id in projectRoles;
                return (
                  <div
                    key={project.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <label className="flex items-center gap-2 text-sm cursor-pointer flex-1 min-w-0">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleProject(project.id)}
                      />
                      <span className="truncate">{project.name}</span>
                    </label>
                    {checked && (
                      <Select
                        value={projectRoles[project.id]}
                        onValueChange={(r) => setRoleForProject(project.id, r)}
                      >
                        <SelectTrigger className="w-28 h-8 shrink-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {assignableRoles.map((r) => (
                            <SelectItem key={r} value={r}>
                              {r.charAt(0).toUpperCase() + r.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("Cancel", "إلغاء")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              submitting ||
              !email.trim() ||
              Object.keys(projectRoles).length === 0
            }
          >
            {t("Send invitation", "إرسال الدعوة")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InviteUserDialog;
