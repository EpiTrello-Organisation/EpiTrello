import { useLocation } from 'react-router-dom';
import styles from './VerifyCodePage.module.css';

export default function VerifyCodePage() {
  const location = useLocation();
  const email = (location.state as any)?.email || 'user@example.com';

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>We've emailed you a code</h1>

      <p className={styles.subtitle}>
        To complete your account setup, enter the code we've sent to:
      </p>

      <p className={styles.email}>{email}</p>

      <div className={styles.codeRow}>
        <input className={styles.codeBox} type="text" inputMode="numeric" maxLength={1} />
        <input className={styles.codeBox} type="text" inputMode="numeric" maxLength={1} />
        <input className={styles.codeBox} type="text" inputMode="numeric" maxLength={1} />
        <input className={styles.codeBox} type="text" inputMode="numeric" maxLength={1} />
        <input className={styles.codeBox} type="text" inputMode="numeric" maxLength={1} />
        <input className={styles.codeBox} type="text" inputMode="numeric" maxLength={1} />
      </div>

      <button className={styles.verifyButton} type="button">
        Verify
      </button>
    </main>
  );
}
