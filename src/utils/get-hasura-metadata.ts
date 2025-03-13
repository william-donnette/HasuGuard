import axios from 'axios';

export const getHasuraMetadata = async (url: string, adminSecret?: string) => {
	try {
		let headers: any = {
			'Content-Type': 'application/json',
		};
		if (headers) {
			headers['x-hasura-admin-secret'] = adminSecret;
		}
		return await axios.post(
			url,
			{
				type: 'export_metadata',
				args: {},
			},
			{
				headers,
			}
		);
	} catch (e: any) {
		console.error(`❌ Error when trying to retrieve Hasura Metadata. Verify your endpoint or your Admin Secret. ${e.message}`);
		process.exit(1);
	}
};
