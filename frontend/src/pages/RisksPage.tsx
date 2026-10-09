import { useState } from 'react';

import type {
  Risk,
  Incident,
  Control,
  Remediation,
  Verification,
  RiskControl,
} from '../api/dashboard';

import RiskDetailPanel from '../components/RiskDetailPanel';

interface RisksPageProps {
  risks: Risk[];
  incidents: Incident[];
  controls: Control[];
  remediations: Remediation[];
  verifications: Verification[];
  riskControls: RiskControl[];
  onNavigate: (page: string) => void;
}

export default function RisksPage({
  risks,
  incidents,
  controls,
  remediations,
  verifications,
  riskControls,
  onNavigate,
}: RisksPageProps) {

  const [selectedRisk, setSelectedRisk] =
    useState<Risk | null>(null);

  const openRisks =
    risks.filter(
      (risk) =>
        (risk.status ?? '').toLowerCase() ===
        'open',
    ).length;

  const highRisks =
    risks.filter(
      (risk) =>
        (risk.risk_level ?? '').toLowerCase() ===
        'high',
    ).length;

  return (
    <section className="page-content">

      {/* PAGE HEADER */}

      <div className="page-header">

        <div>

          <div className="eyebrow">
            GRC MANAGEMENT
            <span>•</span>
            RISK
          </div>

          <h1>
            Risk Management
          </h1>

          <p>
            Monitor security risks derived
            from AEGIS incidents.
          </p>

        </div>

        <div className="operational-badge">

          <div className="status-dot" />

          <div>
            <span>
              RISK ENGINE
            </span>

            <strong>
              Operational
            </strong>
          </div>

        </div>

      </div>


      {/* METRICS */}

      <div className="metric-grid page-metrics">

        <div className="metric-card warning">

          <div className="metric-top">
            <span>
              Open Risks
            </span>
          </div>

          <div className="metric-value">
            {openRisks}
          </div>

          <div className="metric-change">
            Active risk records
          </div>

        </div>


        <div className="metric-card">

          <div className="metric-top">
            <span>
              High Risks
            </span>
          </div>

          <div className="metric-value">
            {highRisks}
          </div>

          <div className="metric-change">
            High-risk exposure
          </div>

        </div>


        <div className="metric-card cyan">

          <div className="metric-top">
            <span>
              Total Risks
            </span>
          </div>

          <div className="metric-value">
            {risks.length}
          </div>

          <div className="metric-change">
            Live from AEGIS API
          </div>

        </div>

      </div>


      {/* RISK REGISTER */}

      <div className="table-card page-table">

        <div className="table-header">

          <div>

            <h3>
              Risk Register
            </h3>

            <span>
              Risk assessment and treatment
              tracking
            </span>

          </div>

        </div>


        <div className="page-table-scroll">

          {risks.length === 0 ? (

            <div className="empty-state">
              No risks available.
            </div>

          ) : (

            risks.map((risk) => (

              <div
                className="page-record risk-record"
                key={risk.id}
                onClick={() =>
                  setSelectedRisk(risk)
                }
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {

                  if (
                    event.key === 'Enter' ||
                    event.key === ' '
                  ) {

                    event.preventDefault();

                    setSelectedRisk(
                      risk,
                    );

                  }

                }}
              >

                <div className="page-record-main">

                  <strong>
                    {risk.risk_number}
                  </strong>

                  <span>
                    {risk.title}
                  </span>

                  <small>
                    {risk.treatment}
                    {' • '}
                    {risk.owner ??
                      'Unassigned'}
                  </small>

                </div>


                <span
                  className={`table-badge ${(risk.risk_level ?? 'unknown').toLowerCase()}`}
                >
                  {risk.risk_level}
                </span>


                <span className="table-badge blue">
                  Score {risk.risk_score}
                </span>


                <span
                  className={`table-badge ${(risk.status ?? 'unknown').toLowerCase()}`}
                >
                  {risk.status}
                </span>


                <span className="page-record-meta">
                  {risk.created_at
                    ? new Date(
                        risk.created_at,
                      ).toLocaleDateString()
                    : '—'}
                </span>

              </div>

            ))

          )}

        </div>

      </div>


      {/* DETAIL PANEL */}

      {/* DETAIL PANEL */}

{selectedRisk && (
  <RiskDetailPanel
    risk={selectedRisk}
    incidents={incidents}
    controls={controls}
    riskControls={riskControls}
    remediations={remediations}
    verifications={verifications}
    onNavigate={onNavigate}
    onClose={() =>
      setSelectedRisk(null)
    }
  />
)}

    </section>
  );
}