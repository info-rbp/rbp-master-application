import { CompanySettings } from './types';

const settings: CompanySettings = {
    name: 'My Company',
    logo: 'https://example.com/logo.png',
    contact: {
        email: 'contact@my-company.com',
        phone: '123-456-7890',
    },
};

export async function getCompanySettings(): Promise<CompanySettings> {
    return settings;
}

export async function updateCompanySettings(newSettings: Partial<CompanySettings>): Promise<CompanySettings> {
    Object.assign(settings, newSettings);
    return settings;
}
