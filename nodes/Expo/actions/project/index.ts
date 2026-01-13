/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { expoGraphQLRequest, expoGraphQLRequestAllItems, resolveProjectId, getCredentialsWithAccount } from '../../transport';
import { QUERIES, MUTATIONS } from '../../constants/constants';
import { filterEmptyValues } from '../../utils/helpers';

export async function get(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const projectId = this.getNodeParameter('projectId', index) as string;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const response = await expoGraphQLRequest.call(this, QUERIES.GET_PROJECT, { appId: projectId }) as any;
	const project = response?.app?.byFullName;

	if (!project) {
		throw new NodeOperationError(this.getNode(), `Project not found: ${projectId}`, { itemIndex: index });
	}

	return [{ json: project }];
}

export async function getMany(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const accountNameParam = this.getNodeParameter('accountName', index, '') as string;
	const returnAll = this.getNodeParameter('returnAll', index, false) as boolean;

	const { accountName } = await getCredentialsWithAccount(this, accountNameParam);

	const variables: IDataObject = {
		accountName,
	};

	let projects;

	if (returnAll) {
		projects = await expoGraphQLRequestAllItems.call(
			this,
			QUERIES.GET_PROJECTS,
			variables,
			'account.byName.apps',
		);
	} else {
		const limit = this.getNodeParameter('limit', index, 50) as number;
		projects = await expoGraphQLRequestAllItems.call(
			this,
			QUERIES.GET_PROJECTS,
			variables,
			'account.byName.apps',
			limit,
		);
	}

	return projects.map((project) => ({ json: project as IDataObject }));
}

export async function create(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const projectName = this.getNodeParameter('projectName', index) as string;
	const additionalFields = this.getNodeParameter('additionalFields', index, {}) as IDataObject;

	// Get account ID first
	const accountNameParam = additionalFields.accountName as string || '';
	const { accountName } = await getCredentialsWithAccount(this, accountNameParam);

	// Get account ID from account name
	const accountQuery = `
		query GetAccountId($accountName: String!) {
			account {
				byName(accountName: $accountName) {
					id
				}
			}
		}
	`;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const accountResponse = await expoGraphQLRequest.call(this, accountQuery, { accountName }) as any;
	const accountId = accountResponse?.account?.byName?.id;

	if (!accountId) {
		throw new NodeOperationError(this.getNode(), `Account not found: ${accountName}`, { itemIndex: index });
	}

	const variables = filterEmptyValues({
		accountId,
		projectName,
		privacy: additionalFields.privacy as string,
	});

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const response = await expoGraphQLRequest.call(this, MUTATIONS.CREATE_PROJECT, variables) as any;
	const project = response?.app?.createApp;

	if (!project) {
		throw new NodeOperationError(this.getNode(), 'Failed to create project', { itemIndex: index });
	}

	return [{ json: project }];
}

export async function update(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const projectId = this.getNodeParameter('projectId', index) as string;
	const updateFields = this.getNodeParameter('updateFields', index, {}) as IDataObject;

	const resolvedProjectId = await resolveProjectId(this, projectId);

	const variables = filterEmptyValues({
		appId: resolvedProjectId,
		privacy: updateFields.privacy as string,
		description: updateFields.description as string,
	});

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const response = await expoGraphQLRequest.call(this, MUTATIONS.UPDATE_PROJECT, variables) as any;
	const project = response?.app?.editApp;

	if (!project) {
		throw new NodeOperationError(this.getNode(), `Failed to update project: ${projectId}`, { itemIndex: index });
	}

	return [{ json: project }];
}

export async function deleteProject(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const projectId = this.getNodeParameter('projectId', index) as string;

	const resolvedProjectId = await resolveProjectId(this, projectId);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const response = await expoGraphQLRequest.call(this, MUTATIONS.DELETE_PROJECT, { appId: resolvedProjectId }) as any;
	const deleted = response?.app?.deleteApp;

	return [{ json: { success: !!deleted, projectId } }];
}

export async function getBuilds(
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
		variables.platform = (filters.platform as string).toUpperCase();
	}

	if (filters.status) {
		variables.status = (filters.status as string).toUpperCase();
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

export async function getSubmissions(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const projectId = this.getNodeParameter('projectId', index) as string;
	const returnAll = this.getNodeParameter('returnAll', index, false) as boolean;

	const variables: IDataObject = {
		appId: projectId,
	};

	let submissions;

	if (returnAll) {
		submissions = await expoGraphQLRequestAllItems.call(
			this,
			QUERIES.GET_SUBMISSIONS,
			variables,
			'app.byFullName.submissions',
		);
	} else {
		const limit = this.getNodeParameter('limit', index, 50) as number;
		submissions = await expoGraphQLRequestAllItems.call(
			this,
			QUERIES.GET_SUBMISSIONS,
			variables,
			'app.byFullName.submissions',
			limit,
		);
	}

	return submissions.map((submission) => ({ json: submission as IDataObject }));
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

export async function transfer(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const projectId = this.getNodeParameter('projectId', index) as string;
	const toAccountName = this.getNodeParameter('toAccountName', index) as string;

	const resolvedProjectId = await resolveProjectId(this, projectId);

	// Get destination account ID
	const accountQuery = `
		query GetAccountId($accountName: String!) {
			account {
				byName(accountName: $accountName) {
					id
				}
			}
		}
	`;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const accountResponse = await expoGraphQLRequest.call(this, accountQuery, { accountName: toAccountName }) as any;
	const toAccountId = accountResponse?.account?.byName?.id;

	if (!toAccountId) {
		throw new NodeOperationError(this.getNode(), `Destination account not found: ${toAccountName}`, { itemIndex: index });
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const response = await expoGraphQLRequest.call(this, MUTATIONS.TRANSFER_PROJECT, {
		appId: resolvedProjectId,
		toAccountId,
	}) as any;

	const project = response?.app?.transferApp;

	if (!project) {
		throw new NodeOperationError(this.getNode(), `Failed to transfer project: ${projectId}`, { itemIndex: index });
	}

	return [{ json: project }];
}
