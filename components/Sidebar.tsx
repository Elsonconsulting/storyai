import React from 'react';
import { View, AIProvider } from '../types';
import { Button } from './common/Button';
import { BookOpenIcon, UsersIcon, ScrollTextIcon, NetworkIcon, SaveIcon, UploadIcon, AnvilIcon, TrashIcon, CpuIcon } from '../constants';

interface SidebarProps {
  activeView: View;
  onViewChange: (view: View) => void;
  onSave: () => Promise<void>;
  onLoad: () => Promise<void>;
  onDeleteStory: () => void;
  isSaving: boolean;
  isLoading: boolean;
  aiProvider: AIProvider;
  onProviderChange: (provider: AIProvider) => void;
}

const navItems = [
  { view: View.Overview, label: 'Overview', icon: <BookOpenIcon /> },
  { view: View.Plot, label: 'Plot & Subplots', icon: <NetworkIcon /> },
  { view: View.Characters, label: 'Characters', icon: <UsersIcon /> },
  { view: View.Chapters, label: 'Chapters', icon: <ScrollTextIcon /> },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange, onSave, onLoad, onDeleteStory, isSaving, isLoading, aiProvider, onProviderChange }) => {
  const NavItem: React.FC<{
    view: View;
    label: string;
    icon: React.ReactNode;
  }> = ({ view, label, icon }) => {
    const isActive = activeView === view;
    return (
      <button
        onClick={() => onViewChange(view)}
        className={`flex items-center w-full px-4 py-3 text-left rounded-lg transition-colors duration-200 ${
          isActive ? 'bg-teal-600 text-white' : 'text-slate-300 hover:bg-slate-700'
        }`}
      >
        <span className="mr-3">{icon}</span>
        <span>{label}</span>
      </button>
    );
  };

  return (
    <aside className="w-64 bg-slate-800 p-4 flex flex-col h-full border-r border-slate-700">
      <div className="flex items-center gap-3 mb-8 px-2">
        <AnvilIcon />
        <h1 className="text-2xl font-bold text-white">Story Forge</h1>
      </div>
      <nav className="flex-grow space-y-2">
        {navItems.map((item) => (
          <NavItem key={item.view} {...item} />
        ))}
      </nav>
      <div className="space-y-3 pt-4 border-t border-slate-700">
        <div className="px-1">
          <label htmlFor="ai-provider" className="flex items-center gap-2 text-sm font-medium text-slate-400 mb-1">
            <CpuIcon /> AI Provider
          </label>
          <select
            id="ai-provider"
            value={aiProvider}
            onChange={(e) => onProviderChange(e.target.value as AIProvider)}
            className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-sm text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
            aria-label="Select AI Provider"
          >
            <option value={AIProvider.Gemini}>Gemini</option>
            <option value={AIProvider.Mock}>Mock AI (Offline)</option>
          </select>
        </div>
        <Button onClick={onSave} isLoading={isSaving} icon={<SaveIcon />}>Save Story</Button>
        <Button onClick={onLoad} isLoading={isLoading} variant="secondary" icon={<UploadIcon />}>Load Story</Button>
        <Button onClick={onDeleteStory} variant="danger" icon={<TrashIcon />}>Delete Story</Button>
      </div>
    </aside>
  );
};