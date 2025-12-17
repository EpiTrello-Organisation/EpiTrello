import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import OtpInput from 'react-otp-input';
import styles from './VerifyCodePage.module.css';

export default function VerifyCodePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = (location.state as any)?.email;

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleVerify() {
    try {
      const isValid = true; // accept all codes for now

      if (!isValid) {
        setError('Code invalide');
        return;
      }

      navigate('/complete-profile', { state: { email } });
    } catch (err) {
      setError('Erreur réseau. Réessayez.');
    }
  }

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>We've emailed you a code</h1>

      <p className={styles.subtitle}>
        To complete your account setup, enter the code we've sent to:
      </p>

      <p className={styles.email}>{email}</p>

      <OtpInput
        value={code}
        onChange={setCode}
        numInputs={6}
        shouldAutoFocus
        inputType="tel"
        renderInput={(props) => <input {...props} className={styles.codeBox} />}
        containerStyle={styles.codeRow}
      />

      {error && <p className={styles.error}>{error}</p>}

      <button
        className={styles.verifyButton}
        type="button"
        onClick={handleVerify}
      >
        Verify
      </button>
    </main>
  );
}
