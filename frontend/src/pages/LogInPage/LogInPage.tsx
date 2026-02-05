import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './LogInPage.module.css';
import { API_BASE_URL } from '@/config/api';

function TrelloLogo() {
  return (
    <svg className={styles.trelloIcon} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="3" fill="#0052CC" />
      <rect x="6" y="6" width="4" height="10" rx="1" fill="#FFFFFF" />
      <rect x="14" y="6" width="4" height="6" rx="1" fill="#FFFFFF" />
    </svg>
  );
}

export default function LogInPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      setError('Invalid email or password');
      return;
    }

    const data: { access_token: string; token_type?: string } = await res.json();

    if (data?.access_token) {
      localStorage.setItem('access_token', data.access_token);
      navigate('/boards');
    } else {
      setError('Unexpected server response');
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoRow}>
          <TrelloLogo />
          <h1 className={styles.logoText}>EpiTrello</h1>
        </div>

        <h2 className={styles.title}>Log in to continue</h2>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label} htmlFor="email">
            Email <span className={styles.required}>*</span>
          </label>
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label className={styles.label} htmlFor="password">
            Password <span className={styles.required}>*</span>
          </label>
          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.primaryButton}>
            Continue
          </button>
        </form>

        <p className={styles.linksRow}>
          <a href="/signup">Don't have an account? Sign up</a>
        </p>
      </div>
    </main>
  );
}
