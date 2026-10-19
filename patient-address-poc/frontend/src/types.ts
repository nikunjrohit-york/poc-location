export interface ZipResult {
  zip: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
}

export interface PtNearest {
  id: number;
  name: string;
  addressLine1: string;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  distanceKm: number;
}

export interface PatientDto {
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  email?: string;
  address: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    latitude?: number;
    longitude?: number;
  };
  ptLocationId?: number;
}

export interface AddressRecord {
  id: number;
  addressLine1: string;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface PtLocationRecord {
  id: number;
  name: string;
  city: string | null;
  state: string | null;
  postalCode: string | null;
}

export interface PatientRecord {
  id: number;
  externalPatientId: string | null;
  patientNumber: string | null;
  patientName: string;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  email: string | null;
  status: number;
  addressId: number | null;
  address: AddressRecord | null;
  ptLocationId: number | null;
  ptLocation: PtLocationRecord | null;
}
