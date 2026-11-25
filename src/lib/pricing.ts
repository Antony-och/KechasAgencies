import { SiteSettingsDoc } from './adminTypes';

export const DEFAULT_CHAUFFEUR_DAILY_FEE_KES = 2000;

export function getChauffeurDailyFeeKes(settings?: Partial<SiteSettingsDoc> | null): number {
  const raw = settings?.chauffeurDailyFeeKes;
  if (typeof raw === 'number' && !Number.isNaN(raw) && raw >= 0) {
    return Math.round(raw);
  }
  return DEFAULT_CHAUFFEUR_DAILY_FEE_KES;
}

export function calculateChauffeurRateKes(
  selfDriveRateKes: number,
  driverFeeKes = DEFAULT_CHAUFFEUR_DAILY_FEE_KES
): number {
  const base = Math.max(0, Number(selfDriveRateKes) || 0);
  const fee = Math.max(0, Number(driverFeeKes) || 0);
  return Math.round(base + fee);
}
