/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { expoGraphQLRequest, expoRestRequest } from '../../transport';
import { QUERIES } from '../../constants/constants';

export async function getMany(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const projectId = this.getNodeParameter('projectId', index) as string;
	const platform = this.getNodeParameter('platform', index) as string;

	const credentials: IDataObject[] = [];

	if (platform === 'ios' || platform === 'all') {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const iosResponse = await expoGraphQLRequest.call(this, QUERIES.GET_IOS_DISTRIBUTION_CREDENTIALS, {
			appId: projectId,
		}) as any;

		const iosCredentials = iosResponse?.app?.byFullName?.iosAppCredentials || [];
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		iosCredentials.forEach((cred: any) => {
			credentials.push({
				...cred,
				platform: 'ios',
				type: 'distribution',
			});
		});
	}

	if (platform === 'android' || platform === 'all') {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const androidResponse = await expoGraphQLRequest.call(this, QUERIES.GET_ANDROID_KEYSTORE, {
			appId: projectId,
		}) as any;

		const androidCredentials = androidResponse?.app?.byFullName?.androidAppCredentials || [];
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		androidCredentials.forEach((cred: any) => {
			credentials.push({
				...cred,
				platform: 'android',
				type: 'keystore',
			});
		});
	}

	return credentials.map((cred) => ({ json: cred }));
}

export async function getIosDistribution(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const projectId = this.getNodeParameter('projectId', index) as string;
	const additionalFields = this.getNodeParameter('additionalFields', index, {}) as IDataObject;

	const variables: IDataObject = {
		appId: projectId,
	};

	if (additionalFields.appleTeamIdentifier) {
		variables.appleTeamIdentifier = additionalFields.appleTeamIdentifier;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const response = await expoGraphQLRequest.call(this, QUERIES.GET_IOS_DISTRIBUTION_CREDENTIALS, variables) as any;
	const credentials = response?.app?.byFullName?.iosAppCredentials || [];

	return credentials.map((cred: IDataObject) => ({
		json: {
			...cred,
			platform: 'ios',
			type: 'distribution',
		},
	}));
}

export async function getIosPush(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const projectId = this.getNodeParameter('projectId', index) as string;

	const query = `
		query GetIosPushCredentials($appId: String!) {
			app {
				byFullName(fullName: $appId) {
					iosAppCredentials {
						id
						pushKey {
							id
							keyIdentifier
							apnsEnvironment
							createdAt
							updatedAt
						}
					}
				}
			}
		}
	`;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const response = await expoGraphQLRequest.call(this, query, { appId: projectId }) as any;
	const credentials = response?.app?.byFullName?.iosAppCredentials || [];

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const pushCredentials = credentials.filter((cred: any) => cred.pushKey).map((cred: any) => ({
		json: {
			id: cred.id,
			pushKey: cred.pushKey,
			platform: 'ios',
			type: 'push',
		},
	}));

	return pushCredentials;
}

export async function getAndroidKeystore(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const projectId = this.getNodeParameter('projectId', index) as string;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const response = await expoGraphQLRequest.call(this, QUERIES.GET_ANDROID_KEYSTORE, { appId: projectId }) as any;
	const credentials = response?.app?.byFullName?.androidAppCredentials || [];

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return credentials.map((cred: any) => ({
		json: {
			id: cred.id,
			keystore: cred.androidKeystore,
			platform: 'android',
			type: 'keystore',
		},
	}));
}

export async function getAndroidFcm(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const projectId = this.getNodeParameter('projectId', index) as string;

	const query = `
		query GetAndroidFcmCredentials($appId: String!) {
			app {
				byFullName(fullName: $appId) {
					androidAppCredentials {
						id
						fcmV1Credential {
							id
							snippet
							createdAt
							updatedAt
						}
					}
				}
			}
		}
	`;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const response = await expoGraphQLRequest.call(this, query, { appId: projectId }) as any;
	const credentials = response?.app?.byFullName?.androidAppCredentials || [];

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const fcmCredentials = credentials.filter((cred: any) => cred.fcmV1Credential).map((cred: any) => ({
		json: {
			id: cred.id,
			fcmCredential: cred.fcmV1Credential,
			platform: 'android',
			type: 'fcm',
		},
	}));

	return fcmCredentials;
}

export async function createIosDistribution(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const projectId = this.getNodeParameter('projectId', index) as string;
	const bundleIdentifier = this.getNodeParameter('bundleIdentifier', index) as string;
	const appleTeamId = this.getNodeParameter('appleTeamId', index) as string;

	// Creating iOS distribution credentials typically requires certificate data
	// This is a simplified version - full implementation would require p12 upload
	const mutation = `
		mutation CreateIosAppCredentials($appId: ID!, $bundleIdentifier: String!, $appleTeamId: String!) {
			iosAppCredentials {
				createIosAppCredentials(
					appId: $appId
					appleAppIdentifierInput: { bundleIdentifier: $bundleIdentifier }
					appleTeam: { id: $appleTeamId }
				) {
					id
					appleTeam {
						id
						appleTeamIdentifier
						appleTeamName
					}
				}
			}
		}
	`;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const response = await expoGraphQLRequest.call(this, mutation, {
		appId: projectId,
		bundleIdentifier,
		appleTeamId,
	}) as any;

	const credential = response?.iosAppCredentials?.createIosAppCredentials;

	if (!credential) {
		throw new NodeOperationError(this.getNode(), 'Failed to create iOS distribution credentials', { itemIndex: index });
	}

	return [{ json: { ...credential, platform: 'ios', type: 'distribution' } }];
}

export async function createAndroidKeystore(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const projectId = this.getNodeParameter('projectId', index) as string;
	const keystorePassword = this.getNodeParameter('keystorePassword', index) as string;
	const keyAlias = this.getNodeParameter('keyAlias', index) as string;
	const keyPassword = this.getNodeParameter('keyPassword', index) as string;

	// Creating Android keystore typically requires keystore file upload
	// This is a simplified version
	const mutation = `
		mutation CreateAndroidKeystore($appId: ID!, $keystore: AndroidKeystoreInput!) {
			androidAppCredentials {
				createAndroidAppCredentials(
					appId: $appId
					androidAppCredentialsInput: {
						androidKeystore: $keystore
					}
				) {
					id
					androidKeystore {
						id
						keyAlias
						type
						createdAt
					}
				}
			}
		}
	`;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const response = await expoGraphQLRequest.call(this, mutation, {
		appId: projectId,
		keystore: {
			keystorePassword,
			keyAlias,
			keyPassword,
		},
	}) as any;

	const credential = response?.androidAppCredentials?.createAndroidAppCredentials;

	if (!credential) {
		throw new NodeOperationError(this.getNode(), 'Failed to create Android keystore', { itemIndex: index });
	}

	return [{ json: { ...credential, platform: 'android', type: 'keystore' } }];
}

export async function deleteCredential(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const credentialId = this.getNodeParameter('credentialId', index) as string;
	const credentialType = this.getNodeParameter('credentialType', index) as string;

	let mutation: string;

	switch (credentialType) {
		case 'ios_distribution':
			mutation = `
				mutation DeleteIosAppCredentials($credentialId: ID!) {
					iosAppCredentials {
						deleteIosAppCredentials(iosAppCredentialsId: $credentialId) {
							id
						}
					}
				}
			`;
			break;
		case 'android_keystore':
			mutation = `
				mutation DeleteAndroidKeystore($credentialId: ID!) {
					androidAppCredentials {
						deleteAndroidAppCredentials(androidAppCredentialsId: $credentialId) {
							id
						}
					}
				}
			`;
			break;
		default:
			throw new NodeOperationError(this.getNode(), `Unknown credential type: ${credentialType}`, { itemIndex: index });
	}

	const response = await expoGraphQLRequest.call(this, mutation, { credentialId });

	return [{ json: { success: !!response, credentialId, credentialType } }];
}

export async function downloadKeystore(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const projectId = this.getNodeParameter('projectId', index) as string;
	const credentialId = this.getNodeParameter('credentialId', index) as string;

	// Download keystore via REST endpoint
	const response = await expoRestRequest.call(
		this,
		'GET',
		`/projects/${projectId}/credentials/${credentialId}/keystore`,
	);

	return [{ json: response as IDataObject }];
}
