import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { readZipFile, resolveZipFile } from '../src/seed/parse-zip-file';

async function convert(): Promise<void> {
  const input = resolveZipFile(process.argv[2]);
  const output = process.argv[3]
    ? path.resolve(process.argv[3])
    : path.join(path.dirname(input), 'zipcodes.json');

  const rows = await readZipFile(input);
  fs.writeFileSync(output, JSON.stringify(rows));
  console.log(`Wrote ${rows.length} rows to ${output}`);
}

convert().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
