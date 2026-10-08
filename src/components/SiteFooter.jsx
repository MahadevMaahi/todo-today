const PROFILE_LINKS = [
  {
    label: 'GitHub',
    href: 'https://github.com/your-username',
  },
  {
    label: 'Portfolio',
    href: 'https://your-portfolio.example.com',
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/your-profile',
  },
]

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <p className="site-footer-license">
          © 2026 TODO BOARD. This project is open-source and free to use under the{' '}
          <a
            href="https://opensource.org/license/mit"
            target="_blank"
            rel="noopener noreferrer"
          >
            MIT License
          </a>
          .
        </p>
        <nav className="site-footer-nav" aria-label="Author profiles">
          {PROFILE_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  )
}
