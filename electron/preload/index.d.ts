export interface ElectronAPI {
  invoke(channel: string, args?: unknown): Promise<{ ok: boolean; data?: unknown; error?: string }>;
}

declare global {
  interface Window {
    api: ElectronAPI;
  }
}
