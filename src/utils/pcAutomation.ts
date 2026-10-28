// PC Control & Automation Engine for Jarvis / Myraa
// Supports: Virtual OS Desktop Simulation + Local Hardware PC Bridge via WebSocket

export interface PcActionStep {
  id: string;
  stepNumber: number;
  action: string;
  details: string;
  status: 'pending' | 'running' | 'done';
  timestamp: number;
}

export interface AppDefinition {
  key: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  matchKeywords: string[];
  externalUrl?: string;
  defaultTitle?: string;
}

export interface VirtualWindow {
  id: string;
  appKey: string;
  title: string;
  icon: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  query?: string;
  activeUrl?: string;
  terminalHistory?: string[];
  notepadText?: string;
  androidLauncher?: {
    id: string;
    appId: string;
    name: string;
    packageName: string;
    icon: string;
    category: string;
    deepLinkUrl?: string;
  };
}

export interface CursorPosition {
  x: number;
  y: number;
  isClicking: boolean;
  targetName?: string;
}

// Complete Catalog of Real PC Apps & System Utilities
export const PC_APPS_CATALOG: AppDefinition[] = [
  {
    key: 'youtube',
    name: 'YouTube Desktop',
    category: 'Entertainment',
    icon: '▶️',
    description: 'Video streaming, music, 4K clips, channels & live feeds',
    matchKeywords: ['youtube', 'यूट्यूब', 'यूटयूब', 'yt', 'video', 'chalao', 'video chalao', 'gaana', 'gana'],
    externalUrl: 'https://www.youtube.com',
    defaultTitle: 'YouTube',
  },
  {
    key: 'discord',
    name: 'Discord',
    category: 'Communication',
    icon: '💬',
    description: 'Voice chat, gaming communities & friend messaging',
    matchKeywords: ['discord', 'डिसकॉर्ड', 'chat', 'gaming call'],
    externalUrl: 'https://discord.com/app',
    defaultTitle: 'Discord - General Voice & Chat',
  },
  {
    key: 'spotify',
    name: 'Spotify Music',
    category: 'Audio',
    icon: '🎵',
    description: 'Music streaming, podcasts & personalized playlists',
    matchKeywords: ['spotify', 'स्पॉटिफ़ाई', 'music', 'song', 'songs', 'gaane', 'playlist'],
    externalUrl: 'https://open.spotify.com',
    defaultTitle: 'Spotify Free',
  },
  {
    key: 'chrome',
    name: 'Google Chrome',
    category: 'Browser',
    icon: '🌐',
    description: 'Fast modern web browsing, tabs & web apps',
    matchKeywords: ['chrome', 'google', 'browser', 'web', 'internet', 'search', 'ब्राउज़र', 'गूगल'],
    externalUrl: 'https://www.google.com',
    defaultTitle: 'New Tab - Google Chrome',
  },
  {
    key: 'vscode',
    name: 'Visual Studio Code',
    category: 'Development',
    icon: '💻',
    description: 'Code editor, extensions, terminal & debugging environment',
    matchKeywords: ['vscode', 'code', 'vs code', 'editor', 'coding', 'विजुअल स्टूडियो'],
    externalUrl: 'https://vscode.dev',
    defaultTitle: 'Visual Studio Code - Workspace',
  },
  {
    key: 'terminal',
    name: 'Windows Terminal / PowerShell',
    category: 'System',
    icon: '⚡',
    description: 'Command line interface, scripts & system diagnostics',
    matchKeywords: ['terminal', 'cmd', 'command prompt', 'powershell', 'कमांड प्रॉम्ट', 'टर्मिनल'],
    defaultTitle: 'Windows PowerShell (Administrator)',
  },
  {
    key: 'notepad',
    name: 'Notepad',
    category: 'Productivity',
    icon: '📝',
    description: 'Plain text note taking, quick ideas & script scratchpad',
    matchKeywords: ['notepad', 'notes', 'note', 'text', 'नोटपैड', 'लिखो'],
    defaultTitle: 'Untitled - Notepad',
  },
  {
    key: 'explorer',
    name: 'File Explorer',
    category: 'System',
    icon: '📁',
    description: 'Browse local drives (C:, D:), downloads & documents',
    matchKeywords: ['file', 'files', 'explorer', 'folder', 'folder kholo', 'फाइल एक्सप्लोरर'],
    defaultTitle: 'File Explorer - Quick Access',
  },
  {
    key: 'excel',
    name: 'Microsoft Excel',
    category: 'Productivity',
    icon: '📊',
    description: 'Spreadsheets, formulas (AutoSum Alt+=, Flash Fill Ctrl+E), charts & data analytics',
    matchKeywords: ['excel', 'एक्सेल', 'ms excel', 'spreadsheet', 'sheet', 'sheets', 'workbook', 'office'],
    externalUrl: 'https://excel.new',
    defaultTitle: 'Microsoft Excel - WorkBook1.xlsx',
  },
  {
    key: 'calculator',
    name: 'Calculator',
    category: 'Utilities',
    icon: '🔢',
    description: 'Standard, scientific & programmer calculations',
    matchKeywords: ['calculator', 'calc', 'math', 'हिसाब', 'कैलकुलेटर'],
    defaultTitle: 'Calculator - Standard',
  },
  {
    key: 'settings',
    name: 'Windows Settings',
    category: 'System',
    icon: '⚙️',
    description: 'Display, sound, network, personalization & privacy',
    matchKeywords: ['settings', 'setting', 'control panel', 'सेटिंग्स', 'सेटिंग'],
    defaultTitle: 'Settings - System & Hardware',
  },
  {
    key: 'steam',
    name: 'Steam',
    category: 'Gaming',
    icon: '🎮',
    description: 'PC game library, store, downloads & friends activity',
    matchKeywords: ['steam', 'games', 'game', 'स्टीम', 'गेम'],
    externalUrl: 'https://store.steampowered.com',
    defaultTitle: 'Steam - Store & Library',
  },
  {
    key: 'whatsapp',
    name: 'WhatsApp Desktop',
    category: 'Communication',
    icon: '🟢',
    description: 'End-to-end encrypted messaging & calls on PC',
    matchKeywords: ['whatsapp', 'wa', 'व्हाट्सएप', 'मैसेज'],
    externalUrl: 'https://web.whatsapp.com',
    defaultTitle: 'WhatsApp Web Desktop',
  },
];

// Helper: Match natural language prompt to best app in catalog
export function findBestAppMatch(query: string): AppDefinition | null {
  const clean = (query || '').toLowerCase().trim();
  if (!clean) return null;

  // Direct exact/substring check
  for (const app of PC_APPS_CATALOG) {
    for (const kw of app.matchKeywords) {
      if (clean.includes(kw) || kw.includes(clean)) {
        return app;
      }
    }
  }

  // Word token overlap scoring
  const words = clean.split(/\s+/).filter(w => w.length >= 2);
  let bestScore = 0;
  let bestMatch: AppDefinition | null = null;

  for (const app of PC_APPS_CATALOG) {
    let score = 0;
    for (const word of words) {
      if (app.name.toLowerCase().includes(word)) score += 3;
      for (const kw of app.matchKeywords) {
        if (kw.includes(word) || word.includes(kw)) score += 2;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = app;
    }
  }

  return bestScore >= 2 ? bestMatch : null;
}

// Real PC Hardware Python Bridge Script template (Zero-dependency, ready to copy & run)
export const REAL_PC_PYTHON_BRIDGE_CODE = `# ====================================================================
# J.A.R.V.I.S. & MYRAA - REAL PC HARDWARE CONTROLLER DAEMON
# ====================================================================
# This script runs on your Windows / Mac / Linux PC and connects
# directly to the Jarvis / Myraa Web App via local WebSocket!
#
# Requirements:
#   pip install pyautogui websockets asyncio
#
# Run:
#   python jarvis_pc_daemon.py
#
# Jarvis will now physically move your mouse, press the Windows key,
# type search queries, click actual apps, and control volume!
# ====================================================================

import asyncio
import json
import os
import subprocess
import sys
import time

try:
    import pyautogui
    pyautogui.FAILSAFE = True
    pyautogui.PAUSE = 0.05
except ImportError:
    print("[!] Error: pyautogui not installed. Run: pip install pyautogui")
    sys.exit(1)

try:
    import websockets
except ImportError:
    print("[!] Error: websockets not installed. Run: pip install websockets")
    sys.exit(1)

PORT = 9123
HOST = "127.0.0.1"

print("=" * 65)
print("  🚀 JARVIS / MYRAA HARDWARE PC CONTROLLER DAEMON ACTIVE")
print(f"  Listening on ws://{HOST}:{PORT}")
print("  Press Ctrl+C to terminate at any time.")
print("=" * 65)

async def handle_client(websocket):
    print(f"[+] Jarvis Web App Connected to Hardware Bridge!")
    await websocket.send(json.dumps({
        "type": "STATUS",
        "connected": True,
        "message": "Physical PC Hardware Bridge Online! Ready for commands."
    }))

    try:
        async for raw_message in websocket:
            try:
                data = json.loads(raw_message)
                action = data.get("action")
                payload = data.get("payload", {})
                print(f"[EXEC] Action: {action} | Payload: {payload}")

                if action == "OPEN_APP_VIA_SEARCH":
                    app_name = payload.get("appName", "")
                    query = payload.get("query", "")
                    # 1. Press Windows Key
                    pyautogui.press("win")
                    time.sleep(0.35)
                    # 2. Type App Name
                    pyautogui.write(app_name, interval=0.04)
                    time.sleep(0.4)
                    # 3. Press Enter to launch best match
                    pyautogui.press("enter")
                    time.sleep(1.2)
                    # 4. If query specified, type it into the app
                    if query:
                        time.sleep(0.8)
                        pyautogui.write(query, interval=0.04)
                        pyautogui.press("enter")

                elif action == "PRESS_WIN_KEY":
                    pyautogui.press("win")

                elif action == "TYPE_TEXT":
                    text = payload.get("text", "")
                    pyautogui.write(text, interval=0.03)

                elif action == "PRESS_KEY":
                    key = payload.get("key", "enter")
                    pyautogui.press(key)

                elif action == "HOTKEY":
                    keys = payload.get("keys", [])
                    if isinstance(keys, str):
                        keys = keys.split("+")
                    pyautogui.hotkey(*[k.strip() for k in keys])

                elif action == "MOVE_MOUSE":
                    x = payload.get("x", 500)
                    y = payload.get("y", 500)
                    pyautogui.moveTo(x, y, duration=0.3)

                elif action == "CLICK":
                    btn = payload.get("button", "left")
                    pyautogui.click(button=btn)

                elif action == "VOLUME_UP":
                    for _ in range(5):
                        pyautogui.press("volumeup")

                elif action == "VOLUME_DOWN":
                    for _ in range(5):
                        pyautogui.press("volumedown")

                elif action == "MUTE":
                    pyautogui.press("volumemute")

                elif action == "LOCK_PC":
                    if sys.platform == "win32":
                        os.system("rundll32.exe user32.dll,LockWorkStation")
                    else:
                        pyautogui.hotkey("ctrl", "cmd", "q")

                elif action == "SHOW_DESKTOP":
                    pyautogui.hotkey("win", "d")

                elif action == "SCREENSHOT":
                    pyautogui.hotkey("win", "prtsc")

                # Acknowledge execution back to Web App
                await websocket.send(json.dumps({
                    "type": "ACTION_COMPLETE",
                    "action": action,
                    "success": True
                }))

            except Exception as e:
                print(f"[!] Error executing action: {e}")
                await websocket.send(json.dumps({
                    "type": "ACTION_ERROR",
                    "error": str(e)
                }))

    except websockets.exceptions.ConnectionClosed:
        print("[-] Jarvis Web App Disconnected.")

async def main():
    async with websockets.serve(handle_client, HOST, PORT):
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\\n[!] Controller stopped by user. Goodbye!")
`;
