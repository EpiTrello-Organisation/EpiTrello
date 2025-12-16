import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import OtpInput from 'react-otp-input';
import styles from './VerifyCodePage.module.css';

export default function VerifyCodePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = (location.state as any)?.email || 'user@example.com';

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleVerify() {
    if (code.length !== 6) {
      setError('Entrez le code à 6 chiffres');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      // const res = await fetch('http://localhost:4000/api/auth/verify-code', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email, code }),
      // });
      // const data = await res.json();

      const isValid = true; // accept all codes for now

      if (!isValid) {
        setError("Code invalide");
        return;
      }

      // TODO: le code est valide -> poursuivre la suite (ex: créer compte, navigate...)
      navigate('/');
    } catch (err) {
      setError('Erreur réseau. Réessayez.');
    } finally {
      setLoading(false);
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
        disabled={code.length !== 6 || loading}
        onClick={handleVerify}
      >
        {loading ? 'Verifying...' : 'Verify'}
      </button>
    </main>
  );
}