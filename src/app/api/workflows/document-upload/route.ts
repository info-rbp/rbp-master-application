import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getBffRequestContext } from '@/lib/bff/utils/request-context';
import { ok, fail } from '@/lib/bff/utils/http';
import { DocumentUploadWorkflowService } from '@/lib/workflows/services/document-upload-workflow-service';
import { WorkflowError } from '@/lib/workflows/utils/errors';

const schema = z.object({ ownerEntityType: z.enum(['application', 'customer', 'loan', 'support_ticket']), ownerEntityId: z.string().min(1), documentType: z.string().min(1), storageReference: z.string().min(1), fileName: z.string().min(1), classificationHints: z.array(z.string()).optional(), idempotencyKey: z.string().min(1).optional() });
const service = new DocumentUploadWorkflowService();

export async function POST(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();
  try {
    const context = await getBffRequestContext(request);
    const body = schema.parse(await request.json());
    const data = await service.registerUpload(context, body);
    return ok(data, correlationId, data.warnings);
  } catch (error) {
    return fail(error instanceof z.ZodError ? new WorkflowError({ code: 'invalid_request', message: 'Invalid document upload payload.', status: 400, category: 'validation_failure', details: { issues: error.issues } }) : error, correlationId);
  }
}
