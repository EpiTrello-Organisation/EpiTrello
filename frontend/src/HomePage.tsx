import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();

  function handleLoginClick() {
    navigate("/signin");
  }

  return (
    <div>
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 20px",
          borderBottom: "1px solid #ddd",
        }}
      >
        <div>Trello</div>
        <button onClick={handleLoginClick}>Log in</button>
      </nav>

      <main style={{ padding: "20px" }}>
        <h1>Welcome to Trello MVP</h1>
        <p>Homepage très simple pour l'instant.</p>
      </main>
    </div>
  );
}
