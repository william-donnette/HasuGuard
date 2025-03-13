import * as fs from 'fs';
import path from 'path';

export const getConfig = (configPath: string) => {
	const configAbsolutePath = path.join(process.cwd(), configPath);
	const jsonData = fs.readFileSync(configAbsolutePath, 'utf8');
	return JSON.parse(jsonData);
};
