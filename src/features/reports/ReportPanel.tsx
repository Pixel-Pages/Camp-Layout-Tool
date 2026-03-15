import { useState } from 'react';
import type { PackingListSections } from '../../domain/types';

interface ReportPanelProps {
  sections: PackingListSections;
  totalWeight: number;
  onExportCsv: () => void;
}

const ReportTable = ({
  title,
  rows,
}: {
  title: string;
  rows: PackingListSections['exterior'];
}) => (
  <div className="panel-group">
    <h4>{title}</h4>
    <div className="report-table">
      <div className="report-row report-row-head">
        <span>Item</span>
        <span>Qty</span>
        <span>Weight</span>
      </div>
      {rows.length ? (
        rows.map((row) => (
          <div className="report-row" key={`${title}-${row.definitionId}`}>
            <span>{row.definitionName}</span>
            <span>{row.quantity}</span>
            <span>{row.totalWeightLbs ?? '-'}</span>
          </div>
        ))
      ) : (
        <div className="report-row">
          <span>No items</span>
          <span>-</span>
          <span>-</span>
        </div>
      )}
    </div>
  </div>
);

export const ReportPanel = ({ sections, totalWeight, onExportCsv }: ReportPanelProps) => {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <section className="panel-card">
      <div className="panel-title-row">
        <div className="panel-header">
          <h3>Equipment</h3>
        </div>
        <button
          type="button"
          className="panel-collapse"
          onClick={() => setCollapsed((current) => !current)}
          aria-label={collapsed ? 'Expand equipment panel' : 'Collapse equipment panel'}
        >
          {collapsed ? 'v' : '^'}
        </button>
      </div>
      {collapsed ? null : (
        <>
          <div className="report-meta">
            <span>{sections.exterior.length + sections.interior.length} line items</span>
            <strong>{Math.round(totalWeight)} lbs total</strong>
          </div>
          <ReportTable title="Exterior" rows={sections.exterior} />
          <ReportTable title="Interior" rows={sections.interior} />
          <button type="button" onClick={onExportCsv}>
            Export CSV
          </button>
        </>
      )}
    </section>
  );
};
