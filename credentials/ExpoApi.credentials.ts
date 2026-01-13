/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class ExpoApi implements ICredentialType {
	name = 'expoApi';
	displayName = 'Expo API';
	documentationUrl = 'https://docs.expo.dev/accounts/personal/';
	properties: INodeProperties[] = [
		{
			displayName: 'Access Token',
			name: 'accessToken',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'Expo Access Token from your account settings at expo.dev',
		},
		{
			displayName: 'Account Name',
			name: 'accountName',
			type: 'string',
			default: '',
			description: 'Default Expo account or organization name (optional)',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.accessToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.expo.dev',
			url: '/graphql',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				query: `query { viewer { id username } }`,
			}),
		},
	};
}
