import { useEffect, useState } from 'react';
import { api, errorMessage } from '../api';
import type { PtNearest } from '../types';

interface NearestPtDropdownProps {
  lat: number | null;
  lng: number | null;
  value: string;
  onChange: (id: string) => void;
}

export function NearestPtDropdown({ lat, lng, value, onChange }: NearestPtDropdownProps) {
  const [debounced, setDebounced] = useState({ lat, lng });
  const [rows, setRows] = useState<PtNearest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced({ lat, lng }), 400);
    return () => window.clearTimeout(timer);
  }, [lat, lng]);

  useEffect(() => {
    if (debounced.lat == null || debounced.lng == null) {
      setRows([]);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    api
      .get<PtNearest[]>('/api/pt/nearest', {
        params: { lat: debounced.lat, lng: debounced.lng, limit: 5 },
        signal: controller.signal,
      })
      .then((response) => setRows(response.data))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setRows([]);
        setError(errorMessage(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [debounced]);

  useEffect(() => {
    if (!value) return;
    if (rows.some((row) => String(row.id) === value)) return;
    onChange('');
  }, [rows, value, onChange]);

  return (
    <label>
      Closest PT location
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">
          {debounced.lat == null ? 'Select a city or ZIP first' : 'Select a clinic'}
        </option>
        {rows.map((row) => (
          <option key={row.id} value={String(row.id)}>
            {row.name} — {row.city}, {row.state} — {row.distanceKm.toFixed(1)} km
          </option>
        ))}
      </select>
      {loading ? <span className="hint">Finding nearby clinics…</span> : null}
      {error ? <span className="hint">{error}</span> : null}
    </label>
  );
}
