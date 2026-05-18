import path from 'path';
import { app } from 'electron';
import type { SoundScene } from '../../types';

const defaultSounds: Record<SoundScene, string> = {
  confirm: 'confirm.wav',
  error: 'error.wav',
  complete: 'complete.wav',
  message: 'message.wav',
};

const customSounds: Record<string, string> = {};

export function playSound(scene: SoundScene): void {
  // Sound playback implementation
  // For now, just log the scene
  console.log(`Playing sound: ${scene}`);
}

export function setCustomSound(scene: SoundScene, filePath: string): void {
  customSounds[scene] = filePath;
}

export function getSoundPath(scene: SoundScene): string | null {
  if (customSounds[scene]) return customSounds[scene];
  const soundsDir = path.join(app.getPath('userData'), 'sounds');
  return path.join(soundsDir, defaultSounds[scene]);
}
