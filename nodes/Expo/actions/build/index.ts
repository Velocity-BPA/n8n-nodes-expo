/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { expoGraphQLRequest, expoGraphQLRequestAllItems } from '../../transport';
import { QUERIES, MUTATIONS } from '../../constants/constants';
import { filterEmptyValues, normalizePlatform, normalizeBuildStatus } from '../../utils/helpers';

export async function create(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const projectId = this.getNodeParameter('projectId', index) as string;
	const platform = this.getNodeParameter('platform', index) as string;
	const additionalFields = this.getNodeParameter('additionalFields', index, {}) as IDataObject;

	const variables = filterEmptyValues({
		appId: projectId,
		platform: normalizePlatform(platform),
		buildProfile: additionalFields.buildProfile as string,
		channel: additionalFields.channel as string,
		gitCommitHash: additionalFields.gitCommitHash as string,
	});

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const response = await expoGraphQLRequest.call(this, MUTATIONS.CREATE_BUILD, variables) as any;
	const build = response?.build?.createBuildForApp;

	if (!build) {
		throw new NodeOperationError(this.getNode(), 'Failed to create build', { itemIndex: index });
	}

	return [{ json: build }];
}

export async function get(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const buildId = this.getNodeParameter('buildId', index) as string;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const response = await expoGraphQLRequest.call(this, QUERIES.GET_BUILD, { buildId }) as any;
	const build = response?.builds?.byId;

	if (!build) {
		throw new NodeOperationError(this.getNode(), `Build not found: ${buildId}`, { itemIndex: index });
	}

	return [{ json: build }];
}

export async function getMany(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const projectId = this.getNodeParameter('projectId', index) as string;
	const returnAll = this.getNodeParameter('returnAll', index, false) as boolean;
	const filters = this.getNodeParameter('filters', index, {}) as IDataObject;

	const variables: IDataObject = {
		appId: projectId,
	};

	if (filters.platform) {
		variables.platform = normalizePlatform(filters.platform as string);
	}

	if (filters.status) {
		variables.status = normalizeBuildStatus(filters.status as string);
	}

	let builds;

	if (returnAll) {
		builds = await expoGraphQLRequestAllItems.call(
			this,
			QUERIES.GET_BUILDS,
			variables,
			'app.byFullName.builds',
		);
	} else {
		const limit = this.getNodeParameter('limit', index, 50) as number;
		builds = await expoGraphQLRequestAllItems.call(
			this,
			QUERIES.GET_BUILDS,
			variables,
			'app.byFullName.builds',
			limit,
		);
	}

	return builds.map((build) => ({ json: build as IDataObject }));
}

export async function cancel(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const buildId = this.getNodeParameter('buildId', index) as string;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const response = await expoGraphQLRequest.call(this, MUTATIONS.CANCEL_BUILD, { buildId }) as any;
	const build = response?.build?.cancel;

	if (!build) {
		throw new NodeOperationError(this.getNode(), `Failed to cancel build: ${buildId}`, { itemIndex: index });
	}

	return [{ json: build }];
}

export async function retry(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const buildId = this.getNodeParameter('buildId', index) as string;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const response = await expoGraphQLRequest.call(this, MUTATIONS.RETRY_BUILD, { buildId }) as any;
	const build = response?.build?.retry;

	if (!build) {
		throw new NodeOperationError(this.getNode(), `Failed to retry build: ${buildId}`, { itemIndex: index });
	}

	return [{ json: build }];
}

export async function deleteBuild(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const buildId = this.getNodeParameter('buildId', index) as string;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const response = await expoGraphQLRequest.call(this, MUTATIONS.DELETE_BUILD, { buildId }) as any;
	const deleted = response?.build?.deleteBuild;

	return [{ json: { success: !!deleted, buildId } }];
}

export async function getArtifacts(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const buildId = this.getNodeParameter('buildId', index) as string;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const response = await expoGraphQLRequest.call(this, QUERIES.GET_BUILD, { buildId }) as any;
	const build = response?.builds?.byId;

	if (!build) {
		throw new NodeOperationError(this.getNode(), `Build not found: ${buildId}`, { itemIndex: index });
	}

	const artifacts = build.artifacts || {};

	return [{ json: { buildId, ...artifacts } }];
}

export async function getLogs(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const buildId = this.getNodeParameter('buildId', index) as string;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const response = await expoGraphQLRequest.call(this, QUERIES.GET_BUILD_LOGS, { buildId }) as any;
	const build = response?.builds?.byId;

	if (!build) {
		throw new NodeOperationError(this.getNode(), `Build not found: ${buildId}`, { itemIndex: index });
	}

	const logsInfo = {
		buildId,
		logsS3KeyPrefix: build.artifacts?.logsS3KeyPrefix,
	};

	return [{ json: logsInfo }];
}
