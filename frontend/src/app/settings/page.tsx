'use client';

import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import styles from './settings.module.css';

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [model, setModel] = useState('gpt-3.5-turbo-0125');
  const [userName, setUserName] = useState('Rohan');
  const [autoSave, setAutoSave] = useState(true);

  // Load settings from LocalStorage on mount
  useEffect(() => {
    const storedKey = localStorage.getItem('openai_api_key');
    if (storedKey) setApiKey(storedKey);

    const storedBaseUrl = localStorage.getItem('openai_base_url');
    if (storedBaseUrl) setBaseUrl(storedBaseUrl);

    const storedModel = localStorage.getItem('openai_model');
    if (storedModel) setModel(storedModel);

    const storedName = localStorage.getItem('user_name');
    if (storedName) setUserName(storedName);
  }, []);

  const handleSave = () => {
    localStorage.setItem('openai_api_key', apiKey);
    localStorage.setItem('openai_base_url', baseUrl);
    localStorage.setItem('openai_model', model);
    localStorage.setItem('user_name', userName);
    alert('Settings saved successfully!');
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Settings</h1>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>General</h2>
        <div className={styles.formGroup}>
          <label className={styles.label}>User Name</label>
          <input
            type="text"
            className={styles.input}
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
        </div>
        <div className={styles.row}>
          <div>
            <div className={styles.label} style={{ marginBottom: 0 }}>Auto-Save</div>
            <div className={styles.description}>Automatically save changes to local storage</div>
          </div>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              className={styles.toggleInput}
              checked={autoSave}
              onChange={(e) => setAutoSave(e.target.checked)}
            />
            <span className={styles.slider}></span>
          </label>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>AI Configuration</h2>
        <div className={styles.formGroup}>
          <label className={styles.label}>OpenAI API Key</label>
          <input
            type="password"
            className={styles.input}
            placeholder="sk-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <div className={styles.description} style={{ marginTop: '0.5rem' }}>
            Your key is stored locally in your browser.
          </div>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Base URL (Optional)</label>
          <input
            type="text"
            className={styles.input}
            placeholder="https://api.openai.com/v1"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
          />
          <div className={styles.description} style={{ marginTop: '0.5rem' }}>
            For OpenRouter, LocalAI, or custom endpoints.
            <button
              className="btn btn-sm btn-outline"
              style={{ marginLeft: '10px', fontSize: '0.8rem', padding: '2px 8px' }}
              onClick={() => setBaseUrl('https://openrouter.ai/api/v1')}
            >
              Use OpenRouter
            </button>
          </div>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Model Name (Optional)</label>
          <input
            type="text"
            className={styles.input}
            placeholder="gpt-3.5-turbo-0125"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          />
          <div className={styles.description} style={{ marginTop: '0.5rem' }}>
            e.g. google/gemini-2.0-flash-exp:free (on OpenRouter)
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={handleSave}>
          <Save size={16} style={{ marginRight: '8px' }} />
          Save Changes
        </button>
      </div>
    </div>
  );
}
