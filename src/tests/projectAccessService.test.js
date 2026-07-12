"use strict";

jest.mock("../models/Organization", () => ({
  findById: jest.fn(),
}));
jest.mock("../models/Project", () => ({
  findById: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
}));
jest.mock("../models/ProjectMembership", () => ({
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  find: jest.fn(),
  deleteOne: jest.fn(),
  deleteMany: jest.fn(),
}));
jest.mock("../models/ProjectInvitation", () => ({
  create: jest.fn(),
  findOne: jest.fn(),
}));
jest.mock("../models/User", () => ({
  findById: jest.fn(),
}));
jest.mock("../services/emailService", () => ({
  sendInvitationEmail: jest.fn().mockResolvedValue(undefined),
}));

const Organization = require("../models/Organization");
const Project = require("../models/Project");
const ProjectMembership = require("../models/ProjectMembership");
const service = require("../services/projectAccessService");

const OWNER_ID = "owner-user-id";
const ADMIN_ID = "admin-user-id";
const EDITOR_ID = "editor-user-id";
const OTHER_ID = "other-user-id";
const ORG_ID = "org-id";
// Must be a real ObjectId-shaped string — loadOwnProject validates the
// format with mongoose.Types.ObjectId.isValid() before querying.
const PROJECT_ID = "000000000000000000000001";

const mockOrgSelect = (owner) => {
  Organization.findById.mockReturnValue({
    select: jest.fn().mockResolvedValue({ owner: { toString: () => owner } }),
  });
};

describe("projectAccessService.isAccountOwner", () => {
  afterEach(() => jest.clearAllMocks());

  test("returns true when Organization.owner matches the given user", async () => {
    mockOrgSelect(OWNER_ID);
    await expect(service.isAccountOwner(OWNER_ID, ORG_ID)).resolves.toBe(true);
  });

  test("returns false for anyone else, even an Admin", async () => {
    mockOrgSelect(OWNER_ID);
    await expect(service.isAccountOwner(ADMIN_ID, ORG_ID)).resolves.toBe(false);
  });

  test("returns false when the organization does not exist", async () => {
    Organization.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });
    await expect(service.isAccountOwner(OWNER_ID, ORG_ID)).resolves.toBe(false);
  });
});

describe("projectAccessService.getEffectiveRole", () => {
  afterEach(() => jest.clearAllMocks());

  const sharedProject = {
    _id: PROJECT_ID,
    isPersonal: false,
    organization: ORG_ID,
  };

  test('Account Owner is implicitly "owner" on every shared project — never a membership row', async () => {
    mockOrgSelect(OWNER_ID);
    const role = await service.getEffectiveRole(OWNER_ID, sharedProject);
    expect(role).toBe("owner");
  });

  test("falls back to the ProjectMembership role for non-owners", async () => {
    mockOrgSelect(OWNER_ID);
    ProjectMembership.findOne.mockResolvedValue({ role: "editor" });
    await expect(
      service.getEffectiveRole(EDITOR_ID, sharedProject),
    ).resolves.toBe("editor");
  });

  test("returns null when the user has no membership and is not the Owner", async () => {
    mockOrgSelect(OWNER_ID);
    ProjectMembership.findOne.mockResolvedValue(null);
    await expect(
      service.getEffectiveRole(OTHER_ID, sharedProject),
    ).resolves.toBeNull();
  });

  test("a personal project is only accessible to its own owner — even the Account Owner is denied", async () => {
    const personalProject = {
      _id: "personal-1",
      isPersonal: true,
      personalOwnerUser: { toString: () => EDITOR_ID },
      organization: ORG_ID,
    };

    await expect(
      service.getEffectiveRole(EDITOR_ID, personalProject),
    ).resolves.toBe("personal-owner");
    await expect(
      service.getEffectiveRole(OWNER_ID, personalProject),
    ).resolves.toBeNull();
    expect(Organization.findById).not.toHaveBeenCalled();
  });
});

describe("projectAccessService.assignableRolesForProject", () => {
  afterEach(() => jest.clearAllMocks());

  const sharedProject = {
    _id: PROJECT_ID,
    isPersonal: false,
    organization: ORG_ID,
  };

  test("Account Owner can assign admin, editor, or viewer", async () => {
    mockOrgSelect(OWNER_ID);
    await expect(
      service.assignableRolesForProject(OWNER_ID, sharedProject),
    ).resolves.toEqual(["admin", "editor", "viewer"]);
  });

  test("a project Admin can only assign editor or viewer — never admin", async () => {
    mockOrgSelect(OWNER_ID);
    ProjectMembership.findOne.mockResolvedValue({ role: "admin" });
    await expect(
      service.assignableRolesForProject(ADMIN_ID, sharedProject),
    ).resolves.toEqual(["editor", "viewer"]);
  });

  test("an Editor cannot assign any role", async () => {
    mockOrgSelect(OWNER_ID);
    ProjectMembership.findOne.mockResolvedValue({ role: "editor" });
    await expect(
      service.assignableRolesForProject(EDITOR_ID, sharedProject),
    ).resolves.toEqual([]);
  });
});

describe("projectAccessService.canManageMember", () => {
  afterEach(() => jest.clearAllMocks());

  const sharedProject = {
    _id: PROJECT_ID,
    isPersonal: false,
    organization: ORG_ID,
  };

  test("Account Owner can manage anyone, including an Admin", async () => {
    mockOrgSelect(OWNER_ID);
    await expect(
      service.canManageMember(OWNER_ID, {
        project: sharedProject,
        role: "admin",
      }),
    ).resolves.toBe(true);
  });

  test("an Admin can manage a Viewer or Editor member", async () => {
    mockOrgSelect(OWNER_ID);
    ProjectMembership.findOne.mockResolvedValue({ role: "admin" });
    await expect(
      service.canManageMember(ADMIN_ID, {
        project: sharedProject,
        role: "viewer",
      }),
    ).resolves.toBe(true);
  });

  test("an Admin can never manage another Admin — only the Owner controls the Admin role", async () => {
    mockOrgSelect(OWNER_ID);
    ProjectMembership.findOne.mockResolvedValue({ role: "admin" });
    await expect(
      service.canManageMember(ADMIN_ID, {
        project: sharedProject,
        role: "admin",
      }),
    ).resolves.toBe(false);
  });

  test("an Editor cannot manage any member", async () => {
    mockOrgSelect(OWNER_ID);
    ProjectMembership.findOne.mockResolvedValue({ role: "editor" });
    await expect(
      service.canManageMember(EDITOR_ID, {
        project: sharedProject,
        role: "viewer",
      }),
    ).resolves.toBe(false);
  });
});

describe("projectAccessService.resolveReadScope", () => {
  afterEach(() => jest.clearAllMocks());

  const soloUser = { id: OTHER_ID, organization: null };
  const ownerUser = { id: OWNER_ID, organization: ORG_ID };
  const viewerUser = { id: OTHER_ID, organization: ORG_ID };

  test("solo (non-enterprise) accounts are unrestricted", async () => {
    await expect(
      service.resolveReadScope(soloUser, undefined),
    ).resolves.toEqual({});
    expect(Project.findOne).not.toHaveBeenCalled();
  });

  test("a requested project the caller can view resolves to a project filter", async () => {
    Project.findOne.mockResolvedValue({
      _id: PROJECT_ID,
      isPersonal: false,
      organization: ORG_ID,
    });
    ProjectMembership.findOne.mockResolvedValue({ role: "viewer" });
    await expect(
      service.resolveReadScope(viewerUser, PROJECT_ID),
    ).resolves.toEqual({ project: PROJECT_ID });
  });

  test("a project belonging to a different organization 404s rather than leaking", async () => {
    Project.findOne.mockResolvedValue(null);
    await expect(
      service.resolveReadScope(viewerUser, PROJECT_ID),
    ).rejects.toThrow(service.NotFoundError);
  });

  test("a malformed projectId 404s instead of a raw CastError/500", async () => {
    await expect(
      service.resolveReadScope(viewerUser, "not-a-valid-object-id"),
    ).rejects.toThrow(service.NotFoundError);
    expect(Project.findOne).not.toHaveBeenCalled();
  });

  test("a requested project the caller cannot access is rejected", async () => {
    Project.findOne.mockResolvedValue({
      _id: PROJECT_ID,
      isPersonal: false,
      organization: ORG_ID,
    });
    ProjectMembership.findOne.mockResolvedValue(null);
    await expect(
      service.resolveReadScope(viewerUser, PROJECT_ID),
    ).rejects.toThrow(service.ForbiddenError);
  });

  test('the Account Owner omitting projectId gets the org-wide "All projects" aggregate', async () => {
    mockOrgSelect(OWNER_ID);
    await expect(
      service.resolveReadScope(ownerUser, undefined),
    ).resolves.toEqual({ organization: ORG_ID });
  });

  test("a non-owner omitting projectId is rejected — they must always specify one", async () => {
    mockOrgSelect(OWNER_ID);
    await expect(
      service.resolveReadScope(viewerUser, undefined),
    ).rejects.toThrow(service.ValidationError);
  });
});

describe("projectAccessService.resolveWriteProject", () => {
  afterEach(() => jest.clearAllMocks());

  const soloUser = { id: OTHER_ID, organization: null };
  const editorUser = { id: EDITOR_ID, organization: ORG_ID };
  const viewerUser = { id: OTHER_ID, organization: ORG_ID };

  test("solo (non-enterprise) accounts are unrestricted and get no project", async () => {
    await expect(
      service.resolveWriteProject(soloUser, undefined),
    ).resolves.toBeNull();
  });

  test("an enterprise account must supply a projectId", async () => {
    await expect(
      service.resolveWriteProject(editorUser, undefined),
    ).rejects.toThrow(service.ValidationError);
  });

  test("an Editor can create resources in a project they can edit", async () => {
    Project.findOne.mockResolvedValue({
      _id: PROJECT_ID,
      isPersonal: false,
      organization: ORG_ID,
    });
    mockOrgSelect(OWNER_ID);
    ProjectMembership.findOne.mockResolvedValue({ role: "editor" });
    await expect(
      service.resolveWriteProject(editorUser, PROJECT_ID),
    ).resolves.toBe(PROJECT_ID);
  });

  test("a Viewer cannot create resources — no edit access", async () => {
    Project.findOne.mockResolvedValue({
      _id: PROJECT_ID,
      isPersonal: false,
      organization: ORG_ID,
    });
    mockOrgSelect(OWNER_ID);
    ProjectMembership.findOne.mockResolvedValue({ role: "viewer" });
    await expect(
      service.resolveWriteProject(viewerUser, PROJECT_ID),
    ).rejects.toThrow(service.ForbiddenError);
  });
});

describe("projectAccessService.assertCanViewResource / assertCanEditResource", () => {
  afterEach(() => jest.clearAllMocks());

  const soloUser = { id: OTHER_ID, organization: null };
  const ownerUser = { id: OWNER_ID, organization: ORG_ID };
  const editorUser = { id: EDITOR_ID, organization: ORG_ID };
  const viewerUser = { id: OTHER_ID, organization: ORG_ID };

  test("solo accounts are never restricted", async () => {
    await expect(
      service.assertCanViewResource(soloUser, { project: null }),
    ).resolves.toBeUndefined();
    await expect(
      service.assertCanEditResource(soloUser, { project: null }),
    ).resolves.toBeUndefined();
  });

  test("a resource with no project set is only visible/editable by the Account Owner", async () => {
    mockOrgSelect(OWNER_ID);
    await expect(
      service.assertCanViewResource(ownerUser, { project: null }),
    ).resolves.toBeUndefined();
    mockOrgSelect(OWNER_ID);
    await expect(
      service.assertCanEditResource(editorUser, { project: null }),
    ).rejects.toThrow(service.ForbiddenError);
  });

  test("a Viewer can view but not edit a resource in a project they belong to", async () => {
    const resource = { project: PROJECT_ID };
    Project.findById.mockResolvedValue({
      _id: PROJECT_ID,
      isPersonal: false,
      organization: ORG_ID,
    });
    ProjectMembership.findOne.mockResolvedValue({ role: "viewer" });
    await expect(
      service.assertCanViewResource(viewerUser, resource),
    ).resolves.toBeUndefined();

    Project.findById.mockResolvedValue({
      _id: PROJECT_ID,
      isPersonal: false,
      organization: ORG_ID,
    });
    ProjectMembership.findOne.mockResolvedValue({ role: "viewer" });
    await expect(
      service.assertCanEditResource(viewerUser, resource),
    ).rejects.toThrow(service.ForbiddenError);
  });

  test("an Editor can view and edit a resource in a project they belong to", async () => {
    const resource = { project: PROJECT_ID };
    Project.findById.mockResolvedValue({
      _id: PROJECT_ID,
      isPersonal: false,
      organization: ORG_ID,
    });
    ProjectMembership.findOne.mockResolvedValue({ role: "editor" });
    await expect(
      service.assertCanEditResource(editorUser, resource),
    ).resolves.toBeUndefined();
  });

  test("a user with no access to the resource's project is rejected", async () => {
    const resource = { project: PROJECT_ID };
    Project.findById.mockResolvedValue({
      _id: PROJECT_ID,
      isPersonal: false,
      organization: ORG_ID,
    });
    ProjectMembership.findOne.mockResolvedValue(null);
    await expect(
      service.assertCanViewResource(viewerUser, resource),
    ).rejects.toThrow(service.ForbiddenError);
  });
});

describe("projectAccessService.assertAccountLevelEditAccess", () => {
  afterEach(() => jest.clearAllMocks());

  const soloUser = { id: OTHER_ID, organization: null };
  const ownerUser = { id: OWNER_ID, organization: ORG_ID };
  const editorUser = { id: EDITOR_ID, organization: ORG_ID };
  const viewerUser = { id: OTHER_ID, organization: ORG_ID };

  test("solo (non-enterprise) accounts are unrestricted", async () => {
    await expect(
      service.assertAccountLevelEditAccess(soloUser, undefined),
    ).resolves.toBeUndefined();
  });

  test("the Account Owner may omit projectId — mirrors the All projects aggregate", async () => {
    mockOrgSelect(OWNER_ID);
    await expect(
      service.assertAccountLevelEditAccess(ownerUser, undefined),
    ).resolves.toBeUndefined();
  });

  test("a non-owner omitting projectId is rejected", async () => {
    mockOrgSelect(OWNER_ID);
    await expect(
      service.assertAccountLevelEditAccess(viewerUser, undefined),
    ).rejects.toThrow(service.ValidationError);
  });

  test("an Editor with edit access to the given project passes", async () => {
    Project.findOne.mockResolvedValue({
      _id: PROJECT_ID,
      isPersonal: false,
      organization: ORG_ID,
    });
    mockOrgSelect(OWNER_ID);
    ProjectMembership.findOne.mockResolvedValue({ role: "editor" });
    await expect(
      service.assertAccountLevelEditAccess(editorUser, PROJECT_ID),
    ).resolves.toBeUndefined();
  });

  test("a Viewer on the given project is rejected", async () => {
    Project.findOne.mockResolvedValue({
      _id: PROJECT_ID,
      isPersonal: false,
      organization: ORG_ID,
    });
    mockOrgSelect(OWNER_ID);
    ProjectMembership.findOne.mockResolvedValue({ role: "viewer" });
    await expect(
      service.assertAccountLevelEditAccess(viewerUser, PROJECT_ID),
    ).rejects.toThrow(service.ForbiddenError);
  });
});
