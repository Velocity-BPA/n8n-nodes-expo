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
	const channelName = this.getNodeParameter('channelName', index) as string;
	const additionalFields = this.getNodeParameter('additionalFields', index, {}) as IDataObject;

	const resolvedProjectId = await resolveProjectId(this, projectId);

	const variables: IDataObject = {
		appId: resolvedProjectId,
		name: channelName,
	};

	if (additionalFields.branchMapping) {
		variables.branchMapping = additionalFields.branchMapping;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const response = await expoGraphQLRequest.call(this, MUTATIONS.CREATE_CHANNEL, variables) as any;
	const channel = response?.updateChannel?.createUpdateChannelForApp;

	if (!channel) {
		throw new NodeOperationError(this.getNode(), 'Failed to create channel', { itemIndex: index });
	}

	return [{ json: channel }];
}

export async function get(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const projectId = this.getNodeParameter('projectId', index) as string;
	const channelName = this.getNodeParameter('channelName', index) as string;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const response = await expoGraphQLRequest.call(this, QUERIES.GET_CHANNEL, {
		appId: projectId,
		channelName,
	}) as any;

	const channel = response?.app?.byFullName?.updateChannelByName;

	if (!channel) {
		throw new NodeOperationError(this.getNode(), `Channel not found: ${channelName}`, { itemIndex: index });
	}

	return [{ json: channel }];
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

	let channels;

	if (returnAll) {
		channels = await expoGraphQLRequestAllItems.call(
			this,
			QUERIES.GET_CHANNELS,
			variables,
			'app.byFullName.updateChannels',
		);
	} else {
		const limit = this.getNodeParameter('limit', index, 50) as number;
		channels = await expoGraphQLRequestAllItems.call(
			this,
			QUERIES.GET_CHANNELS,
			variables,
			'app.byFullName.updateChannels',
			limit,
		);
	}

	return channels.map((channel) => ({ json: channel as IDataObject }));
}

export async function update(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const channelId = this.getNodeParameter('channelId', index) as string;
	const branchMapping = this.getNodeParameter('branchMapping', index) as string;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const response = await expoGraphQLRequest.call(this, MUTATIONS.UPDATE_CHANNEL, {
		channelId,
		branchMapping,
	}) as any;

	const channel = response?.updateChannel?.editUpdateChannel;

	if (!channel) {
		throw new NodeOperationError(this.getNode(), `Failed to update channel: ${channelId}`, { itemIndex: index });
	}

	return [{ json: channel }];
}

export async function deleteChannel(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const channelId = this.getNodeParameter('channelId', index) as string;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const response = await expoGraphQLRequest.call(this, MUTATIONS.DELETE_CHANNEL, { channelId }) as any;
	const deleted = response?.updateChannel?.deleteUpdateChannel;

	return [{ json: { success: !!deleted, channelId } }];
}

export async function linkBranch(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const channelId = this.getNodeParameter('channelId', index) as string;
	const branchId = this.getNodeParameter('branchId', index) as string;

	// Branch mapping in Expo is typically a JSON string that maps branches to channels
	const branchMapping = JSON.stringify({
		branchId,
		branchMappingLogic: 'BRANCH_EQUALS',
	});

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const response = await expoGraphQLRequest.call(this, MUTATIONS.UPDATE_CHANNEL, {
		channelId,
		branchMapping,
	}) as any;

	const channel = response?.updateChannel?.editUpdateChannel;

	if (!channel) {
		throw new NodeOperationError(this.getNode(), `Failed to link branch to channel: ${channelId}`, { itemIndex: index });
	}

	return [{ json: channel }];
}

export async function unlinkBranch(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const channelId = this.getNodeParameter('channelId', index) as string;

	// Unlink by setting branch mapping to empty or null
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const response = await expoGraphQLRequest.call(this, MUTATIONS.UPDATE_CHANNEL, {
		channelId,
		branchMapping: JSON.stringify({}),
	}) as any;

	const channel = response?.updateChannel?.editUpdateChannel;

	if (!channel) {
		throw new NodeOperationError(this.getNode(), `Failed to unlink branch from channel: ${channelId}`, { itemIndex: index });
	}

	return [{ json: channel }];
}

export async function getLinkedBranch(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const projectId = this.getNodeParameter('projectId', index) as string;
	const channelName = this.getNodeParameter('channelName', index) as string;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const response = await expoGraphQLRequest.call(this, QUERIES.GET_CHANNEL, {
		appId: projectId,
		channelName,
	}) as any;

	const channel = response?.app?.byFullName?.updateChannelByName;

	if (!channel) {
		throw new NodeOperationError(this.getNode(), `Channel not found: ${channelName}`, { itemIndex: index });
	}

	return [{
		json: {
			channelId: channel.id,
			channelName: channel.name,
			linkedBranch: channel.updateBranch,
			branchMapping: channel.branchMapping,
		},
	}];
}
