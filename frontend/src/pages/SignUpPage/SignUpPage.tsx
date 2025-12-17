import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import styles from './SignUpPage.module.css';

export default function SignUpPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      // const res = await fetch('http://localhost:4000/api/auth/check-email', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email }),
      // });
      // const data = await res.json();

      const data = { exists: false }; // simulate "email exists"

      if (data.exists) {
        setError('Cet email est déjà utilisé');
        return;
      }

      // TODO: l'email n'existe pas -> poursuivre la suite (ex: envoyer code, navigate...)
      navigate('/verify-code', { state: { email } });
    } catch (err) {
      setError('Erreur réseau. Réessayez.');
    }
  }

  return (
    <main className={styles.container}>
      <h1>Sign up</h1>
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
        {error && <p className={styles.error}>{error}</p>}
        <button type="submit" className={styles.button}>
          Sign up
        </button>
      </form>
    </main>
  );
}
