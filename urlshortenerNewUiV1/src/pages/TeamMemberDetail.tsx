import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProject } from "@/contexts/ProjectContext";
import { useToast } from "@/hooks/use-toast";
import { accountMembersAPI, projectsAPI } from "@/services/api";

interface ProjectRow {
  membershipId: string;
  projectId: string;
  projectName: string;
  role: string;
  assignableRoles: string[];
}

const TeamMemberDetail = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const { isEnterpriseAccount, isPersonalActive, canManageUsers, isAccountOwner, sharedProjects, isLoading: projectsLoading } =
    useProject();

  const [user, setUser] = useState<{ firstName: string; lastName?: string; email: string } | null>(null);
  const [rows, setRows] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [addProjectId, setAddProjectId] = useState("");
  const [addRole, setAddRole] = useState("");
  const [removeAccountOpen, setRemoveAccountOpen] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const response = await accountMembersAPI.getMemberDetail(userId);
      if (response.success) {
        setUser(response.data.user);
        setRows(response.data.projects || []);
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (canManageUsers) load();
  }, [canManageUsers, load]);

  useEffect(() => {
    if (!projectsLoading && (!isEnterpriseAccount || (!isPersonalActive && !canManageUsers))) {
      navigate("/dashboard", { replace: true });
    }
  }, [projectsLoading, isEnterpriseAccount, isPersonalActive, canManageUsers, navigate]);

  if (projectsLoading || isPersonalActive || !canManageUsers) {
    return null;
  }

  const handleRoleChange = async (row: ProjectRow, newRole: string) => {
    try {
      await projectsAPI.changeMemberRole(row.projectId, userId!, newRole);
      toast({ title: t("Role updated", "تم تحديث الدور") });
      load();
    } catch (error: any) {
      toast({
        title: t("Failed to update role", "فشل تحديث الدور"),
        description: error?.message,
        variant: "destructive",
      });
    }
  };

  const handleRemoveFromProject = async (row: ProjectRow) => {
    try {
      await projectsAPI.removeMember(row.projectId, userId!);
      toast({ title: t("Removed from project", "تمت الإزالة من المشروع") });
      load();
    } catch (error: any) {
      toast({
        title: t("Failed to remove member", "فشل إزالة العضو"),
        description: error?.message,
        variant: "destructive",
      });
    }
  };

  const handleRemoveFromAccount = async () => {
    try {
      await accountMembersAPI.removeFromAccount(userId!);
      toast({ title: t("User removed from the account", "تمت إزالة المستخدم من الحساب") });
      navigate("/dashboard/team");
    } catch (error: any) {
      toast({
        title: t("Failed to remove user", "فشل إزالة المستخدم"),
        description: error?.message,
        variant: "destructive",
      });
    } finally {
      setRemoveAccountOpen(false);
    }
  };

  const handleAddToProject = async () => {
    if (!addProjectId || !addRole) return;
    try {
      await projectsAPI.addExistingUser(addProjectId, userId!, addRole);
      toast({ title: t("Added to project", "تمت الإضافة إلى المشروع") });
      setAddProjectId("");
      setAddRole("");
      load();
    } catch (error: any) {
      toast({
        title: t("Failed to add to project", "فشل الإضافة إلى المشروع"),
        description: error?.message,
        variant: "destructive",
      });
    }
  };

  const administerableProjects = sharedProjects.filter((p) => p.role === "owner" || p.role === "admin");
  const assignedProjectIds = new Set(rows.map((r) => r.projectId));
  const addableProjects = administerableProjects.filter((p) => !assignedProjectIds.has(p.id));
  const assignableRolesForAdd = isAccountOwner ? ["admin", "editor", "viewer"] : ["editor", "viewer"];

  return (
    <DashboardLayout>
      <Button variant="ghost" size="sm" className="mb-4 gap-1.5" onClick={() => navigate("/dashboard/team")}>
        <ArrowLeft className="w-4 h-4" />
        {t("Back to Team", "العودة إلى الفريق")}
      </Button>

      {loading || !user ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">
                {user.firstName} {user.lastName || ""}
              </h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            {isAccountOwner && (
              <Button variant="destructive" size="sm" onClick={() => setRemoveAccountOpen(true)}>
                {t("Remove from account", "إزالة من الحساب")}
              </Button>
            )}
          </div>

          <div className="bg-background border border-border rounded-xl overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-start px-4 py-3">{t("Project", "المشروع")}</th>
                  <th className="text-start px-4 py-3">{t("Role", "الدور")}</th>
                  <th className="text-end px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => {
                  const canManageRow = row.assignableRoles.length > 0 && !(row.role === "admin" && !isAccountOwner);
                  return (
                    <tr key={row.membershipId}>
                      <td className="px-4 py-3 font-medium text-foreground">{row.projectName}</td>
                      <td className="px-4 py-3">
                        {canManageRow ? (
                          <Select value={row.role} onValueChange={(value) => handleRoleChange(row, value)}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[row.role, ...row.assignableRoles.filter((r) => r !== row.role)].map((r) => (
                                <SelectItem key={r} value={r}>
                                  {r.charAt(0).toUpperCase() + r.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="secondary">{row.role}</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-end">
                        {canManageRow && (
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveFromProject(row)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-10 text-center text-muted-foreground">
                      {t("No visible project access", "لا يوجد وصول مرئي للمشاريع")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {addableProjects.length > 0 && (
            <div className="bg-background border border-border rounded-xl p-4 flex flex-wrap items-end gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">{t("Add to project", "إضافة إلى مشروع")}</label>
                <Select value={addProjectId} onValueChange={setAddProjectId}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder={t("Select project", "اختر مشروعًا")} />
                  </SelectTrigger>
                  <SelectContent>
                    {addableProjects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Select value={addRole} onValueChange={setAddRole}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder={t("Role", "الدور")} />
                </SelectTrigger>
                <SelectContent>
                  {assignableRolesForAdd.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAddToProject} disabled={!addProjectId || !addRole}>
                {t("Add", "إضافة")}
              </Button>
            </div>
          )}
        </>
      )}

      <AlertDialog open={removeAccountOpen} onOpenChange={setRemoveAccountOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Remove from account?", "إزالة من الحساب؟")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "This removes the user from every shared project on this account. Their personal project is unaffected.",
                "سيؤدي هذا إلى إزالة المستخدم من جميع المشاريع المشتركة في هذا الحساب. لن يتأثر مشروعه الشخصي."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancel", "إلغاء")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveFromAccount}>{t("Remove", "إزالة")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default TeamMemberDetail;
