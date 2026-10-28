import React from 'react';
import {
  Flashlight,
  Volume2,
  VolumeX,
  Battery,
  BatteryCharging,
  Vibrate,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { triggerHaptic, setTorch, launchAndroidApp } from '../utils/deviceHardware';
import { DeviceInfoState } from '../types';

interface HardwareSettingsBarProps {
  deviceState: DeviceInfoState;
  onUpdateDeviceState: (updater: (prev: DeviceInfoState) => DeviceInfoState) => void;
  onLogAction: (text: string) => void;
}

export const HardwareSettingsBar: React.FC<HardwareSettingsBarProps> = ({
  deviceState,
  onUpdateDeviceState,
  onLogAction,
}) => {
  const handleToggleTorch = async () => {
    const nextTorch = !deviceState.torchActive;
    await setTorch(nextTorch);
    triggerHaptic([50, 50]);
    onUpdateDeviceState((prev) => ({ ...prev, torchActive: nextTorch }));
    onLogAction(`Flashlight / Torch turned ${nextTorch ? 'ON' : 'OFF'}`);
  };

  const handleToggleMute = () => {
    triggerHaptic([30]);
    onUpdateDeviceState((prev) => ({ ...prev, audioMuted: !prev.audioMuted }));
    onLogAction(`Assistant audio speech ${!deviceState.audioMuted ? 'MUTED' : 'UNMUTED'}`);
  };

  const handleTestVibrate = () => {
    triggerHaptic([150, 100, 200, 100, 300]);
    onLogAction('Hardware haptic feedback pulse dispatched');
  };

  const handleOpenSettings = () => {
    triggerHaptic([50]);
    launchAndroidApp('settings');
    onLogAction('Opened Android System Settings page');
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 mt-2">
      <div className="p-2.5 rounded-xl bg-gray-900/60 border border-cyan-500/20 backdrop-blur-md flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
        {/* Battery Status */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-950 border border-cyan-500/20 text-xs font-mono text-cyan-300 flex-shrink-0">
          {deviceState.isCharging ? (
            <BatteryCharging className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          ) : (
            <Battery className="w-3.5 h-3.5 text-cyan-400" />
          )}
          <span>{deviceState.batteryLevel}%</span>
        </div>

        {/* Torch / Flashlight Toggle */}
        <button
          id="btn-toggle-torch"
          onClick={handleToggleTorch}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono transition-all flex-shrink-0 ${
            deviceState.torchActive
              ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300 shadow-[0_0_10px_rgba(250,204,21,0.4)]'
              : 'bg-gray-950 border-cyan-500/20 text-cyan-400 hover:text-cyan-200'
          }`}
        >
          <Flashlight className={`w-3.5 h-3.5 ${deviceState.torchActive ? 'text-yellow-400 animate-pulse' : ''}`} />
          <span>TORCH: {deviceState.torchActive ? 'ON' : 'OFF'}</span>
        </button>

        {/* Haptic Vibrate Test */}
        <button
          id="btn-test-vibrate"
          onClick={handleTestVibrate}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-950 border border-cyan-500/20 text-xs font-mono text-cyan-400 hover:text-cyan-200 transition-all flex-shrink-0"
        >
          <Vibrate className="w-3.5 h-3.5 text-cyan-400" />
          <span>VIBRATE</span>
        </button>

        {/* Mute/Voice Toggle */}
        <button
          id="btn-toggle-mute"
          onClick={handleToggleMute}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono transition-all flex-shrink-0 ${
            deviceState.audioMuted
              ? 'bg-red-500/20 border-red-400 text-red-300'
              : 'bg-gray-950 border-cyan-500/20 text-cyan-400 hover:text-cyan-200'
          }`}
        >
          {deviceState.audioMuted ? (
            <VolumeX className="w-3.5 h-3.5 text-red-400" />
          ) : (
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
          )}
          <span>{deviceState.audioMuted ? 'MUTED' : 'VOICE ON'}</span>
        </button>

        {/* Android Device Settings */}
        <button
          id="btn-open-android-settings"
          onClick={handleOpenSettings}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-950 border border-cyan-500/20 text-xs font-mono text-cyan-400 hover:text-cyan-200 transition-all flex-shrink-0"
        >
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          <span>SETTINGS</span>
        </button>
      </div>
    </div>
  );
};
