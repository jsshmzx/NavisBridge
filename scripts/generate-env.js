/**
 * 生成运行时环境变量配置文件 dist/env.js
 * 在 Zeabur 等平台上，环境变量在运行时注入而非构建时，
 * 因此通过此脚本在构建后生成 env.js，供前端运行时读取。
 */

const fs = require('fs');
const path = require('path');

const apiUrl = process.env.TINDER_API_URL || '';

const content = `window.__TINDER_API_URL__ = ${JSON.stringify(apiUrl)};\n`;

const distPath = path.resolve(__dirname, '../dist');
const envPath = path.join(distPath, 'env.js');

if (!fs.existsSync(distPath)) {
  fs.mkdirSync(distPath, { recursive: true });
}

fs.writeFileSync(envPath, content);
// eslint-disable-next-line no-console
console.log(`[generate-env] TINDER_API_URL = ${apiUrl || '(empty)'}`);
// eslint-disable-next-line no-console
console.log(`[generate-env] written to ${envPath}`);
