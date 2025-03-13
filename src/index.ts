#!/usr/bin/env node

import chalk from 'chalk';
import {Command} from 'commander';
import path from 'path';
import semver from 'semver';
import packageJson from '../package.json';
import {checkForLatestVersion} from './utils/check-latest-version';
import {createFolder} from './utils/create-folder';
import {execCommand} from './utils/exec-command';
import {fileExist} from './utils/file-exist';
import {generateCasbinRBAC} from './utils/generate-casbin-rbac';
import {getConfig} from './utils/get-config';
import {getHasuraMetadata} from './utils/get-hasura-metadata';
import {isUsingYarn} from './utils/is-using-yarn';

const main = async () => {
	let configPath: string = 'hasuguard.json';
	const program = new Command(packageJson.name)
		.version(packageJson.version)
		.arguments('<config-path>')
		.usage(`${chalk.green('<config-path>')} [options]`)
		.action((name) => {
			configPath = name;
		})
		.option('--verbose', 'print additional logs')
		.allowUnknownOption()
		.on('--help', () => {
			console.log(`    Only ${chalk.green('<config-path>')} is required.`);
			console.log();
			console.log(`      You can see how to configure the .json file here: ${chalk.cyan('https://github.com/william-donnette/hasuguard')}`);
			console.log();
			console.log(`    If you have any problems, do not hesitate to file an issue:`);
			console.log(`      ${chalk.cyan('https://gitlab.com/william-donnette/hasuguard/-/issues/new')}`);
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
				if (!fileExist(configPath)) {
					console.error('Please specify the configuration file:');
					console.log(
						`Create a hasuguard.json as specified in the README.md that you can found here: ${chalk.cyan(
							'https://github.com/william-donnette/hasuguard'
						)}`
					);
					console.log();
					console.log(`Or specify the config path as follow : ${chalk.cyan(program.name())} ${chalk.green('<config-path>')}`);
					console.log();
					console.log('For example:');
					console.log(`  ${chalk.cyan(program.name())} ${chalk.green('config-path.json')}`);
					console.log();
					console.log(`Run ${chalk.cyan(`${program.name()} --help`)} to see all options.`);
					process.exit(1);
				}

				const config = getConfig(configPath);

				if (config.libraryTarget === 'casbin') {
					startGenerateForCasbin(config, program.verbose, useYarn);
				} else {
					console.error('Please specify a valid authorization library target:');
					console.log(`  ${chalk.cyan(program.name())} ${chalk.green('<authorization-library-target>')}`);
					console.log();
					console.log('Available:');
					console.log(`  - ${chalk.green('casbin')}`);
					process.exit(1);
				}
			}
		});
};
main().catch(() => {
	console.error('Internal Error');
});

const startGenerateForCasbin = async (config: any, verbose = false, useYarn = false) => {
	const response = await getHasuraMetadata(path.join(config.hasura.endpoint, 'v1/metadata'), config.hasura.adminSecret);
	if (verbose) {
		console.log('✅ Hasura Metadata retrieved');
	}

	await createFolder(config.outputDir);

	if (verbose) {
		console.log('✅ Folder created');
	}

	const accessControlModel = config.accessControlModel;
	const fileName = 'index.' + (config.typescript ? 'ts' : 'js');

	if (accessControlModel === 'RBAC') {
		await generateCasbinRBAC(response.data, path.join(config.outputDir, fileName), config.roles);
	}

	console.log('🎉 Permissions generated');
	process.exit(0);
};
