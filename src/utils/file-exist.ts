import fs from 'fs';

export const fileExist = (path: string) => {
	return fs.existsSync(path);
};
