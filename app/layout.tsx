import type { Metadata, Viewport } from 'next';
import './globals.css';

const APP_NAME = 'Cadence';
const APP_DEFAULT_TITLE = 'Cadence - Start Your Tasks';
const APP_TITLE_TEMPLATE = '%s - Cadence';
const APP_DESCRIPTION = 'A process-focused productivity app that celebrates starting tasks over completing them.';

export const metadata: Metadata = {
    applicationName: APP_NAME,
    title: {
        default: APP_DEFAULT_TITLE,
        template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
    manifest: '/manifest.json',
    icons: {
        icon: [
            { url: '/icons/icon-48x48.png', sizes: '48x48', type: 'image/png' },
            { url: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
            { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
        ],
        apple: [
            { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
            { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
        ],
    },
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: APP_NAME,
    },
    formatDetection: {
        telephone: false,
    },
    openGraph: {
        type: 'website',
        siteName: APP_NAME,
        title: {
            default: APP_DEFAULT_TITLE,
            template: APP_TITLE_TEMPLATE,
        },
        description: APP_DESCRIPTION,
    },
    twitter: {
        card: 'summary',
        title: {
            default: APP_DEFAULT_TITLE,
            template: APP_TITLE_TEMPLATE,
        },
        description: APP_DESCRIPTION,
    },
};

export const viewport: Viewport = {
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#EEF2F6' },
        { media: '(prefers-color-scheme: dark)', color: '#0F111A' },
    ],
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="antialiased">
                {children}
            </body>
        </html>
    );
}
