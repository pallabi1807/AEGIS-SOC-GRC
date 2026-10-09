import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  ShieldCheck,
} from 'lucide-react';

import type {
  Control,
  Risk,
  RiskControl,
  Remediation,
  Verification,
} from '../api/dashboard';

interface ControlsPageProps {
  controls: Control[];
  risks: Risk[];
  riskControls: RiskControl[];
  remediations: Remediation[];
  verifications: Verification[];
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
}

interface ControlTest {
  id: string;
  test_number?: string;
  control_id: string;
  evidence_id?: string;
  result?: string;
  findings?: string;
  test_procedure?: string;
  tester?: string;
  tested_at?: string;
}

interface ComplianceMapping {
  id: string;
  framework_id: string;
  requirement_id: string;
  requirement_identifier: string;
  requirement_title: string;
  control_id: string;
  control_identifier: string;
  control_name: string;
  mapping_type: string;
  status: string;
  rationale?: string | null;
  created_at: string;
  framework_code?: string;
  framework_name?: string;
}

interface ComplianceFramework {
  id: string;
  code: string;
  name: string;
  version: string;
}

function badgeClass(value: string | undefined): string {
  return (value ?? 'unknown')
    .toLowerCase()
    .replace(/\s+/g, '-');
}

function formatDate(value: string | undefined): string {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleDateString();
}

export default function ControlsPage({
  controls,
  risks,
  riskControls,
  remediations,
  verifications,
}: ControlsPageProps) {
  const [selectedControl, setSelectedControl] =
    useState<Control | null>(null);
  
  const [selectedEvidence, setSelectedEvidence] =
  useState<Evidence[]>([]);
  const [selectedControlTests, setSelectedControlTests] =
  useState<ControlTest[]>([]);
  const [assuranceLoading, setAssuranceLoading] =
  useState(false);

  const [selectedComplianceMappings, setSelectedComplianceMappings] =
    useState<ComplianceMapping[]>([]);

  const [complianceLoading, setComplianceLoading] =
    useState(false);

useEffect(() => {
  if (!selectedControl) {
    setSelectedEvidence([]);
    setSelectedControlTests([]);
    return;
  }

  const controlId = selectedControl.id;

  async function loadAssuranceData() {
    setAssuranceLoading(true);

    try {
      const [
        evidenceResponse,
        testsResponse,
      ] = await Promise.all([
        fetch(
          'http://127.0.0.1:8000/evidence',
        ),
        fetch(
          'http://127.0.0.1:8000/control-tests',
        ),
      ]);

      if (evidenceResponse.ok) {
        const evidence =
          await evidenceResponse.json();

        setSelectedEvidence(
          evidence.filter(
            (item: Evidence) =>
              item.control_id === controlId,
          ),
        );
      } else {
        setSelectedEvidence([]);
      }

      if (testsResponse.ok) {
        const tests =
          await testsResponse.json();

        setSelectedControlTests(
          tests.filter(
            (item: ControlTest) =>
              item.control_id === controlId,
          ),
        );
      } else {
        setSelectedControlTests([]);
      }
    } catch (error) {
      console.error(
        'AEGIS CONTROL ASSURANCE ERROR:',
        error,
      );

      setSelectedEvidence([]);
      setSelectedControlTests([]);
    } finally {
      setAssuranceLoading(false);
    }
  }

  loadAssuranceData();
}, [selectedControl]);

  useEffect(() => {
    if (!selectedControl) {
      setSelectedComplianceMappings([]);
      return;
    }

    const controlId = selectedControl.id;

    async function loadComplianceData() {
      setComplianceLoading(true);

      try {
        const overviewResponse = await fetch(
          'http://127.0.0.1:8000/compliance/overview',
        );

        if (!overviewResponse.ok) {
          setSelectedComplianceMappings([]);
          return;
        }

        const frameworks: ComplianceFramework[] =
          await overviewResponse.json();

        const mappingGroups = await Promise.all(
          frameworks.map(async (framework) => {
            const response = await fetch(
              `http://127.0.0.1:8000/compliance/frameworks/${framework.id}/controls`,
            );

            if (!response.ok) {
              return [];
            }

            const mappings: ComplianceMapping[] =
              await response.json();

            return mappings
              .filter(
                (mapping) =>
                  mapping.control_id === controlId,
              )
              .map((mapping) => ({
                ...mapping,
                framework_code: framework.code,
                framework_name: framework.name,
              }));
          }),
        );

        setSelectedComplianceMappings(
          mappingGroups.flat(),
        );
      } catch (error) {
        console.error(
          'AEGIS CONTROL COMPLIANCE ERROR:',
          error,
        );

        setSelectedComplianceMappings([]);
      } finally {
        setComplianceLoading(false);
      }
    }

    loadComplianceData();
  }, [selectedControl]);

  const selectedRiskLinks = useMemo(() => {
    if (!selectedControl) {
      return [];
    }

    return riskControls
      .filter(
        (relationship) =>
          relationship.control_identifier ===
          selectedControl.control_id,
      )
      .map((relationship) => {
        const risk =
          risks.find(
            (item) =>
              item.risk_number ===
              relationship.risk_number,
          ) ?? null;

        return {
          relationship,
          risk,
        };
      })
      .filter((item) => item.risk !== null);
  }, [
    selectedControl,
    riskControls,
    risks,
  ]);

  const selectedRemediations = useMemo(() => {
    if (!selectedControl) {
      return [];
    }

    return remediations.filter(
      (remediation) =>
        remediation.control_id ===
        selectedControl.id,
    );
  }, [
    selectedControl,
    remediations,
  ]);

  const selectedVerifications = useMemo(() => {
    const remediationIds = new Set(
      selectedRemediations.map(
        (remediation) =>
          remediation.id,
      ),
    );

    return verifications.filter(
      (verification) =>
        remediationIds.has(
          verification.remediation_id,
        ),
    );
  }, [
    selectedRemediations,
    verifications,
  ]);

  const implementedCount =
    controls.filter(
      (control) =>
        control.status.toLowerCase() ===
        'implemented',
    ).length;

  const plannedCount =
    controls.filter(
      (control) =>
        control.status.toLowerCase() ===
        'planned',
    ).length;

  return (
    <section className="page-content">

      {/* =====================================================
          PAGE HEADER
          ===================================================== */}

      <div className="page-header">

        <div>

          <div className="eyebrow">
            GRC MANAGEMENT
            <span>•</span>
            CONTROL
          </div>

          <h1>
            Security Controls
          </h1>

          <p>
            Manage controls linked to
            identified security risks.
          </p>

        </div>

      </div>


      {/* =====================================================
          METRICS
          ===================================================== */}

      <div className="metric-grid page-metrics">

        <div className="metric-card teal">

          <div className="metric-top">
            <span>
              Total Controls
            </span>
          </div>

          <div className="metric-value">
            {controls.length}
          </div>

        </div>


        <div className="metric-card">

          <div className="metric-top">
            <span>
              Implemented
            </span>
          </div>

          <div className="metric-value">
            {implementedCount}
          </div>

        </div>


        <div className="metric-card warning">

          <div className="metric-top">
            <span>
              Planned
            </span>
          </div>

          <div className="metric-value">
            {plannedCount}
          </div>

        </div>

      </div>


      {/* =====================================================
          CONTROL REGISTER
          ===================================================== */}

      <div className="table-card page-table">

        <div className="table-header">

          <div>

            <h3>
              Control Register
            </h3>

            <span>
              AEGIS preventive and
              detective controls
            </span>

          </div>

        </div>


        <div className="page-table-scroll">

          {controls.length === 0 ? (

            <div className="empty-state">
              No controls available.
            </div>

          ) : (

            controls.map((control) => (

              <div
                className="page-record"
                key={control.id}
                onClick={() =>
                  setSelectedControl(
                    control,
                  )
                }
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {

                  if (
                    event.key ===
                      'Enter' ||
                    event.key === ' '
                  ) {

                    event.preventDefault();

                    setSelectedControl(
                      control,
                    );

                  }

                }}
              >

                <div className="page-record-main">

                  <strong>
                    {control.control_id}
                  </strong>

                  <span>
                    {control.name}
                  </span>

                  <small>
                    {control.control_type}
                  </small>

                </div>


                <span className="table-badge blue">
                  {control.control_type}
                </span>


                <span
                  className={`table-badge ${
                    control.status
                      .toLowerCase() ===
                    'implemented'
                      ? 'success'
                      : 'planned'
                  }`}
                >
                  {control.status}
                </span>


                <span className="page-record-meta">
                  {control.owner ??
                    'Unassigned'}
                </span>

              </div>

            ))

          )}

        </div>

      </div>


      {/* =====================================================
          CONTROL DETAIL
          ===================================================== */}

      {selectedControl && (

        <div
          className="detail-overlay"
          onClick={() =>
            setSelectedControl(null)
          }
        >

          <aside
            className="detail-panel"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* HEADER */}

            <div className="detail-header">

              <button
                className="detail-back"
                onClick={() =>
                  setSelectedControl(null)
                }
              >
                <ArrowLeft size={16} />
                Back to Controls
              </button>

              <div className="eyebrow">
                GRC MANAGEMENT
                <span>•</span>
                CONTROL
              </div>

              <h2>
                {selectedControl.control_id}
              </h2>

              <p>
                {selectedControl.name}
              </p>

            </div>


            {/* CONTROL SUMMARY */}

            <div className="detail-section">

              <div className="detail-section-title">

                <ShieldCheck size={17} />

                <div>

                  <h3>
                    Control Record
                  </h3>

                  <span>
                    AEGIS control definition
                  </span>

                </div>

              </div>


              <div className="detail-grid">

                <div className="detail-field">
                  <span>
                    CONTROL ID
                  </span>

                  <strong>
                    {selectedControl.control_id}
                  </strong>
                </div>


                <div className="detail-field">
                  <span>
                    CONTROL TYPE
                  </span>

                  <strong>
                    {selectedControl.control_type}
                  </strong>
                </div>


                <div className="detail-field">
                  <span>
                    OWNER
                  </span>

                  <strong>
                    {selectedControl.owner ??
                      'Unassigned'}
                  </strong>
                </div>


                <div className="detail-field">
                  <span>
                    STATUS
                  </span>

                  <strong>
                    <span
                      className={`table-badge ${badgeClass(
                        selectedControl.status,
                      )}`}
                    >
                      {selectedControl.status}
                    </span>
                  </strong>
                </div>

              </div>

            </div>


            {/* TRACEABILITY */}

            <div className="detail-section">

              <div className="detail-section-title">

                <CircleAlert size={17} />

                <div>

                  <h3>
                    Risk Traceability
                  </h3>

                  <span>
                    Risks associated with
                    this control
                  </span>

                </div>

              </div>


              {selectedRiskLinks.length ===
              0 ? (

                <div className="empty-state">
                  No risks are currently
                  mapped to this control.
                </div>

              ) : (

                selectedRiskLinks.map(
                  ({
                    risk,
                  }) => (

                    <div
                      className="detail-linked-record"
                      key={risk!.id}
                    >

                      <div>

                        <strong>
                          {risk!.risk_number}
                        </strong>

                        <span>
                          {risk!.title}
                        </span>

                      </div>


                      <div className="detail-linked-badges">

                        <span
                          className={`table-badge ${badgeClass(
                            risk!.risk_level,
                          )}`}
                        >
                          {risk!.risk_level}
                        </span>

                        <span className="table-badge blue">
                          Score {risk!.risk_score}
                        </span>

                        <span
                          className={`table-badge ${badgeClass(
                            risk!.status,
                          )}`}
                        >
                          {risk!.status}
                        </span>

                      </div>

                    </div>

                  ),
                )

              )}

            </div>


            {/* ASSURANCE */}

            <div className="detail-section">

              <div className="detail-section-title">

                <CheckCircle2 size={17} />

                <div>

                  <h3>
                    Assurance & Traceability
                  </h3>

                  <span>
                    Risk, evidence and assurance
                    traceability for this control
                  </span>

                </div>

              </div>              <div className="detail-assurance-grid">

                <div className="detail-assurance-card">
                  <span>RISKS</span>
                  <strong>
                    {selectedRiskLinks.length}
                  </strong>
                </div>

                <div className="detail-assurance-card">
                  <span>EVIDENCE</span>
                  <strong>
                    {selectedEvidence.length}
                  </strong>
                </div>

                <div className="detail-assurance-card">
                  <span>CONTROL TESTS</span>
                  <strong>
                    {selectedControlTests.length}
                  </strong>
                </div>

                <div className="detail-assurance-card">
                  <span>REMEDIATIONS</span>
                  <strong>
                    {selectedRemediations.length}
                  </strong>
                </div>

                <div className="detail-assurance-card">
                  <span>VERIFICATIONS</span>
                  <strong>
                    {selectedVerifications.length}
                  </strong>
                </div>

                <div className="detail-assurance-card">
                  <span>PASS VERIFICATIONS</span>
                  <strong>
                    {
                      selectedVerifications.filter(
                        (verification) =>
                          verification.result
                            .toLowerCase() ===
                          'pass',
                      ).length
                    }
                  </strong>
                </div>

                <div className="detail-assurance-card">
                  <span>COMPLIANCE MAPPINGS</span>
                  <strong>
                    {selectedComplianceMappings.length}
                  </strong>
                </div>

              </div>

            </div>

            {/* EVIDENCE */}

            {/* EVIDENCE */}

<div className="detail-section">

  <div className="detail-section-title">

    <CheckCircle2 size={17} />

    <div>

      <h3>
        Evidence
      </h3>

      <span>
        Evidence supporting this control
      </span>

    </div>

  </div>


  {assuranceLoading ? (

    <div className="empty-state">
      Loading evidence...
    </div>

  ) : selectedEvidence.length === 0 ? (

    <div className="empty-state">
      No evidence records linked
      to this control.
    </div>

  ) : (

    selectedEvidence.map(
      (evidence) => (

        <div
          className="detail-linked-record"
          key={evidence.id}
        >

          <div>

            <strong>
              {evidence.evidence_number}
            </strong>

            <span>
              {evidence.title}
            </span>

            <small>
              {evidence.evidence_type}
              {' • '}
              {evidence.source}
            </small>

          </div>


          <div className="detail-linked-badges">

            <span
              className={`table-badge ${badgeClass(
                evidence.status,
              )}`}
            >
              {evidence.status}
            </span>

          </div>

        </div>

      ),
    )

  )}

</div>


{/* CONTROL TESTS */}

<div className="detail-section">

  <div className="detail-section-title">

    <ShieldCheck size={17} />

    <div>

      <h3>
        Control Tests
      </h3>

      <span>
        Testing records and assurance results
      </span>

    </div>

  </div>


  {assuranceLoading ? (

    <div className="empty-state">
      Loading control tests...
    </div>

  ) : selectedControlTests.length === 0 ? (

    <div className="empty-state">
      No control tests linked
      to this control.
    </div>

  ) : (

    selectedControlTests.map(
      (test) => (

        <div
          className="detail-linked-record"
          key={test.id}
        >

          <div>

            <strong>
              {test.test_number ??
                'Control Test'}
            </strong>

            <span>
              {test.test_procedure ??
                'Control effectiveness test'}
            </span>

            <small>
              Tester:{' '}
              {test.tester ??
                'Analyst'}
            </small>

          </div>


          <div className="detail-linked-badges">

            <span
              className={`table-badge ${
                test.result?.toLowerCase() ===
                'pass'
                  ? 'verified'
                  : badgeClass(
                      test.result,
                    )
              }`}
            >
              {test.result ??
                'pending'}
            </span>

          </div>

        </div>

      ),
    )

  )}

</div>



            {/* COMPLIANCE TRACEABILITY */}

            <div className="detail-section">

              <div className="detail-section-title">

                <ShieldCheck size={17} />

                <div>

                  <h3>
                    Compliance Traceability
                  </h3>

                  <span>
                    Framework requirements mapped to this control
                  </span>

                </div>

              </div>

              {complianceLoading ? (

                <div className="empty-state">
                  Loading compliance mappings...
                </div>

              ) : selectedComplianceMappings.length === 0 ? (

                <div className="empty-state">
                  No compliance requirements mapped to this control.
                </div>

              ) : (

                selectedComplianceMappings.map(
                  (mapping) => (

                    <div
                      className="detail-linked-record"
                      key={mapping.id}
                    >

                      <div>

                        <strong>
                          {mapping.framework_code === 'SOC2'
                            ? 'SOC 2'
                            : mapping.framework_code === 'ISO27001'
                              ? 'ISO 27001'
                              : mapping.framework_code === 'NIST-CSF'
                                ? 'NIST CSF'
                                : mapping.framework_code === 'CIS-CONTROLS'
                                  ? 'CIS Controls'
                                  : mapping.framework_name ??
                                    'Framework'}
                        </strong>

                        <span>
                          {mapping.requirement_identifier}
                          {' — '}
                          {mapping.requirement_title}
                        </span>

                        <small>
                          {mapping.mapping_type}
                          {' • '}
                          {mapping.status}
                        </small>

                      </div>

                      <div className="detail-linked-badges">

                        <span className="table-badge blue">
                          {mapping.mapping_type}
                        </span>

                        <span className="table-badge cyan">
                          mapped
                        </span>

                      </div>

                    </div>

                  ),
                )

              )}

            </div>


            {/* REMEDIATION */}

            <div className="detail-section">

              <div className="detail-section-title">

                <CheckCircle2 size={17} />

                <div>

                  <h3>
                    Remediation
                  </h3>

                  <span>
                    Risk-driven remediation
                    associated with this control
                  </span>

                </div>

              </div>


              {selectedRemediations.length ===
              0 ? (

                <div className="empty-state">
                  No remediation records
                  linked to this control.
                </div>

              ) : (

                selectedRemediations.map(
                  (remediation) => (

                    <div
                      className="detail-linked-record"
                      key={remediation.id}
                    >

                      <div>

                        <strong>
                          {
                            remediation.remediation_number
                          }
                        </strong>

                        <span>
                          {remediation.title}
                        </span>

                      </div>


                      <div className="detail-linked-badges">

                        <span
                          className={`table-badge ${badgeClass(
                            remediation.priority,
                          )}`}
                        >
                          {remediation.priority}
                        </span>

                        <span
                          className={`table-badge ${badgeClass(
                            remediation.status,
                          )}`}
                        >
                          {remediation.status}
                        </span>

                        <span
                          className={`table-badge ${badgeClass(
                            remediation.verification_status,
                          )}`}
                        >
                          {
                            remediation.verification_status
                          }
                        </span>

                      </div>

                    </div>

                  ),
                )

              )}

            </div>


            {/* VERIFICATION */}

            <div className="detail-section">

              <div className="detail-section-title">

                <CheckCircle2 size={17} />

                <div>

                  <h3>
                    Verification
                  </h3>

                  <span>
                    Verification of remediation
                    effectiveness
                  </span>

                </div>

              </div>


              {selectedVerifications.length ===
              0 ? (

                <div className="empty-state">
                  No verification records
                  linked to this control.
                </div>

              ) : (

                selectedVerifications.map(
                  (verification) => (

                    <div
                      className="detail-linked-record"
                      key={verification.id}
                    >

                      <div>

                        <strong>
                          {
                            verification.verification_number
                          }
                        </strong>

                        <span>
                          Verifier:{' '}
                          {verification.verifier ??
                            'Analyst'}
                        </span>

                        <small>
                          Verified:{' '}
                          {formatDate(
                            verification.verified_at,
                          )}
                        </small>

                      </div>


                      <div className="detail-linked-badges">

                        <span
                          className={`table-badge ${
                            verification.result
                              .toLowerCase() ===
                            'pass'
                              ? 'verified'
                              : badgeClass(
                                  verification.result,
                                )
                          }`}
                        >
                          {verification.result}
                        </span>

                      </div>

                    </div>

                  ),
                )

              )}

            </div>

          </aside>

        </div>

      )}

    </section>
  );
}