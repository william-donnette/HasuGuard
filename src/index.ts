#!/usr/bin/env node

import chalk from 'chalk';
import {Command} from 'commander';
import path from 'path';
import semver from 'semver';
import packageJson from '../package.json';
import {checkForLatestVersion} from './utils/check-latest-version';
import {createFolder} from './utils/create-folder';
import {execCommand} from './utils/exec-command';
import {generateCasbinRBAC} from './utils/generate-casbin-rbac';
import {getConfig} from './utils/get-config';
import {getHasuraMetadata} from './utils/get-hasura-metadata';
import {isUsingYarn} from './utils/is-using-yarn';

export interface IHasuraGuardConfig {
	libraryTarget?: 'casbin';
	hasura?: {
		endpoint?: string;
		adminSecret?: string;
	};
	fileName?: string;
	typescript?: boolean;
	outputDir?: string;
	roles?: Array<string>;
	accessControlModel?: 'RBAC';
}

const main = async () => {
	let configPath: string = 'hasuguard.json';
	const program = new Command(packageJson.name)
		.version(packageJson.version)
		.arguments('<config-path>')
		.usage(`${chalk.green('<config-path>')} [options]`)
		.action((name) => {
			configPath = name;
		})
		.option('-e, --hasura-endpoint <hasuraEndpoint>', 'endpoint URL of the Hasura instance ')
		.option('-s, --hasura-admin-secret <hasuraAdminSecret>', 'admin secret of the Hasura instance ')
		.option('-l, --library-target <libraryTarget>', 'library target (must be "casbin")', (value: string) => {
			if (value !== 'casbin') {
				throw new Error('❌ Invalid library-target. Allowed values are "casbin".');
			}
			return value;
		})
		.option('-m, --access-control-model <accessControlModel>', 'access control model (must be "RBAC")', (value: string) => {
			if (value !== 'RBAC') {
				throw new Error('❌ Invalid access-control-model. Allowed values are "RBAC".');
			}
			return value;
		})
		.option('-r, --roles <roles>', 'roles to export', (value: string) => value.split(','))
		.option('-o, --output-dir <outputDir>', 'output directory into export')
		.option('-f, --filename <fileName>', 'name of the generated file')
		.option('-t, --typescript', 'enable TypeScript')
		.option('-v, --verbose', 'print additional logs')
		.allowUnknownOption()
		.on('--help', () => {
			console.log();
			console.log(`You can set your config in a ${chalk.green('hasuguard.json')} file.`);
			console.log(`You can see how to configure the JSON config file here: ${chalk.cyan('https://github.com/william-donnette/hasuguard')}`);
			console.log();
			console.log(`If you have any problems, do not hesitate to create an issue:`);
			console.log(`${chalk.cyan('https://gitlab.com/william-donnette/hasuguard/-/issues/new')}`);
			console.log();
		})
		.parse(process.argv);

	checkForLatestVersion()
		.catch(() => {
			try {
				return execCommand('npm view hasuguard version').toString().trim();
			} catch (e) {
				return null;
			}
		})
		.then((latest) => {
			if (latest && semver.lt(packageJson.version, latest)) {
				console.log();
				console.error(
					chalk.yellow(
						`You are running \`hasuguard\` ${packageJson.version}, which is behind the latest release (${latest}).\n\n` +
							'We recommend always using the latest version of hasuguard if possible.'
					)
				);
				console.log();
				process.exit(1);
			} else {
				const useYarn = isUsingYarn();
				let fileConfig: IHasuraGuardConfig = {};
				try {
					fileConfig = getConfig(configPath);
				} catch (e: any) {
					console.log(`⚠️ Failed to load the config from a config file.`);
					if (!program.hasuraEndpoint) {
						console.log();
						console.log('Please specify a valid config:');
						console.log(`Run ${chalk.green('--help')} for more details`);
						process.exit(1);
					}
				}
				const typescript = program.typescript ?? fileConfig.typescript ?? false;
				const libraryTarget = program.libraryTarget ?? fileConfig.libraryTarget ?? 'casbin';
				const accessControlModel = program.accessControlModel ?? fileConfig.accessControlModel ?? 'RBAC';
				const defaultFileName = libraryTarget + '-' + accessControlModel.toLowerCase() + '.' + (typescript ? 'ts' : 'js');
				const config: Required<IHasuraGuardConfig> = {
					outputDir: program.outputDir ?? fileConfig.outputDir ?? './hasuguard',
					typescript,
					libraryTarget,
					accessControlModel,
					roles: program.roles ?? fileConfig.roles ?? ['admin'],
					hasura: {
						endpoint: program.hasuraEndpoint ?? fileConfig.hasura?.endpoint,
						adminSecret: program.hasuraAdminSecret ?? fileConfig.hasura?.adminSecret,
					},
					fileName: program.fileName ?? fileConfig.fileName ?? defaultFileName,
				};

				if (config.libraryTarget === 'casbin') {
					startGenerateForCasbin(config, program.verbose, useYarn);
				}
			}
		});
};
main().catch((e: any) => {
	console.error(e.message);
});

const startGenerateForCasbin = async (config: Required<IHasuraGuardConfig>, verbose = false, useYarn = false) => {
	if (!config.hasura?.endpoint) {
		console.error(`❌ No Hasura endpoint URL specified.`);
		process.exit(1);
	}
	const response = await getHasuraMetadata(path.join(config.hasura.endpoint, 'v1/metadata'), config.hasura.adminSecret);
	if (verbose) {
		console.log('✅ Hasura Metadata retrieved');
	}

	await createFolder(config.outputDir);

	if (verbose) {
		console.log('✅ Folder created');
	}

	const accessControlModel = config.accessControlModel;
	const fileName = config.libraryTarget + '-' + config.accessControlModel.toLowerCase() + '.' + (config.typescript ? 'ts' : 'js');

	if (accessControlModel === 'RBAC') {
		await generateCasbinRBAC(response.data, path.join(config.outputDir, fileName), config.roles);
	}

	console.log('🎉 Permissions generated');
	process.exit(0);
};
