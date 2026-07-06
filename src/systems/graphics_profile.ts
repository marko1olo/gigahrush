import { lightGraphicsEnabled } from './ui_orchestrator';

export const GRAPHICS_PROFILE = {
    get isMobile(): boolean {
        return (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) || (typeof window !== 'undefined' && window.innerWidth < 1024);
    },
    get useComplexFog(): boolean {
        return !lightGraphicsEnabled();
    },
    get maxParticles(): number {
        if (lightGraphicsEnabled()) return 100;
        return 256;
    },
    get maxSurfaceMarks(): number {
        if (lightGraphicsEnabled()) return 10;
        return 48;
    }
};
