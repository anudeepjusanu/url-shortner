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
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [role, setRole] = useState(assignableRoles[assignableRoles.length - 1] || "viewer");
  const [submitting, setSubmitting] = useState(false);

  const toggleProject = (id: string) => {
    setSelectedProjectIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const reset = () => {
    setEmail("");
    setSelectedProjectIds([]);
    setRole(assignableRoles[assignableRoles.length - 1] || "viewer");
  };

  const handleSubmit = async () => {
    if (!email.trim() || selectedProjectIds.length === 0) {
      toast({
        title: t("Email and at least one project are required", "البريد الإلكتروني ومشروع واحد على الأقل مطلوبان"),
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await accountMembersAPI.invite(email.trim(), selectedProjectIds, role);
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
            <Label>{t("Projects", "المشاريع")}</Label>
            <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
              {availableProjects.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {t("No projects available", "لا توجد مشاريع متاحة")}
                </p>
              )}
              {availableProjects.map((project) => (
                <label key={project.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={selectedProjectIds.includes(project.id)}
                    onCheckedChange={() => toggleProject(project.id)}
                  />
                  {project.name}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t("Role", "الدور")}</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
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
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("Cancel", "إلغاء")}
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {t("Send invitation", "إرسال الدعوة")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InviteUserDialog;
