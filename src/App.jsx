import React, { useEffect, useMemo, useState } from 'react';
import Fuse from 'fuse.js';

const locales = {
  en: { search: 'Search', model: 'Model', severity: 'Severity', copyLink: 'Copy link', close: 'Close' },
  fr: { search: 'Recherche', model: 'Modèle', severity: 'Gravité', copyLink: 'Copier le lien', close: 'Fermer' },
  pl: { search: 'Szukaj', model: 'Model', severity: 'Poziom', copyLink: 'Kopiuj link', close: 'Zamknij' }
};
const lang = navigator.language.startsWith('fr') ? 'fr' :
             navigator.language.startsWith('pl') ? 'pl' : 'en';
const t = key => locales[lang][key] || locales.en[key];

export default function App() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [model, setModel] = useState('');
  const [severity, setSeverity] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetch('/dtc-index.json').then(r => r.json()).then(setData);
  }, []);

  useEffect(() => {
    if (data.length === 0) return;
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const code = hash.get('dtc');
    if (code) {
      const item = data.find(d => d.dtc === code);
      if (item) setSelected(item);
    }
  }, [data]);

  const models = useMemo(() => Array.from(new Set(data.flatMap(d => d.model_code || []))), [data]);

  const fuse = useMemo(() => new Fuse(data, { keys: ['dtc', 'title', 'system'], threshold: 0.3 }), [data]);

  const filtered = useMemo(() => {
    let items = search ? fuse.search(search).map(r => r.item) : data;
    if (model) items = items.filter(d => (d.model_code || []).includes(model));
    if (severity) items = items.filter(d => String(d.severity) === severity);
    return items;
  }, [data, search, model, severity, fuse]);

  function open(item) {
    setSelected(item);
    const url = new URL(window.location);
    url.hash = `dtc=${item.dtc}`;
    history.replaceState(null, '', url);
  }

  function copyLink() {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
  }

  return (
    <div>
      <header>
        <input
          placeholder={t('search')}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select value={model} onChange={e => setModel(e.target.value)}>
          <option value="">{t('model')}</option>
          {models.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <select value={severity} onChange={e => setSeverity(e.target.value)}>
          <option value="">{t('severity')}</option>
          <option value="1">G1</option>
          <option value="2">G2</option>
          <option value="3">G3</option>
        </select>
      </header>
      <main>
        {filtered.map(item => (
          <div key={item.dtc} className={`dtc-card severity-${item.severity}`} onClick={() => open(item)}>
            <strong>{item.dtc}</strong> — {item.title}
          </div>
        ))}
      </main>
      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{selected.dtc}</h2>
            {selected.title && <p><strong>{selected.title}</strong></p>}
            {selected.criteria_activation && <p><strong>Criteria:</strong> {selected.criteria_activation}</p>}
            {selected.fault_criteria && <p><strong>Fault:</strong> {selected.fault_criteria}</p>}
            {selected.system_reaction && <p><strong>Reaction:</strong> {selected.system_reaction}</p>}
            {selected.harness_checks && <p><strong>Harness:</strong> {selected.harness_checks}</p>}
            {selected.diag_help && <p><strong>Diag:</strong> {selected.diag_help}</p>}
            {selected.oem_procedure_url && <p><a href={selected.oem_procedure_url} target="_blank" rel="noreferrer">OEM Procedure</a></p>}
            <button onClick={copyLink}>{t('copyLink')}</button>
            <button onClick={() => setSelected(null)} style={{marginLeft: '0.5rem'}}>{t('close')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
