import { useState } from 'react';
import { CampProjectForm } from './CampProjectForm';
import { InteriorProjectForm } from './InteriorProjectForm';

interface WelcomeScreenProps {
  onCreateSite: (name: string, width: number, height: number) => void;
  onCreateInterior: (name: string, length: number, width: number) => void;
  onOpenProject: () => void;
}

export const WelcomeScreen = ({
  onCreateSite,
  onCreateInterior,
  onOpenProject,
}: WelcomeScreenProps) => {
  const [activePanel, setActivePanel] = useState<'camp' | 'interior' | null>(null);

  return (
    <div className="welcome-shell">
      <section className="welcome-hero">
        <div className="welcome-hero-copy">
          <h1>Camp Layout Design Tool</h1>
          <p className="hero-copy">
            This is a web app that stores all projects locally on your own computer. Once the page is loaded you
            could disconnect from the internet entirely and the app would function the same.
          </p>
          <div className="welcome-feature-strip">
            <div className="welcome-feature">
              <strong>Static and portable</strong>
              <span>No accounts, no backend, and no cloud project history.</span>
            </div>
            <div className="welcome-feature">
              <strong>Camp plus interiors</strong>
              <span>Plan the full site, then drop inside tents and structures when needed.</span>
            </div>
            <div className="welcome-feature">
              <strong>Operational outputs</strong>
              <span>Export PNG layouts and packing lists from the same working file.</span>
            </div>
          </div>
        </div>

        <div className="welcome-hero-actions">
          <button className="primary-button welcome-action-button" onClick={onOpenProject}>
            Open Existing Project
          </button>
          <button
            className={`primary-button welcome-action-button${
              activePanel === 'camp' ? ' welcome-action-button-active' : ''
            }`}
            onClick={() => setActivePanel((current) => (current === 'camp' ? null : 'camp'))}
          >
            Create Camp Layout
          </button>
          <button
            className={`primary-button welcome-action-button${
              activePanel === 'interior' ? ' welcome-action-button-active' : ''
            }`}
            onClick={() => setActivePanel((current) => (current === 'interior' ? null : 'interior'))}
          >
            Create Interior-Only Layout
          </button>
        </div>
      </section>

      {activePanel ? (
        <section className={`welcome-card ${activePanel === 'camp' ? 'welcome-card-emphasis' : ''}`}>
          <div className="panel-header">
            <h2>{activePanel === 'camp' ? 'Create a camp layout' : 'Create an interior-only layout'}</h2>
            <p className="panel-copy">
              {activePanel === 'camp'
                ? 'Set the file name and overall camp size before you start placing tents, structures, utilities, and obstacles.'
                : 'Start from a tent footprint or use a custom room size when you only need the interior planning space.'}
            </p>
          </div>

          {activePanel === 'camp' ? (
            <CampProjectForm
              submitLabel="Create Camp Layout"
              onSubmit={onCreateSite}
              onCancel={() => setActivePanel(null)}
            />
          ) : (
            <InteriorProjectForm
              submitLabel="Create Interior-Only Layout"
              onSubmit={onCreateInterior}
              onCancel={() => setActivePanel(null)}
            />
          )}
        </section>
      ) : null}

      <div className="welcome-footer">
        <a
          className="welcome-issues-link"
          href="https://github.com/Pixel-Pages/Camp-Layout-Tool/issues"
          target="_blank"
          rel="noreferrer"
        >
          issues / change request
        </a>
        <p>created by Aaron Fullbright</p>
      </div>
    </div>
  );
};
