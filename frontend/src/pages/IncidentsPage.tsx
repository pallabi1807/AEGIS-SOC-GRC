import { useState } from 'react';

import type {
  Incident,
  Risk,
  Control,
  Remediation,
  Verification,
  Evidence,
  ControlTest,
} from '../api/dashboard';

import IncidentDetailPanel from '../components/IncidentDetailPanel';

interface IncidentsPageProps {
  incidents: Incident[];
  risks: Risk[];
  controls: Control[];
  remediations: Remediation[];
  verifications: Verification[];
  evidence: Evidence[];
  controlTests: ControlTest[];
  onNavigate: (page: string) => void;
}

function displayValue(
  value: unknown,
  fallback = '—',
): string {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return String(value);
  }

  if (typeof value === 'object') {
    const objectValue = value as {
      name?: unknown;
      id?: unknown;
      label?: unknown;
      value?: unknown;
    };

    if (typeof objectValue.name === 'string') {
      return objectValue.name;
    }

    if (typeof objectValue.label === 'string') {
      return objectValue.label;
    }

    if (typeof objectValue.value === 'string') {
      return objectValue.value;
    }

    if (typeof objectValue.id === 'string') {
      return objectValue.id;
    }
  }

  return fallback;
}

function classValue(value: unknown): string {
  return displayValue(value, 'unknown')
    .toLowerCase()
    .replace(/\s+/g, '-');
}

export default function IncidentsPage({
  incidents,
  risks,
  controls,
  remediations,
  verifications,
  evidence,
  controlTests,
  onNavigate,
}: IncidentsPageProps) {
  const [selectedIncident, setSelectedIncident] =
    useState<Incident | null>(null);

  return (
    <section className="page-content">

      {/* =====================================================
          PAGE HEADER
          ===================================================== */}

      <div className="page-header">

        <div>

          <div className="eyebrow">
            SOC OPERATIONS <span>•</span> RESPONSE
          </div>

          <h1>Incident Management</h1>

          <p>
            Investigate and track the AEGIS incident lifecycle.
          </p>

        </div>

        <div className="operational-badge">

          <div className="status-dot" />

          <div>
            <span>INCIDENT RESPONSE</span>
            <strong>Operational</strong>
          </div>

        </div>

      </div>


      {/* =====================================================
          INCIDENT REGISTER
          ===================================================== */}

      <div className="table-card page-table">

        <div className="table-header">

          <div>

            <h3>Incident Register</h3>

            <span>
              Alerts converted into security incidents
            </span>

          </div>

        </div>


        <div className="page-table-scroll">

          {incidents.length === 0 ? (

            <div className="empty-state">
              No incidents available.
            </div>

          ) : (

            incidents.map((incident) => {

              const incidentNumber =
                displayValue(
                  incident.incident_number,
                );

              const title =
                displayValue(
                  incident.title,
                );

              const sourceIp =
                displayValue(
                  incident.source_ip,
                  'No source IP',
                );

              const username =
                displayValue(
                  incident.username,
                  'No username',
                );

              const severity =
                displayValue(
                  incident.severity,
                );

              const status =
                displayValue(
                  incident.status,
                );

              return (
                <div
                  className="page-record incident-record"
                  key={incident.id}
                  onClick={() =>
                    setSelectedIncident(incident)
                  }
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {

                    if (
                      event.key === 'Enter' ||
                      event.key === ' '
                    ) {

                      event.preventDefault();

                      setSelectedIncident(
                        incident,
                      );

                    }

                  }}
                >

                  <div className="page-record-main">

                    <strong>
                      {incidentNumber}
                    </strong>

                    <span>
                      {title}
                    </span>

                    <small>
                      {sourceIp} • {username}
                    </small>

                  </div>


                  <span
                    className={`table-badge ${classValue(
                      incident.severity,
                    )}`}
                  >
                    {severity}
                  </span>


                  <span
                    className={`table-badge ${classValue(
                      incident.status,
                    )}`}
                  >
                    {status}
                  </span>


                  <span className="page-record-meta">

                    {incident.created_at
                      ? new Date(
                          incident.created_at,
                        ).toLocaleDateString()
                      : '—'}

                  </span>

                </div>
              );

            })

          )}

        </div>

      </div>


      {/* =====================================================
          INCIDENT DETAIL
          ===================================================== */}

      <IncidentDetailPanel
        incident={selectedIncident}
        risks={risks}
        controls={controls}
        remediations={remediations}
        verifications={verifications}
        evidence={evidence}
        controlTests={controlTests}
        onNavigate={onNavigate}
        onClose={() =>
          setSelectedIncident(null)
        }
      />

    </section>
  );
}