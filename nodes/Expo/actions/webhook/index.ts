/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { expoGraphQLRequest, resolveProjectId, expoRestRequest } from '../../transport';
import { QUERIES, MUTATIONS } from '../../constants/constants';

export async function create(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const projectId = this.getNodeParameter('projectId', index) as string;
	const url = this.getNodeParameter('url', index) as string;
	const secret = this.getNodeParameter('secret', index) as string;
	const event = this.getNodeParameter('event', index) as string;

	const resolvedProjectId = await resolveProjectId(this, projectId);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const response = await expoGraphQLRequest.call(this, MUTATIONS.CREATE_WEBHOOK, {
		appId: resolvedProjectId,
		url,
		secret,
		event,
	}) as any;

	const webhook = response?.webhook?.createWebhook;

	if (!webhook) {
		throw new NodeOperationError(this.getNode(), 'Failed to create webhook', { itemIndex: index });
	}

	return [{ json: webhook }];
}

export async function get(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const projectId = this.getNodeParameter('projectId', index) as string;
	const webhookId = this.getNodeParameter('webhookId', index) as string;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const response = await expoGraphQLRequest.call(this, QUERIES.GET_WEBHOOKS, { appId: projectId }) as any;
	const webhooks = response?.app?.byFullName?.webhooks || [];

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const webhook = webhooks.find((w: any) => w.id === webhookId);

	if (!webhook) {
		throw new NodeOperationError(this.getNode(), `Webhook not found: ${webhookId}`, { itemIndex: index });
	}

	return [{ json: webhook }];
}

export async function getMany(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const projectId = this.getNodeParameter('projectId', index) as string;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const response = await expoGraphQLRequest.call(this, QUERIES.GET_WEBHOOKS, { appId: projectId }) as any;
	const webhooks = response?.app?.byFullName?.webhooks || [];

	return webhooks.map((webhook: IDataObject) => ({ json: webhook }));
}

export async function update(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const webhookId = this.getNodeParameter('webhookId', index) as string;
	const updateFields = this.getNodeParameter('updateFields', index, {}) as IDataObject;

	const variables: IDataObject = {
		webhookId,
	};

	if (updateFields.url) variables.url = updateFields.url;
	if (updateFields.secret) variables.secret = updateFields.secret;
	if (updateFields.event) variables.event = updateFields.event;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const response = await expoGraphQLRequest.call(this, MUTATIONS.UPDATE_WEBHOOK, variables) as any;
	const webhook = response?.webhook?.updateWebhook;

	if (!webhook) {
		throw new NodeOperationError(this.getNode(), `Failed to update webhook: ${webhookId}`, { itemIndex: index });
	}

	return [{ json: webhook }];
}

export async function deleteWebhook(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const webhookId = this.getNodeParameter('webhookId', index) as string;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const response = await expoGraphQLRequest.call(this, MUTATIONS.DELETE_WEBHOOK, { webhookId }) as any;
	const deleted = response?.webhook?.deleteWebhook;

	return [{ json: { success: !!deleted, webhookId } }];
}

export async function getDeliveries(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const projectId = this.getNodeParameter('projectId', index) as string;
	const webhookId = this.getNodeParameter('webhookId', index) as string;

	const query = `
		query GetWebhookDeliveries($appId: String!, $webhookId: ID!) {
			app {
				byFullName(fullName: $appId) {
					webhooks(filter: { id: $webhookId }) {
						id
						deliveries(first: 50) {
							edges {
								node {
									id
									event
									successful
									responseCode
									createdAt
								}
							}
						}
					}
				}
			}
		}
	`;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const response = await expoGraphQLRequest.call(this, query, { appId: projectId, webhookId }) as any;
	const webhooks = response?.app?.byFullName?.webhooks || [];
	const webhook = webhooks[0];

	if (!webhook) {
		throw new NodeOperationError(this.getNode(), `Webhook not found: ${webhookId}`, { itemIndex: index });
	}

	const deliveries = webhook.deliveries?.edges?.map((e: { node: IDataObject }) => e.node) || [];

	return deliveries.map((delivery: IDataObject) => ({
		json: {
			...delivery,
			webhookId,
		},
	}));
}

export async function redeliverEvent(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const webhookId = this.getNodeParameter('webhookId', index) as string;
	const deliveryId = this.getNodeParameter('deliveryId', index) as string;

	// Redeliver via REST API
	const response = await expoRestRequest.call(
		this,
		'POST',
		`/webhooks/${webhookId}/deliveries/${deliveryId}/redeliver`,
	);

	return [{ json: { success: true, webhookId, deliveryId, response } as IDataObject }];
}
