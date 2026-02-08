/**
 * OpenPasture branded Clerk appearance configuration
 * Colors match the Olive Cobalt design system
 */
export const clerkAppearance = {
  variables: {
    colorBackground: '#f6f8f4',
    colorPrimary: '#4a6a2e',
    colorText: '#1a1e18',
    colorTextSecondary: '#647060',
    colorInputBackground: '#ffffff',
    colorInputText: '#1a1e18',
    borderRadius: '0px',
  },
  elements: {
    // Card styling
    card: {
      backgroundColor: '#ffffff',
      borderRadius: '0px',
      border: '2px solid #1a1e18',
      boxShadow: '4px 4px 0 #4a6a2e',
    },
    // Header
    headerTitle: {
      color: '#1a1e18',
      fontFamily: "'JetBrains Mono', monospace",
    },
    headerSubtitle: {
      color: '#647060',
    },
    // Form fields
    formFieldLabel: {
      color: '#647060',
      fontFamily: "'JetBrains Mono', monospace",
      textTransform: 'uppercase' as const,
      fontSize: '0.7rem',
      letterSpacing: '0.05em',
    },
    formFieldInput: {
      backgroundColor: '#f2f6ee',
      borderColor: '#c4d0c0',
      borderWidth: '2px',
      borderRadius: '0px',
      color: '#1a1e18',
      fontFamily: "'JetBrains Mono', monospace",
      '&:focus': {
        borderColor: '#4a6a2e',
        boxShadow: '0 0 0 2px rgba(74, 106, 46, 0.3)',
      },
    },
    // Primary button
    formButtonPrimary: {
      backgroundColor: '#4a6a2e',
      color: '#ffffff',
      borderRadius: '0px',
      fontFamily: "'JetBrains Mono', monospace",
      fontWeight: '700',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
      boxShadow: '3px 3px 0 #1a1e18',
      '&:hover': {
        backgroundColor: '#5a7a38',
        transform: 'translate(-1px, -1px)',
        boxShadow: '4px 4px 0 #1a1e18',
      },
    },
    // Social buttons
    socialButtonsBlockButton: {
      backgroundColor: '#ffffff',
      borderColor: '#c4d0c0',
      borderWidth: '2px',
      borderRadius: '0px',
      color: '#1a1e18',
      '&:hover': {
        backgroundColor: '#f2f6ee',
        borderColor: '#4a6a2e',
      },
    },
    socialButtonsBlockButtonText: {
      color: '#1a1e18',
    },
    // Divider
    dividerLine: {
      backgroundColor: '#c4d0c0',
    },
    dividerText: {
      color: '#647060',
    },
    // Pricing table cards
    pricingTableCard: {
      backgroundColor: '#ffffff',
      border: '2px solid #1a1e18',
      boxShadow: '4px 4px 0 #4a6a2e',
      backgroundImage: 'none',
    },
    pricingTableCardTitle: {
      fontFamily: "'JetBrains Mono', monospace",
    },
    pricingTableCardFee: {
      color: '#1a1e18',
    },
    pricingTableCardFeePeriod: {
      color: '#647060',
    },
    pricingTableCardFeePeriodNotice: {
      color: '#647060',
    },
    pricingTableCardFooterButton: {
      backgroundColor: '#4a6a2e',
      color: '#ffffff',
      borderRadius: '0px',
      fontFamily: "'JetBrains Mono', monospace",
      fontWeight: '700',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
      boxShadow: '3px 3px 0 #1a1e18',
      '&:hover': {
        backgroundColor: '#5a7a38',
        transform: 'translate(-1px, -1px)',
        boxShadow: '4px 4px 0 #1a1e18',
      },
    },
    // Footer
    footerActionLink: {
      color: '#a83a32',
      '&:hover': {
        color: '#c06a62',
      },
    },
    footerActionText: {
      color: '#647060',
    },
    // Identity preview
    identityPreviewText: {
      color: '#1a1e18',
    },
    identityPreviewEditButton: {
      color: '#a83a32',
    },
    // Alert
    alert: {
      backgroundColor: 'rgba(168, 58, 50, 0.1)',
      borderColor: 'rgba(168, 58, 50, 0.3)',
      borderRadius: '0px',
    },
    alertText: {
      color: '#1a1e18',
    },
  },
}
