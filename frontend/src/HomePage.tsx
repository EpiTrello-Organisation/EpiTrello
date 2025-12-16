import { useNavigate } from 'react-router-dom';

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
      <nav
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 20px',
          borderBottom: '1px solid #ddd',
        }}
      >
        <div>Trello</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleSignUpClick}>Sign up</button>
          <button onClick={handleLogInClick}>Log in</button>
        </div>
      </nav>

      <main style={{ padding: '20px' }}>
        <h1>Welcome to Trello MVP</h1>
        <p>Homepage très simple pour l'instant.</p>
      </main>j
    </div>
  );
}
