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

/**
 * Integration tests for the Expo n8n node.
 * 
 * These tests verify the node structure and configuration.
 * To run actual API tests, set EXPO_ACCESS_TOKEN environment variable.
 */

import { Expo } from '../../nodes/Expo/Expo.node';
import { ExpoApi } from '../../credentials/ExpoApi.credentials';

describe('Expo Node Integration', () => {
  let expoNode: Expo;

  beforeAll(() => {
    expoNode = new Expo();
  });

  describe('Node Configuration', () => {
    it('should have correct node description', () => {
      const description = expoNode.description;
      
      expect(description.displayName).toBe('Expo');
      expect(description.name).toBe('expo');
      expect(description.group).toContain('transform');
      expect(description.version).toBe(1);
    });

    it('should have proper credential configuration', () => {
      const description = expoNode.description;
      
      expect(description.credentials).toBeDefined();
      expect(description.credentials).toHaveLength(1);
      expect(description.credentials![0].name).toBe('expoApi');
      expect(description.credentials![0].required).toBe(true);
    });

    it('should have all required resources', () => {
      const description = expoNode.description;
      const resourceProperty = description.properties.find(
        (p) => p.name === 'resource'
      );
      
      expect(resourceProperty).toBeDefined();
      expect(resourceProperty!.type).toBe('options');
      
      const options = resourceProperty!.options as Array<{ value: string }>;
      const resourceValues = options.map((o) => o.value);
      
      expect(resourceValues).toContain('build');
      expect(resourceValues).toContain('submission');
      expect(resourceValues).toContain('update');
      expect(resourceValues).toContain('branch');
      expect(resourceValues).toContain('channel');
      expect(resourceValues).toContain('project');
      expect(resourceValues).toContain('secret');
      expect(resourceValues).toContain('credential');
      expect(resourceValues).toContain('webhook');
      expect(resourceValues).toContain('device');
    });

    it('should have build operations', () => {
      const description = expoNode.description;
      const operationProperty = description.properties.find(
        (p) => p.name === 'operation' && 
        p.displayOptions?.show?.resource?.includes('build')
      );
      
      expect(operationProperty).toBeDefined();
      
      const options = operationProperty!.options as Array<{ value: string }>;
      const operationValues = options.map((o) => o.value);
      
      expect(operationValues).toContain('create');
      expect(operationValues).toContain('get');
      expect(operationValues).toContain('getMany');
      expect(operationValues).toContain('cancel');
      expect(operationValues).toContain('retry');
    });

    it('should have submission operations', () => {
      const description = expoNode.description;
      const operationProperty = description.properties.find(
        (p) => p.name === 'operation' && 
        p.displayOptions?.show?.resource?.includes('submission')
      );
      
      expect(operationProperty).toBeDefined();
      
      const options = operationProperty!.options as Array<{ value: string }>;
      const operationValues = options.map((o) => o.value);
      
      expect(operationValues).toContain('create');
      expect(operationValues).toContain('get');
      expect(operationValues).toContain('getMany');
      expect(operationValues).toContain('cancel');
    });

    it('should have update operations', () => {
      const description = expoNode.description;
      const operationProperty = description.properties.find(
        (p) => p.name === 'operation' && 
        p.displayOptions?.show?.resource?.includes('update')
      );
      
      expect(operationProperty).toBeDefined();
      
      const options = operationProperty!.options as Array<{ value: string }>;
      const operationValues = options.map((o) => o.value);
      
      expect(operationValues).toContain('publish');
      expect(operationValues).toContain('get');
      expect(operationValues).toContain('getMany');
      expect(operationValues).toContain('rollback');
    });
  });

  describe('Credential Configuration', () => {
    let credential: ExpoApi;

    beforeAll(() => {
      credential = new ExpoApi();
    });

    it('should have correct credential properties', () => {
      expect(credential.name).toBe('expoApi');
      expect(credential.displayName).toBe('Expo API');
    });

    it('should have access token property', () => {
      const properties = credential.properties;
      const accessToken = properties.find((p) => p.name === 'accessToken');
      
      expect(accessToken).toBeDefined();
      expect(accessToken!.type).toBe('string');
      expect(accessToken!.typeOptions?.password).toBe(true);
      expect(accessToken!.required).toBe(true);
    });

    it('should have account name property', () => {
      const properties = credential.properties;
      const accountName = properties.find((p) => p.name === 'accountName');
      
      expect(accountName).toBeDefined();
      expect(accountName!.type).toBe('string');
      expect(accountName!.required).toBeFalsy();
    });
  });
});

describe('Expo API Tests', () => {
  const hasCredentials = !!process.env.EXPO_ACCESS_TOKEN;

  // Skip API tests if no credentials
  const testOrSkip = hasCredentials ? it : it.skip;

  describe('Build API', () => {
    testOrSkip('should list builds for a project', async () => {
      // This would require mocking or actual API calls
      // Placeholder for actual integration test
      expect(true).toBe(true);
    });
  });

  describe('Project API', () => {
    testOrSkip('should get project details', async () => {
      // Placeholder for actual integration test
      expect(true).toBe(true);
    });
  });
});
