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
                'bg-primary': 'var(--bg-primary)',
                'bg-secondary': 'var(--bg-secondary)',
                'bg-tertiary': 'var(--bg-tertiary)',
                'text-primary': 'var(--text-primary)',
                'text-secondary': 'var(--text-secondary)',
                'text-tertiary': 'var(--text-tertiary)',
                accent: 'var(--accent)',
                'accent-hover': 'var(--accent-hover)',
                'accent-subtle': 'var(--accent-subtle)',
                'on-accent': 'var(--on-accent)',
                secondary: 'var(--secondary)',
                // Semantic status
                started: 'var(--started)',
                'started-bg': 'var(--started-bg)',
                paused: 'var(--paused)',
                'paused-bg': 'var(--paused-bg)',
                done: 'var(--done)',
                'done-bg': 'var(--done-bg)',
                danger: 'var(--danger)',
                'danger-bg': 'var(--danger-bg)',
                priority: 'var(--priority)',
                'priority-bg': 'var(--priority-bg)',
                // Back-compat semantic aliases
                success: 'var(--success)',
                warning: 'var(--warning)',
                complete: 'var(--complete)',
                // Lines
                border: 'var(--border)',
                'border-strong': 'var(--border-strong)',
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
                'xs': ['12px', { lineHeight: '1.4' }],
                'sm': ['13px', { lineHeight: '1.45' }],
                'base': ['15px', { lineHeight: '1.5' }],
                'lg': ['20px', { lineHeight: '1.25' }],
                'xl': ['27px', { lineHeight: '1.15' }],
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
                'elev-1': 'var(--elev-1)',
                'elev-2': 'var(--elev-2)',
                'elev-3': 'var(--elev-3)',
                'elev-4': 'var(--elev-4)',
                // Back-compat
                'soft': 'var(--elev-1)',
                'elevated': 'var(--elev-2)',
                'medium': 'var(--elev-2)',
            },
            borderRadius: {
                'sm': 'var(--r-sm)',
                'md': 'var(--r-md)',
                'lg': 'var(--r-lg)',
                'xl': '12px',
                '2xl': '16px',
                '3xl': '20px',
                '4xl': 'var(--r-xl)',
                'full': '9999px',
            },
            transitionTimingFunction: {
                cad: 'cubic-bezier(0.22, 1, 0.36, 1)',
            },
            backdropBlur: {
                glass: 'var(--glass-blur)',
            },
            animation: {
                'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
                'cad-spin': 'cad-spin .8s linear infinite',
                'cad-fadeup': 'cad-fadeup .35s var(--ease) both',
                'cad-pop': 'cad-pop .16s var(--ease) both',
                'cad-glow': 'cad-glow 1.6s ease-in-out infinite',
                'cad-live': 'cad-live 1.4s ease-in-out infinite',
                'cad-hand': 'cad-spin 2.8s linear infinite',
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
