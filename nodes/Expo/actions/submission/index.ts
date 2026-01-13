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
import { filterEmptyValues, normalizePlatform } from '../../utils/helpers';

export async function create(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const projectId = this.getNodeParameter('projectId', index) as string;
	const platform = this.getNodeParameter('platform', index) as string;
	const additionalFields = this.getNodeParameter('additionalFields', index, {}) as IDataObject;

	const config: IDataObject = {};

	// iOS specific config
	if (platform.toLowerCase() === 'ios') {
		if (additionalFields.appleId) config.appleId = additionalFields.appleId;
		if (additionalFields.ascAppId) config.ascAppId = additionalFields.ascAppId;
		if (additionalFields.appleTeamId) config.appleTeamId = additionalFields.appleTeamId;
	}

	// Android specific config
	if (platform.toLowerCase() === 'android') {
		if (additionalFields.track) config.track = additionalFields.track;
		if (additionalFields.releaseStatus) config.releaseStatus = additionalFields.releaseStatus;
		if (additionalFields.rollout !== undefined) config.rollout = additionalFields.rollout;
	}

	const variables = filterEmptyValues({
		appId: projectId,
		platform: normalizePlatform(platform),
		buildId: additionalFields.buildId as string,
		config: Object.keys(config).length > 0 ? config : undefined,
	});

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const response = await expoGraphQLRequest.call(this, MUTATIONS.CREATE_SUBMISSION, variables) as any;
	const submission = response?.submission?.createSubmission;

	if (!submission) {
		throw new NodeOperationError(this.getNode(), 'Failed to create submission', { itemIndex: index });
	}

	return [{ json: submission }];
}

export async function get(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const submissionId = this.getNodeParameter('submissionId', index) as string;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const response = await expoGraphQLRequest.call(this, QUERIES.GET_SUBMISSION, { submissionId }) as any;
	const submission = response?.submission?.byId;

	if (!submission) {
		throw new NodeOperationError(this.getNode(), `Submission not found: ${submissionId}`, { itemIndex: index });
	}

	return [{ json: submission }];
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
		variables.status = (filters.status as string).toUpperCase();
	}

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

export async function cancel(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const submissionId = this.getNodeParameter('submissionId', index) as string;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const response = await expoGraphQLRequest.call(this, MUTATIONS.CANCEL_SUBMISSION, { submissionId }) as any;
	const submission = response?.submission?.cancelSubmission;

	if (!submission) {
		throw new NodeOperationError(this.getNode(), `Failed to cancel submission: ${submissionId}`, { itemIndex: index });
	}

	return [{ json: submission }];
}

export async function retry(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const submissionId = this.getNodeParameter('submissionId', index) as string;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const response = await expoGraphQLRequest.call(this, MUTATIONS.RETRY_SUBMISSION, { submissionId }) as any;
	const submission = response?.submission?.retrySubmission;

	if (!submission) {
		throw new NodeOperationError(this.getNode(), `Failed to retry submission: ${submissionId}`, { itemIndex: index });
	}

	return [{ json: submission }];
}

export async function getStatus(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const submissionId = this.getNodeParameter('submissionId', index) as string;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const response = await expoGraphQLRequest.call(this, QUERIES.GET_SUBMISSION, { submissionId }) as any;
	const submission = response?.submission?.byId;

	if (!submission) {
		throw new NodeOperationError(this.getNode(), `Submission not found: ${submissionId}`, { itemIndex: index });
	}

	return [{
		json: {
			submissionId,
			status: submission.status,
			platform: submission.platform,
			completedAt: submission.completedAt,
			error: submission.error,
		},
	}];
}
