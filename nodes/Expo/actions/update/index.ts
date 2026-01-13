/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { expoGraphQLRequest, expoGraphQLRequestAllItems, expoRestRequest } from '../../transport';
import { QUERIES, MUTATIONS } from '../../constants/constants';
import { filterEmptyValues } from '../../utils/helpers';

export async function publish(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const projectId = this.getNodeParameter('projectId', index) as string;
	const branchName = this.getNodeParameter('branchName', index) as string;
	const additionalFields = this.getNodeParameter('additionalFields', index, {}) as IDataObject;

	// OTA updates are typically published via EAS CLI or REST API
	// This is a placeholder for the REST endpoint
	const body = filterEmptyValues({
		projectId,
		branchName,
		message: additionalFields.message as string,
		runtimeVersion: additionalFields.runtimeVersion as string,
		platform: additionalFields.platform as string,
		gitCommitHash: additionalFields.gitCommitHash as string,
	});

	// Note: The actual publish endpoint may require file uploads
	// This simplified version creates a publish request
	const response = await expoRestRequest.call(
		this,
		'POST',
		`/projects/${projectId}/updates`,
		body,
	);

	return [{ json: response as IDataObject }];
}

export async function get(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const updateId = this.getNodeParameter('updateId', index) as string;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const response = await expoGraphQLRequest.call(this, QUERIES.GET_UPDATE, { updateId }) as any;
	const update = response?.update?.byId;

	if (!update) {
		throw new NodeOperationError(this.getNode(), `Update not found: ${updateId}`, { itemIndex: index });
	}

	return [{ json: update }];
}

export async function getMany(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const projectId = this.getNodeParameter('projectId', index) as string;
	const branchName = this.getNodeParameter('branchName', index) as string;
	const returnAll = this.getNodeParameter('returnAll', index, false) as boolean;

	const variables: IDataObject = {
		appId: projectId,
		branchName,
	};

	let updates;

	if (returnAll) {
		updates = await expoGraphQLRequestAllItems.call(
			this,
			QUERIES.GET_UPDATES_BY_BRANCH,
			variables,
			'app.byFullName.updateBranchByName.updates',
		);
	} else {
		const limit = this.getNodeParameter('limit', index, 50) as number;
		updates = await expoGraphQLRequestAllItems.call(
			this,
			QUERIES.GET_UPDATES_BY_BRANCH,
			variables,
			'app.byFullName.updateBranchByName.updates',
			limit,
		);
	}

	return updates.map((update) => ({ json: update as IDataObject }));
}

export async function rollback(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const projectId = this.getNodeParameter('projectId', index) as string;
	const branchName = this.getNodeParameter('branchName', index) as string;

	// Rollback is performed via REST API
	const response = await expoRestRequest.call(
		this,
		'POST',
		`/projects/${projectId}/branches/${encodeURIComponent(branchName)}/rollback`,
	);

	return [{ json: response as IDataObject }];
}

export async function deleteUpdate(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const updateId = this.getNodeParameter('updateId', index) as string;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const response = await expoGraphQLRequest.call(this, MUTATIONS.DELETE_UPDATE, { updateId }) as any;
	const deleted = response?.update?.deleteUpdate;

	return [{ json: { success: !!deleted, updateId } }];
}

export async function republish(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const updateGroupId = this.getNodeParameter('updateGroupId', index) as string;
	const branchName = this.getNodeParameter('branchName', index) as string;

	// Republish is typically done by publishing the same update group to a new branch
	const response = await expoRestRequest.call(
		this,
		'POST',
		`/updates/${updateGroupId}/republish`,
		{ branchName },
	);

	return [{ json: response as IDataObject }];
}

export async function getManifest(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const updateId = this.getNodeParameter('updateId', index) as string;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const response = await expoGraphQLRequest.call(this, QUERIES.GET_UPDATE, { updateId }) as any;
	const update = response?.update?.byId;

	if (!update) {
		throw new NodeOperationError(this.getNode(), `Update not found: ${updateId}`, { itemIndex: index });
	}

	return [{
		json: {
			updateId,
			manifestPermalink: update.manifestPermalink,
			runtimeVersion: update.runtimeVersion,
			platform: update.platform,
		},
	}];
}
