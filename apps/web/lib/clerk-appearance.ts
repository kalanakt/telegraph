const clerkBaseVariables = {
  borderRadius: "0px",
  colorPrimary: "hsl(var(--primary))",
  colorPrimaryForeground: "hsl(var(--primary-foreground))",
  colorDanger: "hsl(var(--destructive))",
  colorNeutral: "hsl(var(--foreground))",
  colorForeground: "hsl(var(--foreground))",
  colorMuted: "hsl(var(--secondary) / 0.72)",
  colorMutedForeground: "hsl(var(--muted-foreground))",
  colorBackground: "hsl(var(--card) / 0.92)",
  colorInput: "hsl(var(--background) / 0.88)",
  colorInputForeground: "hsl(var(--foreground))",
  colorBorder: "hsl(var(--border) / 0.95)",
  colorRing: "hsl(var(--ring) / 0.22)",
  fontFamily: "var(--font-sans)",
};

const flatSurface = {
  border: "1px solid hsl(var(--border) / 0.9)",
  borderRadius: "0px",
  boxShadow: "none",
  background: "hsl(var(--card) / 0.92)",
};

const userButtonSurface = {
  ...flatSurface,
  backdropFilter: "blur(14px)",
};

const userButtonActionButton = {
  borderRadius: "0px",
  boxShadow: "none",
  background: "transparent",
  color: "hsl(var(--foreground))",
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
      background: "hsl(var(--card) / 0.86)",
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
      color: "hsl(var(--foreground))",
    },
    socialButtonsProviderIcon: {
      boxShadow: "none",
    },
    formFieldInput: {
      boxShadow: "none",
      borderRadius: "0px",
      border: "1px solid hsl(var(--input) / 0.9)",
      background: "hsl(var(--background) / 0.88)",
    },
    otpCodeFieldInput: {
      boxShadow: "none",
      borderRadius: "0px",
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
      borderTop: "none",
      boxShadow: "none",
    },
    footerActionText: {
      color: "hsl(var(--muted-foreground))",
    },
    footerActionLink: {
      color: "hsl(var(--primary))",
      textDecoration: "none",
    },
    pricingTable: {
      boxShadow: "none",
    },
    pricingTableCard: {
      border: "1px solid hsl(var(--border) / 0.9)",
      borderRadius: "0px",
      boxShadow: "none",
      background: "hsl(var(--card) / 0.92)",
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
      color: "hsl(var(--muted-foreground))",
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
      color: "hsl(var(--muted-foreground))",
    },
    identityPreviewEditButton: {
      boxShadow: "none",
      borderRadius: "0px",
    },
    userButtonTrigger: {
      borderRadius: "0px",
      boxShadow: "none",
    },
    userButtonPopoverCard: userButtonSurface,
    userButtonPopoverMain: {
      background: "transparent",
    },
    userButtonPopoverActions: {
      background: "transparent",
    },
    userButtonPopoverActionButton: userButtonActionButton,
    userButtonPopoverActionButtonText: {
      color: "hsl(var(--foreground))",
    },
    userButtonPopoverActionButtonIcon: {
      color: "hsl(var(--muted-foreground))",
    },
    userButtonPopoverFooter: {
      background: "hsl(var(--background) / 0.92)",
      borderTop: "none",
      boxShadow: "none",
    },
    userButtonPopoverFooterText: {
      color: "hsl(var(--muted-foreground))",
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
