import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';

interface Control {
  id: string;
  control_id: string;
  name: string;
  description?: string;
}

interface Evidence {
  id: string;
  evidence_number: string;
  title: string;
  description: string;
  evidence_type: string;
  source: string;
  status: string;
  control_id: string;
  collected_at: string;
  created_at?: string;

  artifact_name?: string;
  artifact_path?: string;
  collection_method?: string;
  sha256_hash?: string;
  integrity_status?: string;
  review_status?: string;
  reviewed_by?: string;
  reviewed_at?: string;
}

interface ControlTest {
  id: string;
  test_number: string;
  control_id: string;
  evidence_id: string;
  test_procedure: string;
  result: string;
  findings?: string;
  tester: string;
  tested_at: string;
  notes?: string;
}

const API_BASE = 'http://127.0.0.1:8000';

export default function EvidencePage() {
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [controls, setControls] = useState<Control[]>([]);
  const [controlTests, setControlTests] = useState<ControlTest[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [testing, setTesting] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [showTestForm, setShowTestForm] = useState(false);

  const [selectedEvidence, setSelectedEvidence] =
    useState<Evidence | null>(null);

  const [actionMessage, setActionMessage] = useState('');
  const [integrityMessage, setIntegrityMessage] = useState('');
  const [reviewMessage, setReviewMessage] = useState('');
  const [testMessage, setTestMessage] = useState('');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [reviewStatus, setReviewStatus] = useState('accepted');
  const [reviewer, setReviewer] = useState('SOC Analyst');
  const [reviewNotes, setReviewNotes] = useState('');

  const [testForm, setTestForm] = useState({
    test_procedure: '',
    result: 'PASS',
    findings: '',
    tester: 'SOC Analyst',
    notes: '',
  });

  const [form, setForm] = useState({
    title: '',
    description: '',
    evidence_type: 'configuration',
    source: 'AEGIS SOC Analyst',
    control_id: '',
  });

  useEffect(() => {
    loadEvidence();
  }, []);

  async function loadEvidence() {
    setLoading(true);

    try {
      const [
        evidenceResponse,
        controlsResponse,
        controlTestsResponse,
      ] = await Promise.all([
        fetch(`${API_BASE}/evidence`),
        fetch(`${API_BASE}/controls`),
        fetch(`${API_BASE}/control-tests`),
      ]);

      if (!evidenceResponse.ok) {
        throw new Error('Failed to load evidence');
      }

      setEvidence(await evidenceResponse.json());

      if (controlsResponse.ok) {
        setControls(await controlsResponse.json());
      }

      if (controlTestsResponse.ok) {
        setControlTests(await controlTestsResponse.json());
      }
    } catch (error) {
      console.error('AEGIS EVIDENCE ERROR:', error);

      setActionMessage(
        error instanceof Error
          ? error.message
          : 'Failed to load evidence.',
      );
    } finally {
      setLoading(false);
    }
  }

  function resetReviewForm(item?: Evidence) {
    setReviewStatus(
      item?.review_status === 'rejected'
        ? 'rejected'
        : 'accepted',
    );

    setReviewer(item?.reviewed_by || 'SOC Analyst');
    setReviewNotes('');
    setReviewMessage('');
    setIntegrityMessage('');
  }

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
  }

  async function collectEvidence() {
    if (
      !form.title.trim() ||
      !form.description.trim() ||
      !form.control_id
    ) {
      setActionMessage(
        'Title, description, and control are required.',
      );
      return;
    }

    if (!selectedFile) {
      setActionMessage(
        'An evidence artifact is required.',
      );
      return;
    }

    if (selectedFile.size === 0) {
      setActionMessage(
        'The selected evidence artifact is empty.',
      );
      return;
    }

    setSaving(true);
    setActionMessage('');

    try {
      /*
       * Step 1:
       * Create the evidence record as pending.
       *
       * We intentionally do not create it directly as
       * "collected" because the backend requires an actual
       * artifact and SHA-256 for collected evidence.
       */
      const createResponse = await fetch(
        `${API_BASE}/evidence`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: form.title.trim(),
            description: form.description.trim(),
            evidence_type: form.evidence_type,
            source: form.source.trim(),
            control_id: form.control_id,
            status: 'pending',
          }),
        },
      );

      if (!createResponse.ok) {
        const detail = await createResponse.text();
        throw new Error(
          detail || 'Failed to create evidence record.',
        );
      }

      const created: Evidence = await createResponse.json();

      /*
       * Step 2:
       * Upload the real artifact.
       *
       * The backend calculates the SHA-256 from the
       * actual uploaded file.
       */
      const artifactForm = new FormData();
      artifactForm.append('file', selectedFile);

      const artifactResponse = await fetch(
        `${API_BASE}/evidence/${created.id}/artifact`,
        {
          method: 'POST',
          body: artifactForm,
        },
      );

      if (!artifactResponse.ok) {
        const detail = await artifactResponse.text();
        throw new Error(
          detail || 'Evidence artifact upload failed.',
        );
      }

      const collected: Evidence =
        await artifactResponse.json();

      setEvidence((current) => [
        collected,
        ...current.filter(
          (item) => item.id !== collected.id,
        ),
      ]);

      setForm({
        title: '',
        description: '',
        evidence_type: 'configuration',
        source: 'AEGIS SOC Analyst',
        control_id: '',
      });

      setSelectedFile(null);

      setShowForm(false);

      setActionMessage(
        `${collected.evidence_number} collected successfully with artifact integrity metadata.`,
      );
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : 'Failed to collect evidence.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function verifyIntegrity() {
    if (!selectedEvidence) {
      return;
    }

    setVerifying(true);
    setIntegrityMessage('');

    try {
      const response = await fetch(
  `${API_BASE}/evidence/${selectedEvidence.id}/integrity`,
  {
    method: 'PATCH',
  },
);
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(
          detail || 'Evidence integrity verification failed.',
        );
      }

      const updated: Evidence = await response.json();

      setEvidence((current) =>
        current.map((item) =>
          item.id === updated.id ? updated : item,
        ),
      );

      setSelectedEvidence(updated);

      setIntegrityMessage(
        'Evidence integrity verified successfully. SHA-256 matches the stored artifact.',
      );
    } catch (error) {
      setIntegrityMessage(
        error instanceof Error
          ? error.message
          : 'Evidence integrity verification failed.',
      );
    } finally {
      setVerifying(false);
    }
  }

  async function submitEvidenceReview() {
    if (!selectedEvidence) {
      return;
    }

    if (!reviewer.trim()) {
      setReviewMessage('Reviewer name is required.');
      return;
    }

    if (!reviewNotes.trim()) {
      setReviewMessage(
        reviewStatus === 'accepted'
          ? 'Review notes are required before accepting evidence.'
          : 'Rejection reason is required.',
      );
      return;
    }

    if (
      reviewStatus === 'accepted' &&
      selectedEvidence.integrity_status !== 'verified'
    ) {
      setReviewMessage(
        'Evidence integrity must be verified before acceptance.',
      );
      return;
    }

    setReviewing(true);
    setReviewMessage('');

    try {
      const params = new URLSearchParams({
        review_status: reviewStatus,
        reviewed_by: reviewer.trim(),
        review_notes: reviewNotes.trim(),
      });

      const response = await fetch(
        `${API_BASE}/evidence/${selectedEvidence.id}/review?${params.toString()}`,
        {
          method: 'POST',
        },
      );

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(
          detail || 'Failed to review evidence.',
        );
      }

      const updated: Evidence = await response.json();

      setEvidence((current) =>
        current.map((item) =>
          item.id === updated.id ? updated : item,
        ),
      );

      setSelectedEvidence(updated);

      setReviewMessage(
        reviewStatus === 'accepted'
          ? 'Evidence accepted successfully.'
          : 'Evidence rejected successfully.',
      );
    } catch (error) {
      setReviewMessage(
        error instanceof Error
          ? error.message
          : 'Failed to review evidence.',
      );
    } finally {
      setReviewing(false);
    }
  }

  async function runControlTest() {
    if (!selectedEvidence) {
      setTestMessage(
        'Select an evidence record first.',
      );
      return;
    }

    if (!testForm.test_procedure.trim()) {
      setTestMessage(
        'Test procedure is required.',
      );
      return;
    }

    /*
     * Control testing should only be available once
     * evidence has completed the evidence lifecycle.
     */
    if (
      selectedEvidence.status !== 'collected' ||
      selectedEvidence.integrity_status !== 'verified' ||
      selectedEvidence.review_status !== 'accepted'
    ) {
      setTestMessage(
        'Control testing requires collected, integrity-verified, and accepted evidence.',
      );
      return;
    }

    const linkedControl = controls.find(
      (control) =>
        control.id === selectedEvidence.control_id,
    );

    if (!linkedControl) {
      setTestMessage(
        'The linked control could not be found.',
      );
      return;
    }

    setTesting(true);
    setTestMessage('');

    try {
      const response = await fetch(
        `${API_BASE}/control-tests`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            control_id: linkedControl.id,
            evidence_id: selectedEvidence.id,
            test_procedure:
              testForm.test_procedure.trim(),
            result: testForm.result,
            findings:
              testForm.findings.trim() || null,
            tester:
              testForm.tester.trim() ||
              'SOC Analyst',
            notes:
              testForm.notes.trim() || null,
          }),
        },
      );

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(
          detail || 'Failed to run control test.',
        );
      }

      const created: ControlTest =
        await response.json();

      setControlTests((current) => [
        created,
        ...current,
      ]);

      setTestForm({
        test_procedure: '',
        result: 'PASS',
        findings: '',
        tester: 'SOC Analyst',
        notes: '',
      });

      setShowTestForm(false);

      setTestMessage(
        `${created.test_number} completed successfully.`,
      );
    } catch (error) {
      setTestMessage(
        error instanceof Error
          ? error.message
          : 'Failed to run control test.',
      );
    } finally {
      setTesting(false);
    }
  }

  const collectedCount = evidence.filter(
    (item) =>
      item.status.toLowerCase() === 'collected',
  ).length;

  const verifiedCount = evidence.filter(
    (item) =>
      item.integrity_status === 'verified',
  ).length;

  const acceptedCount = evidence.filter(
    (item) =>
      item.review_status === 'accepted',
  ).length;

  const configurationCount = evidence.filter(
    (item) =>
      item.evidence_type === 'configuration',
  ).length;

  const verificationEvidenceCount =
    evidence.filter(
      (item) =>
        item.evidence_type ===
        'verification_record',
    ).length;

  return (
    <section className="page-content evidence-page">
      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <div className="page-header">
        <div>
          <div className="eyebrow">
            GRC MANAGEMENT <span>•</span> ASSURANCE
          </div>

          <h1>Evidence</h1>

          <p>
            Evidence collected to support control
            assurance and audit activities.
          </p>
        </div>

        <button
          type="button"
          className="incident-action-button primary"
          onClick={() => {
            setShowForm((current) => !current);
            setActionMessage('');
            setSelectedFile(null);
          }}
        >
          {showForm ? 'Close' : 'Collect Evidence'}
        </button>
      </div>

      {/* =====================================================
          COLLECTION FORM
      ====================================================== */}

      {showForm && (
        <div className="table-card evidence-form-card">
          <div className="table-header">
            <div>
              <h3>Collect Evidence</h3>

              <span>
                Create an evidence record and attach
                the actual artifact.
              </span>
            </div>
          </div>

          <div className="evidence-form">
            <label className="evidence-field">
              <strong>Evidence Title</strong>

              <input
                type="text"
                value={form.title}
                onChange={(event) =>
                  setForm({
                    ...form,
                    title: event.target.value,
                  })
                }
                placeholder="e.g. Network Monitoring Configuration"
              />
            </label>

            <label className="evidence-field evidence-field-wide">
              <strong>Description</strong>

              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm({
                    ...form,
                    description:
                      event.target.value,
                  })
                }
                placeholder="Describe what was collected and what it demonstrates."
                rows={4}
              />
            </label>

            <label className="evidence-field">
              <strong>Evidence Type</strong>

              <select
                value={form.evidence_type}
                onChange={(event) =>
                  setForm({
                    ...form,
                    evidence_type:
                      event.target.value,
                  })
                }
              >
                <option value="configuration">
                  Configuration
                </option>

                <option value="verification_record">
                  Verification Record
                </option>
              </select>
            </label>

            <label className="evidence-field">
              <strong>Control</strong>

              <select
                value={form.control_id}
                onChange={(event) =>
                  setForm({
                    ...form,
                    control_id: event.target.value,
                  })
                }
              >
                <option value="">
                  Select a control
                </option>

                {controls.map((control) => (
                  <option
                    key={control.id}
                    value={control.id}
                  >
                    {control.control_id} —{' '}
                    {control.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="evidence-field">
              <strong>Source</strong>

              <input
                type="text"
                value={form.source}
                onChange={(event) =>
                  setForm({
                    ...form,
                    source: event.target.value,
                  })
                }
                placeholder="Evidence source"
              />
            </label>

            <label className="evidence-field evidence-field-wide">
              <strong>Evidence Artifact</strong>

              <input
                type="file"
                onChange={handleFileChange}
                accept=".txt,.json,.csv,.log,.pdf,.xml,.conf,.cfg"
              />

              {selectedFile && (
                <small>
                  Selected: {selectedFile.name} •{' '}
                  {selectedFile.size} bytes
                </small>
              )}
            </label>

            <div className="evidence-form-actions">
              <button
                type="button"
                className="incident-action-button primary"
                onClick={collectEvidence}
                disabled={
                  saving ||
                  !selectedFile
                }
              >
                {saving
                  ? 'Collecting…'
                  : 'Collect Evidence'}
              </button>

              {actionMessage && (
                <span className="evidence-form-message">
                  {actionMessage}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          EVIDENCE DETAIL
      ====================================================== */}

      {selectedEvidence && (
        <div className="table-card evidence-detail-card">
          <div className="table-header">
            <div>
              <h3>
                {selectedEvidence.evidence_number} —
                Evidence Detail
              </h3>

              <span>
                {selectedEvidence.title}
              </span>
            </div>

            <button
              type="button"
              className="incident-action-button"
              onClick={() => {
                setSelectedEvidence(null);
                setShowTestForm(false);
                setTestMessage('');
                setIntegrityMessage('');
                setReviewMessage('');
              }}
            >
              Close
            </button>
          </div>

          {/* =================================================
              CORE EVIDENCE DETAILS
          ================================================== */}

          <div className="evidence-detail-grid">
            <div>
              <strong>Description</strong>
              <p>
                {selectedEvidence.description}
              </p>
            </div>

            <div>
              <strong>Evidence Type</strong>
              <p>
                {selectedEvidence.evidence_type}
              </p>
            </div>

            <div>
              <strong>Source</strong>
              <p>
                {selectedEvidence.source}
              </p>
            </div>

            <div>
              <strong>Status</strong>
              <p>
                {selectedEvidence.status}
              </p>
            </div>
          </div>

          {/* =================================================
              ARTIFACT TRACEABILITY
          ================================================== */}

          <div className="evidence-traceability">
            <div>
              <strong>Artifact</strong>

              <p>
                {selectedEvidence.artifact_name ||
                  'No artifact attached'}
              </p>
            </div>

            <div>
              <strong>Collection Method</strong>

              <p>
                {selectedEvidence.collection_method ||
                  'Not recorded'}
              </p>
            </div>

            <div>
              <strong>SHA-256</strong>

              <p
                style={{
                  wordBreak: 'break-all',
                  fontFamily:
                    'monospace',
                  fontSize: '0.78rem',
                }}
              >
                {selectedEvidence.sha256_hash ||
                  'Not calculated'}
              </p>
            </div>

            <div>
              <strong>Integrity</strong>

              <p>
                <span
                  className={`table-badge ${
                    selectedEvidence.integrity_status ===
                    'verified'
                      ? 'verified'
                      : selectedEvidence.integrity_status ===
                          'failed'
                        ? 'failed'
                        : 'pending'
                  }`}
                >
                  {selectedEvidence.integrity_status ||
                    'unverified'}
                </span>
              </p>
            </div>
          </div>

          {/* =================================================
              INTEGRITY ACTION
          ================================================== */}

          <div className="evidence-form-actions">
            {selectedEvidence.integrity_status !==
              'verified' && (
              <button
                type="button"
                className="incident-action-button primary"
                onClick={verifyIntegrity}
                disabled={
                  verifying ||
                  selectedEvidence.status !==
                    'collected'
                }
              >
                {verifying
                  ? 'Verifying Integrity…'
                  : 'Verify Integrity'}
              </button>
            )}

            {selectedEvidence.integrity_status ===
              'verified' && (
              <span className="evidence-form-message">
                ✓ Artifact integrity verified.
              </span>
            )}

            {integrityMessage && (
              <span className="evidence-form-message">
                {integrityMessage}
              </span>
            )}
          </div>

          {/* =================================================
              CONTROL TRACEABILITY
          ================================================== */}

          <div className="evidence-traceability">
            <div>
              <strong>Linked Control</strong>

              <p>
                {controls.find(
                  (control) =>
                    control.id ===
                    selectedEvidence.control_id,
                )?.control_id ||
                  'Unknown control'}
                {' — '}
                {controls.find(
                  (control) =>
                    control.id ===
                    selectedEvidence.control_id,
                )?.name ||
                  'Control not found'}
              </p>
            </div>

            <div>
              <strong>Control Tests</strong>

              <p>
                {
                  controlTests.filter(
                    (test) =>
                      test.evidence_id ===
                      selectedEvidence.id,
                  ).length
                }{' '}
                test(s) linked to this evidence
              </p>
            </div>
          </div>

          {/* =================================================
              ANALYST REVIEW
          ================================================== */}

          <div className="evidence-review-section">
            <div className="table-header">
              <div>
                <h3>Analyst Review</h3>

                <span>
                  Review evidence after artifact
                  integrity verification.
                </span>
              </div>
            </div>

            <div className="evidence-form">
              <label className="evidence-field">
                <strong>Integrity Status</strong>

                <span
                  className={`table-badge ${
                    selectedEvidence.integrity_status ===
                    'verified'
                      ? 'verified'
                      : selectedEvidence.integrity_status ===
                          'failed'
                        ? 'failed'
                        : 'pending'
                  }`}
                >
                  {selectedEvidence.integrity_status ||
                    'unverified'}
                </span>
              </label>

              <label className="evidence-field">
                <strong>Review Status</strong>

                <select
                  value={reviewStatus}
                  onChange={(event) =>
                    setReviewStatus(
                      event.target.value,
                    )
                  }
                  disabled={reviewing}
                >
                  <option value="accepted">
                    Accepted
                  </option>

                  <option value="rejected">
                    Rejected
                  </option>
                </select>
              </label>

              <label className="evidence-field">
                <strong>Reviewer</strong>

                <input
                  type="text"
                  value={reviewer}
                  onChange={(event) =>
                    setReviewer(
                      event.target.value,
                    )
                  }
                  placeholder="Reviewer name"
                  disabled={reviewing}
                />
              </label>

              <label className="evidence-field evidence-field-wide">
                <strong>
                  {reviewStatus === 'accepted'
                    ? 'Review Notes'
                    : 'Rejection Reason'}
                </strong>

                <textarea
                  value={reviewNotes}
                  onChange={(event) =>
                    setReviewNotes(
                      event.target.value,
                    )
                  }
                  placeholder={
                    reviewStatus === 'accepted'
                      ? 'Explain why this evidence is accepted.'
                      : 'Explain why this evidence is rejected.'
                  }
                  rows={4}
                  disabled={reviewing}
                />
              </label>

              <div className="evidence-form-actions">
                <button
                  type="button"
                  className="incident-action-button primary"
                  onClick={
                    submitEvidenceReview
                  }
                  disabled={
                    reviewing ||
                    (
                      reviewStatus ===
                        'accepted' &&
                      selectedEvidence.integrity_status !==
                        'verified'
                    )
                  }
                >
                  {reviewing
                    ? 'Saving Review…'
                    : reviewStatus ===
                        'accepted'
                      ? 'Accept Evidence'
                      : 'Reject Evidence'}
                </button>

                {reviewMessage && (
                  <span className="evidence-form-message">
                    {reviewMessage}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* =================================================
              CURRENT REVIEW RECORD
          ================================================== */}

          {selectedEvidence.review_status !==
            'pending' && (
            <div className="evidence-traceability">
              <div>
                <strong>Review Status</strong>

                <p>
                  <span
                    className={`table-badge ${
                      selectedEvidence.review_status ===
                      'accepted'
                        ? 'accepted'
                        : 'rejected'
                    }`}
                  >
                    {selectedEvidence.review_status}
                  </span>
                </p>
              </div>

              <div>
                <strong>Reviewed By</strong>

                <p>
                  {selectedEvidence.reviewed_by ||
                    'Unknown'}
                </p>
              </div>

              <div>
                <strong>Reviewed At</strong>

                <p>
                  {selectedEvidence.reviewed_at ||
                    'Not recorded'}
                </p>
              </div>
            </div>
          )}

          {/* =================================================
              CONTROL TEST ACTION
          ================================================== */}

          <div className="evidence-form-actions">
            <button
              type="button"
              className="incident-action-button primary"
              onClick={() => {
                setShowTestForm(
                  (current) => !current,
                );
                setTestMessage('');
              }}
              disabled={
                selectedEvidence.status !==
                  'collected' ||
                selectedEvidence.integrity_status !==
                  'verified' ||
                selectedEvidence.review_status !==
                  'accepted'
              }
            >
              {showTestForm
                ? 'Close Test Form'
                : 'Run Control Test'}
            </button>

            {selectedEvidence.review_status !==
              'accepted' && (
              <span className="evidence-form-message">
                Control testing becomes available
                after evidence is accepted.
              </span>
            )}

            {testMessage && (
              <span className="evidence-form-message">
                {testMessage}
              </span>
            )}
          </div>

          {/* =================================================
              CONTROL TEST FORM
          ================================================== */}

          {showTestForm && (
            <div className="evidence-form control-test-form evidence-action-form">
              <label className="evidence-field evidence-field-wide">
                <strong>Test Procedure</strong>

                <textarea
                  value={
                    testForm.test_procedure
                  }
                  onChange={(event) =>
                    setTestForm({
                      ...testForm,
                      test_procedure:
                        event.target.value,
                    })
                  }
                  placeholder="Describe how the control was tested."
                  rows={4}
                />
              </label>

              <label className="evidence-field">
                <strong>Result</strong>

                <select
                  value={testForm.result}
                  onChange={(event) =>
                    setTestForm({
                      ...testForm,
                      result: event.target.value,
                    })
                  }
                >
                  <option value="PASS">
                    PASS
                  </option>

                  <option value="FAIL">
                    FAIL
                  </option>

                  <option value="PARTIAL">
                    PARTIAL
                  </option>
                </select>
              </label>

              <label className="evidence-field evidence-field-wide">
                <strong>Findings</strong>

                <textarea
                  value={testForm.findings}
                  onChange={(event) =>
                    setTestForm({
                      ...testForm,
                      findings:
                        event.target.value,
                    })
                  }
                  placeholder="Record the findings from the control test."
                  rows={4}
                />
              </label>

              <label className="evidence-field">
                <strong>Tester</strong>

                <input
                  type="text"
                  value={testForm.tester}
                  onChange={(event) =>
                    setTestForm({
                      ...testForm,
                      tester:
                        event.target.value,
                    })
                  }
                />
              </label>

              <label className="evidence-field evidence-field-wide">
                <strong>Notes</strong>

                <textarea
                  value={testForm.notes}
                  onChange={(event) =>
                    setTestForm({
                      ...testForm,
                      notes: event.target.value,
                    })
                  }
                  placeholder="Optional testing notes."
                  rows={3}
                />
              </label>

              <div className="evidence-form-actions">
                <button
                  type="button"
                  className="incident-action-button primary"
                  onClick={runControlTest}
                  disabled={testing}
                >
                  {testing
                    ? 'Running Test…'
                    : 'Submit Control Test'}
                </button>
              </div>
            </div>
          )}

          {/* =================================================
              CONTROL TEST HISTORY
          ================================================== */}

          {controlTests.filter(
            (test) =>
              test.evidence_id ===
              selectedEvidence.id,
          ).length > 0 && (
            <div className="evidence-test-list">
              <div className="table-header">
                <div>
                  <h3>
                    Control Test History
                  </h3>

                  <span>
                    Tests performed against this
                    evidence
                  </span>
                </div>
              </div>

              {controlTests
                .filter(
                  (test) =>
                    test.evidence_id ===
                    selectedEvidence.id,
                )
                .map((test) => (
                  <div
                    className="page-record"
                    key={test.id}
                  >
                    <div className="page-record-main">
                      <strong>
                        {test.test_number}
                      </strong>

                      <span>
                        {test.test_procedure}
                      </span>

                      <small>
                        {test.tester} •{' '}
                        {test.tested_at}
                      </small>
                    </div>

                    <span
                      className={`table-badge ${test.result.toLowerCase()}`}
                    >
                      {test.result}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* =====================================================
          METRICS
      ====================================================== */}

      <div className="metric-grid page-metrics">
        <div className="metric-card cyan">
          <div className="metric-top">
            <span>Total Evidence</span>
          </div>

          <div className="metric-value">
            {loading ? '—' : evidence.length}
          </div>
        </div>

        <div className="metric-card green">
          <div className="metric-top">
            <span>Collected</span>
          </div>

          <div className="metric-value">
            {loading ? '—' : collectedCount}
          </div>
        </div>

        <div className="metric-card green">
          <div className="metric-top">
            <span>Integrity Verified</span>
          </div>

          <div className="metric-value">
            {loading ? '—' : verifiedCount}
          </div>
        </div>

        <div className="metric-card cyan">
          <div className="metric-top">
            <span>Accepted</span>
          </div>

          <div className="metric-value">
            {loading ? '—' : acceptedCount}
          </div>
        </div>

        <div className="metric-card cyan">
          <div className="metric-top">
            <span>Configuration</span>
          </div>

          <div className="metric-value">
            {loading
              ? '—'
              : configurationCount}
          </div>
        </div>

        <div className="metric-card cyan">
          <div className="metric-top">
            <span>Verification Evidence</span>
          </div>

          <div className="metric-value">
            {loading
              ? '—'
              : verificationEvidenceCount}
          </div>
        </div>
      </div>

      {/* =====================================================
          EVIDENCE REGISTER
      ====================================================== */}

      <div className="table-card page-table">
        <div className="table-header">
          <div>
            <h3>Evidence Register</h3>

            <span>
              Evidence linked to security controls
            </span>
          </div>
        </div>

        <div className="page-table-scroll">
          {loading ? (
            <div className="empty-state">
              Loading evidence...
            </div>
          ) : evidence.length === 0 ? (
            <div className="empty-state">
              No evidence available.
            </div>
          ) : (
            evidence.map((item) => (
              <div
                className={`page-record ${
                  selectedEvidence?.id ===
                  item.id
                    ? 'selected'
                    : ''
                }`}
                key={item.id}
                onClick={() => {
                  setSelectedEvidence(item);
                  setShowTestForm(false);
                  setTestMessage('');
                  resetReviewForm(item);
                }}
                style={{
                  cursor: 'pointer',
                }}
              >
                <div className="page-record-main">
                  <strong>
                    {item.evidence_number}
                  </strong>

                  <span>{item.title}</span>

                  <small>
                    {item.evidence_type} •{' '}
                    {item.source}
                  </small>

                  <small>
                    Integrity:{' '}
                    {item.integrity_status ||
                      'unverified'}{' '}
                    • Review:{' '}
                    {item.review_status ||
                      'pending'}
                  </small>
                </div>

                <span
                  className={`table-badge ${item.status.toLowerCase()}`}
                >
                  {item.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}