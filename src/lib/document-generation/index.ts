import { marked } from 'marked';
import puppeteer from 'puppeteer';
import { templates } from './templates';

export async function generateHtmlFromMarkdown(markdown: string, data: Record<string, any>): Promise<string> {
    const populatedMarkdown = Object.entries(data).reduce((acc, [key, value]) => {
        return acc.replace(new RegExp(`\\{[${key}]\\}`, 'g'), value.toString());
    }, markdown);
    return marked(populatedMarkdown);
}

export async function generateDocument(templateId: string, data: Record<string, any>): Promise<string> {
    if (!templates[templateId]) {
        throw new Error(`Template with ID '${templateId}' not found.`);
    }
    const template = templates[templateId];
    return generateHtmlFromMarkdown(template, data);
}

export async function generatePdfFromHtml(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html);
    const pdf = await page.pdf();
    await browser.close();
    return pdf;
}

export async function generatePdfDocument(templateId: string, data: Record<string, any>): Promise<Buffer> {
    const html = await generateDocument(templateId, data);
    return generatePdfFromHtml(html);
}
