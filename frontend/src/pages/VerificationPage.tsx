import { useMemo, useState } from 'react';
import type {
  Verification,
  Remediation,
  Control,
  Evidence,
} from '../api/dashboard';

interface VerificationPageProps {
  verifications: Verification[];
}

const API = 'http://127.0.0.1:8000';

function badgeClass(value: string) {
  const normalized = String(value ?? '').toLowerCase();

  if (normalized === 'pass') return 'success';
  if (normalized === 'fail') return 'critical';
  if (normalized === 'partial') return 'orange';

  if (
    normalized === 'verified' ||
    normalized === 'accepted' ||
    normalized === 'collected' ||
    normalized === 'completed'
  ) {
    return 'success';
  }

  if (
    normalized === 'pending' ||
    normalized === 'not_verified' ||
    normalized === 'unverified' ||
    normalized === 'in_progress'
  ) {
    return 'orange';
  }

  if (normalized === 'rejected' || normalized === 'failed') {
    return 'critical';
  }

  return normalized;
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—';

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleString();
}

export default function VerificationPage({
  verifications,
}: VerificationPageProps) {
  const [localVerifications, setLocalVerifications] =
    useState<Verification[]>(verifications);

  const [remediations, setRemediations] =
    useState<Remediation[]>([]);

  const [controls, setControls] =
    useState<Control[]>([]);

  const [evidence, setEvidence] =
    useState<Evidence[]>([]);

  const [selected, setSelected] =
    useState<Verification | null>(null);

  const [showCreate, setShowCreate] =
    useState(false);

  const [selectedRemediation, setSelectedRemediation] =
    useState<Remediation | null>(null);

  const [procedure, setProcedure] = useState('');
  const [result, setResult] =
    useState<'PASS' | 'PARTIAL' | 'FAIL'>('PASS');

  const [findings, setFindings] = useState('');
  const [verifier, setVerifier] = useState('SOC Analyst');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [remediationLoading, setRemediationLoading] =
    useState(false);

  const [remediationLoadError, setRemediationLoadError] =
    useState<string | null>(null);

  const [actionMessage, setActionMessage] =
    useState<string | null>(null);

  const selectedControl = useMemo(() => {
    if (!selected?.control_id) return null;

    return (
      controls.find(
        (control) =>
          control.id === selected.control_id,
      ) ?? null
    );
  }, [selected, controls]);

  const selectedEvidence = useMemo(() => {
    if (!selected?.control_id) return [];

    return evidence.filter(
      (item) =>
        item.control_id === selected.control_id,
    );
  }, [selected, evidence]);

  const selectedRemediationEvidence = useMemo(() => {
    if (!selectedRemediation?.control_id) return [];

    return evidence.filter(
      (item) =>
        item.control_id === selectedRemediation.control_id,
    );
  }, [selectedRemediation, evidence]);

  const evidenceReadiness = useMemo(() => {
    const items = selectedRemediationEvidence;

    const collected = items.some(
      (item) =>
        String(item.status ?? '').toLowerCase() ===
        'collected',
    );

    const integrityVerified = items.some(
      (item) =>
        String(item.status ?? '').toLowerCase() ===
          'collected' &&
        String(item.integrity_status ?? '').toLowerCase() ===
          'verified',
    );

    const analystAccepted = items.some(
      (item) =>
        String(item.status ?? '').toLowerCase() ===
          'collected' &&
        String(item.integrity_status ?? '').toLowerCase() ===
          'verified' &&
        String(item.review_status ?? '').toLowerCase() ===
          'accepted',
    );

    return {
      items,
      collected,
      integrityVerified,
      analystAccepted,
      ready:
        collected &&
        integrityVerified &&
        analystAccepted,
    };
  }, [selectedRemediationEvidence]);

  async function loadTraceability() {
    setRemediationLoading(true);
    setRemediationLoadError(null);

    try {
      const remediationsResponse =
        await fetch(`${API}/remediations`);

      if (!remediationsResponse.ok) {
        const errorData =
          await remediationsResponse.json().catch(() => null);

        throw new Error(
          errorData?.detail ||
            `Failed to load remediations (${remediationsResponse.status}).`,
        );
      }

      const remediationsData =
        await remediationsResponse.json();

      const remediationList =
        Array.isArray(remediationsData)
          ? remediationsData
          : Array.isArray(remediationsData?.items)
            ? remediationsData.items
            : Array.isArray(remediationsData?.results)
              ? remediationsData.results
              : [];

      setRemediations(remediationList);
    } catch (error) {
      console.error(
        'Failed to load remediations:',
        error,
      );

      setRemediations([]);

      setRemediationLoadError(
        error instanceof Error
          ? error.message
          : 'Failed to load remediations.',
      );
    } finally {
      setRemediationLoading(false);
    }

    try {
      const [
        controlsResponse,
        evidenceResponse,
      ] = await Promise.all([
        fetch(`${API}/controls`),
        fetch(`${API}/evidence`),
      ]);

      if (controlsResponse.ok) {
        const data =
          await controlsResponse.json();

        setControls(
          Array.isArray(data) ? data : [],
        );
      }

      if (evidenceResponse.ok) {
        const data =
          await evidenceResponse.json();

        setEvidence(
          Array.isArray(data) ? data : [],
        );
      }
    } catch (error) {
      console.error(
        'Failed to load verification traceability:',
        error,
      );
    }
  }

  async function openVerification(
    verification: Verification,
  ) {
    setSelected(verification);
    setActionMessage(null);
    await loadTraceability();
  }

  function openCreateVerification() {
    setActionMessage(null);
    setSelected(null);
    setSelectedRemediation(null);

    setProcedure('');
    setResult('PASS');
    setFindings('');
    setVerifier('SOC Analyst');
    setNotes('');

    setShowCreate(true);
    loadTraceability();
  }

  const eligibleRemediations =
    remediations.filter((item) => {
      const status =
        String(item.status ?? '').toLowerCase();

      const verificationStatus =
        String(
          item.verification_status ?? '',
        ).toLowerCase();

      return (
        status === 'completed' &&
        verificationStatus !== 'verified'
      );
    });

  async function createVerification() {
    if (
      !selectedRemediation ||
      loading
    ) {
      return;
    }

    if (!selectedRemediation.control_id) {
      setActionMessage(
        'This remediation has no linked control and cannot be verified.',
      );
      return;
    }

    if (!evidenceReadiness.ready) {
      setActionMessage(
        'Verification requires collected, integrity-verified, and analyst-accepted evidence for the associated control.',
      );
      return;
    }

    if (
      !procedure.trim() ||
      procedure.trim().length < 10
    ) {
      setActionMessage(
        'Verification procedure must contain at least 10 characters.',
      );
      return;
    }

    setLoading(true);
    setActionMessage(null);

    try {
      const response = await fetch(
        `${API}/verifications`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            remediation_id:
              selectedRemediation.id,

            control_id:
              selectedRemediation.control_id,

            verification_procedure:
              procedure.trim(),

            result,

            findings:
              findings.trim() || null,

            verifier:
              verifier.trim() || 'analyst',

            notes:
              notes.trim() || null,
          }),
        },
      );

      if (!response.ok) {
        const errorData =
          await response.json().catch(() => null);

        throw new Error(
          errorData?.detail ||
            'Failed to create verification.',
        );
      }

      const created =
        await response.json();

      setLocalVerifications((current) => [
        created,
        ...current,
      ]);

      setSelected(created);
      setShowCreate(false);

      setActionMessage(
        `${created.verification_number} recorded with result ${created.result}.`,
      );

      await loadTraceability();
    } catch (error) {
      console.error(
        'Failed to create verification:',
        error,
      );

      setActionMessage(
        error instanceof Error
          ? error.message
          : 'Failed to create verification.',
      );
    } finally {
      setLoading(false);
    }
  }

  const passed =
    localVerifications.filter(
      (item) =>
        item.result.toUpperCase() === 'PASS',
    ).length;

  const partial =
    localVerifications.filter(
      (item) =>
        item.result.toUpperCase() ===
        'PARTIAL',
    ).length;

  const failed =
    localVerifications.filter(
      (item) =>
        item.result.toUpperCase() ===
        'FAIL',
    ).length;

  return (
    <section className="page-content">
      <div className="page-header">
        <div>
          <div className="eyebrow">
            GRC MANAGEMENT <span>•</span> ASSURANCE
          </div>

          <h1>Verification</h1>

          <p>
            Validate remediation effectiveness
            using recorded evidence.
          </p>
        </div>
      </div>

      <div className="metric-grid page-metrics">
        <div className="metric-card green">
          <div className="metric-top">
            <span>Passed</span>
          </div>

          <div className="metric-value">
            {passed}
          </div>
        </div>

        <div className="metric-card warning">
          <div className="metric-top">
            <span>Partial</span>
          </div>

          <div className="metric-value">
            {partial}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span>Failed</span>
          </div>

          <div className="metric-value">
            {failed}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span>Total Tests</span>
          </div>

          <div className="metric-value">
            {localVerifications.length}
          </div>
        </div>
      </div>

      <div className="table-card page-table">
        <div className="table-header">
          <div>
            <h3>Verification Register</h3>

            <span>
              Recorded control and remediation
              verification results
            </span>
          </div>

          <button
            type="button"
            className="incident-action-button primary"
            onClick={openCreateVerification}
          >
            Perform Verification
          </button>
        </div>

        <div className="page-table-scroll">
          {localVerifications.length === 0 ? (
            <div className="empty-state">
              No verification records available.
            </div>
          ) : (
            localVerifications.map((item) => (
              <div
                className="page-record verification-record"
                key={item.id}
                onClick={() =>
                  openVerification(item)
                }
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (
                    event.key === 'Enter' ||
                    event.key === ' '
                  ) {
                    event.preventDefault();
                    openVerification(item);
                  }
                }}
              >
                <div className="page-record-main">
                  <strong>
                    {item.verification_number}
                  </strong>

                  <span>
                    {item.verification_procedure}
                  </span>

                  <small>
                    Verifier: {item.verifier}
                  </small>
                </div>

                <span
                  className={`table-badge ${badgeClass(
                    item.result,
                  )}`}
                >
                  {item.result}
                </span>

                <span className="page-record-meta">
                  {formatDate(item.verified_at)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {actionMessage && (
        <div className="incident-action-message">
          {actionMessage}
        </div>
      )}

      {showCreate && (
        <div
          className="detail-overlay"
          onClick={() => setShowCreate(false)}
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
                  ASSURANCE
                </div>

                <h2>Perform Verification</h2>

                <p>
                  Verify a completed remediation
                  using validated evidence.
                </p>
              </div>

              <button
                type="button"
                className="detail-close-button"
                onClick={() =>
                  setShowCreate(false)
                }
              >
                ×
              </button>
            </div>

            <div className="detail-section">
              <div className="detail-section-title">
                <div>
                  <h3>
                    Completed Remediations
                  </h3>

                  <span>
                    Verification is available only
                    after remediation completion.
                  </span>
                </div>
              </div>

              {remediationLoading ? (
                <div className="empty-state">
                  Loading completed remediations...
                </div>
              ) : remediationLoadError ? (
                <div className="empty-state">
                  {remediationLoadError}
                </div>
              ) : eligibleRemediations.length === 0 ? (
                <div className="empty-state">
                  No completed, unverified
                  remediations are currently
                  available for verification.
                </div>
              ) : (
                <div className="record-list">
                  {eligibleRemediations.map(
                    (item) => {
                      const itemEvidence =
                        evidence.filter(
                          (entry) =>
                            entry.control_id ===
                            item.control_id,
                        );

                      const ready =
                        itemEvidence.some(
                          (entry) =>
                            String(
                              entry.status ?? '',
                            ).toLowerCase() ===
                              'collected' &&
                            String(
                              entry.integrity_status ??
                                '',
                            ).toLowerCase() ===
                              'verified' &&
                            String(
                              entry.review_status ??
                                '',
                            ).toLowerCase() ===
                              'accepted',
                        );

                      return (
                        <button
                          type="button"
                          key={item.id}
                          className={
                            selectedRemediation?.id ===
                            item.id
                              ? 'detail-linked-record verification-select active'
                              : 'detail-linked-record verification-select'
                          }
                          onClick={() =>
                            setSelectedRemediation(
                              item,
                            )
                          }
                        >
                          <div>
                            <strong>
                              {
                                item.remediation_number
                              }
                            </strong>

                            <span>
                              {item.title}
                            </span>

                            <small>
                              Control:{' '}
                              {item.control_id ??
                                'Unlinked'}
                            </small>
                          </div>

                          <div className="detail-linked-badges">
                            <span className="table-badge success">
                              completed
                            </span>

                            <span
                              className={`table-badge ${
                                ready
                                  ? 'success'
                                  : 'orange'
                              }`}
                            >
                              {ready
                                ? 'evidence ready'
                                : 'evidence pending'}
                            </span>
                          </div>
                        </button>
                      );
                    },
                  )}
                </div>
              )}
            </div>

            {selectedRemediation && (
              <>
                <div className="detail-section">
                  <div className="detail-section-title">
                    <div>
                      <h3>
                        Evidence Readiness
                      </h3>

                      <span>
                        Verification requires
                        collected, integrity-verified,
                        and analyst-accepted evidence.
                      </span>
                    </div>
                  </div>

                  <div className="detail-grid">
                    <div>
                      <span>
                        Evidence Collected
                      </span>

                      <strong>
                        {evidenceReadiness.collected
                          ? 'Ready'
                          : 'Required'}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Integrity Verification
                      </span>

                      <strong>
                        {evidenceReadiness.integrityVerified
                          ? 'Verified'
                          : 'Required'}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Analyst Review
                      </span>

                      <strong>
                        {evidenceReadiness.analystAccepted
                          ? 'Accepted'
                          : 'Required'}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Verification
                      </span>

                      <strong>
                        {evidenceReadiness.ready
                          ? 'Ready'
                          : 'Blocked'}
                      </strong>
                    </div>
                  </div>

                  {evidenceReadiness.items.length >
                    0 ? (
                    <div className="record-list">
                      {evidenceReadiness.items.map(
                        (item) => (
                          <div
                            className="detail-linked-record"
                            key={item.id}
                          >
                            <div>
                              <strong>
                                {
                                  item.evidence_number
                                }
                              </strong>

                              <span>
                                {item.title}
                              </span>

                              <small>
                                Artifact:{' '}
                                {item.artifact_name ??
                                  'Not supplied'}
                              </small>
                            </div>

                            <div className="detail-linked-badges">
                              <span
                                className={`table-badge ${badgeClass(
                                  item.status,
                                )}`}
                              >
                                {item.status}
                              </span>

                              <span
                                className={`table-badge ${badgeClass(
                                  item.integrity_status ??
                                    'unverified',
                                )}`}
                              >
                                {item.integrity_status ??
                                  'unverified'}
                              </span>

                              <span
                                className={`table-badge ${badgeClass(
                                  item.review_status ??
                                    'pending',
                                )}`}
                              >
                                {item.review_status ??
                                  'pending'}
                              </span>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  ) : (
                    <div className="empty-state">
                      No evidence is currently linked
                      to the remediation's control.
                    </div>
                  )}

                  {!evidenceReadiness.ready && (
                    <div className="incident-action-message">
                      Verification is blocked until
                      collected evidence has passed
                      integrity verification and has
                      been accepted by an analyst.
                    </div>
                  )}
                </div>

                <div className="detail-section">
                  <div className="detail-section-title">
                    <div>
                      <h3>
                        Verification Assessment
                      </h3>

                      <span>
                        Record the analyst's
                        effectiveness assessment.
                      </span>
                    </div>
                  </div>

                  <div className="detail-form">
                    <label>
                      Verification Procedure

                      <textarea
                        value={procedure}
                        onChange={(event) =>
                          setProcedure(
                            event.target.value,
                          )
                        }
                        placeholder="Describe how the remediation was checked and its effectiveness was validated."
                        rows={4}
                      />
                    </label>

                    <label>
                      Result

                      <select
                        value={result}
                        onChange={(event) =>
                          setResult(
                            event.target.value as
                              | 'PASS'
                              | 'PARTIAL'
                              | 'FAIL',
                          )
                        }
                      >
                        <option value="PASS">
                          PASS
                        </option>

                        <option value="PARTIAL">
                          PARTIAL
                        </option>

                        <option value="FAIL">
                          FAIL
                        </option>
                      </select>
                    </label>

                    <label>
                      Findings

                      <textarea
                        value={findings}
                        onChange={(event) =>
                          setFindings(
                            event.target.value,
                          )
                        }
                        placeholder="Record verification findings."
                        rows={3}
                      />
                    </label>

                    <label>
                      Verifier

                      <input
                        value={verifier}
                        onChange={(event) =>
                          setVerifier(
                            event.target.value,
                          )
                        }
                      />
                    </label>

                    <label>
                      Notes

                      <textarea
                        value={notes}
                        onChange={(event) =>
                          setNotes(
                            event.target.value,
                          )
                        }
                        placeholder="Optional verification notes."
                        rows={3}
                      />
                    </label>

                    <button
                      type="button"
                      className="incident-action-button primary"
                      onClick={
                        createVerification
                      }
                      disabled={
                        loading ||
                        !evidenceReadiness.ready
                      }
                    >
                      {loading
                        ? 'Recording Verification...'
                        : evidenceReadiness.ready
                          ? 'Record Verification'
                          : 'Evidence Required'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </aside>
        </div>
      )}

      {selected && (
        <div
          className="detail-overlay"
          onClick={() => setSelected(null)}
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
                  VERIFICATION
                </div>

                <h2>
                  {selected.verification_number}
                </h2>

                <p>
                  {selected.verification_procedure}
                </p>
              </div>

              <button
                type="button"
                className="detail-close-button"
                onClick={() =>
                  setSelected(null)
                }
              >
                ×
              </button>
            </div>

            <div className="detail-section">
              <div className="detail-section-title">
                <div>
                  <h3>
                    Verification Record
                  </h3>

                  <span>
                    Recorded effectiveness
                    assessment
                  </span>
                </div>
              </div>

              <div className="detail-grid">
                <div>
                  <span>Result</span>

                  <strong>
                    {selected.result}
                  </strong>
                </div>

                <div>
                  <span>Verifier</span>

                  <strong>
                    {selected.verifier}
                  </strong>
                </div>

                <div>
                  <span>Verified At</span>

                  <strong>
                    {formatDate(
                      selected.verified_at,
                    )}
                  </strong>
                </div>

                <div>
                  <span>Remediation ID</span>

                  <strong>
                    {selected.remediation_id}
                  </strong>
                </div>
              </div>

              <div className="detail-description">
                <span>Procedure</span>

                <p>
                  {selected.verification_procedure}
                </p>
              </div>

              <div className="detail-description">
                <span>Findings</span>

                <p>
                  {selected.findings ??
                    'No findings recorded.'}
                </p>
              </div>

              {selected.notes && (
                <div className="detail-description">
                  <span>Notes</span>

                  <p>{selected.notes}</p>
                </div>
              )}
            </div>

            <div className="detail-section">
              <div className="detail-section-title">
                <div>
                  <h3>
                    Remediation Traceability
                  </h3>

                  <span>
                    Remediation verified by this
                    record
                  </span>
                </div>
              </div>

              {(() => {
                const remediation =
                  remediations.find(
                    (item) =>
                      item.id ===
                      selected.remediation_id,
                  );

                return remediation ? (
                  <div className="detail-linked-record">
                    <div>
                      <strong>
                        {
                          remediation.remediation_number
                        }
                      </strong>

                      <span>
                        {remediation.title}
                      </span>

                      <small>
                        Status:{' '}
                        {remediation.status}
                      </small>
                    </div>

                    <div className="detail-linked-badges">
                      <span
                        className={`table-badge ${badgeClass(
                          remediation.status,
                        )}`}
                      >
                        {remediation.status}
                      </span>

                      <span
                        className={`table-badge ${badgeClass(
                          remediation.verification_status ??
                            'not_verified',
                        )}`}
                      >
                        {remediation.verification_status ??
                          'not_verified'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="empty-state">
                    Remediation record could not
                    be loaded.
                  </div>
                );
              })()}
            </div>

            <div className="detail-section">
              <div className="detail-section-title">
                <div>
                  <h3>
                    Control Traceability
                  </h3>

                  <span>
                    Control associated with the
                    verification
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
                  Control traceability could not
                  be loaded.
                </div>
              )}
            </div>

            <div className="detail-section">
              <div className="detail-section-title">
                <div>
                  <h3>Evidence Traceability</h3>

                  <span>
                    Evidence supporting this
                    verification
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

                          <small>
                            Artifact:{' '}
                            {item.artifact_name ??
                              'Not supplied'}
                          </small>

                          {item.sha256_hash && (
                            <small>
                              SHA-256:{' '}
                              {item.sha256_hash}
                            </small>
                          )}
                        </div>

                        <div className="detail-linked-badges">
                          <span
                            className={`table-badge ${badgeClass(
                              item.status,
                            )}`}
                          >
                            {item.status}
                          </span>

                          <span
                            className={`table-badge ${badgeClass(
                              item.integrity_status ??
                                'unverified',
                            )}`}
                          >
                            {item.integrity_status ??
                              'unverified'}
                          </span>

                          <span
                            className={`table-badge ${badgeClass(
                              item.review_status ??
                                'pending',
                            )}`}
                          >
                            {item.review_status ??
                              'pending'}
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