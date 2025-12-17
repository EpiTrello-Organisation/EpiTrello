import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import styles from './CompleteProfilePage.module.css';

export default function CompleteProfilePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = (location.state as any)?.email ?? '';

  // new state
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // submit handler with backend call commented (like SignUp/Verify)
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      // const res = await fetch('http://localhost:4000/api/auth/create-account', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email, fullName, password }),
      // });
      // const data = await res.json();

      const data = { success: true }; // simulate success

      if (!data.success) {
        setError('Impossible de créer le compte');
        return;
      }

      // account created -> navigate to kanban page
      navigate('/kanban');
    } catch (err) {
      setError('Erreur réseau. Réessayez.');
    }
  }

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>Email address verified</h1>
      <p className={styles.subtitle}>Finish setting up your account</p>

      <p className={styles.email}>{email}</p>

      <form onSubmit={handleSubmit}>
        <div className={styles.fieldWrapper}>
          <label htmlFor="fullName" className={styles.label}>
            Full name
          </label>
          <input
            id="fullName"
            type="text"
            placeholder="Enter full name"
            className={styles.input}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        <div className={styles.fieldWrapper}>
          <label htmlFor="password" className={styles.label}>
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="Create password"
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" className={styles.button}>
          Continue
        </button>
      </form>
    </main>
  );
}
