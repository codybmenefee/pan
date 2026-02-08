import { Link } from '@tanstack/react-router'

export function Footer() {
  return (
    <footer className="bg-dark border-t-2 border-olive/30" role="contentinfo">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
          {/* Product */}
          <nav aria-label="Product">
            <h3 className="font-semibold mb-2 text-cream text-sm">Product</h3>
            <ul className="space-y-1 text-xs text-terracotta-muted">
              <li>
                <Link
                  to="/technology"
                  className="hover:text-cream transition-colors"
                >
                  Technology
                </Link>
              </li>
              <li>
                <Link
                  to="/demo"
                  className="hover:text-cream transition-colors"
                >
                  Demo
                </Link>
              </li>
              <li>
                <Link
                  to="/sign-in"
                  className="hover:text-cream transition-colors"
                >
                  Get Started
                </Link>
              </li>
            </ul>
          </nav>

          {/* Learn More */}
          <nav aria-label="Learn More">
            <h3 className="font-semibold mb-2 text-cream text-sm">Learn More</h3>
            <ul className="space-y-1 text-xs text-terracotta-muted">
              <li>
                <Link
                  to="/investors"
                  className="hover:text-cream transition-colors"
                >
                  The Thesis
                </Link>
              </li>
              <li>
                <Link
                  to="/research"
                  className="hover:text-cream transition-colors"
                >
                  Research Partnerships
                </Link>
              </li>
            </ul>
          </nav>

          {/* Resources */}
          <nav aria-label="Resources">
            <h3 className="font-semibold mb-2 text-cream text-sm">Resources</h3>
            <ul className="space-y-1 text-xs text-terracotta-muted">
              <li>
                <a
                  href="https://github.com/codybmenefee/pan"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cream transition-colors"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/codybmenefee/pan"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cream transition-colors"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </nav>

          {/* Company */}
          <nav aria-label="Company">
            <h3 className="font-semibold mb-2 text-cream text-sm">Company</h3>
            <ul className="space-y-1 text-xs text-terracotta-muted">
              <li>
                <a href="#" className="hover:text-cream transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-cream transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-cream transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-cream transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="border-t border-olive/30 mt-6 pt-6 text-center text-xs text-terracotta-muted/70">
          <p>
            &copy; {new Date().getFullYear()} OpenPasture. Licensed under{' '}
            <a
              href="https://www.apache.org/licenses/LICENSE-2.0"
              target="_blank"
              rel="noopener noreferrer"
              className="text-olive hover:text-terracotta hover:underline transition-colors"
            >
              Apache License 2.0
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
