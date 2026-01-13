/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import * as crypto from 'crypto';
import type { IDataObject } from 'n8n-workflow';

/**
 * Verify Expo webhook signature using HMAC-SHA1
 */
export function verifyWebhookSignature(
	payload: string,
	signature: string,
	secret: string,
): boolean {
	const expectedSignature = crypto
		.createHmac('sha1', secret)
		.update(payload)
		.digest('hex');

	return `sha1=${expectedSignature}` === signature;
}

/**
 * Filter out undefined and null values from an object
 */
export function filterEmptyValues(obj: IDataObject): IDataObject {
	const result: IDataObject = {};

	for (const [key, value] of Object.entries(obj)) {
		if (value !== undefined && value !== null) {
			result[key] = value;
		}
	}

	return result;
}

/**
 * Convert platform string to Expo API format
 */
export function normalizePlatform(platform: string): string {
	const platformMap: Record<string, string> = {
		ios: 'IOS',
		android: 'ANDROID',
		all: 'ALL',
		IOS: 'IOS',
		ANDROID: 'ANDROID',
		ALL: 'ALL',
	};

	return platformMap[platform] || platform.toUpperCase();
}

/**
 * Convert build status string to Expo API format
 */
export function normalizeBuildStatus(status: string): string {
	const statusMap: Record<string, string> = {
		new: 'NEW',
		in_queue: 'IN_QUEUE',
		in_progress: 'IN_PROGRESS',
		pending_cancel: 'PENDING_CANCEL',
		canceled: 'CANCELED',
		finished: 'FINISHED',
		errored: 'ERRORED',
	};

	return statusMap[status.toLowerCase()] || status.toUpperCase();
}

/**
 * Format date string for display
 */
export function formatDate(dateString: string | undefined): string {
	if (!dateString) return '';

	try {
		const date = new Date(dateString);
		return date.toISOString();
	} catch {
		return dateString;
	}
}

/**
 * Simplify GraphQL response by removing edge/node structure
 */
export function simplifyConnection<T>(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	connection: { edges: Array<{ node: T }> } | undefined | null,
): T[] {
	if (!connection || !connection.edges) {
		return [];
	}

	return connection.edges.map((edge) => edge.node);
}

/**
 * Extract error message from various error formats
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extractErrorMessage(error: any): string {
	if (typeof error === 'string') {
		return error;
	}

	if (error?.message) {
		return error.message;
	}

	if (error?.errors && Array.isArray(error.errors)) {
		return error.errors.map((e: { message: string }) => e.message).join(', ');
	}

	return 'Unknown error occurred';
}

/**
 * Build project identifier from parameters
 */
export function buildProjectIdentifier(
	accountName: string | undefined,
	projectSlug: string | undefined,
	projectId: string | undefined,
): string | undefined {
	if (projectId) {
		return projectId;
	}

	if (accountName && projectSlug) {
		return `@${accountName}/${projectSlug}`;
	}

	return undefined;
}

/**
 * Parse project identifier to extract account name and project slug
 */
export function parseProjectIdentifier(identifier: string): {
	accountName: string;
	projectSlug: string;
} | null {
	if (!identifier.startsWith('@')) {
		return null;
	}

	const parts = identifier.slice(1).split('/');
	if (parts.length !== 2) {
		return null;
	}

	return {
		accountName: parts[0],
		projectSlug: parts[1],
	};
}

/**
 * Validate UDID format (iOS device)
 */
export function isValidUdid(udid: string): boolean {
	// UDID should be 40 hexadecimal characters
	return /^[0-9a-fA-F]{40}$/.test(udid) || /^[0-9a-fA-F-]{36}$/.test(udid);
}

/**
 * Validate bundle identifier format
 */
export function isValidBundleIdentifier(bundleId: string): boolean {
	// Basic bundle identifier validation
	return /^[a-zA-Z][a-zA-Z0-9-]*(\.[a-zA-Z][a-zA-Z0-9-]*)+$/.test(bundleId);
}

/**
 * Convert camelCase to SCREAMING_SNAKE_CASE
 */
export function toScreamingSnakeCase(str: string): string {
	return str
		.replace(/([A-Z])/g, '_$1')
		.toUpperCase()
		.replace(/^_/, '');
}

/**
 * Sleep for a specified number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Chunk array into smaller arrays of specified size
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
	const chunks: T[][] = [];
	for (let i = 0; i < array.length; i += size) {
		chunks.push(array.slice(i, i + size));
	}
	return chunks;
}

/**
 * Deep merge two objects
 */
export function deepMerge<T extends IDataObject>(target: T, source: IDataObject): T {
	const result = { ...target };

	for (const key of Object.keys(source)) {
		const sourceValue = source[key];
		const targetValue = result[key as keyof T];

		if (isObject(sourceValue) && isObject(targetValue)) {
			result[key as keyof T] = deepMerge(
				targetValue as IDataObject,
				sourceValue as IDataObject,
			) as T[keyof T];
		} else if (sourceValue !== undefined) {
			result[key as keyof T] = sourceValue as T[keyof T];
		}
	}

	return result;
}

/**
 * Check if value is a plain object
 */
function isObject(value: unknown): value is IDataObject {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Format project ID from account and project name
 */
export function formatProjectId(accountName: string, projectName: string): string {
	const account = accountName.startsWith('@') ? accountName : `@${accountName}`;
	return `${account}/${projectName}`;
}

/**
 * Parse project slug into account and project parts
 */
export function parseProjectSlug(slug: string): { account: string; project: string } | null {
	if (!slug || !slug.startsWith('@')) {
		return null;
	}

	// Check if it's a UUID (not a slug)
	if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)) {
		return null;
	}

	const parts = slug.slice(1).split('/');
	if (parts.length !== 2 || !parts[0] || !parts[1]) {
		return null;
	}

	return {
		account: parts[0],
		project: parts[1],
	};
}
