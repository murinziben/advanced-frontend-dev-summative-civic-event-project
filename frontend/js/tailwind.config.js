(function () {
  // Colours live in css/styles.css; reading them here keeps one source of truth and lets opacity modifiers (bg-primary/10) work.
  function token(name) {
    return "rgb(var(--" + name + ") / <alpha-value>)";
  }

  tailwind.config = {
    theme: {
      extend: {
        fontFamily: {
          sans: ['"Inter"', "ui-sans-serif", "system-ui", "sans-serif"],
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
          navy: token("navy"),
          blue: { brand: token("blue") },
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
          xl: "calc(var(--radius) + 2px)",
          "2xl": "calc(var(--radius) + 6px)",
        },
        boxShadow: {
          card: "0 1px 2px rgb(15 23 42 / 0.04), 0 2px 8px rgb(15 23 42 / 0.04)",
          lift: "0 4px 6px rgb(15 23 42 / 0.04), 0 12px 28px rgb(37 99 235 / 0.10)",
        },
      },
    },
  };
})();
