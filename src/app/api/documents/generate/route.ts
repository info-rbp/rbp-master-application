import { NextRequest, NextResponse } from 'next/server';
import { generateHtmlFromMarkdown } from '@/lib/document-generation';
import { DocumentGenerationOptions } from '@/lib/document-generation/types';

export async function POST(req: NextRequest) {
    const { templateId, data } = await req.json() as DocumentGenerationOptions;

    if (!templateId || !data) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // In a real application, you would fetch the template from a database
    // and use a more sophisticated templating engine.
    // For this example, we'll use a simple markdown template.
    const markdown = `# ${data.title}\n\n${data.content}`;

    try {
        const html = await generateHtmlFromMarkdown(markdown);
        // In a real application, you would save the HTML to a file
        // and return a URL to the file.
        // For this example, we'll just return the HTML.
        return NextResponse.json({ html });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to generate document' }, { status: 500 });
    }
}
