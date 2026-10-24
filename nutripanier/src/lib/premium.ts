/**
 * Point unique qui décide si l'utilisateur est premium (droit « premium » RevenueCat).
 * Les prix et durées viennent toujours des stores via RevenueCat, jamais du code.
 * Les clés RevenueCat sont des clés SDK publiques, fournies par variables d'environnement.
 */

import { Platform } from 'react-native';
import Purchases, {
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from 'react-native-purchases';

export const ENTITLEMENT_ID = 'premium';

/** Historique gratuit, en jours ; au-delà et pour l'export, il faut premium. */
export const FREE_HISTORY_DAYS = 7;

let configured = false;
let lastKnownPremium = false;

function apiKey(): string | undefined {
  if (Platform.OS === 'ios') return process.env.EXPO_PUBLIC_RC_IOS_KEY;
  if (Platform.OS === 'android') return process.env.EXPO_PUBLIC_RC_ANDROID_KEY;
  return undefined;
}

/** Les achats ne sont possibles que sur iOS/Android avec une clé configurée. */
export function purchasesAvailable(): boolean {
  return Platform.OS !== 'web' && !!apiKey();
}

export function configurePurchases(): void {
  const key = apiKey();
  if (configured || !key || Platform.OS === 'web') return;
  Purchases.configure({ apiKey: key });
  configured = true;
}

export function isPremium(info: CustomerInfo | null): boolean {
  return !!info && typeof info.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
}

/** Statut premium ; hors ligne ou en erreur, on garde le dernier statut connu. */
export async function refreshPremium(): Promise<boolean> {
  if (!configured) return false;
  try {
    lastKnownPremium = isPremium(await Purchases.getCustomerInfo());
  } catch {
    // Dernier statut connu (le SDK garde aussi son propre cache).
  }
  return lastKnownPremium;
}

export async function currentOffering(): Promise<PurchasesOffering | null> {
  if (!configured) return null;
  try {
    return (await Purchases.getOfferings()).current;
  } catch {
    return null;
  }
}

export type PurchaseOutcome = 'success' | 'cancelled' | 'error';

export async function buy(pkg: PurchasesPackage): Promise<PurchaseOutcome> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    lastKnownPremium = isPremium(customerInfo);
    return lastKnownPremium ? 'success' : 'error';
  } catch (error) {
    const cancelled = (error as { userCancelled?: boolean }).userCancelled === true;
    return cancelled ? 'cancelled' : 'error';
  }
}

export async function restore(): Promise<boolean> {
  if (!configured) return false;
  try {
    lastKnownPremium = isPremium(await Purchases.restorePurchases());
  } catch {
    // Laisse le dernier statut connu.
  }
  return lastKnownPremium;
}
