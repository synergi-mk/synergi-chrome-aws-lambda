"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLauncher = exports.resolveExecutablePath = exports.executablePathForChannel = void 0;
/**
 * Copyright 2017 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const fs_1 = require("fs");
const os_1 = __importDefault(require("os"));
const BrowserFetcher_js_1 = require("./BrowserFetcher.js");
const ChromeLauncher_js_1 = require("./ChromeLauncher.js");
const FirefoxLauncher_js_1 = require("./FirefoxLauncher.js");
/**
 * @internal
 */
function executablePathForChannel(channel) {
    const platform = os_1.default.platform();
    let chromePath;
    switch (platform) {
        case 'win32':
            switch (channel) {
                case 'chrome':
                    chromePath = `${process.env['PROGRAMFILES']}\\Google\\Chrome\\Application\\chrome.exe`;
                    break;
                case 'chrome-beta':
                    chromePath = `${process.env['PROGRAMFILES']}\\Google\\Chrome Beta\\Application\\chrome.exe`;
                    break;
                case 'chrome-canary':
                    chromePath = `${process.env['PROGRAMFILES']}\\Google\\Chrome SxS\\Application\\chrome.exe`;
                    break;
                case 'chrome-dev':
                    chromePath = `${process.env['PROGRAMFILES']}\\Google\\Chrome Dev\\Application\\chrome.exe`;
                    break;
            }
            break;
        case 'darwin':
            switch (channel) {
                case 'chrome':
                    chromePath =
                        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
                    break;
                case 'chrome-beta':
                    chromePath =
                        '/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta';
                    break;
                case 'chrome-canary':
                    chromePath =
                        '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary';
                    break;
                case 'chrome-dev':
                    chromePath =
                        '/Applications/Google Chrome Dev.app/Contents/MacOS/Google Chrome Dev';
                    break;
            }
            break;
        case 'linux':
            switch (channel) {
                case 'chrome':
                    chromePath = '/opt/google/chrome/chrome';
                    break;
                case 'chrome-beta':
                    chromePath = '/opt/google/chrome-beta/chrome';
                    break;
                case 'chrome-dev':
                    chromePath = '/opt/google/chrome-unstable/chrome';
                    break;
            }
            break;
    }
    if (!chromePath) {
        throw new Error(`Unable to detect browser executable path for '${channel}' on ${platform}.`);
    }
    // Check if Chrome exists and is accessible.
    try {
        (0, fs_1.accessSync)(chromePath);
    }
    catch (error) {
        throw new Error(`Could not find Google Chrome executable for channel '${channel}' at '${chromePath}'.`);
    }
    return chromePath;
}
exports.executablePathForChannel = executablePathForChannel;
/**
 * @internal
 */
function resolveExecutablePath(launcher) {
    const { product, _isPuppeteerCore, _projectRoot, _preferredRevision } = launcher;
    let downloadPath;
    // puppeteer-core doesn't take into account PUPPETEER_* env variables.
    if (!_isPuppeteerCore) {
        const executablePath = process.env['PUPPETEER_EXECUTABLE_PATH'] ||
            process.env['npm_config_puppeteer_executable_path'] ||
            process.env['npm_package_config_puppeteer_executable_path'];
        if (executablePath) {
            const missingText = !(0, fs_1.existsSync)(executablePath)
                ? 'Tried to use PUPPETEER_EXECUTABLE_PATH env variable to launch browser but did not find any executable at: ' +
                    executablePath
                : undefined;
            return { executablePath, missingText };
        }
        const ubuntuChromiumPath = '/usr/bin/chromium-browser';
        if (product === 'chrome' &&
            os_1.default.platform() !== 'darwin' &&
            os_1.default.arch() === 'arm64' &&
            (0, fs_1.existsSync)(ubuntuChromiumPath)) {
            return { executablePath: ubuntuChromiumPath, missingText: undefined };
        }
        downloadPath =
            process.env['PUPPETEER_DOWNLOAD_PATH'] ||
                process.env['npm_config_puppeteer_download_path'] ||
                process.env['npm_package_config_puppeteer_download_path'];
    }
    if (!_projectRoot) {
        throw new Error('_projectRoot is undefined. Unable to create a BrowserFetcher.');
    }
    const browserFetcher = new BrowserFetcher_js_1.BrowserFetcher(_projectRoot, {
        product: product,
        path: downloadPath,
    });
    if (!_isPuppeteerCore && product === 'chrome') {
        const revision = process.env['PUPPETEER_CHROMIUM_REVISION'];
        if (revision) {
            const revisionInfo = browserFetcher.revisionInfo(revision);
            const missingText = !revisionInfo.local
                ? 'Tried to use PUPPETEER_CHROMIUM_REVISION env variable to launch browser but did not find executable at: ' +
                    revisionInfo.executablePath
                : undefined;
            return { executablePath: revisionInfo.executablePath, missingText };
        }
    }
    const revisionInfo = browserFetcher.revisionInfo(_preferredRevision);
    const firefoxHelp = `Run \`PUPPETEER_PRODUCT=firefox npm install\` to download a supported Firefox browser binary.`;
    const chromeHelp = `Run \`npm install\` to download the correct Chromium revision (${launcher._preferredRevision}).`;
    const missingText = !revisionInfo.local
        ? `Could not find expected browser (${product}) locally. ${product === 'chrome' ? chromeHelp : firefoxHelp}`
        : undefined;
    return { executablePath: revisionInfo.executablePath, missingText };
}
exports.resolveExecutablePath = resolveExecutablePath;
/**
 * @internal
 */
function createLauncher(projectRoot, preferredRevision, isPuppeteerCore, product = 'chrome') {
    switch (product) {
        case 'firefox':
            return new FirefoxLauncher_js_1.FirefoxLauncher(projectRoot, preferredRevision, isPuppeteerCore);
        case 'chrome':
            return new ChromeLauncher_js_1.ChromeLauncher(projectRoot, preferredRevision, isPuppeteerCore);
    }
}
exports.createLauncher = createLauncher;
//# sourceMappingURL=ProductLauncher.js.map