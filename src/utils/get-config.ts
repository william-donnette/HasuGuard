import * as fs from 'fs';
import path from 'path';

export const getConfig = (configPath: string) => {
	const configAbsolutePath = path.join(process.cwd(), configPath);
	try {
		const jsonData = fs.readFileSync(configAbsolutePath, 'utf8');
		try {
			return JSON.parse(jsonData);
		} catch (e: any) {
			console.error(`❌ The config file is not valid.`);
			process.exit(1);
		}
	} catch (e: any) {
		console.error(`❌ Failed to load the config file ${configAbsolutePath}.`);
		process.exit(1);
	}
};
