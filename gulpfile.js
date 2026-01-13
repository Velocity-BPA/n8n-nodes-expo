/**
 * [Velocity BPA Licensing Notice]
 *
 * This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
 *
 * Use of this node by for-profit organizations in production environments
 * requires a commercial license from Velocity BPA.
 *
 * For licensing information, visit https://velobpa.com/licensing
 * or contact licensing@velobpa.com.
 */

const { src, dest } = require('gulp');

function buildIcons() {
  return src('nodes/**/*.svg').pipe(dest('dist/nodes'));
}

exports['build:icons'] = buildIcons;
