/**
 * OpenPasture branded Clerk appearance configuration
 * Colors match the app's CSS variables from globals.css
 */
export const clerkAppearance = {
  variables: {
    colorBackground: '#233038',
    colorPrimary: '#075056',
    colorText: '#FDF6E3',
    colorTextSecondary: '#c8c5b9',
    colorInputBackground: '#1a2429',
    colorInputText: '#FDF6E3',
    borderRadius: '0.625rem',
  },
  elements: {
    // Card styling
    card: {
      backgroundColor: '#1a2429',
      borderRadius: '0.625rem',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    },
    // Header
    headerTitle: {
      color: '#FDF6E3',
    },
    headerSubtitle: {
      color: '#c8c5b9',
    },
    // Form fields
    formFieldLabel: {
      color: '#c8c5b9',
    },
    formFieldInput: {
      backgroundColor: '#233038',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      color: '#FDF6E3',
      '&:focus': {
        borderColor: '#075056',
        boxShadow: '0 0 0 2px rgba(7, 80, 86, 0.3)',
      },
    },
    // Primary button
    formButtonPrimary: {
      backgroundColor: '#FF5B04',
      color: '#FDF6E3',
      '&:hover': {
        backgroundColor: '#e55204',
      },
    },
    // Social buttons
    socialButtonsBlockButton: {
      backgroundColor: '#233038',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      color: '#FDF6E3',
      '&:hover': {
        backgroundColor: '#2a3a44',
      },
    },
    socialButtonsBlockButtonText: {
      color: '#FDF6E3',
    },
    // Divider
    dividerLine: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    dividerText: {
      color: '#c8c5b9',
    },
    // Footer
    footerActionLink: {
      color: '#FF5B04',
      '&:hover': {
        color: '#e55204',
      },
    },
    footerActionText: {
      color: '#c8c5b9',
    },
    // Identity preview
    identityPreviewText: {
      color: '#FDF6E3',
    },
    identityPreviewEditButton: {
      color: '#FF5B04',
    },
    // Alert
    alert: {
      backgroundColor: 'rgba(255, 91, 4, 0.1)',
      borderColor: 'rgba(255, 91, 4, 0.3)',
    },
    alertText: {
      color: '#FDF6E3',
    },
  },
}
