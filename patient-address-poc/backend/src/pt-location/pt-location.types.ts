export interface PtNearestResult {
  id: number;
  name: string;
  addressLine1: string;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  distanceKm: number;
}
