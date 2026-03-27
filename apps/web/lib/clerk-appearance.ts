const clerkBaseVariables = {
  borderRadius: "0.125rem",
  colorPrimary: "hsl(var(--primary))",
  colorBackground: "transparent",
  colorInputBackground: "hsl(var(--background) / 0.88)",
  colorInputText: "hsl(var(--foreground))",
  colorText: "hsl(var(--foreground))",
  colorTextSecondary: "hsl(var(--muted-foreground))",
  fontFamily: "var(--font-sans)",
};

const flatSurface = {
  border: "1px solid hsl(var(--border) / 0.8)",
  borderRadius: "0.125rem",
  boxShadow: "none",
  background: "hsl(var(--background) / 0.92)",
};

export const clerkAppearance = {
  theme: "simple" as const,
  layout: {
    animations: false,
    unsafe_disableDevelopmentModeWarnings: true,
  },
  variables: clerkBaseVariables,
  elements: {
    cardBox: {
      boxShadow: "none",
    },
    card: {
      ...flatSurface,
      backdropFilter: "blur(12px)",
    },
    modalContent: flatSurface,
    pageScrollBox: {
      background: "transparent",
      boxShadow: "none",
    },
    page: {
      background: "transparent",
      boxShadow: "none",
    },
    navbar: {
      background: "hsl(var(--background) / 0.92)",
      borderRight: "1px solid hsl(var(--border) / 0.8)",
      boxShadow: "none",
    },
    navbarButtons: {
      background: "transparent",
      boxShadow: "none",
    },
    navbarButton: {
      borderRadius: "0.125rem",
      boxShadow: "none",
    },
    formButtonPrimary: {
      boxShadow: "none",
      borderRadius: "0.125rem",
    },
    socialButtonsBlockButton: flatSurface,
    socialButtonsBlockButtonText: {
      color: "hsl(var(--foreground))",
    },
    socialButtonsProviderIcon: {
      boxShadow: "none",
    },
    formFieldInput: {
      boxShadow: "none",
      borderRadius: "0.125rem",
      border: "1px solid hsl(var(--input) / 0.9)",
      background: "hsl(var(--background) / 0.88)",
    },
    otpCodeFieldInput: {
      boxShadow: "none",
      borderRadius: "0.125rem",
      border: "1px solid hsl(var(--input) / 0.9)",
      background: "hsl(var(--background) / 0.88)",
    },
    formFieldAction: {
      boxShadow: "none",
    },
    footer: {
      background: "transparent",
      boxShadow: "none",
    },
    footerAction: {
      background: "transparent",
      borderTop: "1px solid hsl(var(--border) / 0.8)",
      boxShadow: "none",
    },
    footerActionText: {
      color: "hsl(var(--muted-foreground))",
    },
    footerActionLink: {
      color: "hsl(var(--primary))",
      textDecoration: "none",
    },
    clerkBadgeBox: {
      background: "transparent",
      boxShadow: "none",
    },
    clerkBadge: {
      background: "transparent",
      boxShadow: "none",
    },
    clerkBadgeText: {
      color: "hsl(var(--muted-foreground))",
    },
    clerkBadgeIcon: {
      boxShadow: "none",
    },
    developmentModeWarning: {
      background: "transparent",
      boxShadow: "none",
      borderTop: "1px solid hsl(var(--border) / 0.8)",
    },
    developmentModeWarningText: {
      color: "hsl(var(--muted-foreground))",
    },
    identityPreviewEditButton: {
      boxShadow: "none",
      borderRadius: "0.125rem",
    },
    userButtonPopoverCard: flatSurface,
    userButtonPopoverActionButton: {
      borderRadius: "0.125rem",
      boxShadow: "none",
    },
    userButtonPopoverFooter: {
      borderTop: "1px solid hsl(var(--border) / 0.8)",
    },
  },
};

export const clerkAuthAppearance = {
  ...clerkAppearance,
  elements: {
    ...clerkAppearance.elements,
    rootBox: {
      width: "100%",
    },
  },
};

export const clerkProfileAppearance = {
  ...clerkAppearance,
  elements: {
    ...clerkAppearance.elements,
    rootBox: {
      width: "100%",
    },
    cardBox: {
      width: "100%",
      boxShadow: "none",
    },
  },
};

export const clerkPricingAppearance = {
  ...clerkAppearance,
  elements: {
    ...clerkAppearance.elements,
    pricingTable: {
      boxShadow: "none",
    },
    pricingTableCard: flatSurface,
  },
};

export const clerkCheckoutAppearance = {
  ...clerkAppearance,
  elements: {
    ...clerkAppearance.elements,
    cardBox: {
      boxShadow: "none",
    },
  },
};
