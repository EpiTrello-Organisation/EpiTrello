export default function LogInPage() {
  return (
    <main style={{ padding: '20px', maxWidth: 480 }}>
      <h1>Log in</h1>
      <form onSubmit={(e) => e.preventDefault()}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          <label htmlFor="email" style={{ fontWeight: 600 }}>
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            style={{ padding: '8px 10px', fontSize: 16, borderRadius: 4, border: '1px solid #ccc' }}
          />
        </div>
        <button type="submit" style={{ padding: '8px 12px', fontSize: 16, borderRadius: 4 }}>
          Continue
        </button>
      </form>
    </main>
  );
}
