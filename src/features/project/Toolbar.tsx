import type { ReactNode } from 'react';
import type { LayoutScene, ToolMode } from '../../domain/types';

interface ToolbarProps {
  projectName: string;
  scene: LayoutScene;
  dirty: boolean;
  tool: ToolMode;
  canUndo: boolean;
  canRedo: boolean;
  theme: 'light' | 'dark';
  onNewSite: () => void;
  onNewInterior: () => void;
  onOpen: () => void;
  onSave: () => void;
  onExportPng: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onToggleTheme: () => void;
  onSetTool: (tool: ToolMode) => void;
}

const ThemeToggleIcon = ({ theme }: { theme: 'light' | 'dark' }) =>
  theme === 'dark' ? (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16">
      <circle cx="12" cy="12" r="5" fill="currentColor" />
      <path
        d="M12 2.5V5.5M12 18.5V21.5M21.5 12H18.5M5.5 12H2.5M18.72 5.28 16.6 7.4M7.4 16.6 5.28 18.72M18.72 18.72 16.6 16.6M7.4 7.4 5.28 5.28"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  ) : (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16">
      <path
        d="M19 15.4A7.9 7.9 0 0 1 8.6 5 8.6 8.6 0 1 0 19 15.4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );

const CircleToolIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16">
    <circle
      cx="12"
      cy="12"
      r="7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeDasharray="4 3"
    />
  </svg>
);

const toolButtons: Array<{ id: ToolMode; label: string; icon?: ReactNode }> = [
  { id: 'select', label: 'select' },
  { id: 'cable', label: 'cable' },
  { id: 'text', label: 'text' },
  { id: 'arrow', label: 'arrow' },
  { id: 'circle', label: 'Circle outline', icon: <CircleToolIcon /> },
];

export const Toolbar = ({
  projectName,
  scene,
  dirty,
  tool,
  canUndo,
  canRedo,
  theme,
  onNewSite,
  onNewInterior,
  onOpen,
  onSave,
  onExportPng,
  onUndo,
  onRedo,
  onToggleTheme,
  onSetTool,
}: ToolbarProps) => (
  <header className={`toolbar toolbar-${scene.kind}`}>
    <div className="toolbar-block">
      <div>
        <h2>
          {projectName}
          {dirty ? ' *' : ''}
        </h2>
      </div>
      <div className="toolbar-actions">
        <button type="button" onClick={onNewSite}>
          New Camp Layout
        </button>
        <button type="button" onClick={onNewInterior}>
          New Interior Only Layout
        </button>
        <button type="button" onClick={onExportPng}>
          Export PNG
        </button>
        <button type="button" onClick={onOpen}>
          Open
        </button>
        <button className="primary-button" type="button" onClick={onSave}>
          Save As
        </button>
      </div>
    </div>

    <div className="toolbar-block">
      <div className="toolbar-actions">
        <button type="button" disabled={!canUndo} onClick={onUndo}>
          Undo
        </button>
        <button type="button" disabled={!canRedo} onClick={onRedo}>
          Redo
        </button>
        <button
          type="button"
          className="icon-button"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <ThemeToggleIcon theme={theme} />
        </button>
      </div>

      <div className="toolbar-toolset">
        {toolButtons.map((toolButton) => (
          <button
            key={toolButton.id}
            type="button"
            className={toolButton.id === tool ? 'tool-active' : ''}
            onClick={() => onSetTool(toolButton.id)}
            title={toolButton.label}
            aria-label={toolButton.label}
          >
            {toolButton.icon ?? toolButton.id}
          </button>
        ))}
      </div>
    </div>
  </header>
);
