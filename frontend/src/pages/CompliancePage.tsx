import React from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  FileCheck2,
  Link2,
  ShieldCheck,
} from 'lucide-react';

import {
  getComplianceMappings,
  getComplianceRequirements,
  getVerifications,
  type ComplianceMapping,
  type ComplianceOverview,
  type ComplianceRequirement,
  type Verification,
} from '../api/dashboard';
interface CompliancePageProps {
  frameworks: ComplianceOverview[];
}

interface ComplianceControl {
  id: string;
  control_id: string;
  name: string;
  description?: string | null;
}


function coverageTone(coverage: number) {
  if (coverage >= 90) return 'low';
  if (coverage >= 70) return 'medium';
  return 'high';
}


function frameworkShortName(code: string) {
  switch (code) {
    case 'ISO27001':
      return 'ISO 27001';

    case 'NIST-CSF':
      return 'NIST CSF';

    case 'CIS-CONTROLS':
      return 'CIS Controls';

    case 'SOC2':
      return 'SOC 2';

    default:
      return code;
  }
}


function mappingTone(mappingType: string) {
  return mappingType.toLowerCase() === 'direct'
    ? 'blue'
    : 'cyan';
}


export default function CompliancePage({
  frameworks,
}: CompliancePageProps) {

  const [selectedFramework, setSelectedFramework] =
    React.useState<ComplianceOverview | null>(null);

  const [requirements, setRequirements] =
    React.useState<ComplianceRequirement[]>([]);

  const [mappings, setMappings] =
    React.useState<ComplianceMapping[]>([]);

  const [loading, setLoading] =
    React.useState(false);

  const [error, setError] =
    React.useState<string | null>(null);

  const [verifications, setVerifications] =
    React.useState<Verification[]>([]);


  const totalRequirements =
    frameworks.reduce(
      (sum, framework) =>
        sum + framework.total_requirements,
      0,
    );

  const mappedRequirements =
    frameworks.reduce(
      (sum, framework) =>
        sum + framework.mapped_requirements,
      0,
    );

  const mappedControls =
    frameworks.reduce(
      (sum, framework) =>
        sum + framework.mapped_controls,
      0,
    );

  const verifiedControls =
    frameworks.reduce(
      (sum, framework) =>
        sum + framework.verified_controls,
      0,
    );

  const overallCoverage =
    totalRequirements > 0
      ? Math.round(
          (mappedRequirements /
            totalRequirements) *
            1000,
        ) / 10
      : 0;


  async function openFramework(
    framework: ComplianceOverview,
  ) {

    setSelectedFramework(framework);
    setLoading(true);
    setError(null);

    try {

      const [
        requirementData,
        mappingData,
        verificationData,
      ] = await Promise.all([
        getComplianceRequirements(framework.id),
        getComplianceMappings(framework.id),
        getVerifications(),
      ]);

      setRequirements(requirementData);
      setMappings(mappingData);
      setVerifications(verificationData);

    } catch (err) {

      console.error(
        'AEGIS COMPLIANCE DETAIL ERROR:',
        err,
      );

      setError(
        'Unable to load framework details.',
      );

      setRequirements([]);
      setMappings([]);
      setVerifications([]);

    } finally {

      setLoading(false);

    }
  }


  function closeFramework() {
    setSelectedFramework(null);
    setRequirements([]);
    setMappings([]);
    setVerifications([]);
    setError(null);
  }


  if (selectedFramework) {

    return (
      <FrameworkDetail
        framework={selectedFramework}
        requirements={requirements}
        mappings={mappings}
        verifications={verifications}
        loading={loading}
        error={error}
        onBack={closeFramework}
        onMappingCreated={() => openFramework(selectedFramework)}
      />
    );

  }


  return (
    <section className="page-content">

      <div className="page-header">

        <div>

          <div className="eyebrow">
            GRC MANAGEMENT
            <span>•</span>
            COMPLIANCE
          </div>

          <h1>
            Compliance
          </h1>

          <p>
            Framework mapping, control coverage,
            and assurance visibility across AEGIS.
          </p>

        </div>

      </div>


      {/* SUMMARY */}

      <section className="compliance-metric-grid">

        <div className="compliance-metric-card">

          <div className="compliance-metric-icon blue">
            <FileCheck2 size={20} />
          </div>

          <div className="compliance-metric-content">
            <span>Frameworks</span>

            <strong>
              {frameworks.length}
            </strong>

            <small>
              Active framework catalogs
            </small>
          </div>

        </div>


        <div className="compliance-metric-card">

          <div className="compliance-metric-icon cyan">
            <ShieldCheck size={20} />
          </div>

          <div className="compliance-metric-content">

            <span>
              Requirements
            </span>

            <strong>
              {mappedRequirements}
              <em>
                {' '}/ {totalRequirements}
              </em>
            </strong>

            <small>
              Requirements mapped
            </small>

          </div>

        </div>


        <div className="compliance-metric-card">

          <div className="compliance-metric-icon teal">
            <ShieldCheck size={20} />
          </div>

          <div className="compliance-metric-content">

            <span>
              Mapped Controls
            </span>

            <strong>
              {mappedControls}
            </strong>

            <small>
              AEGIS controls referenced
            </small>

          </div>

        </div>


        <div className="compliance-metric-card">

          <div className="compliance-metric-icon green">
            <CheckCircle2 size={20} />
          </div>

          <div className="compliance-metric-content">

            <span>
              Verified Controls
            </span>

            <strong>
              {verifiedControls}
            </strong>

            <small>
              PASS verification records
            </small>

          </div>

        </div>

      </section>


      {/* FRAMEWORKS */}

      <div className="table-card page-table">

        <div className="table-header">

          <div>

            <h3>
              Framework Coverage
            </h3>

            <span>
              Select a framework to inspect
              requirement-to-control mappings
            </span>

          </div>

          <div className="table-header-summary">

            <strong>
              {overallCoverage}%
            </strong>

            <span>
              Catalog Coverage
            </span>

          </div>

        </div>


        <div className="page-table-scroll">

          {frameworks.length === 0 ? (

            <div className="empty-state">
              No compliance framework data available.
            </div>

          ) : (

            frameworks.map((framework) => {

              const tone =
                coverageTone(
                  framework.coverage_percentage,
                );

              return (
                <button
                  type="button"
                  className="compliance-framework-row"
                  key={framework.id}
                  onClick={() =>
                    openFramework(framework)
                  }
                >

                  <div className="compliance-framework-icon">
                    <FileCheck2 size={17} />
                  </div>


                  <div className="page-record-main">

                    <strong>
                      {frameworkShortName(
                        framework.code,
                      )}
                    </strong>

                    <span>
                      {framework.name}
                    </span>

                    <small>
                      Version: {framework.version}
                    </small>

                  </div>


                  <div className="compliance-stat">

                    <span>
                      Requirements
                    </span>

                    <strong>
                      {framework.mapped_requirements}
                      {' / '}
                      {framework.total_requirements}
                    </strong>

                  </div>


                  <div className="compliance-stat">

                    <span>
                      Controls
                    </span>

                    <strong>
                      {framework.mapped_controls}
                    </strong>

                  </div>


                  <div className="compliance-stat">

                    <span>
                      Verified
                    </span>

                    <strong>
                      {framework.verified_controls}
                    </strong>

                  </div>


                  <div className="compliance-coverage">

                    <div className="coverage-top">

                      <span>
                        Coverage
                      </span>

                      <strong>
                        {framework.coverage_percentage}%
                      </strong>

                    </div>

                    <div className="coverage-bar">

                      <div
                        className={`coverage-fill ${tone}`}
                        style={{
                          width: `${Math.min(
                            framework.coverage_percentage,
                            100,
                          )}%`,
                        }}
                      />

                    </div>

                  </div>


                  <ChevronRight
                    size={17}
                    className="compliance-row-arrow"
                  />

                </button>
              );

            })

          )}

        </div>

      </div>


      <div className="panel compliance-note">

        <div className="compliance-note-icon">
          <CircleAlert size={18} />
        </div>

        <div>

          <strong>
            AEGIS catalog coverage
          </strong>

          <p>
            Coverage reflects the requirements currently
            represented in the AEGIS compliance catalog
            and mapped to AEGIS controls. It is not a
            certification or claim of full framework
            compliance.
          </p>

        </div>

      </div>

    </section>
  );
}


/* =========================================================
   FRAMEWORK DETAIL
   ========================================================= */

function FrameworkDetail({
  framework,
  requirements,
  mappings,
  verifications,
  loading,
  error,
  onBack,
  onMappingCreated,
}: {
  framework: ComplianceOverview;
  requirements: ComplianceRequirement[];
  mappings: ComplianceMapping[];
  verifications: Verification[];
  loading: boolean;
  error: string | null;
  onBack: () => void;
  onMappingCreated: () => void;
}) {

  const [controls, setControls] =
    React.useState<ComplianceControl[]>([]);

  const [currentMappings, setCurrentMappings] =
    React.useState<ComplianceMapping[]>(mappings);

  const [mappingRequirement, setMappingRequirement] =
    React.useState<ComplianceRequirement | null>(null);

  const [mappingControlId, setMappingControlId] =
    React.useState('');

  const [mappingType, setMappingType] =
    React.useState('direct');

  const [mappingRationale, setMappingRationale] =
    React.useState('');

  const [mappingSaving, setMappingSaving] =
    React.useState(false);

  const [mappingMessage, setMappingMessage] =
    React.useState('');

  React.useEffect(() => {
    setCurrentMappings(mappings);
  }, [mappings]);

  React.useEffect(() => {
    async function loadControls() {
      try {
        const response = await fetch(
          'http://127.0.0.1:8000/controls',
        );

        if (response.ok) {
          setControls(await response.json());
        }
      } catch (err) {
        console.error(
          'AEGIS COMPLIANCE CONTROL LOAD ERROR:',
          err,
        );
      }
    }

    loadControls();
  }, []);

  function openMappingForm(
    requirement: ComplianceRequirement,
  ) {
    setMappingRequirement(requirement);
    setMappingControlId('');
    setMappingType('direct');
    setMappingRationale('');
    setMappingMessage('');
  }

  function closeMappingForm() {
    setMappingRequirement(null);
    setMappingControlId('');
    setMappingType('direct');
    setMappingRationale('');
    setMappingMessage('');
  }

  async function createMapping() {
    if (!mappingRequirement) {
      return;
    }

    if (!mappingControlId) {
      setMappingMessage('Select an AEGIS control to map.');
      return;
    }

    const existingMapping = currentMappings.find(
      (mapping) =>
        mapping.requirement_id === mappingRequirement.id &&
        mapping.control_id === mappingControlId,
    );

    if (existingMapping) {
      setMappingMessage(
        'This requirement-control mapping already exists.',
      );
      return;
    }

    setMappingSaving(true);
    setMappingMessage('');

    try {
      const response = await fetch(
        'http://127.0.0.1:8000/compliance/mappings',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            framework_id: framework.id,
            requirement_id: mappingRequirement.id,
            control_id: mappingControlId,
            mapping_type: mappingType,
            status: 'mapped',
            rationale:
              mappingRationale.trim() || null,
          }),
        },
      );

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(
          detail || 'Failed to create compliance mapping.',
        );
      }

      setMappingMessage(
        'Control mapping created successfully.',
      );

      closeMappingForm();

      const refreshedResponse = await fetch(
        `http://127.0.0.1:8000/compliance/frameworks/${framework.id}/controls`,
      );

      if (refreshedResponse.ok) {
        const refreshedMappings =
          await refreshedResponse.json();

        setCurrentMappings(refreshedMappings);
      }

      onMappingCreated();
    } catch (err) {
      setMappingMessage(
        err instanceof Error
          ? err.message
          : 'Failed to create compliance mapping.',
      );
    } finally {
      setMappingSaving(false);
    }
  }

  const getControlVerification = (
    controlId: string,
  ): 'verified' | 'partial' | 'failed' | 'not_verified' => {
    const records = verifications.filter(
      (verification) =>
        verification.control_id === controlId,
    );

    if (records.length === 0) {
      return 'not_verified';
    }

    if (
      records.some(
        (record) =>
          record.result.toUpperCase() === 'PASS',
      )
    ) {
      return 'verified';
    }

    if (
      records.some(
        (record) =>
          record.result.toUpperCase() === 'PARTIAL',
      )
    ) {
      return 'partial';
    }

    return 'failed';
  };

  const mappingStatusTone = (status: string) => {
    switch (status.toLowerCase()) {
      case 'mapped':
        return 'blue';
      case 'unmapped':
        return 'pending';
      case 'deprecated':
        return 'failed';
      default:
        return 'blue';
    }
  };

  const verificationStatusTone = (
    status: string,
  ) => {
    switch (status.toLowerCase()) {
      case 'verified':
        return 'verified';
      case 'partial':
        return 'partial';
      case 'failed':
        return 'failed';
      case 'not_verified':
      case 'not verified':
        return 'pending';
      default:
        return 'pending';
    }
  };

  const mappedRequirementIds =
    new Set(
      currentMappings.map(
        (mapping) =>
          mapping.requirement_id,
      ),
    );


  return (
    <section className="page-content">

      {/* HEADER */}

      <div className="framework-detail-header">

        <button
          type="button"
          className="framework-back-button"
          onClick={onBack}
        >
          <ArrowLeft size={16} />
          Back to Compliance
        </button>


        <div className="framework-detail-title">

          <div className="compliance-framework-icon large">
            <FileCheck2 size={20} />
          </div>

          <div>

            <div className="eyebrow">
              COMPLIANCE FRAMEWORK
              <span>•</span>
              {frameworkShortName(
                framework.code,
              )}
            </div>

            <h1>
              {frameworkShortName(
                framework.code,
              )}
            </h1>

            <p>
              {framework.name}
              {' • '}
              Version: {framework.version}
            </p>

          </div>

        </div>

      </div>


      {/* DETAIL SUMMARY */}

      <section className="framework-detail-summary">

        <div className="framework-summary-card">

          <span>
            Catalog Coverage
          </span>

          <strong>
            {framework.coverage_percentage}%
          </strong>

          <div className="coverage-bar">

            <div
              className={`coverage-fill ${
                coverageTone(
                  framework.coverage_percentage,
                )
              }`}
              style={{
                width: `${Math.min(
                  framework.coverage_percentage,
                  100,
                )}%`,
              }}
            />

          </div>

        </div>


        <div className="framework-summary-card">

          <span>
            Requirements
          </span>

          <strong>
            {framework.mapped_requirements}
            <em>
              {' '}/ {framework.total_requirements}
            </em>
          </strong>

          <small>
            Requirements mapped
          </small>

        </div>


        <div className="framework-summary-card">

          <span>
            AEGIS Controls
          </span>

          <strong>
            {framework.mapped_controls}
          </strong>

          <small>
            Unique mapped controls
          </small>

        </div>


        <div className="framework-summary-card">

          <span>
            Verified
          </span>

          <strong>
            {framework.verified_controls}
          </strong>

          <small>
            Controls with PASS verification
          </small>

        </div>

      </section>


      {/* REQUIREMENTS */}

      <div className="table-card page-table">

        <div className="table-header">

          <div>

            <h3>
              Requirements & Control Mappings
            </h3>

            <span>
              Actual AEGIS catalog records for this
              framework
            </span>

          </div>

          <span className="table-badge blue">
            {requirements.length} requirements
          </span>

        </div>


        {loading ? (

          <div className="compliance-loading">
            Loading framework details...
          </div>

        ) : error ? (

          <div className="compliance-error">
            {error}
          </div>

        ) : (

          <div className="compliance-requirement-list">

            {requirements.map(
              (requirement) => {

                const requirementMappings =
                  currentMappings.filter(
                    (mapping) =>
                      mapping.requirement_id ===
                      requirement.id,
                  );

                const isMapped =
                  mappedRequirementIds.has(
                    requirement.id,
                  );

                return (
                  <div
                    className={`compliance-requirement ${
                      isMapped
                        ? 'mapped'
                        : 'unmapped'
                    }`}
                    key={requirement.id}
                  >

                    <div className="requirement-main">

                      <div className="requirement-icon">

                        {isMapped ? (
                          <Link2 size={16} />
                        ) : (
                          <CircleAlert size={16} />
                        )}

                      </div>


                      <div>

                        <div className="requirement-id">
                          {requirement.requirement_id}
                        </div>

                        <strong>
                          {requirement.title}
                        </strong>

                        {requirement.description && (
                          <p>
                            {requirement.description}
                          </p>
                        )}

                      </div>

                    </div>


                    <div className="requirement-mappings">

                      {requirementMappings.length === 0 ? (
                        <>
                        <div className="unmapped-message">

                          <div className="unmapped-message-main">
                            <span>
                              No AEGIS control mapped
                            </span>

                            <span className="table-badge pending">
                              Unmapped
                            </span>
                          </div>

                          <button
                            type="button"
                            className="incident-action-button primary compliance-map-button"
                            onClick={() =>
                              openMappingForm(
                                requirement,
                              )
                            }
                          >
                            Map Control
                          </button>

                        </div>

                        {mappingRequirement?.id ===
                          requirement.id && (
                          <div className="compliance-mapping-form">

                            <div className="compliance-mapping-form-header">
                              <div>
                                <strong>
                                  Map AEGIS Control
                                </strong>

                                <span>
                                  {requirement.requirement_id}
                                  {' — '}
                                  {requirement.title}
                                </span>
                              </div>

                              <button
                                type="button"
                                className="framework-back-button"
                                onClick={closeMappingForm}
                              >
                                Cancel
                              </button>
                            </div>

                            <div className="compliance-mapping-fields">

                              <label>
                                <strong>
                                  AEGIS Control
                                </strong>

                                <select
                                  value={mappingControlId}
                                  onChange={(event) =>
                                    setMappingControlId(
                                      event.target.value,
                                    )
                                  }
                                >
                                  <option value="">
                                    Select a control
                                  </option>

                                  {controls.map(
                                    (control) => (
                                      <option
                                        key={control.id}
                                        value={control.id}
                                      >
                                        {control.control_id}
                                        {' — '}
                                        {control.name}
                                      </option>
                                    ),
                                  )}
                                </select>
                              </label>

                              <label>
                                <strong>
                                  Mapping Type
                                </strong>

                                <select
                                  value={mappingType}
                                  onChange={(event) =>
                                    setMappingType(
                                      event.target.value,
                                    )
                                  }
                                >
                                  <option value="direct">
                                    Direct
                                  </option>
                                  <option value="supporting">
                                    Supporting
                                  </option>
                                </select>
                              </label>

                              <label className="compliance-mapping-rationale">
                                <strong>
                                  Rationale
                                </strong>

                                <textarea
                                  value={mappingRationale}
                                  onChange={(event) =>
                                    setMappingRationale(
                                      event.target.value,
                                    )
                                  }
                                  rows={3}
                                  placeholder="Explain why this control supports the selected requirement."
                                />
                              </label>

                            </div>

                            <div className="compliance-mapping-actions">

                              <button
                                type="button"
                                className="incident-action-button primary"
                                onClick={createMapping}
                                disabled={mappingSaving}
                              >
                                {mappingSaving
                                  ? 'Mapping…'
                                  : 'Accept & Map Control'}
                              </button>

                              {mappingMessage && (
                                <span className="evidence-form-message">
                                  {mappingMessage}
                                </span>
                              )}

                            </div>

                          </div>
                        )}
                        </>

                      ) : (

                        requirementMappings.map(
                          (mapping) => {
                            const verificationStatus =
                              getControlVerification(
                                mapping.control_id,
                              );

                            return (
                              <div
                              className="control-mapping"
                              key={mapping.id}
                            >

                              <div className="control-mapping-main">

                                <ShieldCheck size={15} />

                                <div>

                                  <strong>
                                    {mapping.control_identifier}
                                  </strong>

                                  <span>
                                    {mapping.control_name}
                                  </span>

                                </div>

                              </div>


                              <span
                                className={`table-badge ${
                                  mappingTone(
                                    mapping.mapping_type,
                                  )
                                }`}
                              >
                                {mapping.mapping_type}
                              </span>


                              <span
                                className={`table-badge ${
                                  mappingStatusTone(
                                    mapping.status,
                                  )
                                }`}
                              >
                                {mapping.status}
                              </span>


                              <span
                                className={`table-badge ${
                                  verificationStatusTone(
                                    verificationStatus,
                                  )
                                }`}
                              >
                                {verificationStatus.replace(
                                  '_',
                                  ' ',
                                )}
                              </span>

                              </div>
                            );
                          },
                        )

                      )}

                    </div>

                  </div>
                );

              },
            )}

          </div>

        )}

      </div>


      {/* SCOPE */}

      <div className="panel compliance-note">

        <div className="compliance-note-icon">
          <CircleAlert size={18} />
        </div>

        <div>

          <strong>
            Mapping scope
          </strong>

          <p>
            The requirements shown here are the
            requirements currently seeded in the AEGIS
            compliance catalog. Mapping status describes
            AEGIS's internal requirement-to-control
            relationships; it does not by itself establish
            external certification or audit compliance.
          </p>

        </div>

      </div>

    </section>
  );
}