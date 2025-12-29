const {
  checkPermission,
  requireRoles,
  requireSuperAdmin,
  requireAdminOrAbove,
  requireEditorOrAbove
} = require('../../middleware/permissions');

// Mock User model
jest.mock('../../models/User');
const User = require('../../models/User');

describe('Permissions Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: {
        id: 'user123',
        role: 'user'
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('checkPermission', () => {
    test('should allow access when user has permission', async () => {
      const mockUser = {
        _id: 'user123',
        role: 'admin',
        hasPermission: jest.fn().mockReturnValue(true),
        permissions: { urls: { create: true } }
      };

      User.findById = jest.fn().mockResolvedValue(mockUser);

      const middleware = checkPermission('urls', 'create');
      await middleware(req, res, next);

      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(mockUser.hasPermission).toHaveBeenCalledWith('urls', 'create');
      expect(next).toHaveBeenCalled();
      expect(req.userPermissions).toEqual({ urls: { create: true } });
      expect(req.userRole).toBe('admin');
    });

    test('should deny access when user lacks permission', async () => {
      const mockUser = {
        _id: 'user123',
        role: 'viewer',
        hasPermission: jest.fn().mockReturnValue(false)
      };

      User.findById = jest.fn().mockResolvedValue(mockUser);

      const middleware = checkPermission('urls', 'delete');
      await middleware(req, res, next);

      expect(mockUser.hasPermission).toHaveBeenCalledWith('urls', 'delete');
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("don't have permission"),
          requiredPermission: 'urls.delete',
          userRole: 'viewer'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 401 when user is not authenticated', async () => {
      req.user = null;

      const middleware = checkPermission('urls', 'create');
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Authentication required'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 401 when user is not found in database', async () => {
      User.findById = jest.fn().mockResolvedValue(null);

      const middleware = checkPermission('urls', 'create');
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'User not found'
        })
      );
    });

    test('should handle database errors', async () => {
      User.findById = jest.fn().mockRejectedValue(new Error('DB Error'));

      const middleware = checkPermission('urls', 'create');
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Permission validation failed'
        })
      );
    });

    test('should check different resources and actions', async () => {
      const testCases = [
        { resource: 'domains', action: 'verify' },
        { resource: 'analytics', action: 'export' },
        { resource: 'qrCodes', action: 'customize' },
        { resource: 'users', action: 'delete' }
      ];

      for (const { resource, action } of testCases) {
        const mockUser = {
          hasPermission: jest.fn().mockReturnValue(true),
          permissions: {}
        };
        User.findById = jest.fn().mockResolvedValue(mockUser);

        const middleware = checkPermission(resource, action);
        await middleware(req, res, next);

        expect(mockUser.hasPermission).toHaveBeenCalledWith(resource, action);
      }
    });
  });

  describe('requireRoles', () => {
    test('should allow access when user has required role', () => {
      req.user.role = 'admin';

      const middleware = requireRoles(['admin', 'super_admin']);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should allow access with single role string', () => {
      req.user.role = 'admin';

      const middleware = requireRoles('admin');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('should deny access when user lacks required role', () => {
      req.user.role = 'user';

      const middleware = requireRoles(['admin', 'super_admin']);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Insufficient permissions'),
          requiredRoles: ['admin', 'super_admin'],
          userRole: 'user'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 401 when user is not authenticated', () => {
      req.user = null;

      const middleware = requireRoles(['admin']);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Authentication required'
        })
      );
    });

    test('should handle editor role', () => {
      req.user.role = 'editor';

      const middleware = requireRoles(['editor', 'admin']);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('should handle viewer role', () => {
      req.user.role = 'viewer';

      const middleware = requireRoles(['viewer', 'editor', 'admin']);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('requireSuperAdmin', () => {
    test('should allow access for super_admin', () => {
      req.user.role = 'super_admin';

      requireSuperAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('should deny access for admin', () => {
      req.user.role = 'admin';

      requireSuperAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          requiredRoles: ['super_admin'],
          userRole: 'admin'
        })
      );
    });

    test('should deny access for regular user', () => {
      req.user.role = 'user';

      requireSuperAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('requireAdminOrAbove', () => {
    test('should allow access for super_admin', () => {
      req.user.role = 'super_admin';

      requireAdminOrAbove(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('should allow access for admin', () => {
      req.user.role = 'admin';

      requireAdminOrAbove(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('should deny access for editor', () => {
      req.user.role = 'editor';

      requireAdminOrAbove(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    test('should deny access for viewer', () => {
      req.user.role = 'viewer';

      requireAdminOrAbove(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    test('should deny access for user', () => {
      req.user.role = 'user';

      requireAdminOrAbove(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('requireEditorOrAbove', () => {
    test('should allow access for super_admin', () => {
      req.user.role = 'super_admin';

      requireEditorOrAbove(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('should allow access for admin', () => {
      req.user.role = 'admin';

      requireEditorOrAbove(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('should allow access for editor', () => {
      req.user.role = 'editor';

      requireEditorOrAbove(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('should deny access for viewer', () => {
      req.user.role = 'viewer';

      requireEditorOrAbove(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    test('should deny access for user', () => {
      req.user.role = 'user';

      requireEditorOrAbove(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('Edge Cases and Integration', () => {
    test('should handle undefined role', () => {
      req.user.role = undefined;

      const middleware = requireRoles(['admin']);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    test('should handle empty roles array', () => {
      req.user.role = 'admin';

      const middleware = requireRoles([]);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    test('should handle case-sensitive role comparison', () => {
      req.user.role = 'Admin'; // Wrong case

      const middleware = requireRoles(['admin']);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    test('should attach permissions to request object', async () => {
      const mockPermissions = {
        urls: { create: true, read: true },
        domains: { create: false }
      };

      const mockUser = {
        hasPermission: jest.fn().mockReturnValue(true),
        permissions: mockPermissions,
        role: 'editor'
      };

      User.findById = jest.fn().mockResolvedValue(mockUser);

      const middleware = checkPermission('urls', 'create');
      await middleware(req, res, next);

      expect(req.userPermissions).toEqual(mockPermissions);
      expect(req.userRole).toBe('editor');
    });
  });
});