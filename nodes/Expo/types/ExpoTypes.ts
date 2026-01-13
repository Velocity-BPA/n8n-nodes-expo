/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

export type Platform = 'ios' | 'android' | 'all';

export type BuildStatus =
	| 'NEW'
	| 'IN_QUEUE'
	| 'IN_PROGRESS'
	| 'PENDING_CANCEL'
	| 'CANCELED'
	| 'FINISHED'
	| 'ERRORED';

export type Distribution = 'internal' | 'store' | 'simulator';

export type SubmissionStatus =
	| 'IN_QUEUE'
	| 'IN_PROGRESS'
	| 'FINISHED'
	| 'ERRORED'
	| 'CANCELED';

export type AndroidTrack = 'internal' | 'alpha' | 'beta' | 'production';

export type ReleaseStatus = 'draft' | 'halted' | 'inProgress' | 'completed';

export type Privacy = 'public' | 'unlisted' | 'hidden';

export type SecretType = 'build' | 'update' | 'shared';

export type Environment = 'development' | 'preview' | 'production';

export type CredentialType = 'distribution' | 'push' | 'keystore' | 'fcm';

export type DeviceClass = 'iphone' | 'ipad';

export interface GraphQLResponse<T = unknown> {
	data?: T;
	errors?: GraphQLError[];
}

export interface GraphQLError {
	message: string;
	locations?: Array<{ line: number; column: number }>;
	path?: string[];
	extensions?: {
		code?: string;
		exception?: {
			statusCode?: number;
		};
	};
}

export interface PageInfo {
	hasNextPage: boolean;
	hasPreviousPage: boolean;
	startCursor?: string;
	endCursor?: string;
}

export interface Edge<T> {
	node: T;
	cursor: string;
}

export interface Connection<T> {
	edges: Edge<T>[];
	pageInfo: PageInfo;
}

export interface Build {
	id: string;
	status: BuildStatus;
	platform: Platform;
	distribution?: Distribution;
	buildProfile?: string;
	channel?: string;
	gitCommitHash?: string;
	createdAt: string;
	updatedAt: string;
	completedAt?: string;
	expirationDate?: string;
	artifacts?: BuildArtifacts;
	error?: BuildError;
	metrics?: BuildMetrics;
	project: Project;
}

export interface BuildArtifacts {
	buildUrl?: string;
	applicationArchiveUrl?: string;
	logsS3KeyPrefix?: string;
}

export interface BuildError {
	message: string;
	errorCode?: string;
}

export interface BuildMetrics {
	buildDuration?: number;
	buildQueueTime?: number;
}

export interface Submission {
	id: string;
	status: SubmissionStatus;
	platform: Platform;
	createdAt: string;
	updatedAt: string;
	completedAt?: string;
	submissionInfo?: SubmissionInfo;
	error?: SubmissionError;
}

export interface SubmissionInfo {
	track?: AndroidTrack;
	releaseStatus?: ReleaseStatus;
	rollout?: number;
}

export interface SubmissionError {
	message: string;
	errorCode?: string;
}

export interface Update {
	id: string;
	group: string;
	message?: string;
	runtimeVersion: string;
	platform: Platform;
	gitCommitHash?: string;
	createdAt: string;
	isRollBackToEmbedded: boolean;
	manifestPermalink?: string;
}

export interface Branch {
	id: string;
	name: string;
	createdAt: string;
	updatedAt: string;
	updates?: Connection<Update>;
}

export interface Channel {
	id: string;
	name: string;
	createdAt: string;
	updatedAt: string;
	branchMapping?: string;
	updateBranch?: Branch;
}

export interface Project {
	id: string;
	name: string;
	slug: string;
	fullName: string;
	description?: string;
	privacy: Privacy;
	createdAt: string;
	updatedAt: string;
	ownerAccount: Account;
	githubRepository?: GitHubRepository;
}

export interface Account {
	id: string;
	name: string;
}

export interface GitHubRepository {
	githubRepoOwnerName: string;
	githubRepoName: string;
}

export interface Secret {
	id: string;
	name: string;
	type: SecretType;
	createdAt: string;
	updatedAt: string;
}

export interface Credential {
	id: string;
	type: CredentialType;
	platform: Platform;
	createdAt: string;
	updatedAt: string;
}

export interface IosDistributionCredential extends Credential {
	serialNumber?: string;
	validityNotBefore?: string;
	validityNotAfter?: string;
	appleTeamIdentifier?: string;
	appleTeamName?: string;
}

export interface AndroidKeystoreCredential extends Credential {
	keystore?: {
		keyAlias: string;
		type: string;
	};
}

export interface Webhook {
	id: string;
	url: string;
	event: string;
	createdAt: string;
	updatedAt: string;
}

export interface WebhookDelivery {
	id: string;
	webhookId: string;
	event: string;
	successful: boolean;
	createdAt: string;
	responseCode?: number;
}

export interface Device {
	id: string;
	identifier: string;
	name?: string;
	deviceClass?: DeviceClass;
	createdAt: string;
	enabled: boolean;
}

export interface Viewer {
	id: string;
	username: string;
	email?: string;
	accounts: Account[];
}

export interface ExpoApiCredentials {
	accessToken: string;
	accountName?: string;
}
