import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default ({ mode }) => {
    // Ensure that variables from Vite's .env files are loaded
    // process.env = { ...process.env, ...loadEnv(mode, process.cwd(), '') };
    // const { DT_PUBLISH_PROTOTYPE_PROJECT_ID } = process.env;

    //const base = mode === 'production' ? `/apps/6556ac2782f1945f9e66d7e0` : '/';
    // const base = mode === 'production' ? `/apps/jelbom-playground/` : '/';
    const base = mode === 'production' ? `/` : '/';

    return defineConfig({
        base,
        plugins: [react()],
        server: {
            host: '0.0.0.0',
            port: 8081,
        },
    });
};
