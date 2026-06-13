import { contextBridge, ipcRenderer } from 'electron';

/**
 * Exposes a single `window.api.invoke(channel, args)` method to the renderer.
 * All IPC goes through this one typed gateway — no direct ipcRenderer access.
 */
contextBridge.exposeInMainWorld('api', {
  invoke: (channel: string, args?: unknown): Promise<{ ok: boolean; data?: unknown; error?: string }> =>
    ipcRenderer.invoke(channel, args),
});
