import { BffApiError } from '@/lib/bff/utils/request-context';

const errorMap: Record<string, { status: number; code: string; message: string }> = {
  unknown_flag: { status: 400, code: 'unknown_flag', message: 'The requested feature flag does not exist.' },
  unknown_module: { status: 400, code: 'unknown_module', message: 'The requested module does not exist.' },
  unsupported_scope: { status: 400, code: 'unsupported_scope', message: 'The selected scope is not supported for this control.' },
  invalid_scope_target: { status: 400, code: 'invalid_scope_target', message: 'The selected scope target is not valid.' },
  invalid_boolean_value: { status: 400, code: 'invalid_boolean_value', message: 'Boolean feature flags must be assigned a boolean value.' },
  invalid_percentage: { status: 400, code: 'invalid_percentage', message: 'Rollout percentage must be an integer between 0 and 100.' },
  invalid_schedule_window: { status: 400, code: 'invalid_schedule_window', message: 'The schedule window is invalid.' },
  reason_required: { status: 400, code: 'reason_required', message: 'A reason is required for this control-plane change.' },
  assignment_not_found: { status: 404, code: 'assignment_not_found', message: 'Feature assignment not found.' },
  rollout_rule_not_found: { status: 404, code: 'rollout_rule_not_found', message: 'Rollout rule not found.' },
  module_rule_not_found: { status: 404, code: 'module_rule_not_found', message: 'Module rule not found.' },
  assignment_version_conflict: { status: 409, code: 'assignment_version_conflict', message: 'The assignment was changed by another operator. Refresh and retry.' },
  rollout_rule_version_conflict: { status: 409, code: 'rollout_rule_version_conflict', message: 'The rollout rule was changed by another operator. Refresh and retry.' },
  module_rule_version_conflict: { status: 409, code: 'module_rule_version_conflict', message: 'The module rule was changed by another operator. Refresh and retry.' },
};

export function toFeatureControlApiError(error: unknown) {
  if (error instanceof BffApiError) return error;
  const key = error instanceof Error ? error.message : '';
  const known = errorMap[key];
  if (!known) return error;
  return new BffApiError(known.code, known.message, known.status, { sourceError: key });
}
