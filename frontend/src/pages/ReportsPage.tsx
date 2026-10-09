import { useState } from 'react';
import type {
  Alert,
  Control,
  Incident,
  Remediation,
  Risk,
  Verification,
} from '../api/dashboard';
import { createPortal } from 'react-dom';
interface ReportsPageProps {
  alerts: Alert[];
  incidents: Incident[];
  risks: Risk[];
  controls: Control[];
  remediations: Remediation[];
  verifications: Verification[];
}

type ReportKey = 'soc' | 'risk' | 'control' | 'remediation';

function activeIncidentsCount(incidents: Incident[]) {
  return incidents.filter(
    (incident) =>
      !['resolved', 'closed'].includes(incident.status.toLowerCase()),
  ).length;
}

function highCriticalAlertsCount(alerts: Alert[]) {
  return alerts.filter((alert) =>
    ['high', 'critical'].includes(alert.severity.toLowerCase()),
  ).length;
}

function highCriticalRisksCount(risks: Risk[]) {
  return risks.filter((risk) =>
    ['high', 'critical'].includes(risk.risk_level.toLowerCase()),
  ).length;
}

function verifiedRemediationsCount(remediations: Remediation[]) {
  return remediations.filter(
    (remediation) =>
      remediation.verification_status.toLowerCase() === 'verified',
  ).length;
}

function completedRemediationsCount(remediations: Remediation[]) {
  return remediations.filter(
    (remediation) => remediation.status.toLowerCase() === 'completed',
  ).length;
}

function openRisksCount(risks: Risk[]) {
  return risks.filter(
    (risk) => !['closed', 'resolved'].includes(risk.status.toLowerCase()),
  ).length;
}

function statusClass(value: string) {
  const normalized = value.toLowerCase();

  if (['critical', 'high', 'open'].includes(normalized)) return 'danger';
  if (['medium', 'in_progress', 'partial'].includes(normalized)) return 'warning';
  if (['completed', 'verified', 'pass', 'resolved', 'closed'].includes(normalized)) {
    return 'success';
  }

  return 'neutral';
}

export default function ReportsPage({
  alerts,
  incidents,
  risks,
  controls,
  remediations,
  verifications,
}: ReportsPageProps) {
  const [selectedReport, setSelectedReport] = useState<ReportKey | null>(null);

  const activeIncidents = activeIncidentsCount(incidents);
  const highCriticalAlerts = highCriticalAlertsCount(alerts);
  const highCriticalRisks = highCriticalRisksCount(risks);
  const verifiedRemediations = verifiedRemediationsCount(remediations);
  const completedRemediations = completedRemediationsCount(remediations);
  const openRisks = openRisksCount(risks);

  const reportItems = [
    {
      key: 'soc' as ReportKey,
      title: 'SOC Operations Summary',
      description:
        'Current security alert and incident activity across the AEGIS SOC.',
      primary: `${alerts.length}`,
      primaryLabel: 'alerts',
      secondary: `${activeIncidents}`,
      secondaryLabel: 'active incidents',
      accent: 'blue',
    },
    {
      key: 'risk' as ReportKey,
      title: 'Risk Register Summary',
      description:
        'Current risk exposure and open risk treatment records.',
      primary: `${risks.length}`,
      primaryLabel: 'total risks',
      secondary: `${highCriticalRisks}`,
      secondaryLabel: 'high / critical',
      accent: 'red',
    },
    {
      key: 'control' as ReportKey,
      title: 'Control Assurance Summary',
      description:
        'Control catalog and assurance activity currently recorded in AEGIS.',
      primary: `${controls.length}`,
      primaryLabel: 'controls',
      secondary: `${verifications.length}`,
      secondaryLabel: 'verifications',
      accent: 'cyan',
    },
    {
      key: 'remediation' as ReportKey,
      title: 'Remediation Summary',
      description:
        'Current remediation workload and completed treatment activity.',
      primary: `${remediations.length}`,
      primaryLabel: 'remediations',
      secondary: `${verifiedRemediations}`,
      secondaryLabel: 'verified',
      accent: 'green',
    },
  ];

  const selectedTitle =
    reportItems.find((report) => report.key === selectedReport)?.title ?? '';

  return (
    <section className="page-content reports-page">
      <div className="page-header reports-header">
        <div>
          <div className="eyebrow">
            REPORTING <span>•</span> MANAGEMENT
          </div>

          <h1>Reports</h1>

          <p>
            Management-ready operational summaries generated from live AEGIS
            SOC and GRC records.
          </p>
        </div>

        <div className="reports-status">
          <span className="reports-status-dot" />
          Live reporting dataset
        </div>
      </div>

      <section className="reports-executive-strip">
        <div className="reports-executive-item">
          <span>SECURITY ALERTS</span>
          <strong>{alerts.length}</strong>
          <small>{highCriticalAlerts} high / critical</small>
        </div>

        <div className="reports-executive-item">
          <span>ACTIVE INCIDENTS</span>
          <strong>{activeIncidents}</strong>
          <small>{incidents.length} total incidents</small>
        </div>

        <div className="reports-executive-item">
          <span>OPEN RISKS</span>
          <strong>{openRisks}</strong>
          <small>{highCriticalRisks} high / critical</small>
        </div>

        <div className="reports-executive-item">
          <span>REMEDIATION</span>
          <strong>{completedRemediations}</strong>
          <small>completed • {verifiedRemediations} verified</small>
        </div>
      </section>

      <section className="reports-section">
        <div className="reports-section-heading">
          <div>
            <div className="eyebrow">
              MANAGEMENT <span>•</span> REPORTS
            </div>

            <h2>Available Reports</h2>

            <p>
              Select a report to open its detailed management view.
            </p>
          </div>

          <span className="reports-live-badge">LIVE</span>
        </div>

        <div className="reports-grid">
          {reportItems.map((report) => (
            <button
              className={`report-card report-card-button ${report.accent}`}
              key={report.key}
              type="button"
              onClick={() => setSelectedReport(report.key)}
            >
              <div className="report-card-top">
                <span className="report-card-kicker">MANAGEMENT VIEW</span>

                <span className="report-card-live">Live</span>
              </div>

              <h3>{report.title}</h3>

              <p>{report.description}</p>

              <div className="report-card-metrics">
                <div>
                  <strong>{report.primary}</strong>
                  <span>{report.primaryLabel}</span>
                </div>

                <div>
                  <strong>{report.secondary}</strong>
                  <span>{report.secondaryLabel}</span>
                </div>
              </div>

              <span className="report-card-action">
                Open detailed report <span>→</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="reports-section">
        <div className="reports-section-heading">
          <div>
            <div className="eyebrow">
              EXECUTIVE <span>•</span> TRACEABILITY
            </div>

            <h2>Security → Governance Traceability</h2>

            <p>
              The AEGIS reporting model connects security operations with
              downstream governance and assurance.
            </p>
          </div>
        </div>

        <div className="reports-traceability">
          <div className="reports-trace-step">
            <span className="reports-trace-number">{alerts.length}</span>
            <strong>Detection</strong>
            <small>Alerts</small>
          </div>

          <span className="reports-trace-arrow">→</span>

          <div className="reports-trace-step">
            <span className="reports-trace-number">{incidents.length}</span>
            <strong>Investigation</strong>
            <small>Incidents</small>
          </div>

          <span className="reports-trace-arrow">→</span>

          <div className="reports-trace-step">
            <span className="reports-trace-number">{risks.length}</span>
            <strong>Risk</strong>
            <small>Risk register</small>
          </div>

          <span className="reports-trace-arrow">→</span>

          <div className="reports-trace-step">
            <span className="reports-trace-number">{controls.length}</span>
            <strong>Governance</strong>
            <small>Controls</small>
          </div>

          <span className="reports-trace-arrow">→</span>

          <div className="reports-trace-step">
            <span className="reports-trace-number">{remediations.length}</span>
            <strong>Treatment</strong>
            <small>Remediation</small>
          </div>

          <span className="reports-trace-arrow">→</span>

          <div className="reports-trace-step">
            <span className="reports-trace-number">{verifications.length}</span>
            <strong>Assurance</strong>
            <small>Verification</small>
          </div>
        </div>
      </section>

      <div className="reports-note">
        <div>
          <strong>Reporting scope</strong>
          <p>
            These summaries represent the current AEGIS operational dataset.
            They are management views of recorded SOC and GRC activity, not
            independent certification or audit conclusions.
          </p>
        </div>

        <span>AEGIS SOC-GRC</span>
      </div>

      {selectedReport &&
        createPortal(
          <div
            className="report-detail-backdrop"
          role="presentation"
          onClick={() => setSelectedReport(null)}
        >
          <section
            className="report-detail-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-detail-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="report-detail-header">
              <div>
                <div className="eyebrow">
                  MANAGEMENT <span>•</span> DETAILED REPORT
                </div>

                <h2 id="report-detail-title">{selectedTitle}</h2>

                <p>Generated from the current AEGIS dataset.</p>
              </div>

              <button
                type="button"
                className="report-detail-close"
                aria-label="Close report"
                onClick={() => setSelectedReport(null)}
              >
                ×
              </button>
            </div>

            {selectedReport === 'soc' && (
              <div className="report-detail-content">
                <div className="report-detail-summary-grid">
                  <div>
                    <span>Total Alerts</span>
                    <strong>{alerts.length}</strong>
                  </div>
                  <div>
                    <span>High / Critical</span>
                    <strong>{highCriticalAlerts}</strong>
                  </div>
                  <div>
                    <span>Active Incidents</span>
                    <strong>{activeIncidents}</strong>
                  </div>
                  <div>
                    <span>Total Incidents</span>
                    <strong>{incidents.length}</strong>
                  </div>
                </div>

                <div className="report-detail-columns">
                  <div className="report-detail-block">
                    <h3>Alert Severity</h3>
                    {['critical', 'high', 'medium', 'low'].map((severity) => {
                      const count = alerts.filter(
                        (alert) =>
                          alert.severity.toLowerCase() === severity,
                      ).length;

                      return (
                        <div className="report-detail-row" key={severity}>
                          <span>{severity}</span>
                          <strong>{count}</strong>
                        </div>
                      );
                    })}
                  </div>

                  <div className="report-detail-block">
                    <h3>Incident Status</h3>
                    {Array.from(
                      new Set(incidents.map((incident) => incident.status)),
                    ).map((status) => (
                      <div className="report-detail-row" key={status}>
                        <span>{status}</span>
                        <strong>
                          {
                            incidents.filter(
                              (incident) => incident.status === status,
                            ).length
                          }
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="report-detail-block">
                  <h3>Recent Incidents</h3>

                  <div className="report-detail-table">
                    {[...incidents]
                      .sort(
                        (a, b) =>
                          new Date(b.created_at).getTime() -
                          new Date(a.created_at).getTime(),
                      )
                      .slice(0, 8)
                      .map((incident) => (
                        <div
                          className="report-detail-table-row"
                          key={incident.id}
                        >
                        <span>{incident.incident_number}</span>
                        <strong>{incident.title}</strong>
                        <span
                          className={`report-status-pill ${statusClass(
                            incident.severity,
                          )}`}
                        >
                          {incident.severity}
                        </span>
                        <span>{incident.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedReport === 'risk' && (
              <div className="report-detail-content">
                <div className="report-detail-summary-grid">
                  <div>
                    <span>Total Risks</span>
                    <strong>{risks.length}</strong>
                  </div>
                  <div>
                    <span>Open Risks</span>
                    <strong>{openRisks}</strong>
                  </div>
                  <div>
                    <span>High / Critical</span>
                    <strong>{highCriticalRisks}</strong>
                  </div>
                  <div>
                    <span>Closed / Resolved</span>
                    <strong>{risks.length - openRisks}</strong>
                  </div>
                </div>

                <div className="report-detail-columns">
                  <div className="report-detail-block">
                    <h3>Risk Level</h3>
                    {['critical', 'high', 'medium', 'low'].map((level) => (
                      <div className="report-detail-row" key={level}>
                        <span>{level}</span>
                        <strong>
                          {
                            risks.filter(
                              (risk) =>
                                risk.risk_level.toLowerCase() === level,
                            ).length
                          }
                        </strong>
                      </div>
                    ))}
                  </div>

                  <div className="report-detail-block">
                    <h3>Treatment</h3>
                    {Array.from(
                      new Set(risks.map((risk) => risk.treatment)),
                    ).map((treatment) => (
                      <div className="report-detail-row" key={treatment}>
                        <span>{treatment}</span>
                        <strong>
                          {
                            risks.filter(
                              (risk) => risk.treatment === treatment,
                            ).length
                          }
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="report-detail-block">
                  <h3>Risk Register</h3>

                  <div className="report-detail-table">
                    {risks.map((risk) => (
                      <div
                        className="report-detail-table-row"
                        key={risk.id}
                      >
                        <span>{risk.risk_number}</span>
                        <strong>{risk.title}</strong>
                        <span
                          className={`report-status-pill ${statusClass(
                            risk.risk_level,
                          )}`}
                        >
                          {risk.risk_level}
                        </span>
                        <span>{risk.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedReport === 'control' && (
              <div className="report-detail-content">
                <div className="report-detail-summary-grid">
                  <div>
                    <span>Total Controls</span>
                    <strong>{controls.length}</strong>
                  </div>
                  <div>
                    <span>Verifications</span>
                    <strong>{verifications.length}</strong>
                  </div>
                  <div>
                    <span>PASS</span>
                    <strong>
                      {
                        verifications.filter(
                          (verification) =>
                            verification.result.toUpperCase() === 'PASS',
                        ).length
                      }
                    </strong>
                  </div>
                  <div>
                    <span>Control Types</span>
                    <strong>
                      {new Set(controls.map((control) => control.control_type))
                        .size}
                    </strong>
                  </div>
                </div>

                <div className="report-detail-columns">
                  <div className="report-detail-block">
                    <h3>Control Type</h3>
                    {Array.from(
                      new Set(controls.map((control) => control.control_type)),
                    ).map((type) => (
                      <div className="report-detail-row" key={type}>
                        <span>{type}</span>
                        <strong>
                          {
                            controls.filter(
                              (control) => control.control_type === type,
                            ).length
                          }
                        </strong>
                      </div>
                    ))}
                  </div>

                  <div className="report-detail-block">
                    <h3>Control Status</h3>
                    {Array.from(
                      new Set(controls.map((control) => control.status)),
                    ).map((status) => (
                      <div className="report-detail-row" key={status}>
                        <span>{status}</span>
                        <strong>
                          {
                            controls.filter(
                              (control) => control.status === status,
                            ).length
                          }
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="report-detail-block">
                  <h3>Verification Results</h3>

                  <div className="report-detail-table">
                    {verifications.slice(0, 10).map((verification) => (
                      <div
                        className="report-detail-table-row"
                        key={verification.id}
                      >
                        <span>{verification.verification_number}</span>
                        <strong>{verification.result}</strong>
                        <span
                          className={`report-status-pill ${statusClass(
                            verification.result,
                          )}`}
                        >
                          {verification.result}
                        </span>
                        <span>{verification.verifier}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedReport === 'remediation' && (
              <div className="report-detail-content">
                <div className="report-detail-summary-grid">
                  <div>
                    <span>Total Remediations</span>
                    <strong>{remediations.length}</strong>
                  </div>
                  <div>
                    <span>Completed</span>
                    <strong>{completedRemediations}</strong>
                  </div>
                  <div>
                    <span>Verified</span>
                    <strong>{verifiedRemediations}</strong>
                  </div>
                  <div>
                    <span>In Progress / Open</span>
                    <strong>
                      {remediations.length - completedRemediations}
                    </strong>
                  </div>
                </div>

                <div className="report-detail-columns">
                  <div className="report-detail-block">
                    <h3>Remediation Status</h3>
                    {Array.from(
                      new Set(remediations.map((remediation) => remediation.status)),
                    ).map((status) => (
                      <div className="report-detail-row" key={status}>
                        <span>{status}</span>
                        <strong>
                          {
                            remediations.filter(
                              (remediation) => remediation.status === status,
                            ).length
                          }
                        </strong>
                      </div>
                    ))}
                  </div>

                  <div className="report-detail-block">
                    <h3>Verification Status</h3>
                    {Array.from(
                      new Set(
                        remediations.map(
                          (remediation) => remediation.verification_status,
                        ),
                      ),
                    ).map((status) => (
                      <div className="report-detail-row" key={status}>
                        <span>{status}</span>
                        <strong>
                          {
                            remediations.filter(
                              (remediation) =>
                                remediation.verification_status === status,
                            ).length
                          }
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="report-detail-block">
                  <h3>Remediation Register</h3>

                  <div className="report-detail-table">
                    {remediations.map((remediation) => (
                      <div
                        className="report-detail-table-row"
                        key={remediation.id}
                      >
                        <span>{remediation.remediation_number}</span>
                        <strong>{remediation.title}</strong>
                        <span
                          className={`report-status-pill ${statusClass(
                            remediation.status,
                          )}`}
                        >
                          {remediation.status}
                        </span>
                        <span>{remediation.verification_status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            </section>
          </div>,
          document.body,
        )}
    </section>
  );
}
