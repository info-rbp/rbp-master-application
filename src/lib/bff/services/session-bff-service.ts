import { resolveSessionResponse } from '@/lib/platform/session';
import { toSessionDto, type SessionDto } from '@/lib/bff/dto/common';

export class SessionBffService {
  async getSession(): Promise<SessionDto> {
    const response = await resolveSessionResponse();
    return toSessionDto(response.authenticated ? response.session : null);
  }
}
