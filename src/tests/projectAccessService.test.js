'use strict';

jest.mock('../models/Organization', () => ({
  findById: jest.fn()
}));
jest.mock('../models/Project', () => ({
  findById: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn()
}));
jest.mock('../models/ProjectMembership', () => ({
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  find: jest.fn(),
  deleteOne: jest.fn(),
  deleteMany: jest.fn()
}));
jest.mock('../models/ProjectInvitation', () => ({
  create: jest.fn(),
  findOne: jest.fn()
}));
jest.mock('../models/User', () => ({
  findById: jest.fn()
}));
jest.mock('../services/emailService', () => ({
  sendInvitationEmail: jest.fn().mockResolvedValue(undefined)
}));

const Organization = require('../models/Organization');
const ProjectMembership = require('../models/ProjectMembership');
const service = require('../services/projectAccessService');

const OWNER_ID = 'owner-user-id';
const ADMIN_ID = 'admin-user-id';
const EDITOR_ID = 'editor-user-id';
const OTHER_ID = 'other-user-id';
const ORG_ID = 'org-id';
const PROJECT_ID = 'project-id';

const mockOrgSelect = (owner) => {
  Organization.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({ owner: { toString: () => owner } }) });
};

describe('projectAccessService.isAccountOwner', () => {
  afterEach(() => jest.clearAllMocks());

  test('returns true when Organization.owner matches the given user', async () => {
    mockOrgSelect(OWNER_ID);
    await expect(service.isAccountOwner(OWNER_ID, ORG_ID)).resolves.toBe(true);
  });

  test('returns false for anyone else, even an Admin', async () => {
    mockOrgSelect(OWNER_ID);
    await expect(service.isAccountOwner(ADMIN_ID, ORG_ID)).resolves.toBe(false);
  });

  test('returns false when the organization does not exist', async () => {
    Organization.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
    await expect(service.isAccountOwner(OWNER_ID, ORG_ID)).resolves.toBe(false);
  });
});

describe('projectAccessService.getEffectiveRole', () => {
  afterEach(() => jest.clearAllMocks());

  const sharedProject = { _id: PROJECT_ID, isPersonal: false, organization: ORG_ID };

  test('Account Owner is implicitly "owner" on every shared project — never a membership row', async () => {
    mockOrgSelect(OWNER_ID);
    const role = await service.getEffectiveRole(OWNER_ID, sharedProject);
    expect(role).toBe('owner');
  });

  test('falls back to the ProjectMembership role for non-owners', async () => {
    mockOrgSelect(OWNER_ID);
    ProjectMembership.findOne.mockResolvedValue({ role: 'editor' });
    await expect(service.getEffectiveRole(EDITOR_ID, sharedProject)).resolves.toBe('editor');
  });

  test('returns null when the user has no membership and is not the Owner', async () => {
    mockOrgSelect(OWNER_ID);
    ProjectMembership.findOne.mockResolvedValue(null);
    await expect(service.getEffectiveRole(OTHER_ID, sharedProject)).resolves.toBeNull();
  });

  test('a personal project is only accessible to its own owner — even the Account Owner is denied', async () => {
    const personalProject = {
      _id: 'personal-1',
      isPersonal: true,
      personalOwnerUser: { toString: () => EDITOR_ID },
      organization: ORG_ID
    };

    await expect(service.getEffectiveRole(EDITOR_ID, personalProject)).resolves.toBe('personal-owner');
    await expect(service.getEffectiveRole(OWNER_ID, personalProject)).resolves.toBeNull();
    expect(Organization.findById).not.toHaveBeenCalled();
  });
});

describe('projectAccessService.assignableRolesForProject', () => {
  afterEach(() => jest.clearAllMocks());

  const sharedProject = { _id: PROJECT_ID, isPersonal: false, organization: ORG_ID };

  test('Account Owner can assign admin, editor, or viewer', async () => {
    mockOrgSelect(OWNER_ID);
    await expect(service.assignableRolesForProject(OWNER_ID, sharedProject)).resolves.toEqual([
      'admin', 'editor', 'viewer'
    ]);
  });

  test('a project Admin can only assign editor or viewer — never admin', async () => {
    mockOrgSelect(OWNER_ID);
    ProjectMembership.findOne.mockResolvedValue({ role: 'admin' });
    await expect(service.assignableRolesForProject(ADMIN_ID, sharedProject)).resolves.toEqual([
      'editor', 'viewer'
    ]);
  });

  test('an Editor cannot assign any role', async () => {
    mockOrgSelect(OWNER_ID);
    ProjectMembership.findOne.mockResolvedValue({ role: 'editor' });
    await expect(service.assignableRolesForProject(EDITOR_ID, sharedProject)).resolves.toEqual([]);
  });
});

describe('projectAccessService.canManageMember', () => {
  afterEach(() => jest.clearAllMocks());

  const sharedProject = { _id: PROJECT_ID, isPersonal: false, organization: ORG_ID };

  test('Account Owner can manage anyone, including an Admin', async () => {
    mockOrgSelect(OWNER_ID);
    await expect(
      service.canManageMember(OWNER_ID, { project: sharedProject, role: 'admin' })
    ).resolves.toBe(true);
  });

  test('an Admin can manage a Viewer or Editor member', async () => {
    mockOrgSelect(OWNER_ID);
    ProjectMembership.findOne.mockResolvedValue({ role: 'admin' });
    await expect(
      service.canManageMember(ADMIN_ID, { project: sharedProject, role: 'viewer' })
    ).resolves.toBe(true);
  });

  test('an Admin can never manage another Admin — only the Owner controls the Admin role', async () => {
    mockOrgSelect(OWNER_ID);
    ProjectMembership.findOne.mockResolvedValue({ role: 'admin' });
    await expect(
      service.canManageMember(ADMIN_ID, { project: sharedProject, role: 'admin' })
    ).resolves.toBe(false);
  });

  test('an Editor cannot manage any member', async () => {
    mockOrgSelect(OWNER_ID);
    ProjectMembership.findOne.mockResolvedValue({ role: 'editor' });
    await expect(
      service.canManageMember(EDITOR_ID, { project: sharedProject, role: 'viewer' })
    ).resolves.toBe(false);
  });
});
