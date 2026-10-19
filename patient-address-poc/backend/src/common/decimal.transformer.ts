import { ValueTransformer } from 'typeorm';

/** PostgreSQL DECIMAL comes back as a string. Keep the entity typed as number. */
export const decimalTransformer: ValueTransformer = {
  to: (value?: number | null) => value ?? null,
  from: (value?: string | number | null) =>
    value == null || value === '' ? null : Number(value),
};
