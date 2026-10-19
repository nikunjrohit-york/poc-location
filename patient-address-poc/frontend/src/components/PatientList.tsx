import { useEffect, useState } from 'react';
import { api, errorMessage } from '../api';
import type { PatientRecord } from '../types';

interface PatientListProps {
  patients: PatientRecord[];
  loading: boolean;
  error: string | null;
  query: string;
  onQueryChange: (value: string) => void;
}

export function PatientList({ patients, loading, error, query, onQueryChange }: PatientListProps) {
  return (
    <section className="panel">
      <header className="panel-head">
        <p className="kicker">Roster</p>
        <h2>Saved patients</h2>
      </header>
      <label className="roster-search">
        Find by name or MRN
        <input
          value={query}
          placeholder="Ada or PT-000001"
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </label>
      {loading ? <p className="hint">Loading roster…</p> : null}
      {error ? <p className="banner banner-error">{error}</p> : null}
      {!loading && !error && patients.length === 0 ? (
        <p className="hint">{query.trim() ? 'No patients match that search.' : 'No patients yet.'}</p>
      ) : null}
      <ul className="roster">
        {patients.map((patient) => (
          <li key={patient.id}>
            <div className="roster-top">
              <strong>{patient.patientName}</strong>
              <span className="mono">{patient.patientNumber}</span>
            </div>
            <p className="hint">
              {formatDate(patient.dateOfBirth)}
              {patient.gender ? ` · ${patient.gender}` : ''}
            </p>
            <p>{formatAddress(patient)}</p>
            {patient.ptLocation ? <p className="hint">Clinic: {patient.ptLocation.name}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function usePatientRoster(query: string) {
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debounced, setDebounced] = useState(query);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query), 400);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    api
      .get<PatientRecord[]>('/api/patient', {
        params: debounced.trim() ? { q: debounced.trim() } : undefined,
        signal: controller.signal,
      })
      .then((response) => {
        setPatients(response.data);
        setError(null);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(errorMessage(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [debounced, reloadKey]);

  return {
    patients,
    loading,
    error,
    reload: () => setReloadKey((value) => value + 1),
  };
}

function formatDate(value: string | null): string {
  if (!value) return 'DOB not set';
  return String(value).slice(0, 10);
}

function formatAddress(patient: PatientRecord): string {
  const address = patient.address;
  if (!address) return 'No address';
  const cityLine = [address.city, address.state, address.postalCode].filter(Boolean).join(', ');
  return [address.addressLine1, cityLine].filter(Boolean).join(' · ');
}
