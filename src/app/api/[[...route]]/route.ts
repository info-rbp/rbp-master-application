import { NextResponse } from 'next/server';

const disabledResponse = () =>
  NextResponse.json(
    {
      error:
        'Genkit API routes are disabled because genkit@1.30.1 does not export the legacy nextJsApiHandler integration.',
    },
    { status: 404 },
  );

export const GET = disabledResponse;
export const POST = disabledResponse;
