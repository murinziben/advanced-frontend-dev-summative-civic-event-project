/*
 * Tailwind configuration (used by the Tailwind Play CDN).
 * ---------------------------------------------------------------
 * WHAT: tells Tailwind about our own colour names, font and corner radius,
 *       so we can write classes like `bg-primary`, `text-muted-foreground`.
 * WHY:  keeps every page on the same design system as the CivicEvents design.
 * HOW:  the colour values live in css/styles.css as CSS variables; here we
 *       only map Tailwind names → those variables.
 *
 * This file must be loaded right AFTER the Tailwind CDN <script>.
 */
(function () {
  // Helper: turns "--primary" into "oklch(var(--primary) / <alpha-value>)"
  // so opacity modifiers like bg-primary/20 still work.
  function token(name) {
    return "oklch(var(--" + name + ") / <alpha-value>)";
  }

  tailwind.config = {
    theme: {
      extend: {
        fontFamily: {
          sans: ['"Plus Jakarta Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
        },
        colors: {
          background: token("background"),
          foreground: token("foreground"),
          card: { DEFAULT: token("card"), foreground: token("card-foreground") },
          primary: {
            DEFAULT: token("primary"),
            foreground: token("primary-foreground"),
            soft: token("primary-soft"),
          },
          secondary: {
            DEFAULT: token("secondary"),
            foreground: token("secondary-foreground"),
            soft: token("secondary-soft"),
          },
          muted: { DEFAULT: token("muted"), foreground: token("muted-foreground") },
          accent: { DEFAULT: token("accent"), foreground: token("accent-foreground") },
          destructive: {
            DEFAULT: token("destructive"),
            foreground: token("destructive-foreground"),
            soft: token("destructive-soft"),
          },
          success: token("success"),
          warning: token("warning"),
          border: token("border"),
          input: token("input"),
          ring: token("ring"),
          sidebar: {
            DEFAULT: token("sidebar"),
            foreground: token("sidebar-foreground"),
            accent: token("sidebar-accent"),
          },
        },
        borderRadius: {
          lg: "var(--radius)",
          xl: "calc(var(--radius) + 4px)",
          "2xl": "calc(var(--radius) + 8px)",
        },
        boxShadow: {
          card: "0 1px 2px rgb(0 0 0 / 0.04), 0 4px 16px rgb(0 0 0 / 0.04)",
          lift: "0 2px 4px rgb(0 0 0 / 0.05), 0 12px 32px rgb(0 0 0 / 0.08)",
        },
      },
    },
  };
})();
