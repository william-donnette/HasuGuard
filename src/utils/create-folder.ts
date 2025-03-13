import * as fs from 'fs';
import path from 'path';

export const createFolder = async (folderPath: string) => {
	const folderAbsolutePath = path.join(process.cwd(), folderPath);
	return new Promise<void>((res, rej) => {
		try {
			fs.mkdir(folderAbsolutePath, () => {
				res();
			});
		} catch (e: any) {
			console.error(`❌ Failed to create the folder. Verify the access to ${folderAbsolutePath}`);
			process.exit(1);
		}
	});
};
