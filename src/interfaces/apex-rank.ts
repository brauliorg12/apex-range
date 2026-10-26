export interface ApexRank {
  id: string;
  shortId: string;
  /** Tier numérico estable; el mayor representa el rango más alto. */
  tier: number;
  label: string;
  roleName: string;
  icon: string;
  color: string;
  apiName: string;
}
