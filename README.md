# HasuGuard 🚀

`HasuGuard` est un outil pour générer des modèles de contrôle d'accès (comme RBAC) avec **Casbin** (ou autre...) à partir de votre instance **Hasura**. 🎯

## Installation rapide 🏃‍♂️

Exécutez directement avec `npx` sans installation locale :

```bash
npx hasuguard@latest ./path/to/hasuguard.json --library-target casbin --roles admin,pro --typescript --output-dir ./hasuguard
```

Ou installer directement

```bash
npm i -D hasuguard
```

## Exemple de configuration `hasuguard.json` 📄

Voici un exemple de fichier `hasuguard.json` :

```json
{
	"libraryTarget": "casbin",
	"hasura": {
		"endpoint": "https://your-hasura-domain.com",
		"adminSecret": "your-admin-secret"
	},
	"typescript": true,
	"outputDir": "./hasuguard",
	"roles": ["admin", "user", "public"],
	"accessControlModel": "RBAC"
}
```

### Paramètres

-   **`libraryTarget`** : `"casbin"` (actuellement, seul Casbin est supporté).
-   **`hasura`** : Détails de votre instance Hasura (endpoint et adminSecret).
-   **`typescript`** : Si `true`, génère un fichier TypeScript.
-   **`outputDir`** : Répertoire où le fichier généré sera sauvegardé.
-   **`roles`** : Liste des rôles à exporter.
-   **`accessControlModel`** : Le modèle de contrôle d'accès (actuellement uniquement `"RBAC"`).

## Exemple de fichier généré 🔧

Voici à quoi ressemblera le fichier généré pour Casbin :

```typescript
import {newEnforcer, newModel, StringAdapter} from 'casbin';

export const casbinModel = newModel(`
[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act, eft

[role_definition]
g = _, _

[policy_effect]
e = some(where (p.eft == allow)) && !some(where (p.eft == deny))

[matchers]
m = g(r.sub, p.sub) && keyMatch(r.obj, p.obj) && regexMatch(r.act, p.act)
`);

export const casbinAdapter = new StringAdapter(`
p, admin, users, (list)|(create)
p, admin, users/*, (edit)|(show)|(delete)
p, admin, publicAction, (list)
p, admin, privateAction, (list)
p, user, users, (list)|(create)
p, user, users/*, (edit)|(show)|(delete)
p, user, publicAction, (list)
p, public, users, (list)
p, public, users/*, (show)
p, public, publicAction, (list)
...
`);

export const getCasbinEnforcer = async () => {
	return await newEnforcer(casbinModel, casbinAdapter);
};
```

## 🚨 Contribution

Si vous avez des suggestions ou des problèmes, ouvrez une issue ou soumettez une PR sur [GitLab](https://gitlab.com/william-donnette/hasuguard).
