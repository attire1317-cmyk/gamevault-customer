const STORE = process.env.NEXT_PUBLIC_STORE_NAME || 'GameVault';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <strong>{STORE}</strong>
        <p>Console games to rent or buy. Stock, prices and due dates are always current.</p>
      </div>
    </footer>
  );
}
