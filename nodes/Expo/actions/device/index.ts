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
import { isValidUdid } from '../../utils/helpers';

export async function register(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const projectId = this.getNodeParameter('projectId', index) as string;
	const udid = this.getNodeParameter('udid', index) as string;
	const additionalFields = this.getNodeParameter('additionalFields', index, {}) as IDataObject;

	if (!isValidUdid(udid)) {
		throw new NodeOperationError(this.getNode(), 'Invalid UDID format', { itemIndex: index });
	}

	const resolvedProjectId = await resolveProjectId(this, projectId);

	const deviceData: IDataObject = {
		identifier: udid,
	};

	if (additionalFields.name) {
		deviceData.name = additionalFields.name;
	}

	if (additionalFields.deviceClass) {
		deviceData.deviceClass = (additionalFields.deviceClass as string).toUpperCase();
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const response = await expoGraphQLRequest.call(this, MUTATIONS.REGISTER_DEVICE, {
		appId: resolvedProjectId,
		deviceData,
	}) as any;

	const device = response?.appleDevice?.createAppleDevice;

	if (!device) {
		throw new NodeOperationError(this.getNode(), 'Failed to register device', { itemIndex: index });
	}

	return [{ json: device }];
}

export async function get(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const projectId = this.getNodeParameter('projectId', index) as string;
	const deviceId = this.getNodeParameter('deviceId', index) as string;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const response = await expoGraphQLRequest.call(this, QUERIES.GET_DEVICES, { appId: projectId }) as any;
	const devices = response?.app?.byFullName?.appleDevices?.edges || [];

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const device = devices.find((edge: any) => edge.node.id === deviceId)?.node;

	if (!device) {
		throw new NodeOperationError(this.getNode(), `Device not found: ${deviceId}`, { itemIndex: index });
	}

	return [{ json: device }];
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

	let devices;

	if (returnAll) {
		devices = await expoGraphQLRequestAllItems.call(
			this,
			QUERIES.GET_DEVICES,
			variables,
			'app.byFullName.appleDevices',
		);
	} else {
		const limit = this.getNodeParameter('limit', index, 50) as number;
		devices = await expoGraphQLRequestAllItems.call(
			this,
			QUERIES.GET_DEVICES,
			variables,
			'app.byFullName.appleDevices',
			limit,
		);
	}

	return devices.map((device) => ({ json: device as IDataObject }));
}

export async function deleteDevice(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const deviceId = this.getNodeParameter('deviceId', index) as string;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const response = await expoGraphQLRequest.call(this, MUTATIONS.DELETE_DEVICE, { deviceId }) as any;
	const deleted = response?.appleDevice?.deleteAppleDevice;

	return [{ json: { success: !!deleted, deviceId } }];
}

export async function createProvisioningProfile(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const projectId = this.getNodeParameter('projectId', index) as string;
	const appleTeamId = this.getNodeParameter('appleTeamId', index) as string;
	const deviceIds = this.getNodeParameter('deviceIds', index) as string[];

	const mutation = `
		mutation CreateProvisioningProfile($appId: ID!, $appleTeamId: String!, $deviceIds: [ID!]!) {
			iosAppCredentials {
				createProvisioningProfile(
					appId: $appId
					appleTeamId: $appleTeamId
					deviceIds: $deviceIds
				) {
					id
					expiration
					appleDevices {
						id
						identifier
						name
					}
				}
			}
		}
	`;

	const resolvedProjectId = await resolveProjectId(this, projectId);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const response = await expoGraphQLRequest.call(this, mutation, {
		appId: resolvedProjectId,
		appleTeamId,
		deviceIds,
	}) as any;

	const profile = response?.iosAppCredentials?.createProvisioningProfile;

	if (!profile) {
		throw new NodeOperationError(this.getNode(), 'Failed to create provisioning profile', { itemIndex: index });
	}

	return [{ json: profile }];
}
