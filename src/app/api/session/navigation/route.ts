import { NextResponse } from 'next/server';
import { resolveSessionResponse } from '@/lib/platform/session';
import { createNavigationContextFromSession } from '@/lib/platform/navigation-context';
import { buildAdminNavigation, buildPrimaryNavigation, buildPublicNavigation, buildUserMenuNavigation, buildWorkspaceNavigation } from '@/lib/platform/navigation-builder';

export async function GET() {
  const response = await resolveSessionResponse();
  const context = createNavigationContextFromSession(response.authenticated ? response.session : null);

  return NextResponse.json({
    authenticated: response.authenticated,
    navigation: {
      public: buildPublicNavigation(context),
      primary: buildPrimaryNavigation(context),
      workspace: buildWorkspaceNavigation(context),
      admin: buildAdminNavigation(context),
      userMenu: buildUserMenuNavigation(context),
    },
  });
}
