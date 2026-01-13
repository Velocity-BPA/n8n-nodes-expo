/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

export const EXPO_GRAPHQL_ENDPOINT = 'https://api.expo.dev/graphql';
export const EXPO_REST_ENDPOINT = 'https://api.expo.dev/v2';

export const BUILD_FRAGMENTS = `
	fragment BuildFragment on Build {
		id
		status
		platform
		distribution
		buildProfile
		channel
		gitCommitHash
		createdAt
		updatedAt
		completedAt
		expirationDate
		artifacts {
			buildUrl
			applicationArchiveUrl
			logsS3KeyPrefix
		}
		error {
			message
			errorCode
		}
		metrics {
			buildDuration
			buildQueueTime
		}
		project {
			id
			name
			slug
			fullName
		}
	}
`;

export const QUERIES = {
	// Viewer queries
	VIEWER: `
		query Viewer {
			viewer {
				id
				username
				email
				accounts {
					id
					name
				}
			}
		}
	`,

	// Build queries
	GET_BUILD: `
		${BUILD_FRAGMENTS}
		query GetBuild($buildId: ID!) {
			builds {
				byId(buildId: $buildId) {
					...BuildFragment
				}
			}
		}
	`,

	GET_BUILDS: `
		${BUILD_FRAGMENTS}
		query GetBuilds($appId: String!, $platform: AppPlatform, $status: BuildStatus, $first: Int, $after: String) {
			app {
				byFullName(fullName: $appId) {
					builds(platform: $platform, status: $status, first: $first, after: $after) {
						edges {
							node {
								...BuildFragment
							}
							cursor
						}
						pageInfo {
							hasNextPage
							endCursor
						}
					}
				}
			}
		}
	`,

	GET_BUILD_LOGS: `
		query GetBuildLogs($buildId: ID!) {
			builds {
				byId(buildId: $buildId) {
					id
					artifacts {
						logsS3KeyPrefix
					}
				}
			}
		}
	`,

	// Submission queries
	GET_SUBMISSION: `
		query GetSubmission($submissionId: ID!) {
			submission {
				byId(submissionId: $submissionId) {
					id
					status
					platform
					createdAt
					updatedAt
					completedAt
					error {
						message
						errorCode
					}
				}
			}
		}
	`,

	GET_SUBMISSIONS: `
		query GetSubmissions($appId: String!, $platform: AppPlatform, $status: SubmissionStatus, $first: Int, $after: String) {
			app {
				byFullName(fullName: $appId) {
					submissions(platform: $platform, status: $status, first: $first, after: $after) {
						edges {
							node {
								id
								status
								platform
								createdAt
								updatedAt
								completedAt
								error {
									message
									errorCode
								}
							}
							cursor
						}
						pageInfo {
							hasNextPage
							endCursor
						}
					}
				}
			}
		}
	`,

	// Update queries
	GET_UPDATE: `
		query GetUpdate($updateId: ID!) {
			update {
				byId(updateId: $updateId) {
					id
					group
					message
					runtimeVersion
					platform
					gitCommitHash
					createdAt
					isRollBackToEmbedded
					manifestPermalink
				}
			}
		}
	`,

	GET_UPDATES_BY_BRANCH: `
		query GetUpdatesByBranch($appId: String!, $branchName: String!, $first: Int, $after: String) {
			app {
				byFullName(fullName: $appId) {
					updateBranchByName(name: $branchName) {
						id
						name
						updates(first: $first, after: $after) {
							edges {
								node {
									id
									group
									message
									runtimeVersion
									platform
									gitCommitHash
									createdAt
									isRollBackToEmbedded
									manifestPermalink
								}
								cursor
							}
							pageInfo {
								hasNextPage
								endCursor
							}
						}
					}
				}
			}
		}
	`,

	// Branch queries
	GET_BRANCH: `
		query GetBranch($appId: String!, $branchName: String!) {
			app {
				byFullName(fullName: $appId) {
					updateBranchByName(name: $branchName) {
						id
						name
						createdAt
						updatedAt
					}
				}
			}
		}
	`,

	GET_BRANCHES: `
		query GetBranches($appId: String!, $first: Int, $after: String) {
			app {
				byFullName(fullName: $appId) {
					updateBranches(first: $first, after: $after) {
						edges {
							node {
								id
								name
								createdAt
								updatedAt
							}
							cursor
						}
						pageInfo {
							hasNextPage
							endCursor
						}
					}
				}
			}
		}
	`,

	// Channel queries
	GET_CHANNEL: `
		query GetChannel($appId: String!, $channelName: String!) {
			app {
				byFullName(fullName: $appId) {
					updateChannelByName(name: $channelName) {
						id
						name
						createdAt
						updatedAt
						branchMapping
						updateBranch {
							id
							name
						}
					}
				}
			}
		}
	`,

	GET_CHANNELS: `
		query GetChannels($appId: String!, $first: Int, $after: String) {
			app {
				byFullName(fullName: $appId) {
					updateChannels(first: $first, after: $after) {
						edges {
							node {
								id
								name
								createdAt
								updatedAt
								branchMapping
								updateBranch {
									id
									name
								}
							}
							cursor
						}
						pageInfo {
							hasNextPage
							endCursor
						}
					}
				}
			}
		}
	`,

	// Project queries
	GET_PROJECT: `
		query GetProject($appId: String!) {
			app {
				byFullName(fullName: $appId) {
					id
					name
					slug
					fullName
					description
					privacy
					createdAt
					updatedAt
					ownerAccount {
						id
						name
					}
					githubRepository {
						githubRepoOwnerName
						githubRepoName
					}
				}
			}
		}
	`,

	GET_PROJECTS: `
		query GetProjects($accountName: String!, $first: Int, $after: String) {
			account {
				byName(accountName: $accountName) {
					apps(first: $first, after: $after) {
						edges {
							node {
								id
								name
								slug
								fullName
								description
								privacy
								createdAt
								updatedAt
								ownerAccount {
									id
									name
								}
							}
							cursor
						}
						pageInfo {
							hasNextPage
							endCursor
						}
					}
				}
			}
		}
	`,

	// Secret queries
	GET_SECRETS: `
		query GetSecrets($appId: String!) {
			app {
				byFullName(fullName: $appId) {
					environmentSecrets {
						id
						name
						type
						createdAt
						updatedAt
					}
				}
			}
		}
	`,

	// Webhook queries
	GET_WEBHOOKS: `
		query GetWebhooks($appId: String!) {
			app {
				byFullName(fullName: $appId) {
					webhooks {
						id
						url
						event
						createdAt
						updatedAt
					}
				}
			}
		}
	`,

	// Device queries
	GET_DEVICES: `
		query GetDevices($appId: String!, $first: Int, $after: String) {
			app {
				byFullName(fullName: $appId) {
					appleDevices(first: $first, after: $after) {
						edges {
							node {
								id
								identifier
								name
								deviceClass
								createdAt
								enabled
							}
							cursor
						}
						pageInfo {
							hasNextPage
							endCursor
						}
					}
				}
			}
		}
	`,

	// Credential queries
	GET_IOS_DISTRIBUTION_CREDENTIALS: `
		query GetIosDistributionCredentials($appId: String!, $appleTeamIdentifier: String) {
			app {
				byFullName(fullName: $appId) {
					iosAppCredentials(filter: { appleTeamIdentifier: $appleTeamIdentifier }) {
						id
						appleTeam {
							id
							appleTeamIdentifier
							appleTeamName
						}
						iosAppBuildCredentialsList {
							id
							distributionCertificate {
								id
								serialNumber
								validityNotBefore
								validityNotAfter
								appleTeam {
									appleTeamIdentifier
									appleTeamName
								}
							}
						}
					}
				}
			}
		}
	`,

	GET_ANDROID_KEYSTORE: `
		query GetAndroidKeystore($appId: String!) {
			app {
				byFullName(fullName: $appId) {
					androidAppCredentials {
						id
						androidKeystore {
							id
							keyAlias
							type
							createdAt
							updatedAt
						}
					}
				}
			}
		}
	`,
};

export const MUTATIONS = {
	// Build mutations
	CREATE_BUILD: `
		${BUILD_FRAGMENTS}
		mutation CreateBuild($appId: ID!, $platform: AppPlatform!, $buildProfile: String, $channel: String, $gitCommitHash: String) {
			build {
				createBuildForApp(
					appId: $appId
					buildParams: {
						platform: $platform
						buildProfile: $buildProfile
						channel: $channel
						gitCommitHash: $gitCommitHash
					}
				) {
					...BuildFragment
				}
			}
		}
	`,

	CANCEL_BUILD: `
		mutation CancelBuild($buildId: ID!) {
			build {
				cancel(buildId: $buildId) {
					id
					status
				}
			}
		}
	`,

	RETRY_BUILD: `
		${BUILD_FRAGMENTS}
		mutation RetryBuild($buildId: ID!) {
			build {
				retry(buildId: $buildId) {
					...BuildFragment
				}
			}
		}
	`,

	DELETE_BUILD: `
		mutation DeleteBuild($buildId: ID!) {
			build {
				deleteBuild(buildId: $buildId) {
					id
				}
			}
		}
	`,

	// Submission mutations
	CREATE_SUBMISSION: `
		mutation CreateSubmission($appId: ID!, $platform: AppPlatform!, $buildId: ID, $config: SubmissionConfigInput) {
			submission {
				createSubmission(
					appId: $appId
					platform: $platform
					buildId: $buildId
					config: $config
				) {
					id
					status
					platform
					createdAt
				}
			}
		}
	`,

	CANCEL_SUBMISSION: `
		mutation CancelSubmission($submissionId: ID!) {
			submission {
				cancelSubmission(submissionId: $submissionId) {
					id
					status
				}
			}
		}
	`,

	RETRY_SUBMISSION: `
		mutation RetrySubmission($submissionId: ID!) {
			submission {
				retrySubmission(submissionId: $submissionId) {
					id
					status
					platform
					createdAt
				}
			}
		}
	`,

	// Branch mutations
	CREATE_BRANCH: `
		mutation CreateBranch($appId: ID!, $name: String!) {
			updateBranch {
				createUpdateBranchForApp(appId: $appId, name: $name) {
					id
					name
					createdAt
					updatedAt
				}
			}
		}
	`,

	DELETE_BRANCH: `
		mutation DeleteBranch($branchId: ID!) {
			updateBranch {
				deleteUpdateBranch(branchId: $branchId) {
					id
				}
			}
		}
	`,

	UPDATE_BRANCH: `
		mutation UpdateBranch($branchId: ID!, $name: String!) {
			updateBranch {
				editUpdateBranch(branchId: $branchId, newName: $name) {
					id
					name
					updatedAt
				}
			}
		}
	`,

	// Channel mutations
	CREATE_CHANNEL: `
		mutation CreateChannel($appId: ID!, $name: String!, $branchMapping: String) {
			updateChannel {
				createUpdateChannelForApp(appId: $appId, name: $name, branchMapping: $branchMapping) {
					id
					name
					createdAt
					branchMapping
				}
			}
		}
	`,

	DELETE_CHANNEL: `
		mutation DeleteChannel($channelId: ID!) {
			updateChannel {
				deleteUpdateChannel(channelId: $channelId) {
					id
				}
			}
		}
	`,

	UPDATE_CHANNEL: `
		mutation UpdateChannel($channelId: ID!, $branchMapping: String!) {
			updateChannel {
				editUpdateChannel(channelId: $channelId, branchMapping: $branchMapping) {
					id
					name
					branchMapping
					updatedAt
				}
			}
		}
	`,

	// Secret mutations
	CREATE_SECRET: `
		mutation CreateSecret($appId: ID!, $name: String!, $value: String!, $type: EnvironmentSecretType) {
			environmentSecret {
				createEnvironmentSecretForApp(appId: $appId, environmentSecretData: { name: $name, value: $value, type: $type }) {
					id
					name
					type
					createdAt
				}
			}
		}
	`,

	UPDATE_SECRET: `
		mutation UpdateSecret($secretId: ID!, $value: String!) {
			environmentSecret {
				updateEnvironmentSecret(environmentSecretId: $secretId, environmentSecretData: { value: $value }) {
					id
					name
					updatedAt
				}
			}
		}
	`,

	DELETE_SECRET: `
		mutation DeleteSecret($secretId: ID!) {
			environmentSecret {
				deleteEnvironmentSecret(environmentSecretId: $secretId) {
					id
				}
			}
		}
	`,

	// Webhook mutations
	CREATE_WEBHOOK: `
		mutation CreateWebhook($appId: ID!, $url: String!, $secret: String!, $event: WebhookType!) {
			webhook {
				createWebhook(appId: $appId, webhookInput: { url: $url, secret: $secret, event: $event }) {
					id
					url
					event
					createdAt
				}
			}
		}
	`,

	UPDATE_WEBHOOK: `
		mutation UpdateWebhook($webhookId: ID!, $url: String, $secret: String, $event: WebhookType) {
			webhook {
				updateWebhook(webhookId: $webhookId, webhookInput: { url: $url, secret: $secret, event: $event }) {
					id
					url
					event
					updatedAt
				}
			}
		}
	`,

	DELETE_WEBHOOK: `
		mutation DeleteWebhook($webhookId: ID!) {
			webhook {
				deleteWebhook(webhookId: $webhookId) {
					id
				}
			}
		}
	`,

	// Device mutations
	REGISTER_DEVICE: `
		mutation RegisterDevice($appId: ID!, $deviceData: AppleDeviceInput!) {
			appleDevice {
				createAppleDevice(appId: $appId, appleDeviceInput: $deviceData) {
					id
					identifier
					name
					deviceClass
					createdAt
					enabled
				}
			}
		}
	`,

	DELETE_DEVICE: `
		mutation DeleteDevice($deviceId: ID!) {
			appleDevice {
				deleteAppleDevice(appleDeviceId: $deviceId) {
					id
				}
			}
		}
	`,

	// Update mutations
	DELETE_UPDATE: `
		mutation DeleteUpdate($updateId: ID!) {
			update {
				deleteUpdate(updateId: $updateId) {
					id
				}
			}
		}
	`,

	// Project mutations
	CREATE_PROJECT: `
		mutation CreateProject($accountId: ID!, $projectName: String!, $privacy: AppPrivacy) {
			app {
				createApp(appInput: { accountId: $accountId, projectName: $projectName, privacy: $privacy }) {
					id
					name
					slug
					fullName
					privacy
					createdAt
				}
			}
		}
	`,

	UPDATE_PROJECT: `
		mutation UpdateProject($appId: ID!, $privacy: AppPrivacy, $description: String) {
			app {
				editApp(appId: $appId, appInput: { privacy: $privacy, description: $description }) {
					id
					name
					description
					privacy
					updatedAt
				}
			}
		}
	`,

	DELETE_PROJECT: `
		mutation DeleteProject($appId: ID!) {
			app {
				deleteApp(appId: $appId) {
					id
				}
			}
		}
	`,

	TRANSFER_PROJECT: `
		mutation TransferProject($appId: ID!, $toAccountId: ID!) {
			app {
				transferApp(appId: $appId, destinationAccountId: $toAccountId) {
					id
					fullName
					ownerAccount {
						id
						name
					}
				}
			}
		}
	`,
};

export const WEBHOOK_EVENTS = [
	{ name: 'Build Finished', value: 'BUILD' },
	{ name: 'Submission Finished', value: 'SUBMIT' },
] as const;

export const BUILD_PLATFORMS = [
	{ name: 'iOS', value: 'IOS' },
	{ name: 'Android', value: 'ANDROID' },
] as const;

export const BUILD_STATUSES = [
	{ name: 'New', value: 'NEW' },
	{ name: 'In Queue', value: 'IN_QUEUE' },
	{ name: 'In Progress', value: 'IN_PROGRESS' },
	{ name: 'Pending Cancel', value: 'PENDING_CANCEL' },
	{ name: 'Canceled', value: 'CANCELED' },
	{ name: 'Finished', value: 'FINISHED' },
	{ name: 'Errored', value: 'ERRORED' },
] as const;

export const DISTRIBUTION_TYPES = [
	{ name: 'Internal', value: 'INTERNAL' },
	{ name: 'Store', value: 'STORE' },
	{ name: 'Simulator', value: 'SIMULATOR' },
] as const;

export const ANDROID_TRACKS = [
	{ name: 'Internal', value: 'internal' },
	{ name: 'Alpha', value: 'alpha' },
	{ name: 'Beta', value: 'beta' },
	{ name: 'Production', value: 'production' },
] as const;

export const SECRET_TYPES = [
	{ name: 'Build', value: 'BUILD' },
	{ name: 'Update', value: 'UPDATE' },
	{ name: 'Shared', value: 'SHARED' },
] as const;

export const PRIVACY_OPTIONS = [
	{ name: 'Public', value: 'PUBLIC' },
	{ name: 'Unlisted', value: 'UNLISTED' },
	{ name: 'Hidden', value: 'HIDDEN' },
] as const;

export const DEVICE_CLASSES = [
	{ name: 'iPhone', value: 'IPHONE' },
	{ name: 'iPad', value: 'IPAD' },
] as const;
