import { getCalibrationProfile, applyPhoneticCorrection } from './voiceCalibration';

/**
 * Gemini-Powered Voice Command Cheat Sheet Parser
 * Takes spoken text in Hindi, English, or Hinglish, maps to available commands,
 * and updates the Cheat Sheet UI in real-time.
 */

export interface VoiceCommandResult {
  command:
    | 'home'
    | 'play_music'
    | 'stop_music'
    | 'dark_mode'
    | 'lock_phone'
    | 'unlock_phone'
    | 'power_button_assist'
    | string;
  status: 'success' | 'failed';
  reply?: string;
}

/**
 * UI अपडेट करने का फंक्शन
 * Updates the Voice Command Cheat Sheet UI with live status classes and events
 * @param command - The matched command string
 * @param status - "success" or "failed"
 */
export function updateCheatSheetUI(command: string, status: string): void {
  if (typeof document === 'undefined') return;
  if (status === 'success') {
    console.log(`UI Update: Command [${command}] is now SUCCESS`);

    // Target the specific command element in the DOM if present
    const el = document.getElementById(command) || document.getElementById(`cheat-sheet-cmd-${command}`);
    if (el) {
      el.classList.add('status-success');
      el.classList.remove('status-failed');
      setTimeout(() => {
        el.classList.remove('status-success');
      }, 5000);
    }
  } else {
    console.log('UI Update: Command not recognized - FAILED');

    if (command && command !== 'unknown') {
      const el = document.getElementById(command) || document.getElementById(`cheat-sheet-cmd-${command}`);
      if (el) {
        el.classList.add('status-failed');
        setTimeout(() => {
          el.classList.remove('status-failed');
        }, 3000);
      }
    }
  }

  // Dispatch broadcast event for React components and overlays
  try {
    window.dispatchEvent(
      new CustomEvent('jarvis:cheat-sheet-update', {
        detail: { command, status, timestamp: Date.now() },
      })
    );
  } catch {}
}

/**
 * यूजर की आवाज़ (Text) को प्रोसेस करके सही कमांड और उसका स्टेटस निकालने का फंक्शन
 * Communicates with server-side Gemini model with accent calibration support
 * @param userVoiceInput - यूजर द्वारा बोला गया टेक्स्ट
 */
export async function processVoiceCommand(userVoiceInput: string): Promise<VoiceCommandResult> {
  try {
    if (!userVoiceInput || !userVoiceInput.trim()) {
      const emptyResult: VoiceCommandResult = { command: 'unknown', status: 'failed' };
      updateCheatSheetUI(emptyResult.command, emptyResult.status);
      return emptyResult;
    }

    // Apply client-side phonetic accent correction first
    const accentProfile = getCalibrationProfile();
    const phoneticResult = applyPhoneticCorrection(userVoiceInput, accentProfile);
    const normalizedInput = phoneticResult.correctedText;

    const response = await fetch('/api/voice/process-command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userVoiceInput: normalizedInput,
        rawVoiceInput: userVoiceInput,
        accentProfile: accentProfile?.isActive ? accentProfile : undefined,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result: VoiceCommandResult = await response.json();
    console.log('Processed Result:', result);

    // यहाँ से आप अपने UI (Cheat Sheet Overlay) का स्टेटस अपडेट कर सकते हैं
    updateCheatSheetUI(result.command, result.status);

    return result;
  } catch (error) {
    console.error('Error processing command with Gemini:', error);
    const failResult: VoiceCommandResult = { command: 'unknown', status: 'failed' };
    updateCheatSheetUI(failResult.command, failResult.status);
    return failResult;
  }
}

// Global browser window attachment for console testing & developer access
if (typeof window !== 'undefined') {
  (window as any).processVoiceCommand = processVoiceCommand;
  (window as any).updateCheatSheetUI = updateCheatSheetUI;
}
