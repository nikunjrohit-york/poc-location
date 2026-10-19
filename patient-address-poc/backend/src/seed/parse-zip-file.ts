import * as fs from 'fs';
import * as path from 'path';
import csvParser from 'csv-parser';
import * as XLSX from 'xlsx';

export interface ZipSeedRow {
  zip: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
}

const ZIP_KEYS = ['zip', 'zipcode', 'zip_code', 'code', 'postal_code', 'postalcode'];
const CITY_KEYS = ['city', 'city_name'];
const STATE_KEYS = ['state', 'state_abbr', 'state_abbreviation', 'st'];
const LAT_KEYS = ['latitude', 'lat'];
const LNG_KEYS = ['longitude', 'lng', 'lon', 'long'];

export async function readZipFile(filePath: string): Promise<ZipSeedRow[]> {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`ZIP file not found: ${resolved}`);
  }

  const extension = path.extname(resolved).toLowerCase();
  const rawRows =
    extension === '.xlsx' || extension === '.xls'
      ? readSpreadsheet(resolved)
      : await readCsv(resolved);

  const rows: ZipSeedRow[] = [];
  for (const raw of rawRows) {
    const parsed = toSeedRow(raw);
    if (parsed) rows.push(parsed);
  }
  return rows;
}

export function resolveZipFile(argvPath?: string): string {
  if (argvPath) return path.resolve(argvPath);
  if (process.env.ZIP_FILE) return path.resolve(process.env.ZIP_FILE);
  return path.resolve(__dirname, '../../data/zipcodes.csv');
}

function readSpreadsheet(filePath: string): Record<string, string>[] {
  const workbook = XLSX.readFile(filePath, { raw: false });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  return rows.map((row) => {
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(row)) {
      out[key] = value == null ? '' : String(value);
    }
    return out;
  });
}

export function readCsv(filePath: string): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const rows: Record<string, string>[] = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row: Record<string, string>) => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
}

function toSeedRow(raw: Record<string, string>): ZipSeedRow | null {
  const zip = normalizeZip(pick(raw, ZIP_KEYS));
  const city = pick(raw, CITY_KEYS);
  const state = pick(raw, STATE_KEYS);
  const latitude = parseCoord(pick(raw, LAT_KEYS));
  const longitude = parseCoord(pick(raw, LNG_KEYS));

  if (!zip || !city || !state || latitude == null || longitude == null) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;

  return { zip, city, state, latitude, longitude };
}

export function pick(row: Record<string, string>, names: string[]): string {
  const entries = Object.entries(row).map(([key, value]) => [normalizeKey(key), value] as const);
  for (const name of names) {
    const found = entries.find(([key]) => key === name);
    if (found && found[1] != null && String(found[1]).trim() !== '') {
      return String(found[1]).trim();
    }
  }
  return '';
}

function normalizeKey(key: string): string {
  return key.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function normalizeZip(value: string): string {
  let zip = value.trim();
  if (!zip) return '';
  if (zip.includes('-')) zip = zip.split('-')[0].trim();
  if (/^\d+\.0+$/.test(zip)) zip = String(parseInt(zip, 10));
  if (/^\d+$/.test(zip) && zip.length < 5) zip = zip.padStart(5, '0');
  if (/^\d+$/.test(zip) && zip.length > 5) zip = zip.slice(0, 5);
  return zip;
}

export function parseCoord(value: string): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
