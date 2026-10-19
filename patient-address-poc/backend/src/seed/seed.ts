import 'dotenv/config';
import 'reflect-metadata';
import { createDataSource } from '../database/data-source';
import { PtLocation } from '../pt-location/pt-location.entity';
import { ZipCode } from '../zip-code/zip-code.entity';
import {
  PtSeedRow,
  ZipSeedRow,
  readPtWorkbook,
  readZipWorkbook,
  resolvePtWorkbook,
  resolveZipWorkbook,
} from './parse-excel';

const BATCH_SIZE = 1000;

async function seed(): Promise<void> {
  const zipPath = resolveZipWorkbook();
  const ptPath = resolvePtWorkbook();
  console.log(`Reading ${zipPath}`);
  console.log(`Reading ${ptPath}`);

  const zipParsed = readZipWorkbook(zipPath);
  const ptParsed = readPtWorkbook(ptPath);
  if (zipParsed.rows.length === 0) {
    throw new Error('No ZIP rows found in the workbook.');
  }
  if (ptParsed.length === 0) {
    throw new Error('No PT locations found in the workbook.');
  }

  const located = locatePtRows(ptParsed, zipParsed.rows);
  const dataSource = createDataSource();
  await dataSource.initialize();

  try {
    await dataSource.transaction(async (manager) => {
      await manager.createQueryBuilder().delete().from(PtLocation).execute();
      await manager.createQueryBuilder().delete().from(ZipCode).execute();

      const chunks = chunk(zipParsed.rows, BATCH_SIZE);
      for (const batch of chunks) {
        await manager.createQueryBuilder().insert().into(ZipCode).values(batch).execute();
      }

      await manager.createQueryBuilder().insert().into(PtLocation).values(located.rows).execute();
    });

    const zipCount = await dataSource.getRepository(ZipCode).count();
    const ptCount = await dataSource.getRepository(PtLocation).count();
    console.log(`Inserted ${zipCount} zip codes, skipped ${zipParsed.skipped} rows.`);
    console.log(`Inserted ${ptCount} PT locations, ${located.missingCoordinates} without coordinates.`);
  } finally {
    await dataSource.destroy();
  }
}

function locatePtRows(
  clinics: PtSeedRow[],
  zips: ZipSeedRow[],
): { rows: Array<PtSeedRow & { latitude: number | null; longitude: number | null }>; missingCoordinates: number } {
  const byZip = new Map<string, ZipSeedRow[]>();
  for (const zip of zips) {
    const group = byZip.get(zip.zip);
    if (group) group.push(zip);
    else byZip.set(zip.zip, [zip]);
  }

  let missingCoordinates = 0;
  const rows = clinics.map((clinic) => {
    const match = pickZip(byZip.get(clinic.postalCode) ?? [], clinic);
    if (!match) {
      missingCoordinates += 1;
      console.warn(`No ZIP coordinates for ${clinic.postalCode} (${clinic.name}, ${clinic.city ?? ''} ${clinic.state ?? ''})`);
      return { ...clinic, latitude: null, longitude: null };
    }
    return { ...clinic, latitude: match.latitude, longitude: match.longitude };
  });

  return { rows, missingCoordinates };
}

function pickZip(candidates: ZipSeedRow[], clinic: PtSeedRow): ZipSeedRow | undefined {
  const city = clinic.city?.toLowerCase();
  const state = clinic.state?.toUpperCase();
  return (
    candidates.find((row) => row.city.toLowerCase() === city && row.state.toUpperCase() === state) ??
    candidates.find((row) => row.city.toLowerCase() === city) ??
    candidates[0]
  );
}

function chunk<T>(rows: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let index = 0; index < rows.length; index += size) {
    batches.push(rows.slice(index, index + size));
  }
  return batches;
}

seed().catch((error: unknown) => {
  console.error(error instanceof Error ? (error.stack ?? error.message) : error);
  process.exit(1);
});
