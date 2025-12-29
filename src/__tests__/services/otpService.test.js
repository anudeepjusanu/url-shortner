const { sendOtp, verifyOtp } = require('../../services/otpService');
const axios = require('axios');

// Mock axios
jest.mock('axios');

describe('OTP Service', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe('sendOtp', () => {
    test('should send OTP via email successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'OTP sent successfully'
        }
      };

      axios.post.mockResolvedValueOnce(mockResponse);

      const result = await sendOtp({
        email: 'test@example.com',
        otp: '123456',
        method: 'email',
        template_id: 31
      });

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/send-otp'),
        expect.objectContaining({
          method: 'email',
          template_id: 31,
          otp: '123456',
          email: 'test@example.com'
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept': 'application/json',
            'X-Authorization': expect.any(String),
            'Content-Type': 'application/json'
          })
        })
      );

      expect(result.data.success).toBe(true);
    });

    test('should use default email method and template_id', async () => {
      const mockResponse = {
        data: { success: true }
      };

      axios.post.mockResolvedValueOnce(mockResponse);

      await sendOtp({
        email: 'test@example.com',
        otp: '123456'
      });

      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'email',
          template_id: 31
        }),
        expect.any(Object)
      );
    });

    test('should send OTP via SMS with fallback email', async () => {
      const mockResponse = {
        data: { success: true }
      };

      axios.post.mockResolvedValueOnce(mockResponse);

      await sendOtp({
        email: 'test@example.com',
        otp: '123456',
        method: 'sms'
      });

      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'sms',
          fallback_email: 'test@example.com',
          otp: '123456'
        }),
        expect.any(Object)
      );
    });

    test('should log OTP to console in development mode', async () => {
      process.env.NODE_ENV = 'development';

      const mockResponse = {
        data: { success: true }
      };

      axios.post.mockResolvedValueOnce(mockResponse);

      await sendOtp({
        email: 'test@example.com',
        otp: '123456',
        method: 'email'
      });

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('OTP SENT'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('123456'));
    });

    test('should allow login in dev mode even if Authentica fails', async () => {
      process.env.NODE_ENV = 'development';

      axios.post.mockRejectedValueOnce(new Error('Network error'));

      const result = await sendOtp({
        email: 'test@example.com',
        otp: '123456'
      });

      expect(result.data.success).toBe(true);
      expect(result.data.message).toContain('OTP logged to console');
      expect(console.warn).toHaveBeenCalled();
    });

    test('should throw error in production if Authentica fails', async () => {
      process.env.NODE_ENV = 'production';

      const error = new Error('Authentica API Error');
      error.response = {
        data: { message: 'Invalid API key' }
      };

      axios.post.mockRejectedValueOnce(error);

      await expect(sendOtp({
        email: 'test@example.com',
        otp: '123456'
      })).rejects.toThrow();

      expect(console.error).toHaveBeenCalled();
    });

    test('should handle API error response', async () => {
      const error = new Error('API Error');
      error.response = {
        data: {
          success: false,
          message: 'Rate limit exceeded'
        }
      };

      axios.post.mockRejectedValueOnce(error);

      process.env.NODE_ENV = 'development';

      const result = await sendOtp({
        email: 'test@example.com',
        otp: '123456'
      });

      expect(result.data.success).toBe(true);
    });

    test('should handle network timeout', async () => {
      process.env.NODE_ENV = 'development';

      axios.post.mockRejectedValueOnce(new Error('ETIMEDOUT'));

      const result = await sendOtp({
        email: 'test@example.com',
        otp: '123456'
      });

      expect(result.data.success).toBe(true);
    });

    test('should include proper headers in API request', async () => {
      axios.post.mockResolvedValueOnce({ data: { success: true } });

      await sendOtp({
        email: 'test@example.com',
        otp: '123456'
      });

      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        {
          headers: {
            'Accept': 'application/json',
            'X-Authorization': expect.any(String),
            'Content-Type': 'application/json'
          }
        }
      );
    });

    test('should log payload in console', async () => {
      axios.post.mockResolvedValueOnce({ data: { success: true } });

      await sendOtp({
        email: 'test@example.com',
        otp: '123456',
        method: 'email'
      });

      expect(console.log).toHaveBeenCalledWith(
        'Authentica payload:',
        expect.stringContaining('email')
      );
    });
  });

  describe('verifyOtp', () => {
    test('should verify OTP successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'OTP verified'
        }
      };

      axios.post.mockResolvedValueOnce(mockResponse);

      const result = await verifyOtp({
        email: 'test@example.com',
        otp: '123456'
      });

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/verify-otp'),
        expect.objectContaining({
          email: 'test@example.com',
          otp: '123456'
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept': 'application/json',
            'X-Authorization': expect.any(String),
            'Content-Type': 'application/json'
          })
        })
      );

      expect(result.data.success).toBe(true);
    });

    test('should handle invalid OTP', async () => {
      const error = new Error('Invalid OTP');
      error.response = {
        data: {
          success: false,
          message: 'Invalid or expired OTP'
        }
      };

      axios.post.mockRejectedValueOnce(error);

      await expect(verifyOtp({
        email: 'test@example.com',
        otp: '000000'
      })).rejects.toThrow();
    });

    test('should handle expired OTP', async () => {
      const error = new Error('Expired OTP');
      error.response = {
        data: {
          success: false,
          message: 'OTP has expired'
        }
      };

      axios.post.mockRejectedValueOnce(error);

      await expect(verifyOtp({
        email: 'test@example.com',
        otp: '123456'
      })).rejects.toThrow();
    });

    test('should handle network errors during verification', async () => {
      axios.post.mockRejectedValueOnce(new Error('Network error'));

      await expect(verifyOtp({
        email: 'test@example.com',
        otp: '123456'
      })).rejects.toThrow('Network error');
    });

    test('should include proper headers in verification request', async () => {
      axios.post.mockResolvedValueOnce({ data: { success: true } });

      await verifyOtp({
        email: 'test@example.com',
        otp: '123456'
      });

      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        {
          headers: {
            'Accept': 'application/json',
            'X-Authorization': expect.any(String),
            'Content-Type': 'application/json'
          }
        }
      );
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty email', async () => {
      axios.post.mockResolvedValueOnce({ data: { success: true } });

      await sendOtp({
        email: '',
        otp: '123456'
      });

      expect(axios.post).toHaveBeenCalled();
    });

    test('should handle special characters in email', async () => {
      axios.post.mockResolvedValueOnce({ data: { success: true } });

      await sendOtp({
        email: 'test+tag@example.com',
        otp: '123456'
      });

      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          email: 'test+tag@example.com'
        }),
        expect.any(Object)
      );
    });

    test('should handle 6-digit OTP', async () => {
      axios.post.mockResolvedValueOnce({ data: { success: true } });

      await sendOtp({
        email: 'test@example.com',
        otp: '123456'
      });

      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          otp: '123456'
        }),
        expect.any(Object)
      );
    });

    test('should handle custom template ID', async () => {
      axios.post.mockResolvedValueOnce({ data: { success: true } });

      await sendOtp({
        email: 'test@example.com',
        otp: '123456',
        template_id: 99
      });

      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          template_id: 99
        }),
        expect.any(Object)
      );
    });
  });
});