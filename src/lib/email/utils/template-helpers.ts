/**
 * Template helper utilities for email generation
 */

export const colors = {
  orchestrator: {
    primary: '#c53030',
    secondary: '#e53e3e',
    white: '#ffffff',
    gray: {
      50: '#f8f9fa',
      100: '#f7fafc',
      200: '#edf2f7',
      300: '#e2e8f0',
      400: '#a0aec0',
      500: '#718096',
      600: '#4a5568',
      700: '#2d3748',
      800: '#1a202c'
    },
    success: '#38a169',
    warning: '#ed8936',
    info: '#3182ce'
  }
}

export const fonts = {
  system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
  mono: '"SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
}

export const spacing = {
  xs: '8px',
  sm: '12px',
  md: '20px',
  lg: '30px',
  xl: '40px',
  xxl: '50px'
}

export const borderRadius = {
  sm: '4px',
  md: '8px',
  lg: '12px'
}

export const shadows = {
  sm: '0 1px 3px rgba(0,0,0,0.1)',
  md: '0 2px 8px rgba(0,0,0,0.1)',
  lg: '0 4px 16px rgba(0,0,0,0.15)'
}

export const gradients = {
  primary: 'linear-gradient(135deg, #c53030 0%, #e53e3e 100%)',
  subtle: 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)',
  accent: 'linear-gradient(90deg, #c53030 0%, #e53e3e 50%, #c53030 100%)'
}

export const createResponsiveStyles = (mobile: string, desktop: string) => `
  @media screen and (max-width: 600px) {
    ${mobile}
  }
  @media screen and (min-width: 601px) {
    ${desktop}
  }
`

export const createButtonStyles = (variant: 'primary' | 'secondary' = 'primary') => {
  const baseStyles = `
    display: inline-block;
    padding: 12px 24px;
    text-decoration: none;
    border-radius: ${borderRadius.md};
    font-weight: 500;
    font-size: 16px;
    text-align: center;
    transition: all 0.2s ease;
  `
  
  const variants = {
    primary: `
      ${baseStyles}
      background: ${gradients.primary};
      color: ${colors.orchestrator.white};
      border: 2px solid ${colors.orchestrator.primary};
    `,
    secondary: `
      ${baseStyles}
      background: ${colors.orchestrator.white};
      color: ${colors.orchestrator.primary};
      border: 2px solid ${colors.orchestrator.primary};
    `
  }
  
  return variants[variant]
} 