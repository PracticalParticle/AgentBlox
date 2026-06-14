/** Client-side Dynamic environment id (Vite exposes VITE_* only). */
export function getDynamicEnvironmentId(): string {
  return (import.meta.env.VITE_DYNAMIC_ENVIRONMENT_ID || '').trim();
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isDynamicEnvironmentConfigured(): boolean {
  const id = getDynamicEnvironmentId();
  return id.length > 0 && UUID_RE.test(id);
}
