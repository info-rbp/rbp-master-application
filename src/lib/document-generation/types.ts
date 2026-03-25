export interface DocumentGenerationOptions {
    templateId: string;
    data: Record<string, any>;
}

export interface DocumentGenerationResult {
    success: boolean;
    url?: string;
    error?: string;
}
