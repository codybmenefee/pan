import { Link } from '@tanstack/react-router'

export function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Product */}
          <div>
            <h3 className="font-semibold mb-4 text-slate-100">Product</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <a href="#how-it-works" className="hover:text-slate-200 transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-slate-200 transition-colors">
                  Features
                </a>
              </li>
              <li>
                <Link to="/technology" className="hover:text-slate-200 transition-colors">
                  Technology
                </Link>
              </li>
              <li>
                <Link to="/onboarding" className="hover:text-slate-200 transition-colors">
                  Get Started
                </Link>
              </li>
            </ul>
          </div>

          {/* For Stakeholders */}
          <div>
            <h3 className="font-semibold mb-4 text-slate-100">For Stakeholders</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link to="/investors" className="hover:text-slate-200 transition-colors">
                  For Investors
                </Link>
              </li>
              <li>
                <Link to="/research" className="hover:text-slate-200 transition-colors">
                  Research Partnerships
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-4 text-slate-100">Resources</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-slate-200 transition-colors"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-slate-200 transition-colors"
                >
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4 text-slate-100">Company</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <a href="#" className="hover:text-slate-200 transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-slate-200 transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-slate-200 transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-slate-200 transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-8 text-center text-sm text-slate-500">
          <p>
            © {new Date().getFullYear()} Grazing Intelligence. Licensed under{' '}
            <a
              href="https://www.apache.org/licenses/LICENSE-2.0"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline"
            >
              Apache License 2.0
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
