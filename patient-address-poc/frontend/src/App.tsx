import { useState } from 'react';
import { PatientForm } from './components/PatientForm';
import { PatientList, usePatientRoster } from './components/PatientList';

export default function App() {
  const [query, setQuery] = useState('');
  const roster = usePatientRoster(query);

  return (
    <>
      <header className="topbar">
        <div className="wrap topbar-inner">
          <div>
            <p className="brand-kicker">Clinic registry</p>
            <h1>Patient addresses</h1>
          </div>
          <p className="topbar-note">Type a ZIP to fill the city, then choose the nearest physical therapy clinic.</p>
        </div>
      </header>
      <main className="wrap layout">
        <PatientForm onSaved={() => roster.reload()} />
        <PatientList
          patients={roster.patients}
          loading={roster.loading}
          error={roster.error}
          query={query}
          onQueryChange={setQuery}
        />
      </main>
    </>
  );
}
