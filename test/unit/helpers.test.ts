/**
 * [Velocity BPA Licensing Notice]
 *
 * This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
 *
 * Use of this node by for-profit organizations in production environments
 * requires a commercial license from Velocity BPA.
 *
 * For licensing information, visit https://velobpa.com/licensing
 * or contact licensing@velobpa.com.
 */

import {
  verifyWebhookSignature,
  filterEmptyValues,
  normalizePlatform,
  normalizeBuildStatus,
  simplifyConnection,
  isValidUdid,
  isValidBundleIdentifier,
  formatProjectId,
  parseProjectSlug,
} from '../../nodes/Expo/utils/helpers';

describe('Expo Helpers', () => {
  describe('verifyWebhookSignature', () => {
    it('should verify valid signature', () => {
      const payload = '{"event":"build.finished"}';
      const secret = 'test-secret';
      // Pre-computed HMAC-SHA1 signature
      const crypto = require('crypto');
      const expectedSignature = 'sha1=' + crypto
        .createHmac('sha1', secret)
        .update(payload)
        .digest('hex');
      
      expect(verifyWebhookSignature(payload, expectedSignature, secret)).toBe(true);
    });

    it('should reject invalid signature', () => {
      const payload = '{"event":"build.finished"}';
      const secret = 'test-secret';
      const invalidSignature = 'sha1=invalid';
      
      expect(verifyWebhookSignature(payload, invalidSignature, secret)).toBe(false);
    });

    it('should reject empty signature', () => {
      const payload = '{"event":"build.finished"}';
      const secret = 'test-secret';
      
      expect(verifyWebhookSignature(payload, '', secret)).toBe(false);
    });
  });

  describe('filterEmptyValues', () => {
    it('should remove null and undefined values', () => {
      const input = {
        name: 'test',
        value: null,
        count: 0,
        empty: undefined,
        bool: false,
      };
      
      const result = filterEmptyValues(input);
      
      expect(result).toEqual({
        name: 'test',
        count: 0,
        bool: false,
      });
    });

    it('should handle empty object', () => {
      expect(filterEmptyValues({})).toEqual({});
    });

    it('should preserve empty strings', () => {
      const input = { name: '', value: 'test' };
      const result = filterEmptyValues(input);
      expect(result).toEqual({ name: '', value: 'test' });
    });
  });

  describe('normalizePlatform', () => {
    it('should normalize ios to uppercase', () => {
      expect(normalizePlatform('ios')).toBe('IOS');
      expect(normalizePlatform('iOS')).toBe('IOS');
      expect(normalizePlatform('IOS')).toBe('IOS');
    });

    it('should normalize android to uppercase', () => {
      expect(normalizePlatform('android')).toBe('ANDROID');
      expect(normalizePlatform('Android')).toBe('ANDROID');
      expect(normalizePlatform('ANDROID')).toBe('ANDROID');
    });

    it('should handle all platform', () => {
      expect(normalizePlatform('all')).toBe('ALL');
    });
  });

  describe('normalizeBuildStatus', () => {
    it('should normalize build statuses', () => {
      expect(normalizeBuildStatus('new')).toBe('NEW');
      expect(normalizeBuildStatus('in_queue')).toBe('IN_QUEUE');
      expect(normalizeBuildStatus('in_progress')).toBe('IN_PROGRESS');
      expect(normalizeBuildStatus('finished')).toBe('FINISHED');
      expect(normalizeBuildStatus('errored')).toBe('ERRORED');
      expect(normalizeBuildStatus('canceled')).toBe('CANCELED');
    });
  });

  describe('simplifyConnection', () => {
    it('should extract nodes from GraphQL connection', () => {
      const connection = {
        edges: [
          { node: { id: '1', name: 'first' }, cursor: 'cursor1' },
          { node: { id: '2', name: 'second' }, cursor: 'cursor2' },
        ],
        pageInfo: {
          hasNextPage: false,
          endCursor: 'cursor2',
        },
      };
      
      const result = simplifyConnection(connection);
      
      expect(result).toEqual([
        { id: '1', name: 'first' },
        { id: '2', name: 'second' },
      ]);
    });

    it('should handle empty connection', () => {
      const connection = {
        edges: [],
        pageInfo: { hasNextPage: false },
      };
      
      expect(simplifyConnection(connection)).toEqual([]);
    });

    it('should handle null/undefined', () => {
      expect(simplifyConnection(null)).toEqual([]);
      expect(simplifyConnection(undefined)).toEqual([]);
    });
  });

  describe('isValidUdid', () => {
    it('should validate correct UDIDs', () => {
      // 40-character hex (older devices)
      expect(isValidUdid('a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2')).toBe(true);
      
      // UUID format (newer devices)
      expect(isValidUdid('00000000-0000-0000-0000-000000000000')).toBe(true);
      expect(isValidUdid('A1B2C3D4-E5F6-A1B2-C3D4-E5F6A1B2C3D4')).toBe(true);
    });

    it('should reject invalid UDIDs', () => {
      expect(isValidUdid('')).toBe(false);
      expect(isValidUdid('invalid')).toBe(false);
      expect(isValidUdid('12345')).toBe(false);
      expect(isValidUdid('not-a-valid-udid-format')).toBe(false);
    });
  });

  describe('isValidBundleIdentifier', () => {
    it('should validate correct bundle identifiers', () => {
      expect(isValidBundleIdentifier('com.example.app')).toBe(true);
      expect(isValidBundleIdentifier('com.company.MyApp')).toBe(true);
      expect(isValidBundleIdentifier('io.expo.client')).toBe(true);
    });

    it('should reject invalid bundle identifiers', () => {
      expect(isValidBundleIdentifier('')).toBe(false);
      expect(isValidBundleIdentifier('invalid')).toBe(false);
      expect(isValidBundleIdentifier('com.')).toBe(false);
      expect(isValidBundleIdentifier('.com.app')).toBe(false);
    });
  });

  describe('formatProjectId', () => {
    it('should format project ID from account and project name', () => {
      expect(formatProjectId('myaccount', 'myproject')).toBe('@myaccount/myproject');
    });

    it('should handle already formatted IDs', () => {
      expect(formatProjectId('@account', 'project')).toBe('@account/project');
    });
  });

  describe('parseProjectSlug', () => {
    it('should parse project slug', () => {
      expect(parseProjectSlug('@account/project')).toEqual({
        account: 'account',
        project: 'project',
      });
    });

    it('should return null for invalid slugs', () => {
      expect(parseProjectSlug('invalid')).toBeNull();
      expect(parseProjectSlug('')).toBeNull();
    });

    it('should return null for UUIDs', () => {
      expect(parseProjectSlug('a1b2c3d4-e5f6-a1b2-c3d4-e5f6a1b2c3d4')).toBeNull();
    });
  });
});
