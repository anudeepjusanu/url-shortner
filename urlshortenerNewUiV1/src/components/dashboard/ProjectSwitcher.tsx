import { useState } from "react";
import { Lock, ChevronDown, Plus, LayoutGrid, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProject } from "@/contexts/ProjectContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";

// Top-bar project switcher — only renders for enterprise accounts. Solo
// accounts see nothing here, matching today's behavior exactly.
const ProjectSwitcher = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const {
    isEnterpriseAccount,
    isAccountOwner,
    isLoading,
    sharedProjects,
    personalProject,
    activeProject,
    isAllProjectsView,
    setActiveProjectId,
    createProject,
  } = useProject();

  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [creating, setCreating] = useState(false);

  if (!isEnterpriseAccount || isLoading) {
    return null;
  }

  const currentLabel = isAllProjectsView
    ? t("All projects", "كل المشاريع")
    : activeProject?.name || t("Select project", "اختر مشروعًا");

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    setCreating(true);
    try {
      await createProject(newProjectName.trim());
      toast({ title: t("Project created", "تم إنشاء المشروع") });
      setNewProjectOpen(false);
      setNewProjectName("");
    } catch (error: any) {
      toast({
        title: t("Failed to create project", "فشل إنشاء المشروع"),
        description: error?.message,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="max-w-[180px] justify-between gap-2"
          >
            <span className="truncate">{currentLabel}</span>
            <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          {personalProject && (
            <>
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {t("Personal", "شخصي")}
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => setActiveProjectId(personalProject.id)}
                className="flex items-center gap-2"
              >
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate flex-1">{personalProject.name}</span>
                <Badge variant="secondary" className="text-[10px]">
                  {t("Private", "خاص")}
                </Badge>
                {!isAllProjectsView && activeProject?.id === personalProject.id && (
                  <Check className="w-3.5 h-3.5 shrink-0" />
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {isAccountOwner && (
            <DropdownMenuItem
              onClick={() => setActiveProjectId(null)}
              className="flex items-center gap-2"
            >
              <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
              <span className="flex-1">{t("All projects", "كل المشاريع")}</span>
              {isAllProjectsView && <Check className="w-3.5 h-3.5 shrink-0" />}
            </DropdownMenuItem>
          )}

          {sharedProjects.length > 0 && (
            <DropdownMenuLabel className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {t("Shared projects", "المشاريع المشتركة")}
            </DropdownMenuLabel>
          )}
          {sharedProjects.map((project) => (
            <DropdownMenuItem
              key={project.id}
              onClick={() => setActiveProjectId(project.id)}
              className="flex items-center gap-2"
            >
              <span className="truncate flex-1">{project.name}</span>
              {!isAllProjectsView && activeProject?.id === project.id && (
                <Check className="w-3.5 h-3.5 shrink-0" />
              )}
            </DropdownMenuItem>
          ))}

          {isAccountOwner && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setNewProjectOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                {t("New project", "مشروع جديد")}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={newProjectOpen} onOpenChange={setNewProjectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("New project", "مشروع جديد")}</DialogTitle>
          </DialogHeader>
          <Input
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder={t("Project name", "اسم المشروع")}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewProjectOpen(false)}>
              {t("Cancel", "إلغاء")}
            </Button>
            <Button onClick={handleCreateProject} disabled={creating || !newProjectName.trim()}>
              {t("Create", "إنشاء")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProjectSwitcher;
