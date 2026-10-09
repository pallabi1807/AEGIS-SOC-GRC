import { useEffect, useMemo, useState } from 'react';

import type {
  Incident,
  Risk,
  Control,
  Remediation,
  Verification,
  Evidence,
  ControlTest,
} from '../api/dashboard';

interface IncidentDetailPanelProps {
  incident: Incident | null;
  risks?: Risk[];
  controls?: Control[];
  remediations?: Remediation[];
  verifications?: Verification[];
  evidence?: Evidence[];
  controlTests?: ControlTest[];
  onNavigate: (page: string) => void;
  onClose: () => void;
}

interface EnrichmentIOC {
  type: string;
  value: string;
}

interface MitreTechnique {
  id: string;
  name: string;
}

interface RecommendedControl {
  id: string;
  name: string;
}

interface Enrichment {
  related_event_count: number;
  related_event_ids: string[];
  iocs: EnrichmentIOC[];
  mitre_techniques: MitreTechnique[];
  recommended_controls: RecommendedControl[];
  risk_score: number;
  risk_level: string;
  enrichment_version: string;
  generated_at: string;
}

function text(value: unknown, fallback = '—'): string {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return String(value);
  }

  if (typeof value === 'object') {
    const item = value as {
      id?: unknown;
      name?: unknown;
      label?: unknown;
      value?: unknown;
    };

    if (typeof item.name === 'string') {
      return item.name;
    }

    if (typeof item.label === 'string') {
      return item.label;
    }

    if (typeof item.value === 'string') {
      return item.value;
    }

    if (typeof item.id === 'string') {
      return item.id;
    }
  }

  return fallback;
}

function className(value: unknown): string {
  return text(value, 'unknown')
    .toLowerCase()
    .replace(/\s+/g, '-');
}

function formatDate(value: unknown): string {
  if (!value) {
    return '—';
  }

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleString();
}

export default function IncidentDetailPanel({
  incident,
  risks = [],
  controls = [],
  remediations = [],
  verifications = [],
  evidence = [],
  controlTests = [],
  onNavigate,
  onClose,
}: IncidentDetailPanelProps) {
  const [enrichment, setEnrichment] =
    useState<Enrichment | null>(null);

  const [loading, setLoading] =
    useState(false);
  const [refreshing, setRefreshing] =
    useState(false);
  const [actionMessage, setActionMessage] =
    useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] =
    useState(false);
  const [showStatusMenu, setShowStatusMenu] =
    useState(false);
  const [riskCreating, setRiskCreating] =
    useState(false);
  const [showRiskConfirmation, setShowRiskConfirmation] =
  useState(false);
  const [selectedControlIds, setSelectedControlIds] =
    useState<string[]>([]);
  const [mappedControlIds, setMappedControlIds] =
    useState<string[]>([]);
  const [controlMappingLoading, setControlMappingLoading] =
    useState(false);
  const [remediationCreating, setRemediationCreating] =
    useState(false);


  async function confirmRiskCreation() {
  if (
    !incident ||
    !enrichment ||
    risk ||
    riskCreating
  ) {
    return;
  }

  setShowRiskConfirmation(false);
  setRiskCreating(true);
  setActionMessage(null);

  try {
    const response = await fetch(
      `http://127.0.0.1:8000/risks/from-incident/${incident.id}`,
      {
        method: 'POST',
      },
    );

    if (!response.ok) {
      const errorData =
        await response.json().catch(() => null);

      throw new Error(
        errorData?.detail ||
          'Failed to create risk.',
      );
    }

    const createdRisk = await response.json();

    setActionMessage(
      `${createdRisk.risk_number || 'Risk'} created successfully.`,
    );

    window.location.reload();
  } catch (error) {
    console.error(
      'Failed to create risk:',
      error,
    );

    setActionMessage(
      error instanceof Error
        ? error.message
        : 'Failed to create risk.',
    );
  } finally {
    setRiskCreating(false);
  }
}

  async function refreshEnrichment() {
    if (!incident || refreshing) return;

    setRefreshing(true);
    setActionMessage(null);

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/incidents/${incident.id}/enrichment/refresh`,
        { method: 'POST' },
      );

      if (!response.ok) {
        const errorData =
          await response.json().catch(() => null);

        throw new Error(
          errorData?.detail ||
            'Failed to refresh enrichment.',
        );
      }

      const data = await response.json();
      setEnrichment(data);
      setActionMessage(
        'Enrichment refreshed successfully.',
      );
    } catch (error) {
      console.error(
        'Failed to refresh incident enrichment:',
        error,
      );

      setActionMessage(
        error instanceof Error
          ? error.message
          : 'Failed to refresh enrichment.',
      );
    } finally {
      setRefreshing(false);
    }
  }

  async function updateIncidentStatus(
    newStatus: string,
  ) {
    if (!incident || statusUpdating) return;

    setStatusUpdating(true);
    setActionMessage(null);
    setShowStatusMenu(false);

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/incidents/${incident.id}/status`,
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
            'Failed to update incident status.',
        );
      }

      setActionMessage(
        `Incident status updated to ${newStatus}.`,
      );

      window.location.reload();
    } catch (error) {
      console.error(
        'Failed to update incident status:',
        error,
      );

      setActionMessage(
        error instanceof Error
          ? error.message
          : 'Failed to update incident status.',
      );
    } finally {
      setStatusUpdating(false);
    }
  }

  function createRiskFromIncident() {
    if (
      !incident ||
      !enrichment ||
      risk ||
      riskCreating
    ) {
      return;
    }

    setActionMessage(null);
    setShowRiskConfirmation(true);
  }

  useEffect(() => {
    if (!incident) {
      setEnrichment(null);
      return;
    }

    const incidentId = incident.id;

    async function loadEnrichment() {
      setLoading(true);

      try {
        const response = await fetch(
          `http://127.0.0.1:8000/incidents/${incidentId}/enrichment`,
        );

        if (!response.ok) {
          setEnrichment(null);
          return;
        }

        const data = await response.json();

        setEnrichment(data);
      } catch (error) {
        console.error(
          'Failed to load incident enrichment:',
          error,
        );

        setEnrichment(null);
      } finally {
        setLoading(false);
      }
    }

    loadEnrichment();
  }, [incident]);

  const risk = useMemo(() => {
    if (!incident) {
      return null;
    }

    return (
      risks.find(
        (item) =>
          item.incident_id === incident.id,
      ) ?? null
    );
  }, [incident, risks]);

  useEffect(() => {
    if (!risk) {
      setMappedControlIds([]);
      setSelectedControlIds([]);
      return;
    }

    const riskId = risk.id;

    async function loadRiskControls() {
      try {
        const response = await fetch(
          'http://127.0.0.1:8000/risk-controls',
        );

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        const relationships = Array.isArray(data)
          ? data
          : Array.isArray(data?.value)
            ? data.value
            : [];

        const mappedIds = relationships
          .filter(
            (item: { risk_id?: string }) =>
              item.risk_id === riskId,
          )
          .map(
            (item: { control_id?: string }) =>
              item.control_id,
          )
          .filter(
            (id: string | undefined): id is string =>
              Boolean(id),
          );

        setMappedControlIds(mappedIds);
        setSelectedControlIds(mappedIds);
      } catch (error) {
        console.error(
          'Failed to load risk-control mappings:',
          error,
        );
      }
    }

    loadRiskControls();
  }, [risk]);

  async function applySelectedControls() {
    if (
      !risk ||
      selectedControlIds.length === 0 ||
      controlMappingLoading
    ) {
      return;
    }

    setControlMappingLoading(true);
    setActionMessage(null);

    try {
      const results = await Promise.all(
        selectedControlIds.map(async (controlId) => {
          const response = await fetch(
            `http://127.0.0.1:8000/risk-controls?risk_id=${encodeURIComponent(
              risk.id,
            )}&control_id=${encodeURIComponent(
              controlId,
            )}&relationship=mitigates`,
            {
              method: 'POST',
            },
          );

          if (!response.ok) {
            const errorData =
              await response.json().catch(() => null);

            throw new Error(
              errorData?.detail ||
                'Failed to map selected control.',
            );
          }

          return response.json();
        }),
      );

      const successfulIds = results
        .map(
          (result: { control_id?: string }) =>
            result.control_id,
        )
        .filter(
          (id: string | undefined): id is string =>
            Boolean(id),
        );

      setMappedControlIds((current) =>
        Array.from(
          new Set([
            ...current,
            ...successfulIds,
          ]),
        ),
      );

      const createdCount = results.filter(
        (result: { created?: boolean }) =>
          result.created === true,
      ).length;

      const reusedCount =
        results.length - createdCount;

      const mappingSummary = [
        createdCount > 0
          ? `${createdCount} new`
          : '',
        reusedCount > 0
          ? `${reusedCount} existing`
          : '',
      ]
        .filter(Boolean)
        .join(' and ');

      setActionMessage(
        `${mappingSummary || results.length} control${
          results.length > 1 ? 's' : ''
        } mapped to ${risk.risk_number}.`,
      );
    } catch (error) {
      console.error(
        'Failed to apply selected controls:',
        error,
      );

      setActionMessage(
        error instanceof Error
          ? error.message
          : 'Failed to apply selected controls.',
      );
    } finally {
      setControlMappingLoading(false);
    }
  }

  async function createRemediationPlan() {
  if (!risk || remediationCreating) {
    return;
  }

  setRemediationCreating(true);
  setActionMessage(null);

  try {
    const response = await fetch(
      `http://127.0.0.1:8000/remediations/from-risk/${risk.id}`,
      {
        method: 'POST',
      },
    );

    if (!response.ok) {
      const errorData =
        await response.json().catch(() => null);

      throw new Error(
        errorData?.detail ||
          'Failed to create remediation plan.',
      );
    }

    const remediationResults = await response.json();

    const results = Array.isArray(remediationResults)
      ? remediationResults
      : [];

    setActionMessage(
      results.length > 0
        ? `${results.length} remediation record${
            results.length > 1 ? 's' : ''
          } created or reused for ${risk.risk_number}.`
        : `No remediation records were returned for ${risk.risk_number}.`,
    );
  } catch (error) {
    console.error(
      'Failed to create remediation plan:',
      error,
    );

    setActionMessage(
      error instanceof Error
        ? error.message
        : 'Failed to create remediation plan.',
    );
  } finally {
    setRemediationCreating(false);
  }
}

  /*
   * GRC relationship chain:
   *
   * Incident
   *   ↓
   * Enrichment
   *   ↓
   * Control
   *   ↓
   * Evidence
   */

  const incidentControls = useMemo(() => {
    if (!enrichment) {
      return [];
    }

    return enrichment.recommended_controls.map(
      (recommended) => {
        const existing = controls.find(
          (control) =>
            control.control_id ===
            recommended.id,
        );

        return (
          existing ?? {
            id: `recommended-${recommended.id}`,
            control_id: recommended.id,
            name: recommended.name,
            description: '',
            control_type: 'detective',
            status: 'planned',
            owner: null,
            created_at: '',
            updated_at: '',
          }
        );
      },
    );
  }, [enrichment, controls]);

  const mappedIncidentControls = useMemo(() => {
    if (mappedControlIds.length === 0) {
      return [];
    }

    const mappedIds = new Set(mappedControlIds);

    return controls.filter((control) =>
      mappedIds.has(control.id),
    );
  }, [controls, mappedControlIds]);

  const incidentEvidence = useMemo(() => {
    if (mappedIncidentControls.length === 0) {
      return [];
    }

    const controlIds = new Set(
      mappedIncidentControls.map(
        (control) => control.id,
      ),
    );

    return evidence.filter((item) =>
      controlIds.has(item.control_id),
    );
  }, [mappedIncidentControls, evidence]);

  const incidentControlTests = useMemo(() => {
    if (incidentEvidence.length === 0) {
      return [];
    }

    const evidenceIds = new Set(
      incidentEvidence.map(
        (item) => item.id,
      ),
    );

    return controlTests.filter((item) =>
      evidenceIds.has(item.evidence_id),
    );
  }, [incidentEvidence, controlTests]);

  const incidentRemediations = useMemo(() => {
    if (!risk) {
      return [];
    }

    return remediations.filter(
      (item) => item.risk_id === risk.id,
    );
  }, [risk, remediations]);

  const incidentVerifications = useMemo(() => {
    const remediationIds = new Set(
      incidentRemediations.map(
        (item) => item.id,
      ),
    );

    return verifications.filter((item) =>
      remediationIds.has(
        item.remediation_id,
      ),
    );
  }, [
    incidentRemediations,
    verifications,
  ]);

  if (!incident) {
    return null;
  }

  return (
    <div
      className="detail-overlay"
      onClick={onClose}
    >
      <aside
        className="detail-panel"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        {/* HEADER */}

        <header className="detail-panel-header">
          <div>
            <div className="eyebrow">
              SOC OPERATIONS
              <span>•</span>
              INCIDENT
            </div>

            <h2>
              {text(
                incident.incident_number,
              )}
            </h2>

            <p>
              {text(incident.title)}
            </p>
          </div>

          <button
            type="button"
            className="detail-close"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        {/* STATUS */}

        <div className="detail-status-row">
          <span
            className={`table-badge ${className(
              incident.severity,
            )}`}
          >
            {text(incident.severity)}
          </span>

          <span
            className={`table-badge ${className(
              incident.status,
            )}`}
          >
            {text(incident.status)}
          </span>
        </div>
        {/* ANALYST ACTIONS */}

        <section className="detail-section incident-actions-section">
          <SectionTitle>
            ANALYST ACTIONS
          </SectionTitle>

          <div className="incident-action-row">
            <button
              type="button"
              className="incident-action-button primary"
              onClick={refreshEnrichment}
              disabled={refreshing}
            >
              {refreshing
                ? 'Refreshing...'
                : 'Refresh Enrichment'}
            </button>

            <div className="incident-status-action">
              <button
                type="button"
                className="incident-action-button secondary"
                onClick={() =>
                  setShowStatusMenu(
                    (current) => !current,
                  )
                }
                disabled={statusUpdating}
                aria-expanded={showStatusMenu}
                aria-haspopup="menu"
              >
                {statusUpdating
                  ? 'Updating...'
                  : 'Change Status'}
              </button>

              {showStatusMenu && (
                <div
                  className="incident-status-menu"
                  role="menu"
                >
                  {[
                    'open',
                    'investigating',
                    'containment',
                    'remediation',
                    'verification',
                    'resolved',
                  ].map((status) => (
                    <button
                      key={status}
                      type="button"
                      role="menuitem"
                      className={
                        status ===
                        incident.status.toLowerCase()
                          ? 'active'
                          : ''
                      }
                      onClick={() =>
                        updateIncidentStatus(status)
                      }
                    >
                      {status
                        .charAt(0)
                        .toUpperCase() +
                        status.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {risk ? (
              <>
                <button
                  type="button"
                  className="incident-action-button secondary"
                  onClick={() => onNavigate('Risks')}
                  disabled={
                    riskCreating ||
                    remediationCreating
                  }
                >
                  View Risk
                </button>

                <button
                  type="button"
                  className="incident-action-button primary"
                  onClick={createRemediationPlan}
                  disabled={remediationCreating}
                  title="Create or reuse remediation records for the controls currently mapped to this risk."
                >
                  {remediationCreating
                    ? 'Creating Plan...'
                    : 'Create Remediation Plan'}
                </button>
              </>
            ) : (
              <button
                type="button"
                className="incident-action-button secondary"
                onClick={createRiskFromIncident}
                disabled={
                  riskCreating ||
                  !enrichment
                }
                title={
                  !enrichment
                    ? 'Enrich the incident before creating a risk.'
                    : 'Create a risk using the current enrichment assessment.'
                }
              >
                {riskCreating
                  ? 'Creating Risk...'
                  : 'Assess Risk'}
              </button>
            )}
          </div>

          {actionMessage && (
            <div className="incident-action-message">
              {actionMessage}
            </div>
          )}
        </section>

        {/* INCIDENT */}

        <section className="detail-section">
          <SectionTitle>
            INCIDENT INFORMATION
          </SectionTitle>

          <div className="detail-grid">
            <InfoCard
              label="Incident Number"
              value={text(
                incident.incident_number,
              )}
            />

            <InfoCard
              label="Severity"
              value={text(
                incident.severity,
              )}
            />

            <InfoCard
              label="Status"
              value={text(
                incident.status,
              )}
            />

            <InfoCard
              label="Username"
              value={text(
                incident.username,
              )}
            />

            <InfoCard
              label="Source IP"
              value={text(
                incident.source_ip,
              )}
            />

            <InfoCard
              label="Created"
              value={formatDate(
                incident.created_at,
              )}
            />
          </div>
        </section>

        {/* DESCRIPTION */}

        <section className="detail-section">
          <SectionTitle>
            DESCRIPTION
          </SectionTitle>

          <div className="detail-description">
            {text(
              incident.description,
              'No description available.',
            )}
          </div>
        </section>

        {/* ENRICHMENT */}

        <section className="detail-section">
          <SectionTitle>
            THREAT ENRICHMENT
          </SectionTitle>

          {loading ? (
            <div className="detail-empty">
              Loading threat enrichment...
            </div>
          ) : enrichment ? (
            <>
              <div className="detail-grid">
                <InfoCard
                  label="Related Events"
                  value={String(
                    enrichment.related_event_count,
                  )}
                />

                <InfoCard
                  label="Risk Score"
                  value={`${enrichment.risk_score}/100`}
                />

                <InfoCard
                  label="Risk Level"
                  value={text(
                    enrichment.risk_level,
                  )}
                />

                <InfoCard
                  label="MITRE Techniques"
                  value={String(
                    enrichment
                      .mitre_techniques.length,
                  )}
                />
              </div>

              {/* MITRE */}

              {enrichment.mitre_techniques
                .length > 0 && (
                <div className="detail-subsection">
                  <SubTitle>
                    MITRE ATT&CK
                  </SubTitle>

                  <div className="mitre-list">
                    {enrichment.mitre_techniques.map(
                      (technique) => (
                        <div
                          className="mitre-item"
                          key={technique.id}
                        >
                          <strong>
                            {text(
                              technique.id,
                            )}
                          </strong>

                          <span>
                            {text(
                              technique.name,
                            )}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}

              {/* IOCS */}

              {enrichment.iocs.length > 0 && (
                <div className="detail-subsection">
                  <SubTitle>
                    INDICATORS OF COMPROMISE
                  </SubTitle>

                  <div className="ioc-list">
                    {enrichment.iocs
                      .slice(0, 8)
                      .map(
                        (ioc, index) => (
                          <div
                            className="ioc-item"
                            key={`${ioc.type}-${ioc.value}-${index}`}
                          >
                            <span>
                              {text(
                                ioc.type,
                              )}
                            </span>

                            <code>
                              {text(
                                ioc.value,
                              )}
                            </code>
                          </div>
                        ),
                      )}
                  </div>

                  {enrichment.iocs.length >
                    8 && (
                    <small className="detail-more">
                      +
                      {enrichment.iocs
                        .length - 8}{' '}
                      additional indicators
                    </small>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="detail-empty">
              No enrichment available.
            </div>
          )}
        </section>

        {/* RISK */}

        <section className="detail-section">
          <SectionTitle>
            RISK ASSESSMENT
          </SectionTitle>

          {risk ? (
            <div className="risk-card">
              <div className="risk-card-content">
                <span className="record-id">
                  {text(risk.risk_number)}
                </span>

                <h3>
                  {text(risk.title)}
                </h3>

                <p>
                  Treatment:{' '}
                  {text(risk.treatment)}
                  {' • '}
                  Owner:{' '}
                  {text(
                    risk.owner,
                    'Unassigned',
                  )}
                </p>
              </div>

              <div className="risk-score">
                <span
                  className={`table-badge ${className(
                    risk.risk_level,
                  )}`}
                >
                  {text(
                    risk.risk_level,
                  )}
                </span>

                <strong>
                  {text(
                    risk.risk_score,
                  )}
                  /100
                </strong>

                <small>
                  Risk Score
                </small>
              </div>
            </div>
          ) : (
            <div className="detail-empty">
              No risk record linked yet.
            </div>
          )}
        </section>

        {/* CONTROLS */}

        <section className="detail-section">
          <SectionTitle>
            RECOMMENDED CONTROLS
          </SectionTitle>

          {enrichment?.recommended_controls?.length ? (
            <>
              <div className="control-selection-note">
                AEGIS recommends these controls from the current
                incident enrichment. Select the controls you want
                to associate with the risk.
              </div>

              <div className="record-list">
                {incidentControls.map((control) => {
                  const isMapped = mappedControlIds.includes(
                    control.id,
                  );
                  const isSelected =
                    selectedControlIds.includes(control.id);

                  return (
                    <label
                      className={`control-selection-card${
                        isSelected
                          ? ' control-selection-selected'
                          : ''
                      }`}
                      key={control.id}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={
                          isMapped ||
                          controlMappingLoading
                        }
                        onChange={() => {
                          setSelectedControlIds((current) =>
                            current.includes(control.id)
                              ? current.filter(
                                  (id) => id !== control.id,
                                )
                              : [
                                  ...current,
                                  control.id,
                                ],
                          );
                        }}
                      />

                      <div className="control-selection-content">
                        <span className="record-id">
                          {text(control.control_id)}
                        </span>

                        <h3>
                          {text(control.name)}
                        </h3>

                        <p>
                          {text(
                            control.control_type,
                            'Detective',
                          )}
                        </p>
                      </div>

                      {isMapped ? (
                        <span className="table-badge success">
                          mapped
                        </span>
                      ) : null}
                    </label>
                  );
                })}
              </div>

              <div className="control-selection-actions">
                <button
                  type="button"
                  className="incident-action-button primary"
                  onClick={applySelectedControls}
                  disabled={
                    controlMappingLoading ||
                    !risk ||
                    selectedControlIds.length === 0 ||
                    selectedControlIds.every((id) =>
                      mappedControlIds.includes(id),
                    )
                  }
                >
                  {controlMappingLoading
                    ? 'Applying...'
                    : 'Apply Selected Controls'}
                </button>

                {!risk && (
                  <small>
                    Create the risk assessment before mapping controls.
                  </small>
                )}
              </div>
            </>
          ) : (
            <div className="detail-empty">
              No control recommendations are available from enrichment.
            </div>
          )}
        </section>

        <section className="detail-section">
          <SectionTitle>
            MITIGATING CONTROLS
          </SectionTitle>

          {mappedIncidentControls.length > 0 ? (
            <div className="record-list">
              {mappedIncidentControls.map(
                (control) => (
                  <div
                    className="control-card"
                    key={control.id}
                  >
                    <div>
                      <span className="record-id">
                        {text(control.control_id)}
                      </span>

                      <h3>
                        {text(control.name)}
                      </h3>

                      <p>
                        {text(
                          control.control_type,
                          'Detective',
                        )}
                      </p>
                    </div>

                    <span
                      className={`table-badge ${className(
                        control.status,
                      )}`}
                    >
                      {text(control.status)}
                    </span>
                  </div>
                ),
              )}
            </div>
          ) : (
            <div className="detail-empty">
              No mitigating controls have been selected yet.
            </div>
          )}
        </section>

        {/* EVIDENCE */}

        <section className="detail-section">
          <SectionTitle>
            EVIDENCE
          </SectionTitle>

          {incidentEvidence.length > 0 ? (
            <div className="record-list">
              {incidentEvidence.map(
                (item) => (
                  <div
                    className="control-card"
                    key={item.id}
                  >
                    <div>
                      <span className="record-id">
                        {text(
                          item.evidence_number,
                        )}
                      </span>

                      <h3>
                        {text(item.title)}
                      </h3>

                      <p>
                        Type:{' '}
                        {text(
                          item.evidence_type,
                        )}
                        {' • '}
                        Source:{' '}
                        {text(item.source)}
                      </p>
                    </div>

                    <span
                      className={`table-badge ${className(
                        item.status,
                      )}`}
                    >
                      {text(item.status)}
                    </span>
                  </div>
                ),
              )}
            </div>
          ) : (
            <div className="detail-empty">
              No evidence linked to the
              mitigating controls yet.
            </div>
          )}
        </section>
        {/* CONTROL TEST */}

        <section className="detail-section">
          <SectionTitle>
            CONTROL TEST
          </SectionTitle>

          {incidentControlTests.length > 0 ? (
            <div className="record-list">
              {incidentControlTests.map((test) => {
                const result = text(
                  test.result,
                ).toUpperCase();

                const resultClass =
                  result === 'PASS'
                    ? 'success'
                    : result === 'FAIL'
                      ? 'failed'
                      : 'partial';

                return (
                  <div
                    className="control-card"
                    key={test.id}
                  >
                    <div>
                      <span className="record-id">
                        {text(
                          test.test_number,
                        )}
                      </span>

                      <h3>
                        {text(
                          test.test_procedure,
                        )}
                      </h3>

                      <p>
                        Tester:{' '}
                        {text(
                          test.tester,
                          'Analyst',
                        )}
                        {' • '}
                        Tested:{' '}
                        {formatDate(
                          test.tested_at,
                        )}
                      </p>
                    </div>

                    <span
                      className={`table-badge ${resultClass}`}
                    >
                      {result}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="detail-empty">
              No control test has been recorded yet.
            </div>
          )}
        </section>

        {/* REMEDIATION */}

        <section className="detail-section">
          <SectionTitle>
            REMEDIATION
          </SectionTitle>

          {incidentRemediations.length >
          0 ? (
            <div className="record-list">
              {incidentRemediations.map(
                (remediation) => (
                  <div
                    className="control-card"
                    key={remediation.id}
                  >
                    <div>
                      <span className="record-id">
                        {text(
                          remediation.remediation_number,
                        )}
                      </span>

                      <h3>
                        {text(
                          remediation.title,
                        )}
                      </h3>

                      <p>
                        Priority:{' '}
                        {text(
                          remediation.priority,
                        )}
                        {' • '}
                        Owner:{' '}
                        {text(
                          remediation.owner,
                          'Unassigned',
                        )}
                      </p>
                    </div>

                    <span
                      className={`table-badge ${className(
                        remediation.status,
                      )}`}
                    >
                      {text(
                        remediation.status,
                      )}
                    </span>
                  </div>
                ),
              )}
            </div>
          ) : (
            <div className="detail-empty">
              No remediation record linked yet.
            </div>
          )}
        </section>

        {/* VERIFICATION */}

        <section className="detail-section">
          <SectionTitle>
            VERIFICATION
          </SectionTitle>

          {incidentVerifications.length >
          0 ? (
            <div className="record-list">
              {incidentVerifications.map(
                (verification) => {
                  const result =
                    text(
                      verification.result,
                    ).toUpperCase();

                  const resultClass =
                    result === 'PASS'
                      ? 'success'
                      : result === 'FAIL'
                        ? 'failed'
                        : 'partial';

                  return (
                    <div
                      className="control-card"
                      key={verification.id}
                    >
                      <div>
                        <span className="record-id">
                          {text(
                            verification.verification_number,
                          )}
                        </span>

                        <h3>
                          {text(
                            verification.verifier,
                            'Analyst',
                          )}
                        </h3>

                        <p>
                          {formatDate(
                            verification.verified_at,
                          )}
                        </p>
                      </div>

                      <span
                        className={`table-badge ${resultClass}`}
                      >
                        {result}
                      </span>
                    </div>
                  );
                },
              )}
            </div>
          ) : (
            <div className="verification-pending">
              <span className="pending-dot" />

              <div>
                <strong>
                  Verification pending
                </strong>

                <small>
                  No verification result has
                  been recorded yet.
                </small>
              </div>
            </div>
          )}
        </section>

        {/* WORKFLOW */}

        <section className="detail-section">
          <SectionTitle>
            SOC → GRC WORKFLOW
          </SectionTitle>

          <div className="workflow-track">
            <WorkflowStep
              label="Alert"
              description="Security detection generated"
              state="complete"
            />

            <WorkflowLine />

            <WorkflowStep
              label="Incident"
              description="Investigation record created"
              state="complete"
            />

            <WorkflowLine />

            <WorkflowStep
              label="Enrichment"
              description={
                loading
                  ? 'Processing threat context'
                  : enrichment
                    ? 'Events, IOCs and MITRE context available'
                    : 'Enrichment pending'
              }
              state={
                loading
                  ? 'processing'
                  : enrichment
                    ? 'complete'
                    : 'pending'
              }
            />

            <WorkflowLine />

            <WorkflowStep
              label="Risk"
              description={
                risk
                  ? `Risk assessment created • ${risk.risk_number}`
                  : 'Risk assessment pending'
              }
              state={
                risk
                  ? 'complete'
                  : 'pending'
              }
              clickable={Boolean(risk)}
              onClick={() => {
                if (risk) {
                  onNavigate('Risks');
                }
              }}
            />

            <WorkflowLine />

            <WorkflowStep
              label="Control"
              description={
                mappedIncidentControls.length > 0
                  ? `${mappedIncidentControls.length} mitigating control${
                      mappedIncidentControls.length > 1
                        ? 's'
                        : ''
                    } mapped`
                  : 'Control mapping pending'
              }
              state={
                mappedIncidentControls.length > 0
                  ? 'complete'
                  : 'pending'
              }
              clickable={
                mappedIncidentControls.length > 0
              }
              onClick={() => {
                if (
                  mappedIncidentControls.length > 0
                ) {
                  onNavigate('Controls');
                }
              }}
            />

            <WorkflowLine />

            <WorkflowStep
              label="Evidence"
              description={
                incidentEvidence.length > 0
                  ? `${incidentEvidence.length} evidence record${
                      incidentEvidence.length > 1
                        ? 's'
                        : ''
                    } collected`
                  : 'Evidence collection pending'
              }
              state={
                incidentEvidence.length > 0
                  ? 'complete'
                  : 'pending'
              }
              clickable={
                incidentEvidence.length > 0
              }
              onClick={() => {
                if (
                  incidentEvidence.length > 0
                ) {
                  onNavigate('Evidence');
                }
              }}
            />

            <WorkflowLine />
            <WorkflowLine />

<WorkflowStep
  label="Control Test"
  description={
    incidentControlTests.length > 0
      ? `${incidentControlTests.length} control test${
          incidentControlTests.length > 1
            ? 's'
            : ''
        } recorded`
      : 'Control testing pending'
  }
  state={
    incidentControlTests.length > 0
      ? 'complete'
      : 'pending'
  }
/>

            <WorkflowStep
              label="Remediation"
              description={
                incidentRemediations.length === 0
                  ? 'Remediation pending'
                  : incidentRemediations.some(
                        (item) =>
                          [
                            'completed',
                            'closed',
                          ].includes(
                            item.status.toLowerCase(),
                          ),
                      )
                    ? 'Risk treatment completed'
                    : 'Risk treatment in progress'
              }
              state={
                incidentRemediations.length === 0
                  ? 'pending'
                  : incidentRemediations.some(
                        (item) =>
                          [
                            'completed',
                            'closed',
                          ].includes(
                            item.status.toLowerCase(),
                          ),
                      )
                    ? 'complete'
                    : 'processing'
              }
              clickable={
                incidentRemediations.length > 0
              }
              onClick={() => {
                if (
                  incidentRemediations.length > 0
                ) {
                  onNavigate('Remediation');
                }
              }}
            />

            <WorkflowLine />

            <WorkflowStep
              label="Verification"
              description={
                incidentVerifications.length === 0
                  ? 'Verification pending'
                  : 'Effectiveness validation recorded'
              }
              state={
                incidentVerifications.length === 0
                  ? 'pending'
                  : (() => {
                      const latest =
                        incidentVerifications[
                          incidentVerifications.length -
                            1
                        ];

                      const result =
                        latest.result.toUpperCase();

                      if (result === 'PASS') {
                        return 'complete';
                      }

                      if (result === 'FAIL') {
                        return 'failed';
                      }

                      return 'warning';
                    })()
              }
              clickable={
                incidentVerifications.length > 0
              }
              onClick={() => {
                if (
                  incidentVerifications.length > 0
                ) {
                  onNavigate('Verification');
                }
              }}
            />
          </div>
        </section>

        {/* REFERENCES */}

        <section className="detail-section">
          <SectionTitle>
            SYSTEM REFERENCE
          </SectionTitle>

          <Reference
            label="Incident ID"
            value={incident.id}
          />

          <Reference
            label="Alert ID"
            value={incident.alert_id}
          />

          <Reference
            label="Asset ID"
            value={incident.asset_id}
          />
        </section>

        {showRiskConfirmation && enrichment && incident && (
          <div
            className="risk-modal-overlay"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setShowRiskConfirmation(false);
              }
            }}
          >
            <div
              className="risk-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="risk-modal-title"
            >
              <div className="risk-modal-header">
                <div>
                  <div className="risk-modal-eyebrow">
                    RISK ASSESSMENT
                  </div>

                  <h3 id="risk-modal-title">
                    Create Risk Record
                  </h3>
                </div>

                <button
                  type="button"
                  className="risk-modal-close"
                  aria-label="Close risk confirmation"
                  onClick={() =>
                    setShowRiskConfirmation(false)
                  }
                  disabled={riskCreating}
                >
                  ×
                </button>
              </div>

              <div className="risk-modal-body">
                <p className="risk-modal-description">
                  AEGIS has assessed this incident using
                  the current threat enrichment.
                </p>

                <div className="risk-summary-grid">
                  <div className="risk-summary-item">
                    <span>INCIDENT</span>
                    <strong>{incident.incident_number}</strong>
                  </div>

                  <div className="risk-summary-item">
                    <span>RISK LEVEL</span>
                    <strong className="risk-level">
                      {enrichment.risk_level}
                    </strong>
                  </div>

                  <div className="risk-summary-item">
                    <span>RISK SCORE</span>
                    <strong>
                      {enrichment.risk_score}/100
                    </strong>
                  </div>

                  <div className="risk-summary-item">
                    <span>TREATMENT</span>
                    <strong>Mitigate</strong>
                  </div>
                </div>

                <div className="risk-modal-note">
                  The risk score and level are based on the
                  current AEGIS enrichment assessment.
                </div>
              </div>

              <div className="risk-modal-footer">
                <button
                  type="button"
                  className="risk-modal-btn cancel"
                  onClick={() =>
                    setShowRiskConfirmation(false)
                  }
                  disabled={riskCreating}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="risk-modal-btn create"
                  onClick={confirmRiskCreation}
                  disabled={riskCreating}
                >
                  {riskCreating
                    ? 'Creating Risk...'
                    : 'Create Risk'}
                </button>
              </div>
            </div>
          </div>
        )}

        <style>{`
          .control-selection-note {
            margin-bottom: 12px;
            padding: 10px 12px;
            border: 1px solid #dbe7f3;
            border-radius: 8px;
            background: #f8fbff;
            color: #64748b;
            font-size: 11px;
            line-height: 1.5;
          }

          .control-selection-card {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 13px;
            margin-bottom: 8px;
            border: 1px solid #e2e8f0;
            border-radius: 9px;
            background: #ffffff;
            cursor: pointer;
          }

          .control-selection-card:hover {
            border-color: #bfdbfe;
            background: #f8fbff;
          }

          .control-selection-card.control-selection-selected {
            border-color: #93c5fd;
            background: #f8fbff;
          }

          .control-selection-card input {
            width: 15px;
            height: 15px;
            flex: 0 0 15px;
            accent-color: #2563eb;
          }

          .control-selection-content {
            min-width: 0;
            flex: 1;
          }

          .control-selection-content h3 {
            margin: 4px 0 3px;
            font-size: 12px;
            font-weight: 800;
            color: #173b6b;
          }

          .control-selection-content p {
            margin: 0;
            font-size: 10px;
            color: #64748b;
            text-transform: capitalize;
          }

          .control-selection-actions {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-top: 10px;
          }

          .control-selection-actions small {
            color: #64748b;
            font-size: 10px;
          }

          .risk-modal-overlay {
            position: fixed;
            inset: 0;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            background: rgba(15, 23, 42, 0.32);
            backdrop-filter: blur(3px);
          }

          .risk-modal {
            width: 460px;
            max-width: calc(100vw - 40px);
            overflow: hidden;
            background: #ffffff;
            border: 1px solid #dbe5f0;
            border-radius: 14px;
            box-shadow:
              0 24px 60px rgba(15, 23, 42, 0.20),
              0 4px 12px rgba(15, 23, 42, 0.08);
          }

          .risk-modal-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 20px;
            padding: 20px 22px 16px;
            border-bottom: 1px solid #e8eef5;
          }

          .risk-modal-eyebrow {
            margin-bottom: 5px;
            font-size: 9px;
            font-weight: 800;
            letter-spacing: 0.12em;
            color: #64748b;
          }

          .risk-modal-header h3 {
            margin: 0;
            font-size: 17px;
            font-weight: 800;
            color: #12345b;
          }

          .risk-modal-close {
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 0;
            border-radius: 7px;
            background: transparent;
            color: #64748b;
            font-size: 22px;
            line-height: 1;
            cursor: pointer;
          }

          .risk-modal-close:hover {
            background: #f1f5f9;
            color: #0f2d55;
          }

          .risk-modal-body {
            padding: 20px 22px;
          }

          .risk-modal-description {
            margin: 0 0 16px;
            font-size: 12px;
            line-height: 1.6;
            color: #475569;
          }

          .risk-summary-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }

          .risk-summary-item {
            padding: 12px 13px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 9px;
          }

          .risk-summary-item span {
            display: block;
            margin-bottom: 5px;
            font-size: 9px;
            font-weight: 800;
            letter-spacing: 0.08em;
            color: #64748b;
          }

          .risk-summary-item strong {
            display: block;
            font-size: 12px;
            font-weight: 800;
            color: #173b6b;
          }

          .risk-summary-item .risk-level {
            color: #dc2626;
            text-transform: capitalize;
          }

          .risk-modal-note {
            margin-top: 16px;
            padding-top: 13px;
            border-top: 1px solid #edf2f7;
            font-size: 11px;
            line-height: 1.5;
            color: #64748b;
          }

          .risk-modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 9px;
            padding: 14px 22px 18px;
            background: #fbfdff;
            border-top: 1px solid #e8eef5;
          }

          .risk-modal-btn {
            min-width: 96px;
            height: 34px;
            padding: 0 15px;
            border-radius: 7px;
            font-size: 11px;
            font-weight: 800;
            cursor: pointer;
          }

          .risk-modal-btn.cancel {
            border: 1px solid #cbd5e1;
            background: #ffffff;
            color: #334155;
          }

          .risk-modal-btn.cancel:hover {
            background: #f8fafc;
          }

          .risk-modal-btn.create {
            border: 1px solid #2563eb;
            background: #2563eb;
            color: #ffffff;
          }

          .risk-modal-btn.create:hover {
            background: #1d4ed8;
          }

          .risk-modal-btn:disabled,
          .risk-modal-close:disabled {
            opacity: 0.55;
            cursor: not-allowed;
          }

          @media (max-width: 520px) {
            .risk-modal {
              width: calc(100vw - 28px);
            }

            .risk-summary-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </aside>
    </div>
  );
}

/* =========================================================
   SMALL COMPONENTS
   ========================================================= */

function SectionTitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="detail-section-title">
      {children}
    </div>
  );
}

function SubTitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="detail-subtitle">
      {children}
    </div>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="detail-field">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function WorkflowStep({
  label,
  description,
  state,
  clickable = false,
  onClick,
}: {
  label: string;
  description: string;
  state:
    | 'complete'
    | 'processing'
    | 'pending'
    | 'warning'
    | 'failed';
  clickable?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      className={`workflow-step workflow-${state}${
        clickable
          ? ' workflow-clickable'
          : ''
      }`}
      onClick={
        clickable
          ? onClick
          : undefined
      }
      role={
        clickable
          ? 'button'
          : undefined
      }
      tabIndex={
        clickable
          ? 0
          : undefined
      }
      onKeyDown={(event) => {
        if (
          clickable &&
          (
            event.key === 'Enter' ||
            event.key === ' '
          )
        ) {
          event.preventDefault();
          onClick?.();
        }
      }}
    >
      <div className="workflow-dot">
        {state === 'complete' && '✓'}
        {state === 'processing' && '•'}
        {state === 'warning' && '!'}
        {state === 'failed' && '!'}
      </div>

      <div>
        <strong>
          {label}
        </strong>

        <span>
          {description}
        </span>
      </div>
    </div>
  );
}

function WorkflowLine() {
  return (
    <div className="workflow-line" />
  );
}

function Reference({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) {
  return (
    <div className="detail-reference">
      <span>{label}</span>
      <code>{text(value)}</code>
    </div>
  );
}