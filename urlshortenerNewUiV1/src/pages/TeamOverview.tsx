import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Loader2, UserPlus, Users, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBrandMetaTags } from "@/hooks/useBrandMetaTags";
import { useProject } from "@/contexts/ProjectContext";
import { accountMembersAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import InviteUserDialog from "@/components/team/InviteUserDialog";

interface MemberRow {
  userId: string;
  firstName: string;
  lastName?: string;
  email: string;
  projectCount: number;
  isOwner?: boolean;
  roles: { projectId: string; projectName: string; role: string }[];
}

interface PendingInvitation {
  id: string;
  email: string;
  projectRoles: { projectId: string; projectName: string; role: string }[];
}

const TeamOverview = () => {
  useBrandMetaTags();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    isEnterpriseAccount,
    isPersonalActive,
    canManageUsers,
    isAccountOwner,
    sharedProjects,
    isLoading: projectsLoading,
  } = useProject();

  const [members, setMembers] = useState<MemberRow[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<
    PendingInvitation[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<PendingInvitation | null>(
    null,
  );
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await accountMembersAPI.getOverview();
      if (response.success) {
        setMembers(response.data.members || []);
        setPendingInvitations(response.data.pendingInvitations || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canManageUsers) load();
  }, [canManageUsers, load]);

  const handleCancelInvitation = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await accountMembersAPI.cancelInvitation(cancelTarget.id);
      toast({ title: t("Invitation cancelled", "تم إلغاء الدعوة") });
      setCancelTarget(null);
      load();
    } catch (error: any) {
      toast({
        title: t("Failed to cancel invitation", "فشل إلغاء الدعوة"),
        description: error?.message,
        variant: "destructive",
      });
    } finally {
      setCancelling(false);
    }
  };

  useEffect(() => {
    if (
      !projectsLoading &&
      (!isEnterpriseAccount || (!isPersonalActive && !canManageUsers))
    ) {
      navigate("/dashboard", { replace: true });
    }
  }, [
    projectsLoading,
    isEnterpriseAccount,
    isPersonalActive,
    canManageUsers,
    navigate,
  ]);

  if (projectsLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (isPersonalActive) {
    return (
      <DashboardLayout>
        <div className="max-w-lg mx-auto text-center py-20">
          <Users className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {t(
              "Personal projects don't have team members or roles — switch to a shared project to manage users.",
              "المشاريع الشخصية لا تحتوي على أعضاء فريق أو أدوار — قم بالتبديل إلى مشروع مشترك لإدارة المستخدمين.",
            )}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (!canManageUsers) {
    return null;
  }

  const administerableProjects = sharedProjects.filter(
    (p) => p.role === "owner" || p.role === "admin",
  );
  const assignableRoles = isAccountOwner
    ? ["admin", "editor", "viewer"]
    : ["editor", "viewer"];

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            {t("Team", "الفريق")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t(
              "Manage who has access to your projects",
              "إدارة من لديه حق الوصول إلى مشاريعك",
            )}
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)} className="gap-2">
          <UserPlus className="w-4 h-4" />
          {t("Invite user", "دعوة مستخدم")}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-background border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-start px-4 py-3">
                    {t("Member", "العضو")}
                  </th>
                  <th className="text-start px-4 py-3">
                    {t("Roles", "الأدوار")}
                  </th>
                  <th className="text-start px-4 py-3">
                    {t("Projects", "المشاريع")}
                  </th>
                  <th className="text-end px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {members.map((member) => (
                  <tr key={member.userId}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">
                        {member.firstName} {member.lastName || ""}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {member.email}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {member.roles.map((r) => (
                          <Badge
                            key={r.projectId}
                            variant="secondary"
                            className="text-[10px]"
                          >
                            {r.projectName}: {r.role}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {member.projectCount}
                    </td>
                    <td className="px-4 py-3 text-end">
                      {!member.isOwner && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            navigate(`/dashboard/team/${member.userId}`)
                          }
                        >
                          {t("Manage", "إدارة")}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {members.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-10 text-center text-muted-foreground"
                    >
                      {t("No team members yet", "لا يوجد أعضاء فريق بعد")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {pendingInvitations.length > 0 && (
            <div className="bg-background border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground">
                  {t("Pending invitations", "الدعوات المعلقة")}
                </h2>
              </div>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-border">
                  {pendingInvitations.map((invitation) => (
                    <tr key={invitation.id}>
                      <td className="px-4 py-3">{invitation.email}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {invitation.projectRoles.map((pr) => (
                            <Badge
                              key={pr.projectId}
                              variant="outline"
                              className="text-[10px]"
                            >
                              {pr.projectName}: {pr.role}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {invitation.projectRoles.length}
                      </td>
                      <td className="px-4 py-3 text-end">
                        <div className="flex items-center justify-end gap-2">
                          <Badge variant="secondary" className="text-[10px]">
                            {t("Pending", "معلق")}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            title={t("Cancel invitation", "إلغاء الدعوة")}
                            onClick={() => setCancelTarget(invitation)}
                          >
                            <X className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <InviteUserDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        availableProjects={administerableProjects.map((p) => ({
          id: p.id,
          name: p.name,
        }))}
        assignableRoles={assignableRoles}
        onInvited={load}
      />

      <AlertDialog
        open={!!cancelTarget}
        onOpenChange={(open) => !open && setCancelTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("Cancel invitation?", "إلغاء الدعوة؟")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                `This cancels the pending invitation to "${cancelTarget?.email}". They will no longer be able to accept it.`,
                `سيؤدي هذا إلى إلغاء الدعوة المعلقة إلى "${cancelTarget?.email}". لن يتمكنوا بعد الآن من قبولها.`,
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>
              {t("Back", "رجوع")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelInvitation}
              disabled={cancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelling ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                t("Cancel invitation", "إلغاء الدعوة")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default TeamOverview;
