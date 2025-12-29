const userService = require('../../services/userService');
const User = require('../../models/User');

// Mock User model
jest.mock('../../models/User');

describe('User Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUsersByRole', () => {
    test('should return users filtered by role', async () => {
      const mockUsers = [
        { _id: 'user1', email: 'admin1@example.com', role: 'admin' },
        { _id: 'user2', email: 'admin2@example.com', role: 'admin' }
      ];

      User.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            skip: jest.fn().mockResolvedValue(mockUsers)
          })
        })
      });

      User.countDocuments = jest.fn().mockResolvedValue(2);

      const result = await userService.getUsersByRole('admin', 1, 10);

      expect(User.find).toHaveBeenCalledWith({ role: 'admin' });
      expect(result.users).toEqual(mockUsers);
      expect(result.total).toBe(2);
    });

    test('should handle pagination correctly', async () => {
      User.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            skip: jest.fn().mockResolvedValue([])
          })
        })
      });

      User.countDocuments = jest.fn().mockResolvedValue(100);

      await userService.getUsersByRole('user', 3, 20);

      const skipCall = User.find().select().limit().skip;
      expect(skipCall).toHaveBeenCalledWith(40); // (page 3 - 1) * 20
    });

    test('should use default pagination values', async () => {
      User.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            skip: jest.fn().mockResolvedValue([])
          })
        })
      });

      User.countDocuments = jest.fn().mockResolvedValue(0);

      await userService.getUsersByRole('user');

      const limitCall = User.find().select().limit;
      expect(limitCall).toHaveBeenCalledWith(10); // default limit
    });
  });

  describe('updateUserRole', () => {
    test('should update user role successfully', async () => {
      const mockUser = {
        _id: 'user123',
        role: 'user',
        save: jest.fn().mockResolvedValue(true)
      };

      User.findById = jest.fn().mockResolvedValue(mockUser);

      const result = await userService.updateUserRole('user123', 'admin');

      expect(mockUser.role).toBe('admin');
      expect(mockUser.save).toHaveBeenCalled();
      expect(result.user.role).toBe('admin');
    });

    test('should return error when user not found', async () => {
      User.findById = jest.fn().mockResolvedValue(null);

      const result = await userService.updateUserRole('invalid-id', 'admin');

      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });

    test('should validate role before updating', async () => {
      const mockUser = {
        _id: 'user123',
        role: 'user',
        save: jest.fn()
      };

      User.findById = jest.fn().mockResolvedValue(mockUser);

      const result = await userService.updateUserRole('user123', 'invalid_role');

      expect(result.success).toBe(false);
      expect(mockUser.save).not.toHaveBeenCalled();
    });

    test('should handle all valid roles', async () => {
      const validRoles = ['user', 'viewer', 'editor', 'admin', 'super_admin'];

      for (const role of validRoles) {
        const mockUser = {
          _id: 'user123',
          role: 'user',
          save: jest.fn().mockResolvedValue(true)
        };

        User.findById = jest.fn().mockResolvedValue(mockUser);

        const result = await userService.updateUserRole('user123', role);

        expect(result.success).toBe(true);
        expect(mockUser.role).toBe(role);
      }
    });
  });

  describe('getUserStats', () => {
    test('should return user statistics', async () => {
      User.countDocuments = jest.fn()
        .mockResolvedValueOnce(100) // total users
        .mockResolvedValueOnce(50); // active users

      User.aggregate = jest.fn().mockResolvedValue([
        { _id: 'user', count: 70 },
        { _id: 'admin', count: 20 },
        { _id: 'editor', count: 10 }
      ]);

      const result = await userService.getUserStats();

      expect(result.totalUsers).toBe(100);
      expect(result.activeUsers).toBe(50);
      expect(result.roleDistribution).toHaveLength(3);
    });

    test('should handle empty database', async () => {
      User.countDocuments = jest.fn().mockResolvedValue(0);
      User.aggregate = jest.fn().mockResolvedValue([]);

      const result = await userService.getUserStats();

      expect(result.totalUsers).toBe(0);
      expect(result.roleDistribution).toEqual([]);
    });
  });

  describe('searchUsers', () => {
    test('should search users by email', async () => {
      const mockUsers = [
        { _id: 'user1', email: 'test@example.com' }
      ];

      User.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(mockUsers)
        })
      });

      const result = await userService.searchUsers('test@example.com');

      expect(User.find).toHaveBeenCalledWith(
        expect.objectContaining({
          email: expect.any(RegExp)
        })
      );
      expect(result).toEqual(mockUsers);
    });

    test('should search users by name', async () => {
      User.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([])
        })
      });

      await userService.searchUsers('John');

      expect(User.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: expect.arrayContaining([
            expect.objectContaining({ firstName: expect.any(RegExp) }),
            expect.objectContaining({ lastName: expect.any(RegExp) })
          ])
        })
      );
    });

    test('should be case-insensitive', async () => {
      User.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([])
        })
      });

      await userService.searchUsers('TEST');

      const findCall = User.find.mock.calls[0][0];
      const emailRegex = findCall.email || findCall.$or[0].email;
      
      expect(emailRegex.toString()).toContain('i'); // case-insensitive flag
    });

    test('should limit results', async () => {
      User.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([])
        })
      });

      await userService.searchUsers('test', 5);

      const limitCall = User.find().select().limit;
      expect(limitCall).toHaveBeenCalledWith(5);
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors in getUsersByRole', async () => {
      User.find = jest.fn().mockImplementation(() => {
        throw new Error('Database error');
      });

      await expect(userService.getUsersByRole('user')).rejects.toThrow();
    });

    test('should handle database errors in updateUserRole', async () => {
      User.findById = jest.fn().mockRejectedValue(new Error('Database error'));

      const result = await userService.updateUserRole('user123', 'admin');

      expect(result.success).toBe(false);
      expect(result.message).toContain('error');
    });

    test('should handle save errors', async () => {
      const mockUser = {
        _id: 'user123',
        role: 'user',
        save: jest.fn().mockRejectedValue(new Error('Save failed'))
      };

      User.findById = jest.fn().mockResolvedValue(mockUser);

      const result = await userService.updateUserRole('user123', 'admin');

      expect(result.success).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    test('should handle very large page numbers', async () => {
      User.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            skip: jest.fn().mockResolvedValue([])
          })
        })
      });

      User.countDocuments = jest.fn().mockResolvedValue(10);

      await userService.getUsersByRole('user', 1000, 10);

      const skipCall = User.find().select().limit().skip;
      expect(skipCall).toHaveBeenCalledWith(9990);
    });

    test('should handle empty search query', async () => {
      User.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([])
        })
      });

      await userService.searchUsers('');

      expect(User.find).toHaveBeenCalled();
    });

    test('should handle special characters in search', async () => {
      User.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([])
        })
      });

      await userService.searchUsers('test+special@example.com');

      expect(User.find).toHaveBeenCalled();
    });

    test('should handle null userId in updateUserRole', async () => {
      const result = await userService.updateUserRole(null, 'admin');

      expect(result.success).toBe(false);
    });

    test('should handle undefined role in updateUserRole', async () => {
      const mockUser = {
        _id: 'user123',
        role: 'user',
        save: jest.fn()
      };

      User.findById = jest.fn().mockResolvedValue(mockUser);

      const result = await userService.updateUserRole('user123', undefined);

      expect(result.success).toBe(false);
      expect(mockUser.save).not.toHaveBeenCalled();
    });
  });
});