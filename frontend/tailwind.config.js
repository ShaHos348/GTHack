/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#F2F2F2",
        foreground: "#1c1c1c",
        card: "#ffffff",
        "card-foreground": "#1c1c1c",
        primary: "#8000FF",
        "primary-foreground": "#ffffff",
        secondary: "#6b7280",
        "secondary-foreground": "#ffffff",
        muted: "#f3f4f6",
        "muted-foreground": "#6b7280",
        destructive: "#ef4444",
        border: "#7F00FF",
        input: "#f9fafb",
        ring: "#3b82f6",
      },
      borderRadius: {
        sm: "0.375rem",
        md: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
      },
      fontFamily: {
        sans: ['"Nunito Sans"', "ui-sans-serif", "system-ui"],
      },
    },
  },
  plugins: [],
};
