import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { api, errorMessage } from '../api';
import type { ZipResult } from '../types';

interface AddressAutofillProps {
  value: string;
  onChange: (zip: string) => void;
  onSelect: (result: ZipResult) => void;
}

export function AddressAutofill({ value, onChange, onSelect }: AddressAutofillProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const keepOpen = useRef(false);
  const [debounced, setDebounced] = useState(value);
  const [results, setResults] = useState<ZipResult[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), 400);
    return () => window.clearTimeout(timer);
  }, [value]);

  useEffect(() => {
    const q = debounced.trim();
    if (!/^\d{1,5}$/.test(q)) {
      setResults([]);
      setOpen(false);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    api
      .get<ZipResult[]>('/api/address/search', {
        params: { q },
        signal: controller.signal,
      })
      .then((response) => {
        setResults(response.data);
        setActive(0);
        if (keepOpen.current) setOpen(true);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setResults([]);
        setError(errorMessage(err));
        setOpen(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [debounced]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  function choose(result: ZipResult) {
    keepOpen.current = false;
    onSelect(result);
    setOpen(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (!open || results.length === 0) {
      if (event.key === 'Enter') event.preventDefault();
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((index) => (index + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((index) => (index - 1 + results.length) % results.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const pick = results[active] ?? results[0];
      if (pick) choose(pick);
    }
  }

  return (
    <div className="autofill" ref={rootRef}>
      <label htmlFor={`${listId}-input`}>ZIP</label>
      <div className="autofill-control">
        <input
          id={`${listId}-input`}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && results[active] ? `${listId}-opt-${active}` : undefined}
          autoComplete="off"
          inputMode="numeric"
          maxLength={5}
          placeholder="030"
          value={value}
          onChange={(event) => {
            keepOpen.current = true;
            onChange(event.target.value.replace(/\D/g, '').slice(0, 5));
            setOpen(true);
          }}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
          }}
          onKeyDown={onKeyDown}
        />
        {loading ? <span className="autofill-status">Searching</span> : null}
      </div>
      <p className="hint">Type a ZIP. Matches appear before all 5 digits are entered.</p>
      {open ? (
        <ul className="suggestions" id={listId} role="listbox">
          {error ? <li className="suggestion-empty">{error}</li> : null}
          {!error && results.length === 0 ? (
            <li className="suggestion-empty">No ZIP codes match.</li>
          ) : null}
          {results.map((result, index) => (
            <li key={`${result.zip}-${result.city}-${result.state}`} role="presentation">
              <button
                type="button"
                id={`${listId}-opt-${index}`}
                role="option"
                aria-selected={index === active}
                className={index === active ? 'suggestion is-active' : 'suggestion'}
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(result)}
              >
                <span>
                  <strong>{result.city}</strong>
                  <span className="muted">
                    , {result.state} — {result.zip}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
