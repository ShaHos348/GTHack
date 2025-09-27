/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#ffffff",
        foreground: "#1c1c1c",
        card: "#ffffff",
        "card-foreground": "#1c1c1c",
        primary: "#3b82f6",
        "primary-foreground": "#ffffff",
        secondary: "#6b7280",
        "secondary-foreground": "#ffffff",
        muted: "#f3f4f6",
        "muted-foreground": "#6b7280",
        destructive: "#ef4444",
        border: "#e5e7eb",
        input: "#f9fafb",
        ring: "#3b82f6",
      },
      borderRadius: {
        sm: "0.375rem",
        md: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
      },
    },
  },
  plugins: [],
};
