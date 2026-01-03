import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // Light theme
                'bg-primary': 'var(--bg-primary)',
                'bg-secondary': 'var(--bg-secondary)',
                'bg-tertiary': 'var(--bg-tertiary)',
                'text-primary': 'var(--text-primary)',
                'text-secondary': 'var(--text-secondary)',
                accent: 'var(--accent)',
                success: 'var(--success)',
                warning: 'var(--warning)',
                complete: 'var(--complete)',
                border: 'var(--border)',
            },
            spacing: {
                '1': '4px',
                '2': '8px',
                '3': '12px',
                '4': '16px',
                '6': '24px',
                '8': '32px',
                '12': '48px',
            },
            fontSize: {
                'xs': ['13px', { lineHeight: '1.4' }],
                'sm': ['15px', { lineHeight: '1.4' }],
                'base': ['17px', { lineHeight: '1.4' }],
                'lg': ['22px', { lineHeight: '1.2' }],
                'xl': ['28px', { lineHeight: '1.2' }],
            },
            fontFamily: {
                sans: [
                    '-apple-system',
                    'BlinkMacSystemFont',
                    'Segoe UI',
                    'SF Pro Display',
                    'sans-serif',
                ],
            },
            boxShadow: {
                'soft': '0 2px 8px var(--shadow)',
                'medium': '0 4px 16px var(--shadow)',
            },
            borderRadius: {
                'xl': '12px',
                '2xl': '16px',
            },
            animation: {
                'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
            },
            keyframes: {
                'pulse-soft': {
                    '0%, 100%': { opacity: '0.9', transform: 'scale(1)' },
                    '50%': { opacity: '1', transform: 'scale(1.02)' },
                },
            },
        },
    },
    plugins: [],
};

export default config;
