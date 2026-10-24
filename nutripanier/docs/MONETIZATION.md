# Monétisation — NutriPanier

## Modèle
Gratuit + abonnement « Premium » (choix validé au cadrage).

| Gratuit | Premium |
|---|---|
| Journal, objectif, scan, liste de courses, aliments enregistrés | Historique complet (gratuit : 7 derniers jours) |
| Effacement des données | Export CSV du journal |

Aucun revenu n'est estimé ni promis.

## Implémentation
- SDK : `react-native-purchases` (RevenueCat). Un seul point de décision : `isPremium()` dans `src/lib/premium.ts`, droit (entitlement) `premium`.
- Hors ligne ou en erreur : le dernier statut connu est conservé.
- Prix, titre et durée viennent du store via RevenueCat ; rien n'est codé en dur.
- Paywall : avantages, offres, mention du renouvellement automatique et de l'annulation, « Restaurer les achats », liens vers confidentialité et conditions.
- Achats impossibles sur le web et sans clé configurée : l'écran le dit.
- Les achats demandent un development build ou un build EAS (pas Expo Go).

## À créer par vous
### RevenueCat
1. Projet RevenueCat, apps iOS et Android.
2. Entitlement : **`premium`** (identifiant exact, utilisé dans le code).
3. Offering « default » contenant vos packages (ex. mensuel, annuel).
4. Clés SDK publiques → variables EAS `EXPO_PUBLIC_RC_IOS_KEY` et `EXPO_PUBLIC_RC_ANDROID_KEY`.

### App Store Connect / Google Play Console
Identifiants proposés (à créer à l'identique dans les deux stores, puis à relier à l'entitlement `premium` dans RevenueCat) :

| Identifiant | Type | Durée | Prix |
|---|---|---|---|
| `nutripanier_premium_monthly` | abonnement auto-renouvelable | 1 mois | à choisir |
| `nutripanier_premium_yearly` | abonnement auto-renouvelable | 1 an | à choisir |

Essai gratuit : optionnel, à configurer dans les stores ; l'app l'affichera tel que renvoyé par le store.

## Tests
- iOS : comptes sandbox (App Store Connect).
- Android : testeurs de licence (Play Console).
- Vérifier : achat, annulation, restauration sur un 2ᵉ appareil, perte de réseau pendant l'achat.

## À vérifier sur les sources officielles avant publication
- Commission des stores : Google indique 15 % sur le premier million de dollars de revenus annuels pour les biens numériques ([source](https://support.google.com/googleplay/android-developer/answer/10632485)). Pour Apple, je ne l'ai pas vérifié : consultez App Store Connect.
- Obligation d'utiliser l'achat intégré pour un contenu numérique et règles sur les paiements externes : variables selon les régions, non vérifiées ici.
