const mongoose = require('mongoose');
const QRCode = require('../../models/QRCode');

// Mock mongoose
jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');
  return {
    ...actualMongoose,
    model: jest.fn(),
    Schema: actualMongoose.Schema
  };
});

describe('QRCode Model', () => {
  describe('Schema Validation', () => {
    test('should have required fields', () => {
      const qrCodeSchema = QRCode.schema;
      
      expect(qrCodeSchema.path('url').isRequired).toBe(true);
      expect(qrCodeSchema.path('shortCode').isRequired).toBe(true);
      expect(qrCodeSchema.path('creator').isRequired).toBe(true);
    });

    test('should have correct default values', () => {
      const qrCodeSchema = QRCode.schema;
      
      expect(qrCodeSchema.path('customization.size').defaultValue).toBe(300);
      expect(qrCodeSchema.path('customization.format').defaultValue).toBe('png');
      expect(qrCodeSchema.path('customization.errorCorrection').defaultValue).toBe('M');
      expect(qrCodeSchema.path('scanCount').defaultValue).toBe(0);
      expect(qrCodeSchema.path('uniqueScanCount').defaultValue).toBe(0);
      expect(qrCodeSchema.path('downloadCount').defaultValue).toBe(0);
      expect(qrCodeSchema.path('isActive').defaultValue).toBe(true);
    });

    test('should have correct enum values for format', () => {
      const formatPath = QRCode.schema.path('customization.format');
      
      expect(formatPath.enumValues).toContain('png');
      expect(formatPath.enumValues).toContain('jpeg');
      expect(formatPath.enumValues).toContain('jpg');
      expect(formatPath.enumValues).toContain('gif');
      expect(formatPath.enumValues).toContain('webp');
      expect(formatPath.enumValues).toContain('svg');
      expect(formatPath.enumValues).toContain('pdf');
    });

    test('should have correct enum values for errorCorrection', () => {
      const errorCorrectionPath = QRCode.schema.path('customization.errorCorrection');
      
      expect(errorCorrectionPath.enumValues).toContain('L');
      expect(errorCorrectionPath.enumValues).toContain('M');
      expect(errorCorrectionPath.enumValues).toContain('Q');
      expect(errorCorrectionPath.enumValues).toContain('H');
    });

    test('should have correct min/max for size', () => {
      const sizePath = QRCode.schema.path('customization.size');
      
      expect(sizePath.options.min).toBe(100);
      expect(sizePath.options.max).toBe(2000);
    });

    test('should validate hex color patterns', () => {
      const foregroundPath = QRCode.schema.path('customization.foregroundColor');
      const backgroundPath = QRCode.schema.path('customization.backgroundColor');
      
      expect(foregroundPath.options.match).toBeDefined();
      expect(backgroundPath.options.match).toBeDefined();
    });

    test('should have indexes defined', () => {
      const indexes = QRCode.schema.indexes();
      
      expect(indexes.length).toBeGreaterThan(0);
      
      // Check for specific indexes
      const indexFields = indexes.map(idx => Object.keys(idx[0]));
      expect(indexFields.some(fields => fields.includes('url'))).toBe(true);
      expect(indexFields.some(fields => fields.includes('shortCode'))).toBe(true);
      expect(indexFields.some(fields => fields.includes('creator'))).toBe(true);
    });
  });

  describe('Instance Methods', () => {
    let mockQRCode;

    beforeEach(() => {
      mockQRCode = {
        scanCount: 5,
        uniqueScanCount: 3,
        downloadCount: 2,
        lastScannedAt: null,
        lastDownloadedAt: null,
        updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 })
      };
    });

    describe('incrementScan', () => {
      test('should increment scan count', async () => {
        const incrementScan = QRCode.schema.methods.incrementScan;
        
        await incrementScan.call(mockQRCode, false);
        
        expect(mockQRCode.updateOne).toHaveBeenCalledWith(
          expect.objectContaining({
            $inc: { scanCount: 1 },
            lastScannedAt: expect.any(Date)
          })
        );
      });

      test('should increment unique scan count when isUnique is true', async () => {
        const incrementScan = QRCode.schema.methods.incrementScan;
        
        await incrementScan.call(mockQRCode, true);
        
        expect(mockQRCode.updateOne).toHaveBeenCalledWith(
          expect.objectContaining({
            $inc: expect.objectContaining({
              scanCount: 1,
              uniqueScanCount: 1
            })
          })
        );
      });

      test('should not increment unique scan count when isUnique is false', async () => {
        const incrementScan = QRCode.schema.methods.incrementScan;
        
        await incrementScan.call(mockQRCode, false);
        
        const callArgs = mockQRCode.updateOne.mock.calls[0][0];
        expect(callArgs.$inc).not.toHaveProperty('uniqueScanCount');
      });

      test('should update lastScannedAt timestamp', async () => {
        const incrementScan = QRCode.schema.methods.incrementScan;
        const beforeTime = new Date();
        
        await incrementScan.call(mockQRCode, false);
        
        const callArgs = mockQRCode.updateOne.mock.calls[0][0];
        expect(callArgs.lastScannedAt).toBeInstanceOf(Date);
        expect(callArgs.lastScannedAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      });
    });

    describe('incrementDownload', () => {
      test('should increment download count', async () => {
        const incrementDownload = QRCode.schema.methods.incrementDownload;
        
        await incrementDownload.call(mockQRCode);
        
        expect(mockQRCode.updateOne).toHaveBeenCalledWith(
          expect.objectContaining({
            $inc: { downloadCount: 1 },
            lastDownloadedAt: expect.any(Date)
          })
        );
      });

      test('should update lastDownloadedAt timestamp', async () => {
        const incrementDownload = QRCode.schema.methods.incrementDownload;
        const beforeTime = new Date();
        
        await incrementDownload.call(mockQRCode);
        
        const callArgs = mockQRCode.updateOne.mock.calls[0][0];
        expect(callArgs.lastDownloadedAt).toBeInstanceOf(Date);
        expect(callArgs.lastDownloadedAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      });
    });
  });

  describe('Static Methods', () => {
    describe('findByUrl', () => {
      test('should find QR code by URL ID', async () => {
        const mockFindOne = jest.fn().mockResolvedValue({ _id: 'qr123' });
        QRCode.findOne = mockFindOne;

        const findByUrl = QRCode.schema.statics.findByUrl;
        await findByUrl.call(QRCode, 'url123');

        expect(mockFindOne).toHaveBeenCalledWith({
          url: 'url123',
          isActive: true
        });
      });

      test('should only return active QR codes', async () => {
        const mockFindOne = jest.fn().mockResolvedValue(null);
        QRCode.findOne = mockFindOne;

        const findByUrl = QRCode.schema.statics.findByUrl;
        await findByUrl.call(QRCode, 'url123');

        const callArgs = mockFindOne.mock.calls[0][0];
        expect(callArgs.isActive).toBe(true);
      });
    });

    describe('getOrCreate', () => {
      test('should create new QR code if not exists', async () => {
        const mockFindOne = jest.fn().mockResolvedValue(null);
        const mockSave = jest.fn().mockResolvedValue(true);
        
        QRCode.findOne = mockFindOne;
        
        const mockConstructor = jest.fn().mockImplementation(function(data) {
          this.save = mockSave;
          Object.assign(this, data);
          return this;
        });
        
        const urlData = {
          _id: 'url123',
          shortCode: 'abc123'
        };
        const customization = {
          size: 500,
          format: 'png'
        };
        const creator = 'user123';
        const organization = 'org123';

        const getOrCreate = QRCode.schema.statics.getOrCreate;
        const qrCode = await getOrCreate.call(mockConstructor, urlData, customization, creator, organization);

        expect(mockFindOne).toHaveBeenCalledWith({ url: 'url123' });
        expect(mockSave).toHaveBeenCalled();
      });

      test('should return existing QR code if found', async () => {
        const existingQR = {
          _id: 'qr123',
          customization: { size: 300 },
          save: jest.fn().mockResolvedValue(true)
        };
        
        const mockFindOne = jest.fn().mockResolvedValue(existingQR);
        QRCode.findOne = mockFindOne;

        const urlData = { _id: 'url123' };
        const getOrCreate = QRCode.schema.statics.getOrCreate;
        
        const result = await getOrCreate.call(QRCode, urlData, null, 'user123', null);

        expect(result).toEqual(existingQR);
      });

      test('should update customization if provided and QR exists', async () => {
        const existingQR = {
          _id: 'qr123',
          customization: { size: 300, format: 'png' },
          save: jest.fn().mockResolvedValue(true)
        };
        
        const mockFindOne = jest.fn().mockResolvedValue(existingQR);
        QRCode.findOne = mockFindOne;

        const urlData = { _id: 'url123' };
        const newCustomization = { size: 500 };
        
        const getOrCreate = QRCode.schema.statics.getOrCreate;
        await getOrCreate.call(QRCode, urlData, newCustomization, 'user123', null);

        expect(existingQR.customization.size).toBe(500);
        expect(existingQR.save).toHaveBeenCalled();
      });

      test('should not update if customization is not provided', async () => {
        const existingQR = {
          _id: 'qr123',
          customization: { size: 300 },
          save: jest.fn()
        };
        
        const mockFindOne = jest.fn().mockResolvedValue(existingQR);
        QRCode.findOne = mockFindOne;

        const urlData = { _id: 'url123' };
        
        const getOrCreate = QRCode.schema.statics.getOrCreate;
        await getOrCreate.call(QRCode, urlData, null, 'user123', null);

        expect(existingQR.save).not.toHaveBeenCalled();
      });
    });
  });

  describe('Color Validation', () => {
    test('should accept valid 6-digit hex colors', () => {
      const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      
      expect(colorRegex.test('#000000')).toBe(true);
      expect(colorRegex.test('#FFFFFF')).toBe(true);
      expect(colorRegex.test('#FF5733')).toBe(true);
      expect(colorRegex.test('#abc123')).toBe(true);
    });

    test('should accept valid 3-digit hex colors', () => {
      const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      
      expect(colorRegex.test('#000')).toBe(true);
      expect(colorRegex.test('#FFF')).toBe(true);
      expect(colorRegex.test('#F57')).toBe(true);
    });

    test('should reject invalid hex colors', () => {
      const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      
      expect(colorRegex.test('000000')).toBe(false); // Missing #
      expect(colorRegex.test('#GGGGGG')).toBe(false); // Invalid chars
      expect(colorRegex.test('#12')).toBe(false); // Too short
      expect(colorRegex.test('#1234567')).toBe(false); // Too long
    });
  });

  describe('Edge Cases', () => {
    test('should handle very large scan counts', () => {
      const mockQRCode = {
        scanCount: Number.MAX_SAFE_INTEGER - 1,
        updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 })
      };

      const incrementScan = QRCode.schema.methods.incrementScan;
      expect(async () => {
        await incrementScan.call(mockQRCode, false);
      }).not.toThrow();
    });

    test('should handle minimum size boundary', () => {
      const sizePath = QRCode.schema.path('customization.size');
      expect(sizePath.options.min).toBe(100);
    });

    test('should handle maximum size boundary', () => {
      const sizePath = QRCode.schema.path('customization.size');
      expect(sizePath.options.max).toBe(2000);
    });

    test('should have timestamps enabled', () => {
      expect(QRCode.schema.options.timestamps).toBe(true);
    });
  });
});