import { Click } from './types';

const clicks: Click[] = [];

export async function trackClick(data: Omit<Click, 'id' | 'timestamp'>): Promise<Click> {
    const click: Click = {
        id: String(clicks.length + 1),
        timestamp: new Date(),
        ...data,
    };
    clicks.push(click);
    return click;
}

export async function getClicks(): Promise<Click[]> {
    return clicks;
}
