import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import styles from './SignUpPage.module.css';

export default function SignUpPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  return (
    <main className={styles.container}>
      <h1>Sign up</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          navigate('/verify-code', { state: { email } });
        }}
      >
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
        <button type="submit" className={styles.button}>
          Sign up
        </button>
      </form>
    </main>
  );
}
