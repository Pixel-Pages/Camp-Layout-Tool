import { useState } from 'react';
import { InteriorProjectForm } from './InteriorProjectForm';

interface WelcomeScreenProps {
  onCreateSite: (name: string) => void;
  onCreateInterior: (name: string, length: number, width: number) => void;
  onOpenProject: () => void;
}

export const WelcomeScreen = ({
  onCreateSite,
  onCreateInterior,
  onOpenProject,
}: WelcomeScreenProps) => {
  const [siteName, setSiteName] = useState('New Camp Layout');

  return (
    <div className="welcome-shell">
      <section className="welcome-hero">
        <div className="welcome-hero-copy">
          <span className="welcome-kicker">Local-first deployment planning</span>
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
          <button className="primary-button" onClick={onOpenProject}>
            Open Existing Project
          </button>
          <p className="panel-copy">Open a saved `.layoutplanner.json` file from your own computer.</p>
        </div>
      </section>

      <div className="welcome-grid">
        <section className="welcome-card welcome-card-emphasis">
          <div className="panel-header">
            <h2>Start a new camp layout</h2>
            <p className="panel-copy">
              Build a camp-scale plan for tents, hardened structures, generators, obstacles, cabling, and visibility
              layers.
            </p>
          </div>

          <label>
            Layout title
            <input value={siteName} onChange={(event) => setSiteName(event.target.value)} />
          </label>

          <button className="primary-button" onClick={() => onCreateSite(siteName)}>
            Create Camp Layout
          </button>
        </section>

        <section className="welcome-card">
          <div className="panel-header">
            <h2>Start an interior-only layout</h2>
            <p className="panel-copy">
              Begin from a tent footprint or define a custom room size when you only need the interior planning space.
            </p>
          </div>

          <InteriorProjectForm submitLabel="Create Interior Only Layout" onSubmit={onCreateInterior} />
        </section>
      </div>

      <p className="welcome-footer">created by Aaron Fullbright</p>
    </div>
  );
};
