# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please report it responsibly.

### How to Report

**Option 1: GitHub Security Advisory (Preferred)**

1. Go to the [Security Advisories](https://github.com/codybmenefee/pan/security/advisories) page
2. Click "New draft security advisory"
3. Fill in the details of the vulnerability

**Option 2: Email**

Send details to: security@openpasture.dev

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fixes (optional)

### Response Timeline

- **Initial Response:** Within 48 hours
- **Status Update:** Within 7 days
- **Resolution Target:** Within 30 days for critical issues

### Disclosure Policy

- We follow coordinated disclosure practices
- We will work with you to understand and resolve the issue
- We will credit reporters in the security advisory (unless you prefer anonymity)
- Please allow us reasonable time to address the issue before public disclosure

### Scope

This policy applies to:
- The OpenPasture web application (`app/`)
- Convex backend functions (`app/convex/`)
- Documentation and configuration files

### Out of Scope

- Third-party services (Clerk, Convex infrastructure, satellite data providers)
- Issues in dependencies (please report to the upstream project)
- Social engineering attacks
- Physical security

## Security Best Practices

When contributing, please:
- Never commit API keys, secrets, or credentials
- Use environment variables for sensitive configuration
- Validate and sanitize user inputs
- Follow the principle of least privilege

Thank you for helping keep OpenPasture secure.
