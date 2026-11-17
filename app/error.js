'use client';

export default function GlobalError({ reset }) {
  return (
    <main className="auth">
      <div className="auth-card">
        <h1>Something went wrong</h1>
        <p className="muted">Please try again.</p>
        <button className="btn btn-primary btn-lg btn-block" onClick={reset}>
          Try again
        </button>
      </div>
    </main>
  );
}
