/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { expoGraphQLRequest, expoGraphQLRequestAllItems, resolveProjectId } from '../../transport';
import { QUERIES, MUTATIONS } from '../../constants/constants';

export async function create(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const projectId = this.getNodeParameter('projectId', index) as string;
	const branchName = this.getNodeParameter('branchName', index) as string;

	const resolvedProjectId = await resolveProjectId(this, projectId);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const response = await expoGraphQLRequest.call(this, MUTATIONS.CREATE_BRANCH, {
		appId: resolvedProjectId,
		name: branchName,
	}) as any;

	const branch = response?.updateBranch?.createUpdateBranchForApp;

	if (!branch) {
		throw new NodeOperationError(this.getNode(), 'Failed to create branch', { itemIndex: index });
	}

	return [{ json: branch }];
}

export async function get(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const projectId = this.getNodeParameter('projectId', index) as string;
	const branchName = this.getNodeParameter('branchName', index) as string;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const response = await expoGraphQLRequest.call(this, QUERIES.GET_BRANCH, {
		appId: projectId,
		branchName,
	}) as any;

	const branch = response?.app?.byFullName?.updateBranchByName;

	if (!branch) {
		throw new NodeOperationError(this.getNode(), `Branch not found: ${branchName}`, { itemIndex: index });
	}

	return [{ json: branch }];
}

export async function getMany(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const projectId = this.getNodeParameter('projectId', index) as string;
	const returnAll = this.getNodeParameter('returnAll', index, false) as boolean;

	const variables: IDataObject = {
		appId: projectId,
	};

	let branches;

	if (returnAll) {
		branches = await expoGraphQLRequestAllItems.call(
			this,
			QUERIES.GET_BRANCHES,
			variables,
			'app.byFullName.updateBranches',
		);
	} else {
		const limit = this.getNodeParameter('limit', index, 50) as number;
		branches = await expoGraphQLRequestAllItems.call(
			this,
			QUERIES.GET_BRANCHES,
			variables,
			'app.byFullName.updateBranches',
			limit,
		);
	}

	return branches.map((branch) => ({ json: branch as IDataObject }));
}

export async function update(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const branchId = this.getNodeParameter('branchId', index) as string;
	const newName = this.getNodeParameter('newName', index) as string;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const response = await expoGraphQLRequest.call(this, MUTATIONS.UPDATE_BRANCH, {
		branchId,
		name: newName,
	}) as any;

	const branch = response?.updateBranch?.editUpdateBranch;

	if (!branch) {
		throw new NodeOperationError(this.getNode(), `Failed to update branch: ${branchId}`, { itemIndex: index });
	}

	return [{ json: branch }];
}

export async function deleteBranch(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const branchId = this.getNodeParameter('branchId', index) as string;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const response = await expoGraphQLRequest.call(this, MUTATIONS.DELETE_BRANCH, { branchId }) as any;
	const deleted = response?.updateBranch?.deleteUpdateBranch;

	return [{ json: { success: !!deleted, branchId } }];
}

export async function getUpdates(
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

export async function publishToBranch(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const projectId = this.getNodeParameter('projectId', index) as string;
	const branchName = this.getNodeParameter('branchName', index) as string;
	const message = this.getNodeParameter('message', index, '') as string;
	const runtimeVersion = this.getNodeParameter('runtimeVersion', index, '') as string;

	// This would typically require the EAS CLI or upload mechanism
	// Simplified placeholder for the workflow
	return [{
		json: {
			projectId,
			branchName,
			message,
			runtimeVersion,
			note: 'OTA update publishing typically requires EAS CLI. This operation queues the request.',
		},
	}];
}
