/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import * as build from './actions/build';
import * as submission from './actions/submission';
import * as update from './actions/update';
import * as branch from './actions/branch';
import * as channel from './actions/channel';
import * as project from './actions/project';
import * as secret from './actions/secret';
import * as credential from './actions/credential';
import * as webhook from './actions/webhook';
import * as device from './actions/device';

import {
	BUILD_PLATFORMS,
	BUILD_STATUSES,
	ANDROID_TRACKS,
	SECRET_TYPES,
	PRIVACY_OPTIONS,
	DEVICE_CLASSES,
	WEBHOOK_EVENTS,
} from './constants/constants';

// Emit licensing notice once per node load
const licenseNoticeEmitted = false;
if (!licenseNoticeEmitted) {
	console.warn(`[Velocity BPA Licensing Notice]

This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).

Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.

For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.`);
}

export class Expo implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Expo',
		name: 'expo',
		icon: 'file:expo.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with Expo Application Services (EAS) API',
		defaults: {
			name: 'Expo',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'expoApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Branch', value: 'branch' },
					{ name: 'Build', value: 'build' },
					{ name: 'Channel', value: 'channel' },
					{ name: 'Credential', value: 'credential' },
					{ name: 'Device', value: 'device' },
					{ name: 'Project', value: 'project' },
					{ name: 'Secret', value: 'secret' },
					{ name: 'Submission', value: 'submission' },
					{ name: 'Update', value: 'update' },
					{ name: 'Webhook', value: 'webhook' },
				],
				default: 'build',
			},

			// ==================== BUILD OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['build'],
					},
				},
				options: [
					{ name: 'Cancel', value: 'cancel', description: 'Cancel a running build', action: 'Cancel a build' },
					{ name: 'Create', value: 'create', description: 'Trigger a new EAS build', action: 'Create a build' },
					{ name: 'Delete', value: 'delete', description: 'Delete a build record', action: 'Delete a build' },
					{ name: 'Get', value: 'get', description: 'Get build details by ID', action: 'Get a build' },
					{ name: 'Get Artifacts', value: 'getArtifacts', description: 'Get build artifacts and download URLs', action: 'Get build artifacts' },
					{ name: 'Get Logs', value: 'getLogs', description: 'Get build logs', action: 'Get build logs' },
					{ name: 'Get Many', value: 'getMany', description: 'List builds for a project', action: 'Get many builds' },
					{ name: 'Retry', value: 'retry', description: 'Retry a failed build', action: 'Retry a build' },
				],
				default: 'get',
			},

			// ==================== SUBMISSION OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['submission'],
					},
				},
				options: [
					{ name: 'Cancel', value: 'cancel', description: 'Cancel pending submission', action: 'Cancel a submission' },
					{ name: 'Create', value: 'create', description: 'Submit build to app store', action: 'Create a submission' },
					{ name: 'Get', value: 'get', description: 'Get submission details', action: 'Get a submission' },
					{ name: 'Get Many', value: 'getMany', description: 'List submissions for project', action: 'Get many submissions' },
					{ name: 'Get Status', value: 'getStatus', description: 'Get submission status', action: 'Get submission status' },
					{ name: 'Retry', value: 'retry', description: 'Retry failed submission', action: 'Retry a submission' },
				],
				default: 'get',
			},

			// ==================== UPDATE OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['update'],
					},
				},
				options: [
					{ name: 'Delete', value: 'delete', description: 'Delete an update', action: 'Delete an update' },
					{ name: 'Get', value: 'get', description: 'Get update details', action: 'Get an update' },
					{ name: 'Get Manifest', value: 'getManifest', description: 'Get update manifest', action: 'Get update manifest' },
					{ name: 'Get Many', value: 'getMany', description: 'List updates for branch', action: 'Get many updates' },
					{ name: 'Publish', value: 'publish', description: 'Publish OTA update', action: 'Publish an update' },
					{ name: 'Republish', value: 'republish', description: 'Republish an existing update', action: 'Republish an update' },
					{ name: 'Rollback', value: 'rollback', description: 'Rollback to previous update', action: 'Rollback an update' },
				],
				default: 'get',
			},

			// ==================== BRANCH OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['branch'],
					},
				},
				options: [
					{ name: 'Create', value: 'create', description: 'Create new update branch', action: 'Create a branch' },
					{ name: 'Delete', value: 'delete', description: 'Delete branch', action: 'Delete a branch' },
					{ name: 'Get', value: 'get', description: 'Get branch details', action: 'Get a branch' },
					{ name: 'Get Many', value: 'getMany', description: 'List all branches', action: 'Get many branches' },
					{ name: 'Get Updates', value: 'getUpdates', description: 'Get updates for branch', action: 'Get branch updates' },
					{ name: 'Publish', value: 'publish', description: 'Publish update to branch', action: 'Publish to branch' },
					{ name: 'Update', value: 'update', description: 'Update branch configuration', action: 'Update a branch' },
				],
				default: 'get',
			},

			// ==================== CHANNEL OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['channel'],
					},
				},
				options: [
					{ name: 'Create', value: 'create', description: 'Create release channel', action: 'Create a channel' },
					{ name: 'Delete', value: 'delete', description: 'Delete channel', action: 'Delete a channel' },
					{ name: 'Get', value: 'get', description: 'Get channel details', action: 'Get a channel' },
					{ name: 'Get Linked Branch', value: 'getLinkedBranch', description: 'Get currently linked branch', action: 'Get linked branch' },
					{ name: 'Get Many', value: 'getMany', description: 'List all channels', action: 'Get many channels' },
					{ name: 'Link Branch', value: 'linkBranch', description: 'Link branch to channel', action: 'Link branch to channel' },
					{ name: 'Unlink Branch', value: 'unlinkBranch', description: 'Unlink branch from channel', action: 'Unlink branch from channel' },
					{ name: 'Update', value: 'update', description: 'Update channel configuration', action: 'Update a channel' },
				],
				default: 'get',
			},

			// ==================== PROJECT OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['project'],
					},
				},
				options: [
					{ name: 'Create', value: 'create', description: 'Create new project', action: 'Create a project' },
					{ name: 'Delete', value: 'delete', description: 'Delete project', action: 'Delete a project' },
					{ name: 'Get', value: 'get', description: 'Get project details', action: 'Get a project' },
					{ name: 'Get Builds', value: 'getBuilds', description: 'Get project builds', action: 'Get project builds' },
					{ name: 'Get Many', value: 'getMany', description: 'List account projects', action: 'Get many projects' },
					{ name: 'Get Submissions', value: 'getSubmissions', description: 'Get project submissions', action: 'Get project submissions' },
					{ name: 'Get Updates', value: 'getUpdates', description: 'Get project updates', action: 'Get project updates' },
					{ name: 'Transfer', value: 'transfer', description: 'Transfer project to another account', action: 'Transfer a project' },
					{ name: 'Update', value: 'update', description: 'Update project settings', action: 'Update a project' },
				],
				default: 'get',
			},

			// ==================== SECRET OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['secret'],
					},
				},
				options: [
					{ name: 'Create', value: 'create', description: 'Create environment secret', action: 'Create a secret' },
					{ name: 'Create Build Secret', value: 'createBuildSecret', description: 'Create build-time secret', action: 'Create build secret' },
					{ name: 'Create Update Secret', value: 'createUpdateSecret', description: 'Create update-time secret', action: 'Create update secret' },
					{ name: 'Delete', value: 'delete', description: 'Delete secret', action: 'Delete a secret' },
					{ name: 'Get', value: 'get', description: 'Get secret metadata', action: 'Get a secret' },
					{ name: 'Get Many', value: 'getMany', description: 'List all secrets', action: 'Get many secrets' },
					{ name: 'Update', value: 'update', description: 'Update secret value', action: 'Update a secret' },
				],
				default: 'get',
			},

			// ==================== CREDENTIAL OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['credential'],
					},
				},
				options: [
					{ name: 'Create Android Keystore', value: 'createAndroidKeystore', description: 'Create Android keystore', action: 'Create android keystore' },
					{ name: 'Create iOS Distribution', value: 'createIosDistribution', description: 'Create iOS distribution credentials', action: 'Create ios distribution' },
					{ name: 'Delete', value: 'delete', description: 'Delete credentials', action: 'Delete credentials' },
					{ name: 'Download Keystore', value: 'downloadKeystore', description: 'Download Android keystore file', action: 'Download keystore' },
					{ name: 'Get Android FCM', value: 'getAndroidFcm', description: 'Get Android FCM credentials', action: 'Get android fcm' },
					{ name: 'Get Android Keystore', value: 'getAndroidKeystore', description: 'Get Android keystore', action: 'Get android keystore' },
					{ name: 'Get iOS Distribution', value: 'getIosDistribution', description: 'Get iOS distribution credentials', action: 'Get ios distribution' },
					{ name: 'Get iOS Push', value: 'getIosPush', description: 'Get iOS push notification credentials', action: 'Get ios push' },
					{ name: 'Get Many', value: 'getMany', description: 'List all credentials', action: 'Get many credentials' },
				],
				default: 'getMany',
			},

			// ==================== WEBHOOK OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['webhook'],
					},
				},
				options: [
					{ name: 'Create', value: 'create', description: 'Create webhook endpoint', action: 'Create a webhook' },
					{ name: 'Delete', value: 'delete', description: 'Delete webhook', action: 'Delete a webhook' },
					{ name: 'Get', value: 'get', description: 'Get webhook details', action: 'Get a webhook' },
					{ name: 'Get Deliveries', value: 'getDeliveries', description: 'Get webhook delivery history', action: 'Get webhook deliveries' },
					{ name: 'Get Many', value: 'getMany', description: 'List all webhooks', action: 'Get many webhooks' },
					{ name: 'Redeliver Event', value: 'redeliverEvent', description: 'Redeliver a failed webhook event', action: 'Redeliver webhook event' },
					{ name: 'Update', value: 'update', description: 'Update webhook configuration', action: 'Update a webhook' },
				],
				default: 'get',
			},

			// ==================== DEVICE OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['device'],
					},
				},
				options: [
					{ name: 'Create Provisioning Profile', value: 'createProvisioningProfile', description: 'Create provisioning profile with devices', action: 'Create provisioning profile' },
					{ name: 'Delete', value: 'delete', description: 'Remove registered device', action: 'Delete a device' },
					{ name: 'Get', value: 'get', description: 'Get device details', action: 'Get a device' },
					{ name: 'Get Many', value: 'getMany', description: 'List registered devices', action: 'Get many devices' },
					{ name: 'Register', value: 'register', description: 'Register device for ad-hoc builds', action: 'Register a device' },
				],
				default: 'getMany',
			},

			// ==================== COMMON PARAMETERS ====================
			// Project ID - used by most operations
			{
				displayName: 'Project ID',
				name: 'projectId',
				type: 'string',
				default: '',
				required: true,
				description: 'Expo project ID or full name (e.g., @account/project-slug)',
				displayOptions: {
					show: {
						resource: ['build', 'submission', 'update', 'branch', 'channel', 'secret', 'credential', 'webhook', 'device'],
					},
					hide: {
						operation: ['cancel', 'retry', 'delete', 'update', 'getArtifacts', 'getLogs'],
					},
				},
			},

			// Build ID
			{
				displayName: 'Build ID',
				name: 'buildId',
				type: 'string',
				default: '',
				required: true,
				description: 'The build identifier',
				displayOptions: {
					show: {
						resource: ['build'],
						operation: ['get', 'cancel', 'retry', 'delete', 'getArtifacts', 'getLogs'],
					},
				},
			},

			// Platform for builds
			{
				displayName: 'Platform',
				name: 'platform',
				type: 'options',
				options: BUILD_PLATFORMS.map((p) => ({ name: p.name, value: p.value })),
				default: 'IOS',
				required: true,
				displayOptions: {
					show: {
						resource: ['build', 'submission'],
						operation: ['create'],
					},
				},
			},

			// Platform for credentials
			{
				displayName: 'Platform',
				name: 'platform',
				type: 'options',
				options: [
					{ name: 'All', value: 'all' },
					{ name: 'Android', value: 'android' },
					{ name: 'iOS', value: 'ios' },
				],
				default: 'all',
				required: true,
				displayOptions: {
					show: {
						resource: ['credential'],
						operation: ['getMany'],
					},
				},
			},

			// Submission ID
			{
				displayName: 'Submission ID',
				name: 'submissionId',
				type: 'string',
				default: '',
				required: true,
				description: 'The submission identifier',
				displayOptions: {
					show: {
						resource: ['submission'],
						operation: ['get', 'cancel', 'retry', 'getStatus'],
					},
				},
			},

			// Update ID
			{
				displayName: 'Update ID',
				name: 'updateId',
				type: 'string',
				default: '',
				required: true,
				description: 'The update identifier',
				displayOptions: {
					show: {
						resource: ['update'],
						operation: ['get', 'delete', 'getManifest'],
					},
				},
			},

			// Update Group ID
			{
				displayName: 'Update Group ID',
				name: 'updateGroupId',
				type: 'string',
				default: '',
				required: true,
				description: 'The update group identifier',
				displayOptions: {
					show: {
						resource: ['update'],
						operation: ['republish'],
					},
				},
			},

			// Branch Name
			{
				displayName: 'Branch Name',
				name: 'branchName',
				type: 'string',
				default: '',
				required: true,
				description: 'The update branch name',
				displayOptions: {
					show: {
						resource: ['update'],
						operation: ['publish', 'getMany', 'rollback', 'republish'],
					},
				},
			},

			// Branch Name for Branch resource
			{
				displayName: 'Branch Name',
				name: 'branchName',
				type: 'string',
				default: '',
				required: true,
				description: 'The branch name',
				displayOptions: {
					show: {
						resource: ['branch'],
						operation: ['create', 'get', 'getUpdates', 'publish'],
					},
				},
			},

			// Branch ID
			{
				displayName: 'Branch ID',
				name: 'branchId',
				type: 'string',
				default: '',
				required: true,
				description: 'The branch identifier',
				displayOptions: {
					show: {
						resource: ['branch'],
						operation: ['update', 'delete'],
					},
				},
			},

			// New Branch Name (for update)
			{
				displayName: 'New Name',
				name: 'newName',
				type: 'string',
				default: '',
				required: true,
				description: 'The new branch name',
				displayOptions: {
					show: {
						resource: ['branch'],
						operation: ['update'],
					},
				},
			},

			// Channel Name
			{
				displayName: 'Channel Name',
				name: 'channelName',
				type: 'string',
				default: '',
				required: true,
				description: 'The channel name',
				displayOptions: {
					show: {
						resource: ['channel'],
						operation: ['create', 'get', 'getLinkedBranch'],
					},
				},
			},

			// Channel ID
			{
				displayName: 'Channel ID',
				name: 'channelId',
				type: 'string',
				default: '',
				required: true,
				description: 'The channel identifier',
				displayOptions: {
					show: {
						resource: ['channel'],
						operation: ['update', 'delete', 'linkBranch', 'unlinkBranch'],
					},
				},
			},

			// Branch Mapping
			{
				displayName: 'Branch Mapping',
				name: 'branchMapping',
				type: 'string',
				default: '',
				required: true,
				description: 'JSON string defining branch mapping logic',
				displayOptions: {
					show: {
						resource: ['channel'],
						operation: ['update'],
					},
				},
			},

			// Branch ID for channel linking
			{
				displayName: 'Branch ID',
				name: 'branchId',
				type: 'string',
				default: '',
				required: true,
				description: 'The branch identifier to link',
				displayOptions: {
					show: {
						resource: ['channel'],
						operation: ['linkBranch'],
					},
				},
			},

			// Project resource parameters
			{
				displayName: 'Project ID',
				name: 'projectId',
				type: 'string',
				default: '',
				required: true,
				description: 'Project ID or full name (e.g., @account/project-slug)',
				displayOptions: {
					show: {
						resource: ['project'],
						operation: ['get', 'update', 'delete', 'getBuilds', 'getSubmissions', 'getUpdates', 'transfer'],
					},
				},
			},

			// Account Name
			{
				displayName: 'Account Name',
				name: 'accountName',
				type: 'string',
				default: '',
				description: 'Expo account or organization name (uses credential default if not set)',
				displayOptions: {
					show: {
						resource: ['project'],
						operation: ['getMany'],
					},
				},
			},

			// Project Name
			{
				displayName: 'Project Name',
				name: 'projectName',
				type: 'string',
				default: '',
				required: true,
				description: 'The project name',
				displayOptions: {
					show: {
						resource: ['project'],
						operation: ['create'],
					},
				},
			},

			// To Account Name (for transfer)
			{
				displayName: 'To Account Name',
				name: 'toAccountName',
				type: 'string',
				default: '',
				required: true,
				description: 'Destination account name for project transfer',
				displayOptions: {
					show: {
						resource: ['project'],
						operation: ['transfer'],
					},
				},
			},

			// Branch Name for project getUpdates
			{
				displayName: 'Branch Name',
				name: 'branchName',
				type: 'string',
				default: '',
				required: true,
				description: 'The branch name to get updates from',
				displayOptions: {
					show: {
						resource: ['project'],
						operation: ['getUpdates'],
					},
				},
			},

			// Secret Name
			{
				displayName: 'Secret Name',
				name: 'secretName',
				type: 'string',
				default: '',
				required: true,
				description: 'Secret name (uppercase with underscores)',
				displayOptions: {
					show: {
						resource: ['secret'],
						operation: ['create', 'get', 'createBuildSecret', 'createUpdateSecret'],
					},
				},
			},

			// Secret Value
			{
				displayName: 'Secret Value',
				name: 'secretValue',
				type: 'string',
				typeOptions: {
					password: true,
				},
				default: '',
				required: true,
				description: 'The secret value',
				displayOptions: {
					show: {
						resource: ['secret'],
						operation: ['create', 'update', 'createBuildSecret', 'createUpdateSecret'],
					},
				},
			},

			// Secret ID
			{
				displayName: 'Secret ID',
				name: 'secretId',
				type: 'string',
				default: '',
				required: true,
				description: 'The secret identifier',
				displayOptions: {
					show: {
						resource: ['secret'],
						operation: ['update', 'delete'],
					},
				},
			},

			// Credential ID
			{
				displayName: 'Credential ID',
				name: 'credentialId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['credential'],
						operation: ['delete', 'downloadKeystore'],
					},
				},
			},

			// Credential Type for delete
			{
				displayName: 'Credential Type',
				name: 'credentialType',
				type: 'options',
				options: [
					{ name: 'iOS Distribution', value: 'ios_distribution' },
					{ name: 'Android Keystore', value: 'android_keystore' },
				],
				default: 'ios_distribution',
				required: true,
				displayOptions: {
					show: {
						resource: ['credential'],
						operation: ['delete'],
					},
				},
			},

			// Bundle Identifier
			{
				displayName: 'Bundle Identifier',
				name: 'bundleIdentifier',
				type: 'string',
				default: '',
				required: true,
				description: 'iOS bundle identifier (e.g., com.example.app)',
				displayOptions: {
					show: {
						resource: ['credential'],
						operation: ['createIosDistribution'],
					},
				},
			},

			// Apple Team ID
			{
				displayName: 'Apple Team ID',
				name: 'appleTeamId',
				type: 'string',
				default: '',
				required: true,
				description: 'Apple Developer Team ID',
				displayOptions: {
					show: {
						resource: ['credential', 'device'],
						operation: ['createIosDistribution', 'createProvisioningProfile'],
					},
				},
			},

			// Keystore Password
			{
				displayName: 'Keystore Password',
				name: 'keystorePassword',
				type: 'string',
				typeOptions: {
					password: true,
				},
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['credential'],
						operation: ['createAndroidKeystore'],
					},
				},
			},

			// Key Alias
			{
				displayName: 'Key Alias',
				name: 'keyAlias',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['credential'],
						operation: ['createAndroidKeystore'],
					},
				},
			},

			// Key Password
			{
				displayName: 'Key Password',
				name: 'keyPassword',
				type: 'string',
				typeOptions: {
					password: true,
				},
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['credential'],
						operation: ['createAndroidKeystore'],
					},
				},
			},

			// Webhook ID
			{
				displayName: 'Webhook ID',
				name: 'webhookId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['webhook'],
						operation: ['get', 'update', 'delete', 'getDeliveries', 'redeliverEvent'],
					},
				},
			},

			// Webhook URL
			{
				displayName: 'URL',
				name: 'url',
				type: 'string',
				default: '',
				required: true,
				description: 'Webhook endpoint URL',
				displayOptions: {
					show: {
						resource: ['webhook'],
						operation: ['create'],
					},
				},
			},

			// Webhook Secret
			{
				displayName: 'Secret',
				name: 'secret',
				type: 'string',
				typeOptions: {
					password: true,
				},
				default: '',
				required: true,
				description: 'Webhook signing secret for verification',
				displayOptions: {
					show: {
						resource: ['webhook'],
						operation: ['create'],
					},
				},
			},

			// Webhook Event
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				options: WEBHOOK_EVENTS.map((e) => ({ name: e.name, value: e.value })),
				default: 'BUILD',
				required: true,
				displayOptions: {
					show: {
						resource: ['webhook'],
						operation: ['create'],
					},
				},
			},

			// Delivery ID
			{
				displayName: 'Delivery ID',
				name: 'deliveryId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['webhook'],
						operation: ['redeliverEvent'],
					},
				},
			},

			// Device ID
			{
				displayName: 'Device ID',
				name: 'deviceId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['device'],
						operation: ['get', 'delete'],
					},
				},
			},

			// UDID
			{
				displayName: 'UDID',
				name: 'udid',
				type: 'string',
				default: '',
				required: true,
				description: 'Device UDID (40 hexadecimal characters)',
				displayOptions: {
					show: {
						resource: ['device'],
						operation: ['register'],
					},
				},
			},

			// Device IDs for provisioning
			{
				displayName: 'Device IDs',
				name: 'deviceIds',
				type: 'string',
				typeOptions: {
					multipleValues: true,
				},
				default: [],
				required: true,
				description: 'Array of device IDs to include in provisioning profile',
				displayOptions: {
					show: {
						resource: ['device'],
						operation: ['createProvisioningProfile'],
					},
				},
			},

			// ==================== ADDITIONAL FIELDS ====================
			// Build additional fields
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['build'],
						operation: ['create'],
					},
				},
				options: [
					{
						displayName: 'Build Profile',
						name: 'buildProfile',
						type: 'string',
						default: '',
						description: 'Build profile name (development, preview, production)',
					},
					{
						displayName: 'Channel',
						name: 'channel',
						type: 'string',
						default: '',
						description: 'Release channel name',
					},
					{
						displayName: 'Git Commit Hash',
						name: 'gitCommitHash',
						type: 'string',
						default: '',
						description: 'Git commit hash to build from',
					},
				],
			},

			// Submission additional fields
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['submission'],
						operation: ['create'],
					},
				},
				options: [
					{
						displayName: 'Build ID',
						name: 'buildId',
						type: 'string',
						default: '',
						description: 'Build ID to submit',
					},
					{
						displayName: 'Apple ID',
						name: 'appleId',
						type: 'string',
						default: '',
						description: 'Apple ID for iOS submissions',
					},
					{
						displayName: 'App Store Connect App ID',
						name: 'ascAppId',
						type: 'string',
						default: '',
						description: 'App Store Connect App ID',
					},
					{
						displayName: 'Apple Team ID',
						name: 'appleTeamId',
						type: 'string',
						default: '',
						description: 'Apple Developer Team ID',
					},
					{
						displayName: 'Track',
						name: 'track',
						type: 'options',
						options: ANDROID_TRACKS.map((t) => ({ name: t.name, value: t.value })),
						default: 'internal',
						description: 'Android release track',
					},
					{
						displayName: 'Release Status',
						name: 'releaseStatus',
						type: 'options',
						options: [
							{ name: 'Draft', value: 'draft' },
							{ name: 'Halted', value: 'halted' },
							{ name: 'In Progress', value: 'inProgress' },
							{ name: 'Completed', value: 'completed' },
						],
						default: 'draft',
					},
					{
						displayName: 'Rollout',
						name: 'rollout',
						type: 'number',
						default: 100,
						description: 'Rollout percentage for staged releases',
					},
				],
			},

			// Update additional fields
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['update'],
						operation: ['publish'],
					},
				},
				options: [
					{
						displayName: 'Message',
						name: 'message',
						type: 'string',
						default: '',
						description: 'Update commit message',
					},
					{
						displayName: 'Runtime Version',
						name: 'runtimeVersion',
						type: 'string',
						default: '',
						description: 'Compatible runtime version',
					},
					{
						displayName: 'Platform',
						name: 'platform',
						type: 'options',
						options: [
							{ name: 'All', value: 'all' },
							{ name: 'iOS', value: 'ios' },
							{ name: 'Android', value: 'android' },
						],
						default: 'all',
					},
					{
						displayName: 'Git Commit Hash',
						name: 'gitCommitHash',
						type: 'string',
						default: '',
					},
				],
			},

			// Channel additional fields
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['channel'],
						operation: ['create'],
					},
				},
				options: [
					{
						displayName: 'Branch Mapping',
						name: 'branchMapping',
						type: 'string',
						default: '',
						description: 'JSON string defining initial branch mapping',
					},
				],
			},

			// Project additional fields
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['project'],
						operation: ['create'],
					},
				},
				options: [
					{
						displayName: 'Account Name',
						name: 'accountName',
						type: 'string',
						default: '',
						description: 'Account name (uses credential default if not set)',
					},
					{
						displayName: 'Privacy',
						name: 'privacy',
						type: 'options',
						options: PRIVACY_OPTIONS.map((p) => ({ name: p.name, value: p.value })),
						default: 'HIDDEN',
					},
				],
			},

			// Project update fields
			{
				displayName: 'Update Fields',
				name: 'updateFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['project'],
						operation: ['update'],
					},
				},
				options: [
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Privacy',
						name: 'privacy',
						type: 'options',
						options: PRIVACY_OPTIONS.map((p) => ({ name: p.name, value: p.value })),
						default: 'HIDDEN',
					},
				],
			},

			// Secret additional fields
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['secret'],
						operation: ['create'],
					},
				},
				options: [
					{
						displayName: 'Secret Type',
						name: 'secretType',
						type: 'options',
						options: SECRET_TYPES.map((s) => ({ name: s.name, value: s.value })),
						default: 'SHARED',
					},
				],
			},

			// Credential additional fields
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['credential'],
						operation: ['getIosDistribution'],
					},
				},
				options: [
					{
						displayName: 'Apple Team Identifier',
						name: 'appleTeamIdentifier',
						type: 'string',
						default: '',
					},
				],
			},

			// Webhook update fields
			{
				displayName: 'Update Fields',
				name: 'updateFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['webhook'],
						operation: ['update'],
					},
				},
				options: [
					{
						displayName: 'URL',
						name: 'url',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Secret',
						name: 'secret',
						type: 'string',
						typeOptions: {
							password: true,
						},
						default: '',
					},
					{
						displayName: 'Event',
						name: 'event',
						type: 'options',
						options: WEBHOOK_EVENTS.map((e) => ({ name: e.name, value: e.value })),
						default: 'BUILD',
					},
				],
			},

			// Device additional fields
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['device'],
						operation: ['register'],
					},
				},
				options: [
					{
						displayName: 'Device Name',
						name: 'name',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Device Class',
						name: 'deviceClass',
						type: 'options',
						options: DEVICE_CLASSES.map((d) => ({ name: d.name, value: d.value })),
						default: 'IPHONE',
					},
				],
			},

			// ==================== FILTERS ====================
			// Build filters
			{
				displayName: 'Filters',
				name: 'filters',
				type: 'collection',
				placeholder: 'Add Filter',
				default: {},
				displayOptions: {
					show: {
						resource: ['build'],
						operation: ['getMany'],
					},
				},
				options: [
					{
						displayName: 'Platform',
						name: 'platform',
						type: 'options',
						options: BUILD_PLATFORMS.map((p) => ({ name: p.name, value: p.value })),
						default: '',
					},
					{
						displayName: 'Status',
						name: 'status',
						type: 'options',
						options: BUILD_STATUSES.map((s) => ({ name: s.name, value: s.value })),
						default: '',
					},
				],
			},

			// Submission filters
			{
				displayName: 'Filters',
				name: 'filters',
				type: 'collection',
				placeholder: 'Add Filter',
				default: {},
				displayOptions: {
					show: {
						resource: ['submission'],
						operation: ['getMany'],
					},
				},
				options: [
					{
						displayName: 'Platform',
						name: 'platform',
						type: 'options',
						options: BUILD_PLATFORMS.map((p) => ({ name: p.name, value: p.value })),
						default: '',
					},
					{
						displayName: 'Status',
						name: 'status',
						type: 'options',
						options: [
							{ name: 'In Queue', value: 'IN_QUEUE' },
							{ name: 'In Progress', value: 'IN_PROGRESS' },
							{ name: 'Finished', value: 'FINISHED' },
							{ name: 'Errored', value: 'ERRORED' },
							{ name: 'Canceled', value: 'CANCELED' },
						],
						default: '',
					},
				],
			},

			// Project builds filters
			{
				displayName: 'Filters',
				name: 'filters',
				type: 'collection',
				placeholder: 'Add Filter',
				default: {},
				displayOptions: {
					show: {
						resource: ['project'],
						operation: ['getBuilds'],
					},
				},
				options: [
					{
						displayName: 'Platform',
						name: 'platform',
						type: 'options',
						options: BUILD_PLATFORMS.map((p) => ({ name: p.name, value: p.value })),
						default: '',
					},
					{
						displayName: 'Status',
						name: 'status',
						type: 'options',
						options: BUILD_STATUSES.map((s) => ({ name: s.name, value: s.value })),
						default: '',
					},
				],
			},

			// ==================== PAGINATION ====================
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				default: false,
				description: 'Whether to return all results or only up to a given limit',
				displayOptions: {
					show: {
						resource: ['build', 'submission', 'update', 'branch', 'channel', 'project', 'device'],
						operation: ['getMany', 'getUpdates', 'getBuilds', 'getSubmissions'],
					},
				},
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				description: 'Max number of results to return',
				typeOptions: {
					minValue: 1,
					maxValue: 100,
				},
				displayOptions: {
					show: {
						resource: ['build', 'submission', 'update', 'branch', 'channel', 'project', 'device'],
						operation: ['getMany', 'getUpdates', 'getBuilds', 'getSubmissions'],
						returnAll: [false],
					},
				},
			},

			// Branch publish parameters
			{
				displayName: 'Message',
				name: 'message',
				type: 'string',
				default: '',
				description: 'Update message',
				displayOptions: {
					show: {
						resource: ['branch'],
						operation: ['publish'],
					},
				},
			},
			{
				displayName: 'Runtime Version',
				name: 'runtimeVersion',
				type: 'string',
				default: '',
				description: 'Compatible runtime version',
				displayOptions: {
					show: {
						resource: ['branch'],
						operation: ['publish'],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData: INodeExecutionData[] = [];

				switch (resource) {
					case 'build':
						switch (operation) {
							case 'create':
								responseData = await build.create.call(this, i);
								break;
							case 'get':
								responseData = await build.get.call(this, i);
								break;
							case 'getMany':
								responseData = await build.getMany.call(this, i);
								break;
							case 'cancel':
								responseData = await build.cancel.call(this, i);
								break;
							case 'retry':
								responseData = await build.retry.call(this, i);
								break;
							case 'delete':
								responseData = await build.deleteBuild.call(this, i);
								break;
							case 'getArtifacts':
								responseData = await build.getArtifacts.call(this, i);
								break;
							case 'getLogs':
								responseData = await build.getLogs.call(this, i);
								break;
						}
						break;

					case 'submission':
						switch (operation) {
							case 'create':
								responseData = await submission.create.call(this, i);
								break;
							case 'get':
								responseData = await submission.get.call(this, i);
								break;
							case 'getMany':
								responseData = await submission.getMany.call(this, i);
								break;
							case 'cancel':
								responseData = await submission.cancel.call(this, i);
								break;
							case 'retry':
								responseData = await submission.retry.call(this, i);
								break;
							case 'getStatus':
								responseData = await submission.getStatus.call(this, i);
								break;
						}
						break;

					case 'update':
						switch (operation) {
							case 'publish':
								responseData = await update.publish.call(this, i);
								break;
							case 'get':
								responseData = await update.get.call(this, i);
								break;
							case 'getMany':
								responseData = await update.getMany.call(this, i);
								break;
							case 'rollback':
								responseData = await update.rollback.call(this, i);
								break;
							case 'delete':
								responseData = await update.deleteUpdate.call(this, i);
								break;
							case 'republish':
								responseData = await update.republish.call(this, i);
								break;
							case 'getManifest':
								responseData = await update.getManifest.call(this, i);
								break;
						}
						break;

					case 'branch':
						switch (operation) {
							case 'create':
								responseData = await branch.create.call(this, i);
								break;
							case 'get':
								responseData = await branch.get.call(this, i);
								break;
							case 'getMany':
								responseData = await branch.getMany.call(this, i);
								break;
							case 'update':
								responseData = await branch.update.call(this, i);
								break;
							case 'delete':
								responseData = await branch.deleteBranch.call(this, i);
								break;
							case 'getUpdates':
								responseData = await branch.getUpdates.call(this, i);
								break;
							case 'publish':
								responseData = await branch.publishToBranch.call(this, i);
								break;
						}
						break;

					case 'channel':
						switch (operation) {
							case 'create':
								responseData = await channel.create.call(this, i);
								break;
							case 'get':
								responseData = await channel.get.call(this, i);
								break;
							case 'getMany':
								responseData = await channel.getMany.call(this, i);
								break;
							case 'update':
								responseData = await channel.update.call(this, i);
								break;
							case 'delete':
								responseData = await channel.deleteChannel.call(this, i);
								break;
							case 'linkBranch':
								responseData = await channel.linkBranch.call(this, i);
								break;
							case 'unlinkBranch':
								responseData = await channel.unlinkBranch.call(this, i);
								break;
							case 'getLinkedBranch':
								responseData = await channel.getLinkedBranch.call(this, i);
								break;
						}
						break;

					case 'project':
						switch (operation) {
							case 'get':
								responseData = await project.get.call(this, i);
								break;
							case 'getMany':
								responseData = await project.getMany.call(this, i);
								break;
							case 'create':
								responseData = await project.create.call(this, i);
								break;
							case 'update':
								responseData = await project.update.call(this, i);
								break;
							case 'delete':
								responseData = await project.deleteProject.call(this, i);
								break;
							case 'getBuilds':
								responseData = await project.getBuilds.call(this, i);
								break;
							case 'getSubmissions':
								responseData = await project.getSubmissions.call(this, i);
								break;
							case 'getUpdates':
								responseData = await project.getUpdates.call(this, i);
								break;
							case 'transfer':
								responseData = await project.transfer.call(this, i);
								break;
						}
						break;

					case 'secret':
						switch (operation) {
							case 'create':
								responseData = await secret.create.call(this, i);
								break;
							case 'get':
								responseData = await secret.get.call(this, i);
								break;
							case 'getMany':
								responseData = await secret.getMany.call(this, i);
								break;
							case 'update':
								responseData = await secret.update.call(this, i);
								break;
							case 'delete':
								responseData = await secret.deleteSecret.call(this, i);
								break;
							case 'createBuildSecret':
								responseData = await secret.createBuildSecret.call(this, i);
								break;
							case 'createUpdateSecret':
								responseData = await secret.createUpdateSecret.call(this, i);
								break;
						}
						break;

					case 'credential':
						switch (operation) {
							case 'getMany':
								responseData = await credential.getMany.call(this, i);
								break;
							case 'getIosDistribution':
								responseData = await credential.getIosDistribution.call(this, i);
								break;
							case 'getIosPush':
								responseData = await credential.getIosPush.call(this, i);
								break;
							case 'getAndroidKeystore':
								responseData = await credential.getAndroidKeystore.call(this, i);
								break;
							case 'getAndroidFcm':
								responseData = await credential.getAndroidFcm.call(this, i);
								break;
							case 'createIosDistribution':
								responseData = await credential.createIosDistribution.call(this, i);
								break;
							case 'createAndroidKeystore':
								responseData = await credential.createAndroidKeystore.call(this, i);
								break;
							case 'delete':
								responseData = await credential.deleteCredential.call(this, i);
								break;
							case 'downloadKeystore':
								responseData = await credential.downloadKeystore.call(this, i);
								break;
						}
						break;

					case 'webhook':
						switch (operation) {
							case 'create':
								responseData = await webhook.create.call(this, i);
								break;
							case 'get':
								responseData = await webhook.get.call(this, i);
								break;
							case 'getMany':
								responseData = await webhook.getMany.call(this, i);
								break;
							case 'update':
								responseData = await webhook.update.call(this, i);
								break;
							case 'delete':
								responseData = await webhook.deleteWebhook.call(this, i);
								break;
							case 'getDeliveries':
								responseData = await webhook.getDeliveries.call(this, i);
								break;
							case 'redeliverEvent':
								responseData = await webhook.redeliverEvent.call(this, i);
								break;
						}
						break;

					case 'device':
						switch (operation) {
							case 'register':
								responseData = await device.register.call(this, i);
								break;
							case 'get':
								responseData = await device.get.call(this, i);
								break;
							case 'getMany':
								responseData = await device.getMany.call(this, i);
								break;
							case 'delete':
								responseData = await device.deleteDevice.call(this, i);
								break;
							case 'createProvisioningProfile':
								responseData = await device.createProvisioningProfile.call(this, i);
								break;
						}
						break;

					default:
						throw new NodeOperationError(this.getNode(), `Unknown resource: ${resource}`);
				}

				returnData.push(...responseData);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: (error as Error).message,
						},
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
