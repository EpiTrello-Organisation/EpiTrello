import styles from './SignUpPage.module.css';

export default function SignUpPage() {
  return (
    <main className={styles.container}>
      <h1>Sign up</h1>
      <form onSubmit={(e) => e.preventDefault()}>
        <div className={styles.fieldWrapper}>
          <label htmlFor="email" className={styles.label}>
            Email
          </label>
          <input id="email" type="email" placeholder="Enter your email" className={styles.input} />
        </div>
        <button type="submit" className={styles.button}>
          Sign up
        </button>
      </form>
    </main>
  );
}
