
/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Professional Zinc-based dark theme
                background: '#09090b', // Zinc 950
                surface: '#18181b',    // Zinc 900
                'surface-highlight': '#27272a', // Zinc 800
                primary: '#6366f1',    // Indigo 500
                'primary-foreground': '#eef2ff', // Indigo 50
                secondary: '#71717a',  // Zinc 500
                'secondary-foreground': '#fafafa', // Zinc 50
                accent: '#f43f5e',     // Rose 500 (kept for critical alerts)
                destructive: '#ef4444', // Red 500
                'text-primary': '#fafafa', // Zinc 50
                'text-secondary': '#a1a1aa', // Zinc 400
                border: '#27272a',     // Zinc 800 - Subtle borders
            },
            fontFamily: {
                sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
            },
            container: {
                center: true,
                padding: "2rem",
                screens: {
                    "2xl": "1400px",
                },
            },
        },
    },
    plugins: [],
}
