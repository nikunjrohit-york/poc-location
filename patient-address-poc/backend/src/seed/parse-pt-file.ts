import * as path from 'path';
import { parseCoord, pick, readCsv } from './parse-zip-file';

export interface PtSeedRow {
  id: number;
  name: string;
  addressLine1: string;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  latitude: number;
  longitude: number;
}

const NAME_KEYS = ['name', 'location_name', 'clinic'];
const LINE_KEYS = ['address_line_1', 'addressline1', 'address'];
const CITY_KEYS = ['city'];
const STATE_KEYS = ['state'];
const POSTAL_KEYS = ['postal_code', 'zip', 'zipcode'];
const LAT_KEYS = ['latitude', 'lat'];
const LNG_KEYS = ['longitude', 'lng', 'lon', 'long'];

export function resolvePtFile(): string {
  if (process.env.PT_FILE) return path.resolve(process.env.PT_FILE);
  return path.resolve(__dirname, '../../data/pt_locations.csv');
}

export async function readPtFile(filePath: string): Promise<PtSeedRow[]> {
  const rawRows = await readCsv(filePath);
  const rows: PtSeedRow[] = [];
  for (const raw of rawRows) {
    const parsed = toSeedRow(raw);
    if (parsed) rows.push(parsed);
  }
  return rows;
}

function toSeedRow(raw: Record<string, string>): PtSeedRow | null {
  const id = Number(pick(raw, ['id']));
  const name = pick(raw, NAME_KEYS);
  const addressLine1 = pick(raw, LINE_KEYS);
  const city = pick(raw, CITY_KEYS);
  const state = pick(raw, STATE_KEYS);
  const postalCode = pick(raw, POSTAL_KEYS);
  const latitude = parseCoord(pick(raw, LAT_KEYS));
  const longitude = parseCoord(pick(raw, LNG_KEYS));

  if (!Number.isInteger(id) || id < 1 || !name || !addressLine1) return null;
  if (latitude == null || longitude == null) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;

  return {
    id,
    name,
    addressLine1,
    city: city || null,
    state: state || null,
    postalCode: postalCode || null,
    latitude,
    longitude,
  };
}
