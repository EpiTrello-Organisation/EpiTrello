import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import styles from './SignUpPage.module.css';
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

export default function SignUpPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email || !username || !password || !confirmPassword) {
      setError('Tous les champs sont requis');
      return;
    }
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password }),
      });

      if (res.status === 200) {
        navigate('/login');
      } else if (res.status === 400) {
        setError('Email already used');
      } else {
        setError('Une erreur est survenue');
      }
    } catch {
      setError('Une erreur est survenue');
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoRow}>
          <TrelloLogo />
          <h1 className={styles.logoText}>EpiTrello</h1>
        </div>
        <h2 className={styles.title}>Sign up to continue</h2>

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

          <label className={styles.label} htmlFor="username">
            Username <span className={styles.required}>*</span>
          </label>
          <input
            id="username"
            type="text"
            placeholder="Choose a username"
            className={styles.input}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
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

          <label className={styles.label} htmlFor="confirmPassword">
            Confirm password <span className={styles.required}>*</span>
          </label>
          <input
            id="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            className={styles.input}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.primaryButton}>
            Sign up
          </button>
        </form>

        <p className={styles.linksRow}>
          <a href="/login">Already have an account? Log in</a>
        </p>
      </div>
    </main>
  );
}
