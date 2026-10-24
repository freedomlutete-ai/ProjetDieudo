# Audit de sécurité et de qualité — NutriPanier v1.0.0

Date : 24/10/2026. Environnement : conteneur Linux sans simulateur ni appareil. Ce qui a réellement été exécuté est marqué ✅. Ce qui ne l'a pas été est marqué ⚠️ et listé en fin de document.

## 1. Résultats des contrôles automatiques
| Contrôle | Résultat |
|---|---|
| `npx tsc --noEmit` | ✅ 0 erreur |
| `npx expo lint` | ✅ 0 erreur, 0 avertissement |
| `npm test` (Jest) | ✅ 81 tests réussis |
| `node e2e/run.js` (Playwright, export web, viewport mobile) | ✅ 46/46, sur 3 exécutions consécutives |
| Mode sombre + anglais (Playwright) | ✅ affichage, 0 erreur JavaScript |
| Contraste des couleurs (WCAG AA ≥ 4,5:1) | ✅ 22 paires sur 22, minimum 6,01:1 |
| `npx expo-doctor` | ⚠️ 18/20 : les 2 contrôles en échec demandent l'API Expo, bloquée par le réseau du conteneur |
| `npm audit` | ⚠️ 5 « high », voir § 4 |
| Recherche de secrets (code, config, bundle web) | ✅ aucun |
| `eslint-plugin-security` | ✅ 11 alertes examinées une à une, aucune exploitable (§ 3) |
| Semgrep | ⚠️ non exécuté : règles en ligne bloquées par le réseau |

## 2. Failles trouvées et corrigées
| # | Faille | Gravité | Correction |
|---|---|---|---|
| 1 | `isProfileInBounds` acceptait `activity: "toString"` ou `goal: "__proto__"` (opérateur `in`) ; un profil falsifié en base donnait un calcul `NaN` | Moyenne | Vérification par propriété propre ; tests ajoutés |
| 2 | Réponse API sous forme de tableau traitée comme « introuvable » au lieu d'« erreur » | Faible | Rejet explicite des tableaux |
| 3 | Permissions Android ajoutées par le modèle et les bibliothèques : `SYSTEM_ALERT_WINDOW`, `READ/WRITE_EXTERNAL_STORAGE` | Moyenne (surface d'attaque, risque de rejet) | `blockedPermissions` ; vérifié dans le manifeste généré par `expo prebuild` |
| 4 | Texte d'usage Face ID générique en anglais ajouté par `expo-secure-store`, alors que l'app n'utilise pas Face ID | Faible (risque de rejet Apple) | `faceIDPermission: false` ; vérifié dans l'Info.plist généré |
| 5 | Aliments enregistrés sans plafond (saturation du stockage) | Faible | Limite de 1000 |
| 6 | Écran de scan ouvert par lien profond : bloqué après ajout (pas d'historique) | Faible (UX) | Retour vers « Ajouter » si pas d'historique ; test E2E ajouté |
| 7 | Paywall sans durée d'abonnement | Moyenne (conformité store) | Durée lue du store et affichée |
| 8 | Liens légaux inactifs sans aucun signe quand non configurés | Faible | Boutons désactivés tant que les URL ne sont pas fournies |
| 9 | Phrase « résilier 24 h avant la fin » non vérifiée, valable pour un seul store | Faible (texte trompeur) | Remplacée par une formulation neutre |

## 3. Protections en place (vérifiées par tests)
- **Injection SQL** : 100 % de requêtes paramétrées. La seule interpolation (`PRAGMA key`) ne reçoit qu'une clé hexadécimale vérifiée par regex. Test E2E : `Lait'); DROP TABLE shopping;--` stocké comme texte, la table fonctionne ensuite.
- **XSS** : React Native affiche le texte sans l'interpréter. Tests E2E : charges `<img onerror>` dans la saisie et dans la réponse API, `window.__xss` reste indéfini.
- **Caractères piégés** : contrôle, zéro-largeur et marques bidirectionnelles (usurpation visuelle) retirés ; longueur limitée à 80 caractères, sans couper un emoji.
- **Liens profonds** (`nutripanier://scan?barcode=…`) : code-barres validé (chiffres + clé GS1) avant toute requête. Tests : traversée de chemin, ajout de paramètres, `javascript:`, injection SQL → refusés sans appel réseau.
- **Réseau** : URL fixe en HTTPS, `credentials: 'omit'`, `redirect: 'error'`, délai de 8 s, réponse limitée à 200 Ko, JSON validé champ par champ (kcal finies, entre 0 et 900), limite de 15 requêtes par minute conforme à Open Food Facts. Réseau coupé → message clair, sans plantage.
- **Export CSV** : formules neutralisées (`=`, `+`, `-`, `@`, tabulation, retour chariot).
- **Stockage** : SQLCipher (vérifié : `expo.sqlite.useSQLCipher=true` dans les projets natifs générés), clé aléatoire de 256 bits dans le trousseau (`WHEN_UNLOCKED_THIS_DEVICE_ONLY`), `allowBackup: false`.
- **iOS ATS** : `NSAllowsArbitraryLoads = false`.
- **Vie privée** : test E2E confirmant qu'aucun domaine autre qu'Open Food Facts n'est contacté (aucun traceur).
- **ReDoS** : expressions régulières testées sur 100 000 caractères, < 1 ms.
- **Alertes `eslint-plugin-security`** : accès par clé sur des constantes typées (faux positifs) ; serveur de test protégé contre la traversée de chemin.

## 4. `npm audit` : 5 vulnérabilités « high »
- `node-forge` (vérification de signature RSA) et `zod` (épuisement mémoire), tirés par `@expo/cli` et `eslint-plugin-react-hooks`.
- Ce sont des **outils de développement** : absents du bundle livré (vérifié par recherche dans l'export).
- Le correctif proposé `npm audit fix --force` installerait **expo@44** (rétrogradation de 14 versions majeures) : **à ne pas lancer**. Attendre un correctif d'Expo.

## 5. Risques résiduels acceptés ou à traiter
| Risque | Statut |
|---|---|
| Statut premium vérifié côté client : contournable sur un appareil rooté/jailbreaké | Accepté : les fonctions premium sont locales, sans coût serveur |
| Perte de la clé du trousseau → base illisible, l'app affiche « Impossible de charger » sans issue | À traiter en v1.1 : proposer une réinitialisation explicite |
| Aperçu de l'app dans le sélecteur d'apps (données visibles) | Non traité ; option v1.1 |
| Version web non chiffrée et User-Agent ignoré par les navigateurs | La version web sert uniquement aux tests ; ne pas la publier |
| Données Open Food Facts inexactes | Avertissement affiché ; valeurs modifiables avant ajout |

## 6. Non testé (faute d'appareil ou de réseau)
⚠️ Caméra et scan réels, ouverture de la base SQLCipher, trousseau, achats RevenueCat (sandbox), restauration, build Android avec R8, iOS réel, schéma `app.json` par `expo-doctor` (clés vérifiées à la place dans les types `@expo/config-types`), tailles dynamiques du texte, lecteurs d'écran.
