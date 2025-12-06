export function Footer() {
  return (
    <footer className="footer footer-center p-4 bg-base-200 text-base-content border-t border-base-300">
      <div className="flex flex-col sm:flex-row items-center justify-between w-full max-w-6xl">
        <div className="text-sm">
          <p>&copy; 2025 CRM System. All rights reserved.</p>
        </div>
        <div className="flex gap-4 text-sm">
          <a href="/privacy" className="link link-hover">
            プライバシーポリシー
          </a>
          <a href="/terms" className="link link-hover">
            利用規約
          </a>
        </div>
      </div>
    </footer>
  );
}
