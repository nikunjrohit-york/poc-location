import { FormEvent, useState } from 'react';
import { api, errorMessage } from '../api';
import type { PatientDto, PatientRecord, ZipResult } from '../types';
import { AddressAutofill } from './AddressAutofill';
import { NearestPtDropdown } from './NearestPtDropdown';

interface PatientFormProps {
  onSaved: (patient: PatientRecord) => void;
}

interface FormState {
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  gender: '' | 'male' | 'female' | 'other';
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  latitude: string;
  longitude: string;
  ptLocationId: string;
}

const EMPTY: FormState = {
  firstName: '',
  middleName: '',
  lastName: '',
  dateOfBirth: '',
  gender: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  latitude: '',
  longitude: '',
  ptLocationId: '',
};

export function PatientForm({ onSaved }: PatientFormProps) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [formVersion, setFormVersion] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setSaved(null);
  }

  function onZipChange(zip: string) {
    setForm((current) => ({
      ...current,
      postalCode: zip,
      city: '',
      state: '',
      latitude: '',
      longitude: '',
      ptLocationId: '',
    }));
    setSaved(null);
  }

  function applyMatch(result: ZipResult) {
    setForm((current) => ({
      ...current,
      city: result.city,
      state: result.state,
      postalCode: result.zip,
      latitude: String(result.lat),
      longitude: String(result.lng),
      ptLocationId: '',
    }));
    setSaved(null);
  }

  const lat = parseCoord(form.latitude);
  const lng = parseCoord(form.longitude);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const problem = validate(form);
    if (problem) {
      setError(problem);
      return;
    }

    const payload: PatientDto = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      address: {
        addressLine1: form.addressLine1.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        postalCode: form.postalCode.trim(),
      },
    };
    if (form.middleName.trim()) payload.middleName = form.middleName.trim();
    if (form.dateOfBirth) payload.dateOfBirth = form.dateOfBirth;
    if (form.gender) payload.gender = form.gender;
    if (form.addressLine2.trim()) payload.address.addressLine2 = form.addressLine2.trim();
    if (lat != null && lng != null) {
      payload.address.latitude = lat;
      payload.address.longitude = lng;
    }
    if (form.ptLocationId) payload.ptLocationId = Number(form.ptLocationId);

    setSubmitting(true);
    setError(null);
    try {
      const response = await api.post<PatientRecord>('/api/patient', payload);
      const patient = response.data;
      setSaved(`${patient.patientNumber ?? 'Patient'} saved`);
      setForm(EMPTY);
      setFormVersion((version) => version + 1);
      onSaved(patient);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
      <form className="panel form" onSubmit={onSubmit}>
        <header className="panel-head">
          <p className="kicker">Registration</p>
          <h2>New patient</h2>
        </header>

        {error ? <p className="banner banner-error">{error}</p> : null}
        {saved ? <p className="banner banner-ok">{saved}</p> : null}

        <fieldset>
          <legend>Patient</legend>
          <div className="grid-3">
            <Field label="First name" value={form.firstName} onChange={(value) => update('firstName', value)} autoComplete="given-name" />
            <Field label="Middle name" value={form.middleName} onChange={(value) => update('middleName', value)} autoComplete="additional-name" />
            <Field label="Last name" value={form.lastName} onChange={(value) => update('lastName', value)} autoComplete="family-name" />
          </div>
          <div className="grid-2">
            <label>
              Date of birth
              <input
                type="date"
                value={form.dateOfBirth}
                autoComplete="bday"
                onChange={(event) => update('dateOfBirth', event.target.value)}
              />
            </label>
            <label>
              Gender
              <select
                value={form.gender}
                onChange={(event) => update('gender', event.target.value as FormState['gender'])}
              >
                <option value="">Not specified</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend>Address</legend>
          <AddressAutofill
            key={formVersion}
            value={form.postalCode}
            onChange={onZipChange}
            onSelect={applyMatch}
          />
          <div className="grid-2">
            <Field label="City" value={form.city} onChange={(value) => update('city', value)} autoComplete="address-level2" />
            <Field label="State" value={form.state} onChange={(value) => update('state', value)} autoComplete="address-level1" />
          </div>
          <Field
            label="Address line 1"
            value={form.addressLine1}
            onChange={(value) => update('addressLine1', value)}
            autoComplete="address-line1"
          />
          <Field
            label="Address line 2"
            value={form.addressLine2}
            onChange={(value) => update('addressLine2', value)}
            autoComplete="address-line2"
          />
          <div className="grid-2">
            <NearestPtDropdown
              lat={lat}
              lng={lng}
              value={form.ptLocationId}
              onChange={(id) => update('ptLocationId', id)}
            />
          </div>
        </fieldset>

        <div className="form-actions">
          <button type="submit" className="primary" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save patient'}
          </button>
        </div>
      </form>
  );
}

function Field({
  label,
  value,
  onChange,
  autoComplete,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  inputMode?: 'decimal' | 'text';
}) {
  return (
    <label>
      {label}
      <input
        value={value}
        autoComplete={autoComplete}
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function parseCoord(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function validate(form: FormState): string | null {
  if (!form.firstName.trim() || !form.lastName.trim()) {
    return 'First name and last name are required.';
  }
  if (!form.city.trim() || !/^\d{5}$/.test(form.postalCode.trim())) {
    return 'Choose a ZIP from the list.';
  }
  if (!form.addressLine1.trim()) return 'Address line 1 is required.';
  return null;
}
