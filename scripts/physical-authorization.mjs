import { readFile } from 'node:fs/promises';

export const authorizationStatement =
  'I authorize only this owned isolated test environment and operator for the stated scope and origin. No shared Safari sessions, device pairing, driver/OS changes, external production access or audible sound are authorized.';

export async function readAuthorization(path, scope, origin) {
  if (!path)
    throw new Error(
      `BLOCKED: missing explicit owned-environment authorization for ${scope}.`,
    );
  const value = JSON.parse(await readFile(path, 'utf8'));
  if (
    value.schemaVersion !== 1 ||
    value.scope !== scope ||
    value.origin !== origin ||
    value.ownedEnvironment !== true ||
    value.isolatedSession !== true ||
    value.noAudibleOutput !== true ||
    value.statement !== authorizationStatement ||
    typeof value.operator !== 'string' ||
    !value.operator.trim() ||
    typeof value.signedName !== 'string' ||
    !value.signedName.trim() ||
    !Number.isFinite(Date.parse(value.signedAt)) ||
    Date.parse(value.signedAt) > Date.now()
  )
    throw new Error(
      `BLOCKED: incomplete explicit ${scope} authorization. Do not change shared Safari/OS/driver settings.`,
    );
  return {
    operator: value.operator,
    signedName: value.signedName,
    signedAt: value.signedAt,
    scope,
    origin,
    trustBoundary:
      'Explicit human authorization, not machine proof of ownership.',
  };
}
