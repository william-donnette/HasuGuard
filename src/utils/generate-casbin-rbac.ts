import * as fs from 'fs';
import path from 'path';

export const generateCasbinRBAC = async (metadata: any, filePath: string, roles: Array<string>) => {
	return new Promise<void>((res, rej) => {
		const policyFile = fs.createWriteStream(path.join(process.cwd(), filePath), {flags: 'w'});

		policyFile.write(
			"import {newEnforcer, newModel, StringAdapter} from 'casbin';\n\nexport const casbinModel = newModel(`\n[request_definition]\nr = sub, obj, act\n\n[policy_definition]\np = sub, obj, act, eft\n\n[role_definition]\ng = _, _\n\n[policy_effect]\ne = some(where (p.eft == allow)) && !some(where (p.eft == deny))\n\n[matchers]\nm = g(r.sub, p.sub) && keyMatch(r.obj, p.obj) && regexMatch(r.act, p.act)\n`);\n\nexport const casbinAdapter = new StringAdapter(`\n"
		);

		const policies: Array<any> = [];

		// Parcourir les tables et les permissions
		roles.forEach((role: string) => {
			metadata.sources.forEach((source: any) => {
				source.tables.forEach((table: any) => {
					const resource = table.table.name;
					const policy: any = {
						role,
						resource,
						actions: {
							generic: [
								table.select_permissions?.some((permission: any) => permission.role === role) || role === 'admin'
									? '(list)'
									: undefined,
								table.insert_permissions?.some((permission: any) => permission.role === role) || role === 'admin'
									? '(create)'
									: undefined,
							].filter(Boolean),
							specific: [
								table.update_permissions?.some((permission: any) => permission.role === role) || role === 'admin'
									? '(edit)'
									: undefined,
								table.select_permissions?.some((permission: any) => permission.role === role) || role === 'admin'
									? '(show)'
									: undefined,
								table.delete_permissions?.some((permission: any) => permission.role === role) || role === 'admin'
									? '(delete)'
									: undefined,
							].filter(Boolean),
						},
					};
					policies.push(policy);
				});
			});
			metadata.actions.forEach((action: any) => {
				const resource = action.name;
				const policy: any = {
					role,
					resource,
					actions: {
						generic: [
							action.permissions?.some((permission: any) => permission.role === role) || role === 'admin' ? '(list)' : undefined,
						].filter(Boolean),
					},
				};
				policies.push(policy);
			});
		});

		policies.forEach(({role, resource, actions: {generic, specific}}) => {
			if (generic?.length > 0) {
				const policyLine = `p, ${role}, ${resource}, ${generic.join('|')}\n`;
				policyFile.write(policyLine);
			}
			if (specific?.length > 0) {
				const policyLine2 = `p, ${role}, ${resource}/*, ${specific.join('|')}\n`;
				policyFile.write(policyLine2);
			}
		});
		policyFile.write('`);\n\nexport const getCasbinEnforcer = async () => {\n\treturn await newEnforcer(casbinModel, casbinAdapter);\n};');
		policyFile.end(() => {
			res();
		}); // Fermer le fichier une fois l'écriture terminée
	});
};
