import React, { useState } from 'react';
import { PlayerSettings, SubtitleConfig, MediaItem } from '../types';
import { buildEmbedUrl } from '../utils/embedUrl';
import { useAuth } from '../context/AuthContext';
import { X, Plus, Trash2, Sliders, ExternalLink, Check, Copy, Cloud } from 'lucide-react';

interface PlayerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PlayerSettings;
  onSaveSettings: (settings: PlayerSettings) => void;
  currentMedia: MediaItem;
}

export const PlayerSettingsModal: React.FC<PlayerSettingsModalProps> = ({
  isOpen,
  onClose,
  settings: initialSettings,
  onSaveSettings,
  currentMedia,
}) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PlayerSettings>(initialSettings);
  const [newSubUrl, setNewSubUrl] = useState('');
  const [newSubLabel, setNewSubLabel] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleAddSubtitle = () => {
    if (!newSubUrl.trim()) return;
    const newSub: SubtitleConfig = {
      url: newSubUrl.trim(),
      label: newSubLabel.trim() || `Subtitle ${settings.subtitles.length + 1}`,
    };
    setSettings((prev) => ({
      ...prev,
      subtitles: [...prev.subtitles, newSub],
    }));
    setNewSubUrl('');
    setNewSubLabel('');
  };

  const handleRemoveSubtitle = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      subtitles: prev.subtitles.filter((_, i) => i !== index),
    }));
  };

  const handleSave = () => {
    onSaveSettings(settings);
    onClose();
  };

  const currentEmbedUrl = buildEmbedUrl(currentMedia, settings);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(currentEmbedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="player_settings_modal_backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="player_settings_modal_content"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-zinc-100">
              EmbedMaster Configuration
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cloud Sync State */}
        <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-[11px]">
          <div className="flex items-center gap-1.5 text-zinc-300">
            <Cloud className={`w-3.5 h-3.5 ${user ? 'text-emerald-400' : 'text-zinc-500'}`} />
            <span className="truncate max-w-[280px]">
              {user ? `Firebase Cloud Sync: Active (${user.email})` : 'Firebase Cloud Sync: Standby (Sign in to sync across devices)'}
            </span>
          </div>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${user ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-400'}`}>
            {user ? 'CLOUD_ENABLED' : 'LOCAL_ONLY'}
          </span>
        </div>

        {/* Form controls */}
        <div className="space-y-4">
          {/* Player Skin selection */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Player Skin
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSettings((s) => ({ ...s, skin: 'onyx' }))}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  settings.skin === 'onyx'
                    ? 'bg-indigo-950/60 border-indigo-500/80 text-white'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-850'
                }`}
              >
                <div className="text-xs font-bold text-zinc-100">Onyx Skin</div>
                <div className="text-[11px] text-zinc-400 mt-0.5">
                  Dark and flat, YouTube-style context menus
                </div>
              </button>
              <button
                type="button"
                onClick={() => setSettings((s) => ({ ...s, skin: 'aurora' }))}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  settings.skin === 'aurora'
                    ? 'bg-indigo-950/60 border-indigo-500/80 text-white'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-850'
                }`}
              >
                <div className="text-xs font-bold text-zinc-100">Aurora Skin</div>
                <div className="text-[11px] text-zinc-400 mt-0.5">
                  Colorful, menus open as modal windows
                </div>
              </button>
            </div>
          </div>

          {/* Welcome Page & Autoplay */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Welcome Page
              </label>
              <div className="flex rounded-xl bg-zinc-900 p-1 border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setSettings((s) => ({ ...s, welcomePage: 'off' }))}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                    settings.welcomePage === 'off'
                      ? 'bg-zinc-800 text-white shadow'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Off
                </button>
                <button
                  type="button"
                  onClick={() => setSettings((s) => ({ ...s, welcomePage: 'on' }))}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                    settings.welcomePage === 'on'
                      ? 'bg-zinc-800 text-white shadow'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  On
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Autoplay
              </label>
              <div className="flex rounded-xl bg-zinc-900 p-1 border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setSettings((s) => ({ ...s, autoplay: 'off' }))}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                    settings.autoplay === 'off'
                      ? 'bg-zinc-800 text-white shadow'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Off
                </button>
                <button
                  type="button"
                  onClick={() => setSettings((s) => ({ ...s, autoplay: 'on' }))}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                    settings.autoplay === 'on'
                      ? 'bg-zinc-800 text-white shadow'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  On
                </button>
              </div>
            </div>
          </div>

          {/* Subtitles Manager */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Custom Subtitles (sub_url[] & sub_label[])
              </label>
              <span className="text-[10px] text-zinc-500">CORS * required</span>
            </div>

            <div className="space-y-2 mb-2">
              {settings.subtitles.map((sub, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-semibold text-zinc-200">{sub.label}: </span>
                    <span className="text-zinc-400 font-mono truncate">{sub.url}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveSubtitle(idx)}
                    className="p-1 text-zinc-500 hover:text-red-400 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              <input
                type="text"
                placeholder="Label (e.g. English VTT)"
                value={newSubLabel}
                onChange={(e) => setNewSubLabel(e.target.value)}
                className="sm:col-span-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
              />
              <input
                type="url"
                placeholder="https://example.com/subtitle.vtt"
                value={newSubUrl}
                onChange={(e) => setNewSubUrl(e.target.value)}
                className="sm:col-span-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <button
                type="button"
                onClick={handleAddSubtitle}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Generated URL Preview */}
          <div className="pt-2 border-t border-zinc-800">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
              <span>Current EmbedMaster Target URL:</span>
              <button
                onClick={handleCopyUrl}
                className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-850 font-mono text-[11px] text-zinc-400 break-all select-all">
              {currentEmbedUrl}
            </div>
          </div>
        </div>

        {/* Modal actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow cursor-pointer transition-all"
          >
            Apply Settings
          </button>
        </div>
      </div>
    </div>
  );
};
