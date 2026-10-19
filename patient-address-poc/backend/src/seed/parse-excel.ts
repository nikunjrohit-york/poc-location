import * as path from 'path';
import * as XLSX from 'xlsx';

export interface ZipSeedRow {
  zip: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
}

export interface PtSeedRow {
  name: string;
  addressLine1: string;
  city: string | null;
  state: string | null;
  postalCode: string;
}

export interface ZipParseResult {
  rows: ZipSeedRow[];
  skipped: number;
}

export function resolveZipWorkbook(): string {
  if (process.env.ZIP_FILE) return path.resolve(process.env.ZIP_FILE);
  return path.resolve(__dirname, '../../data/zip-codes-database-FREE.xls');
}

export function resolvePtWorkbook(): string {
  if (process.env.PT_FILE) return path.resolve(process.env.PT_FILE);
  return path.resolve(__dirname, '../../data/Master PT Location List_06.18.2026.xlsx');
}

export function readZipWorkbook(filePath: string): ZipParseResult {
  const sheet = firstSheet(filePath);
  const grid = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, { header: 1, defval: '' });
  const headerIndex = findZipHeaderRow(grid);
  const columns =
    headerIndex >= 0 ? zipColumns(grid[headerIndex]) : { zip: 0, city: 1, state: 2, lat: 3, lng: 4 };
  const start = headerIndex >= 0 ? headerIndex + 1 : 0;

  const rows: ZipSeedRow[] = [];
  let skipped = headerIndex >= 0 ? headerIndex + 1 : 0;

  for (let index = start; index < grid.length; index += 1) {
    const parsed = toZipRow(grid[index], columns);
    if (parsed) rows.push(parsed);
    else skipped += 1;
  }

  return { rows, skipped };
}

export function readPtWorkbook(filePath: string): PtSeedRow[] {
  const sheet = firstSheet(filePath);
  const grid = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, { header: 1, defval: '' });
  const rows: PtSeedRow[] = [];

  for (const row of grid) {
    if (!row || String(row[0] ?? '').trim() === '') continue;
    const postalCode = padZip(row[4]);
    const name = String(row[0] ?? '').trim();
    const addressLine1 = String(row[1] ?? '').trim();
    if (!name || !addressLine1 || !postalCode) continue;
    rows.push({
      name,
      addressLine1,
      city: String(row[2] ?? '').trim() || null,
      state: String(row[3] ?? '').trim().toUpperCase() || null,
      postalCode,
    });
  }

  return rows;
}

function firstSheet(filePath: string): XLSX.WorkSheet {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error(`No worksheet in ${filePath}`);
  return workbook.Sheets[sheetName];
}

function findZipHeaderRow(grid: (string | number)[][]): number {
  const limit = Math.min(grid.length, 25);
  for (let index = 0; index < limit; index += 1) {
    const labels = grid[index].map((cell) => String(cell).trim().toLowerCase());
    const hasCity = labels.includes('city');
    const hasLat = labels.includes('latitude');
    const hasLng = labels.includes('longitude');
    if (hasCity && hasLat && hasLng) return index;
  }
  return -1;
}

function zipColumns(header: (string | number)[]): {
  zip: number;
  city: number;
  state: number;
  lat: number;
  lng: number;
} {
  const labels = header.map((cell) => String(cell).trim().toLowerCase());
  const city = labels.indexOf('city');
  const state = labels.indexOf('state');
  const lat = labels.indexOf('latitude');
  const lng = labels.indexOf('longitude');
  const namedZip = labels.findIndex((label) => label === 'zipcode' || label === 'zip code' || label === 'zip');
  return {
    zip: namedZip >= 0 ? namedZip : 0,
    city,
    state: state >= 0 ? state : 2,
    lat,
    lng,
  };
}

function toZipRow(
  row: (string | number)[] | undefined,
  columns: { zip: number; city: number; state: number; lat: number; lng: number },
): ZipSeedRow | null {
  if (!row) return null;
  const zip = padZip(row[columns.zip]);
  const city = String(row[columns.city] ?? '').trim();
  const state = String(row[columns.state] ?? '').trim().toUpperCase();
  const latitude = parseCoord(row[columns.lat]);
  const longitude = parseCoord(row[columns.lng]);
  if (!/^\d{5}$/.test(zip) || !city || !state || latitude == null || longitude == null) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return { zip, city, state, latitude, longitude };
}

export function padZip(value: string | number | null | undefined): string {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  const head = raw.split('-')[0].trim();
  const digits = /^\d+\.0+$/.test(head) ? String(parseInt(head, 10)) : head;
  if (!/^\d+$/.test(digits)) return '';
  return digits.padStart(5, '0').slice(0, 5);
}

function parseCoord(value: string | number | undefined): number | null {
  if (value == null || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(String(value).trim());
  return Number.isFinite(parsed) ? parsed : null;
}
