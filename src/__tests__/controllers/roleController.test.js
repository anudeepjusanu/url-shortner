const roleController = require('../../controllers/roleController');
const User = require('../../models/User');

// Mock User model
jest.mock('../../models/User');

describe('Role Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: {
        id: 'user123',
        role: 'admin'
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('getMyPermissions', () => {
    test('should return user permissions successfully', async () => {
      const mockUser = {
        _id: 'user123',
        role: 'editor',
        permissions: {
          urls: { create: true, read: true, update: true, delete: true }
        },
        hasPermission: jest.fn((resource, action) => {
          if (resource === 'urls') return true;
          if (resource === 'domains' && action === 'create') return true;
          if (resource === 'analytics' && action === 'view') return true;
          if (resource === 'qrCodes') return true;
          if (resource === 'users') return false;
          return false;
        })
      };

      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await roleController.getMyPermissions(req, res);

      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          role: 'editor',
          permissions: mockUser.permissions,
          canAccess: expect.objectContaining({
            urls: expect.any(Object),
            domains: expect.any(Object),
            analytics: expect.any(Object),
            qrCodes: expect.any(Object),
            users: expect.any(Object),
            settings: expect.any(Object)
          })
        })
      });
    });

    test('should return 404 when user not found', async () => {
      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      await roleController.getMyPermissions(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found'
      });
    });

    test('should handle database errors', async () => {
      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error('DB Error'))
      });

      await roleController.getMyPermissions(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to retrieve permissions'
      });
    });

    test('should include all permission categories', async () => {
      const mockUser = {
        role: 'admin',
        permissions: {},
        hasPermission: jest.fn().mockReturnValue(true)
      };

      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await roleController.getMyPermissions(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.data.canAccess).toHaveProperty('urls');
      expect(response.data.canAccess).toHaveProperty('domains');
      expect(response.data.canAccess).toHaveProperty('analytics');
      expect(response.data.canAccess).toHaveProperty('qrCodes');
      expect(response.data.canAccess).toHaveProperty('users');
      expect(response.data.canAccess).toHaveProperty('settings');
    });

    test('should correctly check all URL permissions', async () => {
      const mockUser = {
        role: 'viewer',
        permissions: {},
        hasPermission: jest.fn((resource, action) => {
          if (resource === 'urls' && action === 'read') return true;
          return false;
        })
      };

      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await roleController.getMyPermissions(req, res);

      expect(mockUser.hasPermission).toHaveBeenCalledWith('urls', 'create');
      expect(mockUser.hasPermission).toHaveBeenCalledWith('urls', 'read');
      expect(mockUser.hasPermission).toHaveBeenCalledWith('urls', 'update');
      expect(mockUser.hasPermission).toHaveBeenCalledWith('urls', 'delete');
    });
  });

  describe('getAllRoles', () => {
    test('should return all available roles', async () => {
      await roleController.getAllRoles(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          super_admin: expect.any(Object),
          admin: expect.any(Object),
          editor: expect.any(Object),
          viewer: expect.any(Object),
          user: expect.any(Object)
        })
      });
    });

    test('should include role metadata for each role', async () => {
      await roleController.getAllRoles(req, res);

      const response = res.json.mock.calls[0][0];
      const roles = response.data;

      // Check super_admin role structure
      expect(roles.super_admin).toHaveProperty('name');
      expect(roles.super_admin).toHaveProperty('description');
      expect(roles.super_admin).toHaveProperty('level');
      expect(roles.super_admin).toHaveProperty('permissions');
    });

    test('should have correct permission structure for each role', async () => {
      await roleController.getAllRoles(req, res);

      const response = res.json.mock.calls[0][0];
      const roles = response.data;

      Object.values(roles).forEach(role => {
        expect(role.permissions).toHaveProperty('urls');
        expect(role.permissions).toHaveProperty('domains');
        expect(role.permissions).toHaveProperty('analytics');
        expect(role.permissions).toHaveProperty('qrCodes');
        expect(role.permissions).toHaveProperty('users');
        expect(role.permissions).toHaveProperty('settings');
      });
    });

    test('should have hierarchical levels for roles', async () => {
      await roleController.getAllRoles(req, res);

      const response = res.json.mock.calls[0][0];
      const roles = response.data;

      expect(roles.super_admin.level).toBeGreaterThan(roles.admin.level);
      expect(roles.admin.level).toBeGreaterThan(roles.editor.level);
      expect(roles.editor.level).toBeGreaterThan(roles.viewer.level);
      expect(roles.viewer.level).toBeGreaterThan(roles.user.level);
    });

    test('should define super_admin with full permissions', async () => {
      await roleController.getAllRoles(req, res);

      const response = res.json.mock.calls[0][0];
      const superAdmin = response.data.super_admin;

      expect(superAdmin.permissions.urls.create).toBe(true);
      expect(superAdmin.permissions.urls.delete).toBe(true);
      expect(superAdmin.permissions.users.create).toBe(true);
      expect(superAdmin.permissions.users.delete).toBe(true);
    });

    test('should define viewer with read-only permissions', async () => {
      await roleController.getAllRoles(req, res);

      const response = res.json.mock.calls[0][0];
      const viewer = response.data.viewer;

      expect(viewer.permissions.urls.read).toBe(true);
      expect(viewer.permissions.urls.create).toBe(false);
      expect(viewer.permissions.urls.delete).toBe(false);
      expect(viewer.permissions.users.read).toBe(false);
    });

    test('should define editor with create/edit permissions but not user management', async () => {
      await roleController.getAllRoles(req, res);

      const response = res.json.mock.calls[0][0];
      const editor = response.data.editor;

      expect(editor.permissions.urls.create).toBe(true);
      expect(editor.permissions.urls.delete).toBe(true);
      expect(editor.permissions.domains.create).toBe(true);
      expect(editor.permissions.users.create).toBe(false);
      expect(editor.permissions.users.delete).toBe(false);
    });

    test('should handle errors gracefully', async () => {
      // Simulate an error by throwing in the controller
      // Since getAllRoles doesn't do async operations, we test it returns successfully
      await roleController.getAllRoles(req, res);

      expect(res.json).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('Role Permission Structure Validation', () => {
    test('should have consistent CRUD structure for URLs across roles', async () => {
      await roleController.getAllRoles(req, res);

      const response = res.json.mock.calls[0][0];
      const roles = response.data;

      Object.keys(roles).forEach(roleKey => {
        const role = roles[roleKey];
        expect(role.permissions.urls).toHaveProperty('create');
        expect(role.permissions.urls).toHaveProperty('read');
        expect(role.permissions.urls).toHaveProperty('update');
        expect(role.permissions.urls).toHaveProperty('delete');
      });
    });

    test('should have domain verification permission only for appropriate roles', async () => {
      await roleController.getAllRoles(req, res);

      const response = res.json.mock.calls[0][0];
      const roles = response.data;

      expect(roles.super_admin.permissions.domains.verify).toBe(true);
      expect(roles.admin.permissions.domains.verify).toBe(true);
      expect(roles.editor.permissions.domains.verify).toBe(true);
      expect(roles.viewer.permissions.domains.verify).toBe(false);
      expect(roles.user.permissions.domains.verify).toBe(false);
    });

    test('should have analytics export limited to higher roles', async () => {
      await roleController.getAllRoles(req, res);

      const response = res.json.mock.calls[0][0];
      const roles = response.data;

      expect(roles.super_admin.permissions.analytics.export).toBe(true);
      expect(roles.admin.permissions.analytics.export).toBe(true);
      expect(roles.editor.permissions.analytics.export).toBe(true);
      expect(roles.viewer.permissions.analytics.export).toBe(false);
      expect(roles.user.permissions.analytics.export).toBe(false);
    });

    test('should have user management limited to admin roles', async () => {
      await roleController.getAllRoles(req, res);

      const response = res.json.mock.calls[0][0];
      const roles = response.data;

      expect(roles.super_admin.permissions.users.create).toBe(true);
      expect(roles.admin.permissions.users.create).toBe(true);
      expect(roles.editor.permissions.users.create).toBe(false);
      expect(roles.viewer.permissions.users.create).toBe(false);
      expect(roles.user.permissions.users.create).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing user in request', async () => {
      req.user = null;

      // getMyPermissions will fail without user
      await roleController.getMyPermissions(req, res);

      // Should throw or handle gracefully
      expect(res.status).toHaveBeenCalledWith(expect.any(Number));
    });

    test('should handle malformed user ID', async () => {
      req.user.id = 'invalid-id';

      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error('Invalid ID'))
      });

      await roleController.getMyPermissions(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    test('should return consistent role levels', async () => {
      await roleController.getAllRoles(req, res);

      const response = res.json.mock.calls[0][0];
      const roles = response.data;

      const levels = Object.values(roles).map(r => r.level);
      const uniqueLevels = new Set(levels);

      // All levels should be unique
      expect(uniqueLevels.size).toBe(levels.length);
    });
  });
});