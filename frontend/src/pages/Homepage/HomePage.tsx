import { useNavigate } from 'react-router-dom';
import styles from './HomePage.module.css';

export default function HomePage() {
  const navigate = useNavigate();

  function handleSignUpClick() {
    navigate('/signup');
  }

  function handleLogInClick() {
    navigate('/login');
  }

  return (
    <div>
      <nav className={styles.nav}>
        <div>EpiTrello</div>
        <div className={styles.navButtons}>
          <button onClick={handleSignUpClick}>Sign up</button>
          <button onClick={handleLogInClick}>Log in</button>
        </div>
      </nav>

      <main className={styles.main}>
        <p>Homepage très simple pour l'instant.</p>
      </main>
    </div>
  );
}
