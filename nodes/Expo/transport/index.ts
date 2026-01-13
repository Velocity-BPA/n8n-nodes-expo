/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
	IExecuteFunctions,
	IHookFunctions,
	ILoadOptionsFunctions,
	IWebhookFunctions,
	IHttpRequestMethods,
	IDataObject,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

import { EXPO_GRAPHQL_ENDPOINT, EXPO_REST_ENDPOINT } from '../constants/constants';
import type { GraphQLResponse, PageInfo } from '../types/ExpoTypes';

export interface IExpoCredentials {
	accessToken: string;
	accountName?: string;
}

/**
 * Make a GraphQL request to the Expo API
 */
export async function expoGraphQLRequest<T = unknown>(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions | IWebhookFunctions,
	query: string,
	variables?: IDataObject,
): Promise<T> {
	const credentials = await this.getCredentials('expoApi') as IExpoCredentials;

	const options = {
		method: 'POST' as IHttpRequestMethods,
		url: EXPO_GRAPHQL_ENDPOINT,
		headers: {
			Authorization: `Bearer ${credentials.accessToken}`,
			'Content-Type': 'application/json',
		},
		body: {
			query,
			variables: variables || {},
		},
		json: true,
	};

	try {
		const response = await this.helpers.httpRequest(options) as GraphQLResponse<T>;

		if (response.errors && response.errors.length > 0) {
			const error = response.errors[0];
			const errorCode = error.extensions?.code || 'UNKNOWN_ERROR';
			const statusCode = error.extensions?.exception?.statusCode || 400;

			throw new NodeApiError(this.getNode(), {
				message: error.message,
				description: `GraphQL Error: ${errorCode}`,
				httpCode: String(statusCode),
			} as JsonObject);
		}

		if (!response.data) {
			throw new NodeOperationError(this.getNode(), 'No data returned from Expo API');
		}

		return response.data;
	} catch (error) {
		if (error instanceof NodeApiError || error instanceof NodeOperationError) {
			throw error;
		}
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}

/**
 * Make a REST request to the Expo API
 */
export async function expoRestRequest<T = unknown>(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions | IWebhookFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body?: IDataObject,
	qs?: IDataObject,
): Promise<T> {
	const credentials = await this.getCredentials('expoApi') as IExpoCredentials;

	const options = {
		method,
		url: `${EXPO_REST_ENDPOINT}${endpoint}`,
		headers: {
			Authorization: `Bearer ${credentials.accessToken}`,
			'Content-Type': 'application/json',
		},
		qs,
		body,
		json: true,
	};

	try {
		return await this.helpers.httpRequest(options) as T;
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}

/**
 * Paginate through all items using GraphQL cursor-based pagination
 */
export async function expoGraphQLRequestAllItems<T>(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	query: string,
	variables: IDataObject,
	dataPath: string,
	limit?: number,
): Promise<T[]> {
	const results: T[] = [];
	let hasNextPage = true;
	let cursor: string | undefined;
	const pageSize = 50;

	while (hasNextPage) {
		const response = await expoGraphQLRequest.call(this, query, {
			...variables,
			after: cursor,
			first: pageSize,
		});

		// Navigate to the connection using the data path
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let connection: any = response;
		const pathParts = dataPath.split('.');

		for (const part of pathParts) {
			connection = connection?.[part];
		}

		if (!connection) {
			break;
		}

		// Extract nodes from edges
		const edges = connection.edges || [];
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const items = edges.map((edge: any) => edge.node);
		results.push(...items);

		// Check pagination info
		const pageInfo: PageInfo = connection.pageInfo || {};
		hasNextPage = pageInfo.hasNextPage ?? false;
		cursor = pageInfo.endCursor;

		// Respect limit if provided
		if (limit && results.length >= limit) {
			return results.slice(0, limit);
		}
	}

	return results;
}

/**
 * Get credentials with account name fallback
 */
export async function getCredentialsWithAccount(
	context: IExecuteFunctions | ILoadOptionsFunctions,
	accountNameParam?: string,
): Promise<{ accessToken: string; accountName: string }> {
	const credentials = await context.getCredentials('expoApi') as IExpoCredentials;

	const accountName = accountNameParam || credentials.accountName;

	if (!accountName) {
		throw new NodeOperationError(context.getNode(), 'Account name is required. Provide it in the node parameters or in the credentials.');
	}

	return {
		accessToken: credentials.accessToken,
		accountName,
	};
}

/**
 * Build full project name from account and project slug
 */
export function buildProjectFullName(accountName: string, projectSlug: string): string {
	return `@${accountName}/${projectSlug}`;
}

/**
 * Extract project ID from full name or return as-is if already an ID
 */
export async function resolveProjectId(
	context: IExecuteFunctions,
	projectIdentifier: string,
): Promise<string> {
	// If it looks like a full name (@account/project), fetch the ID
	if (projectIdentifier.startsWith('@')) {
		const query = `
			query GetProjectId($fullName: String!) {
				app {
					byFullName(fullName: $fullName) {
						id
					}
				}
			}
		`;

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const response = await expoGraphQLRequest.call(context, query, { fullName: projectIdentifier }) as any;
		const projectId = response?.app?.byFullName?.id;

		if (!projectId) {
			throw new NodeOperationError(context.getNode(), `Project not found: ${projectIdentifier}`);
		}

		return projectId;
	}

	// Otherwise assume it's already an ID
	return projectIdentifier;
}

/**
 * Handle rate limiting with exponential backoff
 */
export async function handleRateLimit<T>(
	context: IExecuteFunctions,
	requestFn: () => Promise<T>,
	maxRetries = 5,
): Promise<T> {
	let retries = 0;
	let delay = 1000; // Start with 1 second

	while (retries < maxRetries) {
		try {
			return await requestFn();
		} catch (error) {
			const isRateLimited =
				error instanceof NodeApiError &&
				(error.httpCode === '429' || (error.message && error.message.includes('rate limit')));

			if (!isRateLimited || retries >= maxRetries - 1) {
				throw error;
			}

			retries++;
			await new Promise((resolve) => setTimeout(resolve, delay));
			delay *= 2; // Exponential backoff
		}
	}

	throw new NodeOperationError(context.getNode(), 'Max retries exceeded for rate-limited request');
}
