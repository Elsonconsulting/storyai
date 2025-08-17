import React from 'react';
import { Button } from './Button';
import { CheckIcon, XIcon, SparklesIcon } from '../../constants';

interface SuggestionBoxProps {
  title?: string;
  onAccept: () => void;
  onDismiss: () => void;
  children: React.ReactNode;
  acceptLabel?: string;
  dismissLabel?: string;
}

export const SuggestionBox: React.FC<SuggestionBoxProps> = ({
  title = "AI Suggestion",
  onAccept,
  onDismiss,
  children,
  acceptLabel = "Use this",
  dismissLabel = "Discard"
}) => {
  return (
    <div className="mt-6 bg-slate-900/50 border-2 border-dashed border-teal-500 rounded-lg p-4 animate-fade-in">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-lg font-semibold text-teal-400 flex items-center gap-2">
            <SparklesIcon />
            {title}
        </h4>
        <div className="flex gap-2">
          <Button onClick={onAccept} variant="primary" className="!px-3 !py-1 text-sm" icon={<CheckIcon />}>
            {acceptLabel}
          </Button>
          <Button onClick={onDismiss} variant="secondary" className="!px-3 !py-1 text-sm" icon={<XIcon />}>
            {dismissLabel}
          </Button>
        </div>
      </div>
      <div className="bg-slate-800 p-4 rounded-md max-h-60 overflow-y-auto">
        {children}
      </div>
    </div>
  );
};
