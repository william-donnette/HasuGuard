import axios from 'axios';

export const getHasuraMetadata = async (url: string, adminSecret: string) => {
	try {
		return await axios.post(
			url,
			{
				type: 'export_metadata',
				args: {},
			},
			{
				headers: {
					'Content-Type': 'application/json',
					'x-hasura-admin-secret': `${adminSecret}`,
				},
			}
		);
	} catch (e: any) {
		console.error(`❌ Error when trying to retrieve Hasura Metadata. Verify your endpoint or your Admin Secret. ${e.message}`);
		process.exit(1);
	}
};
