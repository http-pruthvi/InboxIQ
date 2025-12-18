
/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Modern dark theme palette
                background: '#0f172a', // Slate 900
                surface: '#1e293b',    // Slate 800
                primary: '#3b82f6',    // Blue 500
                secondary: '#64748b',  // Slate 500
                accent: '#f43f5e',     // Rose 500
                'text-primary': '#f8fafc', // Slate 50
                'text-secondary': '#94a3b8', // Slate 400
            }
        },
    },
    plugins: [],
}
