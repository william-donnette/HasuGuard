import {execSync} from 'child_process';

export const execCommand = (command: string, options = {}) => {
	try {
		return execSync(command, {stdio: 'inherit', ...options});
	} catch (error) {
		throw new Error(`Error executing command: ${command}`);
	}
};
