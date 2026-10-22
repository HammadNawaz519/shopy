/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        shopy: {
          bg: "#F4F4F2",
          surface: "#E8E8E8",
          muted: "#BBBFCA",
          dark: "#495464",
          darker: "#363E4B",
          light: "#FAFAF9",
        },
      },
      fontFamily: {
        serif: ["var(--font-cormorant)", "Playfair Display", "Georgia", "serif"],
        sans: ["var(--font-jakarta)", "Inter", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        widest: ".25em",
        editorial: ".15em",
        tightest: "-.04em",
      },
      lineHeight: {
        tightest: "0.75",
        tighter: "0.85",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(0)" },
        },
        slideLeft: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleUp: {
          "0%": { opacity: "0", transform: "scale(0.97) translateY(8px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        toastIn: {
          "0%": { opacity: "0", transform: "translateY(-8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        toastOut: {
          "0%": { opacity: "1", transform: "translateY(0)" },
          "100%": { opacity: "0", transform: "translateY(-8px)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in": "fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        scaleUp: "scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        slideDown: "slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        slideLeft: "slideLeft 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        slideUp: "slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-up": "slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "toast-in": "toastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both",
        "toast-out": "toastOut 0.25s ease-in both",
      },
    },
  },
  plugins: [],
};
