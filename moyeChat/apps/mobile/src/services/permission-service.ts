export type PermissionName = 'camera' | 'microphone' | 'photo-library';

export interface PermissionResult {
  granted: boolean;
  reason?: string;
}

export async function ensurePermission(name: PermissionName): Promise<PermissionResult> {
  return {
    granted: false,
    reason: `${name} permission is not wired yet.`
  };
}
