/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { expoGraphQLRequest, resolveProjectId } from '../../transport';
import { QUERIES, MUTATIONS } from '../../constants/constants';
import { filterEmptyValues } from '../../utils/helpers';

export async function create(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const projectId = this.getNodeParameter('projectId', index) as string;
	const secretName = this.getNodeParameter('secretName', index) as string;
	const secretValue = this.getNodeParameter('secretValue', index) as string;
	const additionalFields = this.getNodeParameter('additionalFields', index, {}) as IDataObject;

	const resolvedProjectId = await resolveProjectId(this, projectId);

	const variables = filterEmptyValues({
		appId: resolvedProjectId,
		name: secretName,
		value: secretValue,
		type: additionalFields.secretType as string,
	});

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const response = await expoGraphQLRequest.call(this, MUTATIONS.CREATE_SECRET, variables) as any;
	const secret = response?.environmentSecret?.createEnvironmentSecretForApp;

	if (!secret) {
		throw new NodeOperationError(this.getNode(), 'Failed to create secret', { itemIndex: index });
	}

	return [{ json: secret }];
}

export async function get(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const projectId = this.getNodeParameter('projectId', index) as string;
	const secretName = this.getNodeParameter('secretName', index) as string;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const response = await expoGraphQLRequest.call(this, QUERIES.GET_SECRETS, { appId: projectId }) as any;
	const secrets = response?.app?.byFullName?.environmentSecrets || [];

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const secret = secrets.find((s: any) => s.name === secretName);

	if (!secret) {
		throw new NodeOperationError(this.getNode(), `Secret not found: ${secretName}`, { itemIndex: index });
	}

	return [{ json: secret }];
}

export async function getMany(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const projectId = this.getNodeParameter('projectId', index) as string;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const response = await expoGraphQLRequest.call(this, QUERIES.GET_SECRETS, { appId: projectId }) as any;
	const secrets = response?.app?.byFullName?.environmentSecrets || [];

	return secrets.map((secret: IDataObject) => ({ json: secret }));
}

export async function update(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const secretId = this.getNodeParameter('secretId', index) as string;
	const secretValue = this.getNodeParameter('secretValue', index) as string;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const response = await expoGraphQLRequest.call(this, MUTATIONS.UPDATE_SECRET, {
		secretId,
		value: secretValue,
	}) as any;

	const secret = response?.environmentSecret?.updateEnvironmentSecret;

	if (!secret) {
		throw new NodeOperationError(this.getNode(), `Failed to update secret: ${secretId}`, { itemIndex: index });
	}

	return [{ json: secret }];
}

export async function deleteSecret(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const secretId = this.getNodeParameter('secretId', index) as string;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const response = await expoGraphQLRequest.call(this, MUTATIONS.DELETE_SECRET, { secretId }) as any;
	const deleted = response?.environmentSecret?.deleteEnvironmentSecret;

	return [{ json: { success: !!deleted, secretId } }];
}

export async function createBuildSecret(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const projectId = this.getNodeParameter('projectId', index) as string;
	const secretName = this.getNodeParameter('secretName', index) as string;
	const secretValue = this.getNodeParameter('secretValue', index) as string;

	const resolvedProjectId = await resolveProjectId(this, projectId);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const response = await expoGraphQLRequest.call(this, MUTATIONS.CREATE_SECRET, {
		appId: resolvedProjectId,
		name: secretName,
		value: secretValue,
		type: 'BUILD',
	}) as any;

	const secret = response?.environmentSecret?.createEnvironmentSecretForApp;

	if (!secret) {
		throw new NodeOperationError(this.getNode(), 'Failed to create build secret', { itemIndex: index });
	}

	return [{ json: { ...secret, secretType: 'build' } }];
}

export async function createUpdateSecret(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const projectId = this.getNodeParameter('projectId', index) as string;
	const secretName = this.getNodeParameter('secretName', index) as string;
	const secretValue = this.getNodeParameter('secretValue', index) as string;

	const resolvedProjectId = await resolveProjectId(this, projectId);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const response = await expoGraphQLRequest.call(this, MUTATIONS.CREATE_SECRET, {
		appId: resolvedProjectId,
		name: secretName,
		value: secretValue,
		type: 'UPDATE',
	}) as any;

	const secret = response?.environmentSecret?.createEnvironmentSecretForApp;

	if (!secret) {
		throw new NodeOperationError(this.getNode(), 'Failed to create update secret', { itemIndex: index });
	}

	return [{ json: { ...secret, secretType: 'update' } }];
}
