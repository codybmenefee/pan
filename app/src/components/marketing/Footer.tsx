import { Link } from '@tanstack/react-router'

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#075056] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111719] rounded'

export function Footer() {
  return (
    <footer className="bg-[#111719] border-t border-[#075056]/30" role="contentinfo">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
          {/* Product */}
          <nav aria-label="Product">
            <h3 className="font-semibold mb-2 text-[#FDF6E3] text-sm">Product</h3>
            <ul className="space-y-1 text-xs text-[#D3DBDD]">
              <li>
                <a
                  href="#how-it-works"
                  className={`hover:text-[#FDF6E3] transition-colors ${focusRing}`}
                >
                  How It Works
                </a>
              </li>
              <li>
                <a href="#features" className={`hover:text-[#FDF6E3] transition-colors ${focusRing}`}>
                  Features
                </a>
              </li>
              <li>
                <Link
                  to="/technology"
                  className={`hover:text-[#FDF6E3] transition-colors ${focusRing}`}
                >
                  Technology
                </Link>
              </li>
              <li>
                <Link
                  to="/sign-in"
                  className={`hover:text-[#FDF6E3] transition-colors ${focusRing}`}
                >
                  Get Started
                </Link>
              </li>
            </ul>
          </nav>

          {/* Learn More */}
          <nav aria-label="Learn More">
            <h3 className="font-semibold mb-2 text-[#FDF6E3] text-sm">Learn More</h3>
            <ul className="space-y-1 text-xs text-[#D3DBDD]">
              <li>
                <Link
                  to="/investors"
                  className={`hover:text-[#FDF6E3] transition-colors ${focusRing}`}
                >
                  The Thesis
                </Link>
              </li>
              <li>
                <Link
                  to="/research"
                  className={`hover:text-[#FDF6E3] transition-colors ${focusRing}`}
                >
                  Research Partnerships
                </Link>
              </li>
            </ul>
          </nav>

          {/* Resources */}
          <nav aria-label="Resources">
            <h3 className="font-semibold mb-2 text-[#FDF6E3] text-sm">Resources</h3>
            <ul className="space-y-1 text-xs text-[#D3DBDD]">
              <li>
                <a
                  href="https://github.com/codybmenefee/pan"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`hover:text-[#FDF6E3] transition-colors ${focusRing}`}
                >
                  Documentation
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/codybmenefee/pan"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`hover:text-[#FDF6E3] transition-colors ${focusRing}`}
                >
                  FAQ
                </a>
              </li>
            </ul>
          </nav>

          {/* Company */}
          <nav aria-label="Company">
            <h3 className="font-semibold mb-2 text-[#FDF6E3] text-sm">Company</h3>
            <ul className="space-y-1 text-xs text-[#D3DBDD]">
              <li>
                <a href="#" className={`hover:text-[#FDF6E3] transition-colors ${focusRing}`}>
                  About
                </a>
              </li>
              <li>
                <a href="#" className={`hover:text-[#FDF6E3] transition-colors ${focusRing}`}>
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className={`hover:text-[#FDF6E3] transition-colors ${focusRing}`}>
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className={`hover:text-[#FDF6E3] transition-colors ${focusRing}`}>
                  Terms of Service
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="border-t border-[#075056]/30 mt-6 pt-6 text-center text-xs text-[#D3DBDD]/70">
          <p>
            © {new Date().getFullYear()} OpenPasture. Licensed under{' '}
            <a
              href="https://www.apache.org/licenses/LICENSE-2.0"
              target="_blank"
              rel="noopener noreferrer"
              className={`text-[#075056] hover:text-[#FF5B04] hover:underline transition-colors ${focusRing}`}
            >
              Apache License 2.0
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
