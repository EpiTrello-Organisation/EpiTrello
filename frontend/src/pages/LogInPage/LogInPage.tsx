import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './LogInPage.module.css';

type Provider = 'google' | 'microsoft' | 'apple' | 'slack';

function TrelloLogo() {
  return (
    <svg className={styles.trelloIcon} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="3" fill="#0052CC" />
      <rect x="6" y="6" width="4" height="10" rx="1" fill="#FFFFFF" />
      <rect x="14" y="6" width="4" height="6" rx="1" fill="#FFFFFF" />
    </svg>
  );
}

function ProviderIcon({ provider }: { provider: Provider }) {
  switch (provider) {
    case 'google':
      return (
        <svg className={styles.providerIcon} viewBox="0 0 48 48" aria-hidden="true">
          <path
            fill="#FFC107"
            d="M43.611 20.083H42V20H24v8h11.303C33.655 32.657 29.244 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.96 3.04l5.657-5.657C34.047 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.651-.389-3.917z"
          />
          <path
            fill="#FF3D00"
            d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.96 3.04l5.657-5.657C34.047 6.053 29.268 4 24 4c-7.682 0-14.354 4.337-17.694 10.691z"
          />
          <path
            fill="#4CAF50"
            d="M24 44c5.166 0 9.86-1.977 13.409-5.197l-6.191-5.238C29.164 35.09 26.715 36 24 36c-5.223 0-9.62-3.317-11.293-7.946l-6.522 5.025C9.482 39.556 16.227 44 24 44z"
          />
          <path
            fill="#1976D2"
            d="M43.611 20.083H42V20H24v8h11.303c-.802 2.273-2.319 4.194-4.085 5.565l.003-.002 6.191 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.651-.389-3.917z"
          />
        </svg>
      );
    case 'microsoft':
      return (
        <svg className={styles.providerIcon} viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#F25022" d="M1 1h10v10H1z" />
          <path fill="#7FBA00" d="M13 1h10v10H13z" />
          <path fill="#00A4EF" d="M1 13h10v10H1z" />
          <path fill="#FFB900" d="M13 13h10v10H13z" />
        </svg>
      );
    case 'apple':
      return (
        <svg className={styles.providerIcon} viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M16.365 1.43c0 1.14-.42 2.208-1.165 3.03-.79.88-2.08 1.56-3.245 1.47-.14-1.08.44-2.23 1.165-3.02.8-.89 2.155-1.55 3.245-1.48zM20.9 17.06c-.4.93-.59 1.35-1.1 2.17-.7 1.13-1.7 2.54-2.95 2.55-1.11.01-1.4-.73-2.93-.72-1.53.01-1.85.74-2.96.73-1.25-.01-2.2-1.28-2.9-2.4-1.96-3.09-2.16-6.72-.96-8.57.86-1.34 2.22-2.12 3.5-2.12 1.3 0 2.12.74 3.2.74 1.05 0 1.69-.75 3.19-.75 1.14 0 2.35.62 3.2 1.7-2.81 1.54-2.36 5.58.62 6.97z"
          />
        </svg>
      );
    case 'slack':
      return (
        <svg className={styles.providerIcon} viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#E01E5A" d="M6.1 13.6a2.1 2.1 0 1 1-2.1-2.1h2.1v2.1z" />
          <path fill="#E01E5A" d="M7.2 13.6a2.1 2.1 0 1 1 4.2 0V19a2.1 2.1 0 1 1-4.2 0v-5.4z" />
          <path fill="#36C5F0" d="M10.4 6.1A2.1 2.1 0 1 1 12.5 4v2.1h-2.1z" />
          <path fill="#36C5F0" d="M10.4 7.2a2.1 2.1 0 1 1 0 4.2H5a2.1 2.1 0 1 1 0-4.2h5.4z" />
          <path fill="#2EB67D" d="M17.9 10.4A2.1 2.1 0 1 1 20 12.5h-2.1v-2.1z" />
          <path fill="#2EB67D" d="M16.8 10.4a2.1 2.1 0 1 1-4.2 0V5a2.1 2.1 0 1 1 4.2 0v5.4z" />
          <path fill="#ECB22E" d="M13.6 17.9A2.1 2.1 0 1 1 11.5 20v-2.1h2.1z" />
          <path fill="#ECB22E" d="M13.6 16.8a2.1 2.1 0 1 1 0-4.2H19a2.1 2.1 0 1 1 0 4.2h-5.4z" />
        </svg>
      );
  }
}

function ProviderButton({ provider, label }: { provider: Provider; label: string }) {
  return (
    <button type="button" className={styles.providerButton}>
      <ProviderIcon provider={provider} />
      <span className={styles.providerLabel}>{label}</span>
    </button>
  );
}

function PasskeyIcon() {
  return (
    <svg className={styles.passkeyIcon} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M7.5 14A5.5 5.5 0 1 1 13 8.5c0 .6-.1 1.2-.3 1.7l7.3 7.3a1 1 0 0 1-.7 1.7H17v1a1 1 0 0 1-1 1h-2v-2h-2v-2H9.7l-1-1A5.5 5.5 0 0 1 7.5 14Zm0-9A4.5 4.5 0 1 0 12 9.5 4.5 4.5 0 0 0 7.5 5Zm0 3a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"
      />
    </svg>
  );
}

function InfoIcon() {
  return (
    <span className={styles.infoIcon} aria-hidden="true">
      i
    </span>
  );
}

export default function LogInPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Email et mot de passe requis');
      return;
    }

    // TODO: call backend
    navigate('/kanban');
  }

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoRow}>
          <TrelloLogo />
          <h1 className={styles.logoText}>Trello</h1>
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

          <label className={styles.rememberRow}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span className={styles.rememberText}>Remember me</span>
            <InfoIcon />
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.primaryButton}>
            Continue
          </button>
        </form>

        <p className={styles.sectionLabel}>Or login with:</p>

        <button type="button" className={styles.passkeyButton}>
          <PasskeyIcon />
          <span>Passkey</span>
        </button>

        <p className={styles.sectionLabel}>Or continue with:</p>

        <div className={styles.providers}>
          <ProviderButton provider="google" label="Google" />
          <ProviderButton provider="microsoft" label="Microsoft" />
          <ProviderButton provider="apple" label="Apple" />
          <ProviderButton provider="slack" label="Slack" />
        </div>

        <div className={styles.linksRow}>
          <a className={styles.link} href="/forgot-password">
            Can&apos;t log in?
          </a>
          <span className={styles.dot}>·</span>
          <a className={styles.link} href="/signup">
            Create an account
          </a>
        </div>

        <div className={styles.footer}>
          <div className={styles.atlassianRow}>
            <span className={styles.atlassianMark} aria-hidden="true">
              ▲
            </span>
            <span className={styles.atlassianText}>ATLASSIAN</span>
          </div>

          <p className={styles.footerSmall}>One account for Trello, Jira, Confluence and more.</p>

          <div className={styles.footerLinks}>
            <a className={styles.footerLink} href="/privacy">
              Privacy Policy
            </a>
            <span className={styles.dot}>·</span>
            <a className={styles.footerLink} href="/user-notice">
              User Notice
            </a>
          </div>

          <p className={styles.footerTiny}>
            This site is protected by reCAPTCHA and the Google Privacy Policy and Terms of Service apply.
          </p>
        </div>
      </div>
    </main>
  );
}
