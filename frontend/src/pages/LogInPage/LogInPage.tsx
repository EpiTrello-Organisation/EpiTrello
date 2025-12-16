import styles from './LogInPage.module.css';

export default function LogInPage() {
  return (
    <main className={styles.container}>
      <h1>Log in</h1>
      <form onSubmit={(e) => e.preventDefault()}>
        <div className={styles.fieldWrapper}>
          <label htmlFor="email" className={styles.label}>
            Email
          </label>
          <input id="email" type="email" placeholder="Enter your email" className={styles.input} />
        </div>
        <button type="submit" className={styles.button}>
          Continue
        </button>
      </form>
    </main>
  );
}
