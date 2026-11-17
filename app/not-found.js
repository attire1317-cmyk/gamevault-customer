import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="auth">
      <div className="auth-card">
        <h1>Page not found</h1>
        <p className="muted">That page does not exist.</p>
        <Link href="/" className="btn btn-primary btn-lg btn-block">
          Back to the store
        </Link>
      </div>
    </main>
  );
}
