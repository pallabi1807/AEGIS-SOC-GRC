import { useMemo, useState } from 'react';
import type {
  Remediation,
  Risk,
  Control,
  Verification,
  Evidence,
} from '../api/dashboard';

interface RemediationPageProps {
  remediations: Remediation[];
}

function text(
  value: unknown,
  fallback = '—',
): string {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return fallback;
  }

  return String(value);
}

function badgeClass(value: unknown): string {
  return text(value, 'unknown')
    .toLowerCase()
    .replace(/\s+/g, '-');
}

function formatDate(value: unknown): string {
  if (!value) return '—';

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleString();
}

export default function RemediationPage({
  remediations,
}: RemediationPageProps) {
  const [selectedRemediation, setSelectedRemediation] =
    useState<Remediation | null>(null);
  const [localRemediations, setLocalRemediations] =
    useState<Remediation[]>(remediations);
  const [statusUpdating, setStatusUpdating] =
    useState(false);
  const [actionMessage, setActionMessage] =
    useState<string | null>(null);

  const [risks, setRisks] = useState<Risk[]>([]);
  const [controls, setControls] = useState<Control[]>([]);
  const [verifications, setVerifications] =
    useState<Verification[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);

  const selectedRisk = useMemo(() => {
    if (!selectedRemediation?.risk_id) {
      return null;
    }

    return (
      risks.find(
        (item) =>
          item.id === selectedRemediation.risk_id,
      ) ?? null
    );
  }, [selectedRemediation, risks]);

  const selectedControl = useMemo(() => {
    if (!selectedRemediation?.control_id) {
      return null;
    }

    return (
      controls.find(
        (item) =>
          item.id === selectedRemediation.control_id,
      ) ?? null
    );
  }, [selectedRemediation, controls]);

  const selectedVerification = useMemo(() => {
    if (!selectedRemediation) {
      return null;
    }

    return (
      verifications.find(
        (item) =>
          item.remediation_id ===
          selectedRemediation.id,
      ) ?? null
    );
  }, [selectedRemediation, verifications]);

  const selectedEvidence = useMemo(() => {
    if (!selectedControl) {
      return [];
    }

    return evidence.filter(
      (item) =>
        item.control_id ===
        selectedControl.id,
    );
  }, [selectedControl, evidence]);

  async function openRemediation(
    remediation: Remediation,
  ) {
    setSelectedRemediation(remediation);
    setActionMessage(null);

    try {
      const [
        risksResponse,
        controlsResponse,
        verificationsResponse,
        evidenceResponse,
      ] = await Promise.all([
        fetch('http://127.0.0.1:8000/risks'),
        fetch('http://127.0.0.1:8000/controls'),
        fetch('http://127.0.0.1:8000/verifications'),
        fetch('http://127.0.0.1:8000/evidence'),
      ]);

      if (risksResponse.ok) {
        const data = await risksResponse.json();
        setRisks(Array.isArray(data) ? data : []);
      }

      if (controlsResponse.ok) {
        const data = await controlsResponse.json();
        setControls(Array.isArray(data) ? data : []);
      }

      if (verificationsResponse.ok) {
        const data = await verificationsResponse.json();
        setVerifications(
          Array.isArray(data) ? data : [],
        );
      }

      if (evidenceResponse.ok) {
        const data = await evidenceResponse.json();
        setEvidence(
          Array.isArray(data) ? data : [],
        );
      }
    } catch (error) {
      console.error(
        'Failed to load remediation traceability:',
        error,
      );
    }
  }

  async function updateStatus(
    newStatus: string,
  ) {
    if (
      !selectedRemediation ||
      statusUpdating
    ) {
      return;
    }

    setStatusUpdating(true);
    setActionMessage(null);

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/remediations/${selectedRemediation.id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        },
      );

      if (!response.ok) {
        const errorData =
          await response.json().catch(() => null);

        throw new Error(
          errorData?.detail ||
            'Failed to update remediation status.',
        );
      }

      const updated =
        await response.json();

      setLocalRemediations((current) =>
        current.map((item) =>
          item.id === updated.id
            ? updated
            : item,
        ),
      );

      setSelectedRemediation(updated);

      setActionMessage(
        `${updated.remediation_number} status updated to ${updated.status}.`,
      );
    } catch (error) {
      console.error(
        'Failed to update remediation status:',
        error,
      );

      setActionMessage(
        error instanceof Error
          ? error.message
          : 'Failed to update remediation status.',
      );
    } finally {
      setStatusUpdating(false);
    }
  }

  const activeCount =
    localRemediations.filter(
      (item) =>
        !['completed', 'closed'].includes(
          item.status.toLowerCase(),
        ),
    ).length;

  const verifiedCount =
    localRemediations.filter(
      (item) =>
        item.verification_status.toLowerCase() ===
        'verified',
    ).length;

  return (
    <section className="page-content">
      <div className="page-header">
        <div>
          <div className="eyebrow">
            GRC MANAGEMENT <span>•</span> TREATMENT
          </div>

          <h1>Remediation</h1>

          <p>
            Track risk treatment activities and
            remediation progress.
          </p>
        </div>
      </div>

      <div className="metric-grid page-metrics">
        <div className="metric-card orange">
          <div className="metric-top">
            <span>Active</span>
          </div>

          <div className="metric-value">
            {activeCount}
          </div>
        </div>

        <div className="metric-card green">
          <div className="metric-top">
            <span>Verified</span>
          </div>

          <div className="metric-value">
            {verifiedCount}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span>Total</span>
          </div>

          <div className="metric-value">
            {localRemediations.length}
          </div>
        </div>
      </div>

      <div className="table-card page-table">
        <div className="table-header">
          <div>
            <h3>Remediation Register</h3>

            <span>
              Risk treatment activities generated
              by AEGIS
            </span>
          </div>
        </div>

        <div className="page-table-scroll">
          {localRemediations.length === 0 ? (
            <div className="empty-state">
              No remediation records available.
            </div>
          ) : (
            localRemediations.map((item) => (
              <div
                className="page-record"
                key={item.id}
                onClick={() =>
                  openRemediation(item)
                }
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (
                    event.key === 'Enter' ||
                    event.key === ' '
                  ) {
                    event.preventDefault();
                    openRemediation(item);
                  }
                }}
                style={{
                  cursor: 'pointer',
                }}
              >
                <div className="page-record-main">
                  <strong>
                    {item.remediation_number}
                  </strong>

                  <span>{item.title}</span>

                  <small>
                    {item.owner ??
                      'Unassigned'}
                  </small>
                </div>

                <span
                  className={`table-badge ${badgeClass(
                    item.priority,
                  )}`}
                >
                  {item.priority}
                </span>

                <span
                  className={`table-badge ${badgeClass(
                    item.status,
                  )}`}
                >
                  {item.status}
                </span>

                <span
                  className={`table-badge ${badgeClass(
                    item.verification_status,
                  )}`}
                >
                  {item.verification_status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedRemediation && (
        <div
          className="detail-overlay"
          onClick={() =>
            setSelectedRemediation(null)
          }
        >
          <aside
            className="detail-panel"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="detail-panel-header">
              <div>
                <div className="eyebrow">
                  GRC MANAGEMENT
                  <span>•</span>
                  REMEDIATION
                </div>

                <h2>
                  {selectedRemediation.remediation_number}
                </h2>

                <p>
                  {selectedRemediation.title}
                </p>
              </div>

              <button
                type="button"
                className="detail-close-button"
                onClick={() =>
                  setSelectedRemediation(null)
                }
              >
                ×
              </button>
            </div>

            <div className="detail-section">
              <div className="detail-section-title">
                <div>
                  <h3>Remediation Record</h3>
                  <span>
                    Analyst-owned treatment activity
                  </span>
                </div>
              </div>

              <div className="detail-grid">
                <div>
                  <span>Status</span>
                  <strong>
                    {selectedRemediation.status}
                  </strong>
                </div>

                <div>
                  <span>Priority</span>
                  <strong>
                    {selectedRemediation.priority}
                  </strong>
                </div>

                <div>
                  <span>Owner</span>
                  <strong>
                    {text(
                      selectedRemediation.owner,
                      'Unassigned',
                    )}
                  </strong>
                </div>

                <div>
                  <span>Due Date</span>
                  <strong>
                    {formatDate(
                      selectedRemediation.due_date,
                    )}
                  </strong>
                </div>

                <div>
                  <span>Verification</span>
                  <strong>
                    {
                      selectedRemediation.verification_status
                    }
                  </strong>
                </div>

                <div>
                  <span>Completed At</span>
                  <strong>
                    {formatDate(
                      selectedRemediation.completed_at,
                    )}
                  </strong>
                </div>
              </div>

              <div className="detail-description">
                <span>Description</span>
                <p>
                  {text(
                    selectedRemediation.description,
                  )}
                </p>
              </div>

              <div className="incident-action-message">
                <strong>
                  Analyst Actions
                </strong>

                <p style={{ marginTop: '6px' }}>
                  Update the treatment lifecycle as the
                  remediation is worked and completed.
                </p>

                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap',
                    marginTop: '10px',
                  }}
                >
                  {selectedRemediation.status.toLowerCase() ===
                    'open' && (
                    <button
                      type="button"
                      className="incident-action-button primary"
                      onClick={() =>
                        updateStatus('in_progress')
                      }
                      disabled={statusUpdating}
                    >
                      {statusUpdating
                        ? 'Starting…'
                        : 'Start Remediation'}
                    </button>
                  )}

                  {selectedRemediation.status.toLowerCase() ===
                    'in_progress' && (
                    <button
                      type="button"
                      className="incident-action-button primary"
                      onClick={() =>
                        updateStatus('completed')
                      }
                      disabled={statusUpdating}
                    >
                      {statusUpdating
                        ? 'Completing…'
                        : 'Mark Completed'}
                    </button>
                  )}

                  {selectedRemediation.status.toLowerCase() ===
                    'completed' && (
                    <span className="table-badge success">
                      Completed — Ready for Verification
                    </span>
                  )}

                  {selectedRemediation.status.toLowerCase() ===
                    'closed' && (
                    <span className="table-badge verified">
                      Closed
                    </span>
                  )}
                </div>

                {actionMessage && (
                  <p style={{ marginTop: '10px' }}>
                    {actionMessage}
                  </p>
                )}
              </div>
            </div>

            <div className="detail-section">
              <div className="detail-section-title">
                <div>
                  <h3>Risk Traceability</h3>
                  <span>
                    Risk associated with this
                    remediation
                  </span>
                </div>
              </div>

              {selectedRisk ? (
                <div className="detail-linked-record">
                  <div>
                    <strong>
                      {selectedRisk.risk_number}
                    </strong>

                    <span>
                      {selectedRisk.title}
                    </span>
                  </div>

                  <div className="detail-linked-badges">
                    <span
                      className={`table-badge ${badgeClass(
                        selectedRisk.risk_level,
                      )}`}
                    >
                      {selectedRisk.risk_level}
                    </span>

                    <span className="table-badge blue">
                      Score {selectedRisk.risk_score}
                    </span>

                    <span
                      className={`table-badge ${badgeClass(
                        selectedRisk.status,
                      )}`}
                    >
                      {selectedRisk.status}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  No risk is linked to this
                  remediation.
                </div>
              )}
            </div>

            <div className="detail-section">
              <div className="detail-section-title">
                <div>
                  <h3>Control Traceability</h3>
                  <span>
                    Control addressed by this
                    remediation
                  </span>
                </div>
              </div>

              {selectedControl ? (
                <div className="detail-linked-record">
                  <div>
                    <strong>
                      {selectedControl.control_id}
                    </strong>

                    <span>
                      {selectedControl.name}
                    </span>
                  </div>

                  <div className="detail-linked-badges">
                    <span
                      className={`table-badge ${badgeClass(
                        selectedControl.status,
                      )}`}
                    >
                      {selectedControl.status}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  No control is linked to this
                  remediation.
                </div>
              )}
            </div>

            <div className="detail-section">
              <div className="detail-section-title">
                <div>
                  <h3>Verification</h3>
                  <span>
                    Verification remains a separate
                    assurance activity
                  </span>
                </div>
              </div>

              {selectedVerification ? (
                <div className="detail-linked-record">
                  <div>
                    <strong>
                      {
                        selectedVerification.verification_number
                      }
                    </strong>

                    <span>
                      {
                        selectedVerification.verification_procedure
                      }
                    </span>
                  </div>

                  <div className="detail-linked-badges">
                    <span
                      className={`table-badge ${badgeClass(
                        selectedVerification.result,
                      )}`}
                    >
                      {selectedVerification.result}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  No verification has been
                  recorded for this remediation.
                </div>
              )}
            </div>

            <div className="detail-section">
              <div className="detail-section-title">
                <div>
                  <h3>Evidence</h3>
                  <span>
                    Evidence associated with the
                    linked control
                  </span>
                </div>
              </div>

              {selectedEvidence.length > 0 ? (
                <div className="record-list">
                  {selectedEvidence.map(
                    (item) => (
                      <div
                        className="detail-linked-record"
                        key={item.id}
                      >
                        <div>
                          <strong>
                            {item.evidence_number}
                          </strong>

                          <span>
                            {item.title}
                          </span>
                        </div>

                        <div className="detail-linked-badges">
                          <span
                            className={`table-badge ${badgeClass(
                              item.status,
                            )}`}
                          >
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <div className="empty-state">
                  No evidence is currently linked
                  through this control.
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
