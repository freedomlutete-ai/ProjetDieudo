# Checklist de soumission — ce que vous seul pouvez faire

Rien n'est publié automatiquement : chaque étape ci-dessous demande vos comptes, vos identifiants ou votre validation. Les règles citées ont été vérifiées le 24/10/2026 ; revérifiez-les au moment d'envoyer.

## 0. Décisions à prendre avant tout build
- [ ] **Identifiant de bundle / package** : actuellement `com.projetdieudo.nutripanier` (provisoire). Il devient **définitif** après le premier envoi : Apple indique qu'on ne peut plus le changer une fois un build envoyé ([Apple](https://developer.apple.com/help/app-store-connect/reference/app-information/app-information/)). Modifiez `ios.bundleIdentifier` et `android.package` dans `app.json` si besoin.
- [ ] **Nom** : vérifier que « NutriPanier » n'est pas une marque déposée (INPI, EUIPO) ni déjà pris sur les stores.
- [ ] **Pages publiques** en https : politique de confidentialité (à partir de `PRIVACY_POLICY.md`, validée par un juriste), conditions d'utilisation (avec conditions d'abonnement), page support avec de vraies coordonnées.

## 1. Comptes
- [ ] **Apple Developer Program** : 99 USD par an ([Apple](https://developer.apple.com/programs/enroll/)).
- [ ] **Google Play Console** : 25 USD une fois ([Google](https://support.google.com/googleplay/android-developer/answer/6112435)).
- [ ] Contrats, informations bancaires et fiscales dans les deux consoles (requis pour vendre un abonnement).
- [ ] Compte **RevenueCat** (voir `MONETIZATION.md`).

## 2. Produits d'abonnement
- [ ] Créer `nutripanier_premium_monthly` et `nutripanier_premium_yearly` dans App Store Connect et Play Console.
- [ ] Dans RevenueCat : entitlement **`premium`**, offering « default », import des produits.

## 3. Variables d'environnement EAS (jamais dans Git)
```bash
npm i -g eas-cli
eas login
eas init                      # relie le projet à votre compte Expo
eas env:create --name EXPO_PUBLIC_RC_IOS_KEY --value <clé SDK iOS> --environment production --visibility plaintext
eas env:create --name EXPO_PUBLIC_RC_ANDROID_KEY --value <clé SDK Android> --environment production --visibility plaintext
eas env:create --name EXPO_PUBLIC_CONTACT_EMAIL --value <e-mail> --environment production --visibility plaintext
eas env:create --name EXPO_PUBLIC_PRIVACY_URL --value https://… --environment production --visibility plaintext
eas env:create --name EXPO_PUBLIC_TERMS_URL --value https://… --environment production --visibility plaintext
```
Ces valeurs sont publiques par nature (`EXPO_PUBLIC_*` est intégré en clair dans l'app) : n'y mettez aucun secret. Vérifiez la syntaxe exacte de `eas env:create` avec `eas env:create --help` (non exécuté ici, faute de compte).

## 4. Builds
```bash
eas build --platform all --profile preview      # test sur vos appareils
eas build --platform all --profile production   # versions store (.ipa / .aab)
```
- [ ] Tester sur de vrais téléphones ce qui n'a pas pu l'être ici : caméra et scan, base chiffrée, achats, restauration, perte de réseau.
- [ ] Tester un build **production** Android : R8 est activé par défaut en release avec Expo SDK 58 ([Expo](https://expo.dev/changelog/sdk-58-beta)).
- [ ] Cible Android : API 36 exigée pour les nouvelles apps ([Google](https://support.google.com/googleplay/android-developer/answer/11926878)). Le build Expo SDK 58 cible l'API 36 (vérifié dans `react-native/gradle/libs.versions.toml`).

## 5. Fiches store
- [ ] Remplir avec `STORE_LISTING.md` (FR + EN), captures `store/screenshots/`, éléments Play `store/`.
- [ ] **Apple – App Privacy** : déclarer les achats et identifiants transmis via RevenueCat ; données de santé : stockées seulement sur l'appareil (à confirmer avec un juriste).
- [ ] **Apple – classification d'âge** et **chiffrement à l'export** : l'app utilise SQLCipher. Répondez au questionnaire de conformité au chiffrement d'App Store Connect ; je n'ai pas pu confirmer la bonne réponse, d'où l'absence de `ITSAppUsesNonExemptEncryption` dans `app.json`.
- [ ] **Apple – Regulated Medical Devices** : déclaration obligatoire pour une app de catégorie Santé et forme distribuée dans l'UE/EEE, au Royaume-Uni ou aux États-Unis ([Apple](https://developer.apple.com/help/app-store-connect/reference/app-information/app-information/)).
- [ ] **Google – Sécurité des données**, classification du contenu, public cible (adultes), déclaration « pas de publicité ».
- [ ] Mention Open Food Facts (licence ODbL) : présente dans l'app et la description.

## 6. Envoi
```bash
eas submit --platform ios
eas submit --platform android
```
ou envoi manuel du `.ipa` (Transporter) et du `.aab` (Play Console).

## 7. Tests avant la revue
- [ ] iOS : TestFlight + achats en sandbox.
- [ ] Android : **compte personnel créé après le 13/11/2023** → test fermé avec **au moins 12 testeurs inscrits sans interruption pendant 14 jours** avant de demander l'accès à la production ([Google](https://support.google.com/googleplay/android-developer/answer/14151465)).

## 8. Risques de rejet connus et parades
| Risque | Parade |
|---|---|
| Paywall sans prix, durée ou liens légaux | Prix et durée lus du store ; liens actifs dès que les URL EAS sont configurées (désactivés sinon) |
| Allégations santé | Avertissement au premier lancement, « estimations », pas de promesse de perte de poids |
| Liens confidentialité / support morts | Publier les pages avant l'envoi |
| Permission inutile | Micro, stockage, superposition et Face ID retirés (vérifié dans les fichiers natifs générés) |
| Données Open Food Facts inexactes | Mention « sans garantie, vérifiez l'étiquette » à chaque produit |

Délais de revue : je ne peux pas les confirmer ; ils varient.
