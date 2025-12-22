export const config = {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    PACKAGE_NAME: process.env.PACKAGE_NAME,
    MENTRAOS_API_KEY: process.env.MENTRAOS_API_KEY,
    BACKEND_URL: process.env.BACKEND_URL,
    PORT: parseInt(process.env.PORT || '3000'),
} as const;