const clerkBaseVariables = {
  borderRadius: "0px",
  colorPrimary: "oklch(var(--primary))",
  colorPrimaryForeground: "oklch(var(--primary-foreground))",
  colorDanger: "oklch(var(--destructive))",
  colorNeutral: "oklch(var(--foreground))",
  colorForeground: "oklch(var(--foreground))",
  colorMuted: "oklch(var(--secondary) / 0.24)",
  colorMutedForeground: "oklch(var(--muted-foreground))",
  colorBackground: "oklch(var(--card))",
  colorInput: "oklch(var(--background))",
  colorInputForeground: "oklch(var(--foreground))",
  colorBorder: "oklch(var(--border))",
  colorRing: "oklch(var(--ring) / 0.35)",
  fontFamily: "var(--font-sans)",
};

const flatSurface = {
  border: "1px solid oklch(var(--border))",
  borderRadius: "0px",
  boxShadow: "none",
  background: "oklch(var(--card))",
};

const userButtonActionButton = {
  borderRadius: "0px",
  boxShadow: "none",
  background: "transparent",
  color: "oklch(var(--foreground))",
};

export const clerkAppearance = {
  theme: "simple" as const,
  layout: {
    animations: false,
    unsafe_disableDevelopmentModeWarnings: true,
  },
  variables: clerkBaseVariables,
  elements: {
    actionCard: flatSurface,
    cardBox: {
      boxShadow: "none",
    },
    card: {
      ...flatSurface,
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
      background: "oklch(var(--card))",
      borderRight: "none",
      boxShadow: "none",
    },
    navbarButtons: {
      background: "transparent",
      boxShadow: "none",
    },
    navbarButton: {
      borderRadius: "0px",
      boxShadow: "none",
    },
    formButtonPrimary: {
      boxShadow: "none",
      borderRadius: "0px",
    },
    socialButtonsBlockButton: flatSurface,
    socialButtonsBlockButtonText: {
      color: "oklch(var(--foreground))",
    },
    socialButtonsProviderIcon: {
      boxShadow: "none",
    },
    formFieldInput: {
      boxShadow: "none",
      borderRadius: "0px",
      border: "1px solid oklch(var(--input))",
      background: "oklch(var(--background))",
    },
    otpCodeFieldInput: {
      boxShadow: "none",
      borderRadius: "0px",
      border: "1px solid oklch(var(--input))",
      background: "oklch(var(--background))",
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
      borderTop: "none",
      boxShadow: "none",
    },
    footerActionText: {
      color: "oklch(var(--muted-foreground))",
    },
    footerActionLink: {
      color: "oklch(var(--primary))",
      textDecoration: "none",
    },
    pricingTable: {
      boxShadow: "none",
    },
    pricingTableCard: {
      border: "1px solid oklch(var(--border))",
      borderRadius: "0px",
      boxShadow: "none",
      background: "oklch(var(--card))",
    },
    pricingTableMatrixTable: {
      background: "transparent",
      boxShadow: "none",
    },
    subscriptionDetailsCard: flatSurface,
    clerkBadgeBox: {
      background: "transparent",
      boxShadow: "none",
    },
    clerkBadge: {
      background: "transparent",
      boxShadow: "none",
    },
    clerkBadgeText: {
      color: "oklch(var(--muted-foreground))",
    },
    clerkBadgeIcon: {
      boxShadow: "none",
    },
    developmentModeWarning: {
      background: "transparent",
      boxShadow: "none",
      borderTop: "none",
    },
    developmentModeWarningText: {
      color: "oklch(var(--muted-foreground))",
    },
    identityPreviewEditButton: {
      boxShadow: "none",
      borderRadius: "0px",
    },
    userButtonTrigger: {
      borderRadius: "0px",
      boxShadow: "none",
    },
    userButtonPopoverCard: flatSurface,
    userButtonPopoverMain: {
      background: "transparent",
    },
    userButtonPopoverActions: {
      background: "transparent",
    },
    userButtonPopoverActionButton: userButtonActionButton,
    userButtonPopoverActionButtonText: {
      color: "oklch(var(--foreground))",
    },
    userButtonPopoverActionButtonIcon: {
      color: "oklch(var(--muted-foreground))",
    },
    userButtonPopoverFooter: {
      background: "oklch(var(--background))",
      borderTop: "none",
      boxShadow: "none",
    },
    userButtonPopoverFooterText: {
      color: "oklch(var(--muted-foreground))",
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
      ...clerkAppearance.elements.cardBox,
      width: "100%",
    },
  },
};

export const clerkUserButtonAppearance = {
  ...clerkAppearance,
};

export const clerkPricingAppearance = {
  ...clerkAppearance,
  elements: {
    ...clerkAppearance.elements,
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
