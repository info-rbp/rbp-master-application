import { ACTION_POLICIES } from './action-policies';
import { listCapabilityFamilies } from './capabilities';
import { ROUTE_POLICIES } from './route-policies';
import { SUB_FEATURES } from './sub-features';
import { listModuleDefinitions } from '@/lib/platform/bootstrap';

export function validateAccessDefinitions() {
  const capabilities = new Set(Object.keys(listCapabilityFamilies()));
  const modules = new Set(listModuleDefinitions().map((module) => module.key));
  const errors: string[] = [];

  const validateRef = (owner: string, capabilityList: string[], moduleKey?: string) => {
    for (const capability of capabilityList) {
      if (!capabilities.has(capability)) errors.push(`${owner} references unknown capability ${capability}`);
    }
    if (moduleKey && !modules.has(moduleKey)) errors.push(`${owner} references unknown module ${moduleKey}`);
  };

  for (const policy of ROUTE_POLICIES) validateRef(`route:${policy.id}`, policy.requiredCapabilities, policy.moduleKey);
  for (const policy of ACTION_POLICIES) validateRef(`action:${policy.id}`, policy.requiredCapabilities, policy.moduleKey);
  for (const feature of SUB_FEATURES) validateRef(`subfeature:${feature.key}`, feature.requiredCapabilities, feature.moduleKey);

  const routeIds = new Set<string>();
  for (const policy of ROUTE_POLICIES) {
    if (routeIds.has(policy.id)) errors.push(`duplicate route policy id ${policy.id}`);
    routeIds.add(policy.id);
  }

  const actionKeys = new Set<string>();
  for (const policy of ACTION_POLICIES) {
    if (actionKeys.has(policy.actionKey)) errors.push(`duplicate action policy key ${policy.actionKey}`);
    actionKeys.add(policy.actionKey);
  }

  return { valid: errors.length === 0, errors };
}

export function assertAccessDefinitions() {
  const result = validateAccessDefinitions();
  if (!result.valid) throw new Error(`invalid_access_definitions:${result.errors.join('; ')}`);
  return result;
}
