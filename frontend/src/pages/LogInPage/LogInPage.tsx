import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './LogInPage.module.css';

export default function LogInPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Email et mot de passe requis');
      return;
    }

    try {
      // Exemple futur backend
      // const res = await fetch('http://localhost:4000/api/auth/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email, password }),
      // });
      // const data = await res.json();

      const data = { success: true }; // simulation

      if (!data.success) {
        setError('Email ou mot de passe incorrect');
        return;
      }

      navigate('/kanban');
    } catch {
      setError('Erreur réseau. Réessayez.');
    }
  }

  return (
    <main className={styles.container}>
      <h1>Log in</h1>

      <form onSubmit={handleSubmit}>
        <div className={styles.fieldWrapper}>
          <label htmlFor="email" className={styles.label}>
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className={styles.fieldWrapper}>
          <label htmlFor="password" className={styles.label}>
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" className={styles.button}>
          Log in
        </button>
      </form>
    </main>
  );
}
