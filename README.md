# n8n-nodes-expo

> [Velocity BPA Licensing Notice]
>
> This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
>
> Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
>
> For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.

A comprehensive n8n community node for Expo Application Services (EAS), the cloud platform for React Native and Expo apps. This node enables workflow automation for builds, app store submissions, over-the-air updates, project management, credentials, webhooks, and device registration.

![n8n Community Node](https://img.shields.io/badge/n8n-Community%20Node-ff6d5a)
![Expo EAS](https://img.shields.io/badge/Expo-EAS-4630eb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)
![License](https://img.shields.io/badge/license-BSL--1.1-blue)

## Features

- **Build Management**: Trigger, monitor, cancel, and retry EAS builds for iOS and Android
- **App Store Submissions**: Automate submissions to Apple App Store and Google Play Store
- **OTA Updates**: Publish, rollback, and manage over-the-air updates
- **Branch & Channel Management**: Create and manage update branches and release channels
- **Project Management**: Create, update, and manage Expo projects
- **Secret Management**: Securely manage environment secrets for builds and updates
- **Credential Management**: Handle iOS certificates, Android keystores, and push credentials
- **Webhooks**: Create and manage webhook endpoints for build/submission notifications
- **Device Registration**: Register devices for ad-hoc iOS builds

## Installation

### Community Nodes (Recommended)

1. Open n8n
2. Go to **Settings** > **Community Nodes**
3. Click **Install a community node**
4. Enter `n8n-nodes-expo`
5. Click **Install**

### Manual Installation

```bash
# Navigate to your n8n installation directory
cd ~/.n8n

# Install the node
npm install n8n-nodes-expo
```

### Development Installation

```bash
# 1. Extract the zip file
unzip n8n-nodes-expo.zip
cd n8n-nodes-expo

# 2. Install dependencies
npm install

# 3. Build the project
npm run build

# 4. Create symlink to n8n custom nodes directory
# For Linux/macOS:
mkdir -p ~/.n8n/custom
ln -s $(pwd) ~/.n8n/custom/n8n-nodes-expo

# For Windows (run as Administrator):
# mklink /D %USERPROFILE%\.n8n\custom\n8n-nodes-expo %CD%

# 5. Restart n8n
n8n start
```

## Credentials Setup

### Expo API Credentials

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Access Token | String (Password) | Yes | Expo Personal or Robot Access Token |
| Account Name | String | No | Default Expo account or organization name |

### Getting Your Access Token

1. Log into [expo.dev](https://expo.dev)
2. Navigate to **Account Settings** > **Access Tokens**
3. Click **Create Token**
4. Choose **Personal Access Token** for individual use or **Robot Token** for CI/CD
5. Copy the token immediately (shown only once)
6. Paste into n8n credential configuration

## Resources & Operations

### Build

| Operation | Description |
|-----------|-------------|
| Create | Trigger a new EAS build |
| Get | Get build details by ID |
| Get Many | List builds for a project with filters |
| Cancel | Cancel a running build |
| Retry | Retry a failed build |
| Delete | Delete a build record |
| Get Artifacts | Get build artifacts and download URLs |
| Get Logs | Get build logs |

### Submission

| Operation | Description |
|-----------|-------------|
| Create | Submit build to app store |
| Get | Get submission details |
| Get Many | List submissions for project |
| Cancel | Cancel pending submission |
| Retry | Retry failed submission |
| Get Status | Get submission status |

### Update

| Operation | Description |
|-----------|-------------|
| Publish | Publish OTA update |
| Get | Get update details |
| Get Many | List updates for branch |
| Rollback | Rollback to previous update |
| Delete | Delete an update |
| Republish | Republish an existing update |
| Get Manifest | Get update manifest |

### Branch

| Operation | Description |
|-----------|-------------|
| Create | Create new update branch |
| Get | Get branch details |
| Get Many | List all branches |
| Update | Update branch configuration |
| Delete | Delete branch |
| Get Updates | Get updates for branch |
| Publish to Branch | Publish update to branch |

### Channel

| Operation | Description |
|-----------|-------------|
| Create | Create release channel |
| Get | Get channel details |
| Get Many | List all channels |
| Update | Update channel configuration |
| Delete | Delete channel |
| Link Branch | Link branch to channel |
| Unlink Branch | Unlink branch from channel |
| Get Linked Branch | Get currently linked branch |

### Project

| Operation | Description |
|-----------|-------------|
| Get | Get project details |
| Get Many | List account projects |
| Create | Create new project |
| Update | Update project settings |
| Delete | Delete project |
| Get Builds | Get project builds |
| Get Submissions | Get project submissions |
| Get Updates | Get project updates |
| Transfer | Transfer project to another account |

### Secret

| Operation | Description |
|-----------|-------------|
| Create | Create environment secret |
| Get | Get secret metadata (not value) |
| Get Many | List all secrets |
| Update | Update secret value |
| Delete | Delete secret |
| Create Build Secret | Create build-time secret |
| Create Update Secret | Create update-time secret |

### Credential

| Operation | Description |
|-----------|-------------|
| Get Many | List all credentials |
| Get iOS Distribution | Get iOS distribution credentials |
| Get iOS Push | Get iOS push notification credentials |
| Get Android Keystore | Get Android keystore |
| Get Android FCM | Get Android FCM credentials |
| Create iOS Distribution | Create iOS distribution credentials |
| Create Android Keystore | Create Android keystore |
| Delete | Delete credentials |
| Download Keystore | Download Android keystore file |

### Webhook

| Operation | Description |
|-----------|-------------|
| Create | Create webhook endpoint |
| Get | Get webhook details |
| Get Many | List all webhooks |
| Update | Update webhook configuration |
| Delete | Delete webhook |
| Get Deliveries | Get webhook delivery history |
| Redeliver Event | Redeliver a failed webhook event |

### Device

| Operation | Description |
|-----------|-------------|
| Register | Register device for ad-hoc builds |
| Get | Get device details |
| Get Many | List registered devices |
| Delete | Remove registered device |
| Create Provisioning Profile | Create provisioning profile with devices |

## Usage Examples

### Trigger a Build on Git Push

```json
{
  "nodes": [
    {
      "name": "GitHub Trigger",
      "type": "n8n-nodes-base.githubTrigger",
      "parameters": {
        "events": ["push"]
      }
    },
    {
      "name": "Expo Build",
      "type": "n8n-nodes-expo.expo",
      "parameters": {
        "resource": "build",
        "operation": "create",
        "projectId": "@myaccount/myapp",
        "platform": "all",
        "buildProfile": "production"
      }
    }
  ]
}
```

### Monitor Build and Submit to Store

```json
{
  "nodes": [
    {
      "name": "Get Build Status",
      "type": "n8n-nodes-expo.expo",
      "parameters": {
        "resource": "build",
        "operation": "get",
        "buildId": "={{ $json.buildId }}"
      }
    },
    {
      "name": "Submit to App Store",
      "type": "n8n-nodes-expo.expo",
      "parameters": {
        "resource": "submission",
        "operation": "create",
        "projectId": "@myaccount/myapp",
        "platform": "ios",
        "buildId": "={{ $json.id }}"
      }
    }
  ]
}
```

### Publish OTA Update

```json
{
  "nodes": [
    {
      "name": "Publish Update",
      "type": "n8n-nodes-expo.expo",
      "parameters": {
        "resource": "update",
        "operation": "publish",
        "projectId": "@myaccount/myapp",
        "branchName": "production",
        "message": "Bug fixes and performance improvements",
        "platform": "all"
      }
    }
  ]
}
```

## EAS Concepts

### Build Profiles

Build profiles define build configurations in `eas.json`:
- **development**: Debug builds for development
- **preview**: Internal testing builds
- **production**: Release builds for app stores

### Branches & Channels

- **Branch**: A stream of updates (like git branches)
- **Channel**: A named pointer to a branch for client apps
- **Updates**: OTA JavaScript bundles published to branches

### Runtime Versions

Runtime version determines update compatibility:
- Updates only install on matching runtime versions
- Increment when native code changes

## Error Handling

The node handles common Expo API errors:

| Error Code | Description | Resolution |
|------------|-------------|------------|
| UNAUTHENTICATED | Invalid access token | Verify token in credentials |
| FORBIDDEN | Insufficient permissions | Check account/project access |
| NOT_FOUND | Resource doesn't exist | Verify ID or project slug |
| VALIDATION_ERROR | Invalid parameters | Check input values |
| RATE_LIMITED | Too many requests | Wait and retry |

## Security Best Practices

1. **Use Robot Tokens**: For CI/CD, use Robot tokens instead of Personal tokens
2. **Limit Token Scope**: Create tokens with minimum required permissions
3. **Rotate Tokens**: Regularly rotate access tokens
4. **Secure Webhooks**: Use webhook signing secrets to verify payloads
5. **Environment Secrets**: Use Expo secrets instead of hardcoding values

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run linting
npm run lint

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Format code
npm run format
```

## Author

**Velocity BPA**
- Website: [velobpa.com](https://velobpa.com)
- GitHub: [Velocity-BPA](https://github.com/Velocity-BPA)

## Licensing

This n8n community node is licensed under the **Business Source License 1.1**.

### Free Use
Permitted for personal, educational, research, and internal business use.

### Commercial Use
Use of this node within any SaaS, PaaS, hosted platform, managed service, or paid automation offering requires a commercial license.

For licensing inquiries: **licensing@velobpa.com**

See [LICENSE](LICENSE), [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md), and [LICENSING_FAQ.md](LICENSING_FAQ.md) for details.

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## Support

- **Issues**: [GitHub Issues](https://github.com/Velocity-BPA/n8n-nodes-expo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Velocity-BPA/n8n-nodes-expo/discussions)
- **Expo Documentation**: [docs.expo.dev](https://docs.expo.dev)

## Acknowledgments

- [Expo](https://expo.dev) for the amazing React Native platform
- [n8n](https://n8n.io) for the powerful automation platform
- The open-source community for inspiration and support
