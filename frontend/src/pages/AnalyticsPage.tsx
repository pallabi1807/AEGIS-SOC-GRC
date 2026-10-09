import type {
  Alert,
  Incident,
  Risk,
  Control,
  Remediation,
  Verification,
  Evidence,
  ComplianceOverview,
} from '../api/dashboard';

interface AnalyticsPageProps {
  alerts: Alert[];
  incidents: Incident[];
  risks: Risk[];
  controls: Control[];
  remediations: Remediation[];
  verifications: Verification[];
  evidence: Evidence[];
  complianceOverview: ComplianceOverview[];
}

function percentage(
  value: number,
  total: number,
): number {
  if (!total) return 0;

  return Math.round(
    (value / total) * 100,
  );
}


/* =========================================================
   ANALYTICS BAR
   ========================================================= */

function BarRow({
  label,
  value,
  total,
  tone = 'blue',
}: {
  label: string;
  value: number;
  total: number;
  tone?: string;
}) {
  const width = total
    ? Math.max(
        (value / total) * 100,
        value > 0 ? 4 : 0,
      )
    : 0;

  return (
    <div className="analytics-bar-row">

      <div className="analytics-bar-label">
        <span>{label}</span>

        <strong>
          {value}
        </strong>
      </div>

      <div className="analytics-bar-track">

        <span
          className={`analytics-bar-fill ${tone}`}
          style={{
            width: `${width}%`,
          }}
        />

      </div>

    </div>
  );
}


/* =========================================================
   ANALYTICS CARD
   ========================================================= */

function AnalyticsCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="analytics-live-card">

      <div className="analytics-live-header">

        <div>
          <h3>{title}</h3>

          <span>
            {subtitle}
          </span>
        </div>

      </div>

      {children}

    </div>
  );
}


/* =========================================================
   ANALYTICS PAGE
   ========================================================= */

export default function AnalyticsPage({
  alerts,
  incidents,
  risks,
  controls,
  remediations,
  verifications,
  evidence,
  complianceOverview,
}: AnalyticsPageProps) {


  /* =========================================================
     ALERT ANALYTICS
     ========================================================= */

  const criticalAlerts =
    alerts.filter(
      (alert) =>
        alert.severity.toLowerCase() ===
        'critical',
    ).length;

  const highAlerts =
    alerts.filter(
      (alert) =>
        alert.severity.toLowerCase() ===
        'high',
    ).length;

  const mediumAlerts =
    alerts.filter(
      (alert) =>
        alert.severity.toLowerCase() ===
        'medium',
    ).length;

  const lowAlerts =
    alerts.filter(
      (alert) =>
        alert.severity.toLowerCase() ===
        'low',
    ).length;

  const highCriticalAlerts =
    criticalAlerts + highAlerts;

  const highCriticalAlertRate =
    percentage(
      highCriticalAlerts,
      alerts.length,
    );


  /* =========================================================
     INCIDENT ANALYTICS
     ========================================================= */

  const activeIncidents =
    incidents.filter(
      (incident) =>
        ![
          'resolved',
          'closed',
        ].includes(
          incident.status.toLowerCase(),
        ),
    ).length;

  const resolvedIncidents =
    incidents.filter(
      (incident) =>
        incident.status.toLowerCase() ===
        'resolved',
    ).length;

  const closedIncidents =
    incidents.filter(
      (incident) =>
        incident.status.toLowerCase() ===
        'closed',
    ).length;

  const highSeverityIncidents =
    incidents.filter(
      (incident) =>
        [
          'high',
          'critical',
        ].includes(
          incident.severity.toLowerCase(),
        ),
    ).length;




  /* =========================================================
     RISK ANALYTICS
     ========================================================= */

  const criticalRisks =
    risks.filter(
      (risk) =>
        risk.risk_level.toLowerCase() ===
        'critical',
    ).length;

  const highRisks =
    risks.filter(
      (risk) =>
        risk.risk_level.toLowerCase() ===
        'high',
    ).length;

  const mediumRisks =
    risks.filter(
      (risk) =>
        risk.risk_level.toLowerCase() ===
        'medium',
    ).length;

  const lowRisks =
    risks.filter(
      (risk) =>
        risk.risk_level.toLowerCase() ===
        'low',
    ).length;

  const openRisks =
    risks.filter(
      (risk) =>
        ![
          'closed',
          'resolved',
        ].includes(
          risk.status.toLowerCase(),
        ),
    ).length;

  const highCriticalRisks =
    highRisks + criticalRisks;


  /* =========================================================
     REMEDIATION ANALYTICS
     ========================================================= */

  const openRemediations =
    remediations.filter(
      (item) =>
        item.status.toLowerCase() ===
        'open',
    ).length;

  const inProgressRemediations =
    remediations.filter(
      (item) =>
        item.status.toLowerCase() ===
        'in_progress',
    ).length;

  const completedRemediations =
    remediations.filter(
      (item) =>
        item.status.toLowerCase() ===
        'completed',
    ).length;

  const verifiedRemediations =
    remediations.filter(
      (item) =>
        item.verification_status
          .toLowerCase() ===
        'verified',
    ).length;

  const unverifiedRemediations =
    Math.max(
      remediations.length -
        verifiedRemediations,
      0,
    );

  const remediationVerificationRate =
    percentage(
      verifiedRemediations,
      remediations.length,
    );


  /* =========================================================
     VERIFICATION ANALYTICS
     ========================================================= */

  const passedVerifications =
    verifications.filter(
      (item) =>
        item.result.toLowerCase() ===
        'pass',
    ).length;

  const partialVerifications =
    verifications.filter(
      (item) =>
        item.result.toLowerCase() ===
        'partial',
    ).length;

  const failedVerifications =
    verifications.filter(
      (item) =>
        item.result.toLowerCase() ===
        'fail',
    ).length;

  const verificationPassRate =
    percentage(
      passedVerifications,
      verifications.length,
    );


  /* =========================================================
     EVIDENCE ANALYTICS
     ========================================================= */

  const collectedEvidence =
    evidence.filter(
      (item) =>
        item.status.toLowerCase() ===
        'collected',
    ).length;

  const integrityVerifiedEvidence =
    evidence.filter(
      (item) =>
        item.integrity_status
          ?.toLowerCase() ===
        'verified',
    ).length;

  const acceptedEvidence =
    evidence.filter(
      (item) =>
        item.review_status
          ?.toLowerCase() ===
        'accepted',
    ).length;


  /* =========================================================
     COMPLIANCE ANALYTICS
     ========================================================= */

  const totalRequirements =
    complianceOverview.reduce(
      (sum, framework) =>
        sum +
        framework.total_requirements,
      0,
    );

  const totalMappedRequirements =
    complianceOverview.reduce(
      (sum, framework) =>
        sum +
        framework.mapped_requirements,
      0,
    );

  


  const overallComplianceCoverage =
    percentage(
      totalMappedRequirements,
      totalRequirements,
    );


  /* =========================================================
     CONTROL ANALYTICS
     ========================================================= */

  const plannedControls =
    controls.filter(
      (control) =>
        control.status.toLowerCase() ===
        'planned',
    ).length;

  const activeControls =
    controls.filter(
      (control) =>
        [
          'active',
          'implemented',
          'operational',
        ].includes(
          control.status.toLowerCase(),
        ),
    ).length;


  /* =========================================================
     TOP ANALYTICS METRICS
     ========================================================= */

  const metrics = [

    {
      label: 'Total Alerts',
      value: alerts.length,
      detail:
        'Live alert records',
      tone: 'blue',
    },

    {
      label: 'High / Critical Alerts',
      value: highCriticalAlerts,
      detail:
        `${highCriticalAlertRate}% of all alerts`,
      tone: 'high',
    },

    {
      label: 'Active Incidents',
      value: activeIncidents,
      detail:
        `${incidents.length} total incidents`,
      tone: 'cyan',
    },

    {
      label: 'High / Critical Risks',
      value: highCriticalRisks,
      detail:
        `${openRisks} open risks`,
      tone: 'warning',
    },

    {
      label: 'Verified Remediations',
      value: verifiedRemediations,
      detail:
        `${remediationVerificationRate}% verified`,
      tone: 'success',
    },

    {
      label: 'Verification Pass Rate',
      value: `${verificationPassRate}%`,
      detail:
        `${passedVerifications} PASS results`,
      tone: 'teal',
    },

  ];


  return (

    <section className="page-content">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="page-header">

        <div>

          <div className="eyebrow">
            REPORTING
            <span>•</span>
            ANALYTICS
          </div>

          <h1>
            Security Analytics
          </h1>

          <p>
            Data-driven analysis of live
            AEGIS security operations,
            risk, remediation, assurance,
            and compliance records.
          </p>

        </div>

      </div>


      {/* =====================================================
          KPI METRICS
          ===================================================== */}

      <div className="metric-grid page-metrics analytics-metrics">

        {metrics.map(
          (metric) => (

            <div
              className={`metric-card ${metric.tone}`}
              key={metric.label}
            >

              <div className="metric-top">
                <span>
                  {metric.label}
                </span>
              </div>

              <div className="metric-value">
                {metric.value}
              </div>

              <div className="metric-change">
                {metric.detail}
              </div>

              <div className="metric-wave" />

            </div>

          ),
        )}

      </div>


      {/* =====================================================
          OPERATIONAL DISTRIBUTIONS
          ===================================================== */}

      <section className="analytics-live-grid">


        {/* ALERT SEVERITY */}

        <AnalyticsCard
          title="Alert Severity"
          subtitle="Distribution across all live alert records"
        >

          <div className="analytics-bar-list">

            <BarRow
              label="Critical"
              value={criticalAlerts}
              total={alerts.length}
              tone="critical"
            />

            <BarRow
              label="High"
              value={highAlerts}
              total={alerts.length}
              tone="high"
            />

            <BarRow
              label="Medium"
              value={mediumAlerts}
              total={alerts.length}
              tone="warning"
            />

            <BarRow
              label="Low"
              value={lowAlerts}
              total={alerts.length}
              tone="success"
            />

          </div>

        </AnalyticsCard>


        {/* INCIDENT STATUS */}

        <AnalyticsCard
          title="Incident Lifecycle"
          subtitle="Current distribution by incident status"
        >

          <div className="analytics-bar-list">

            <BarRow
              label="Active"
              value={activeIncidents}
              total={incidents.length}
              tone="high"
            />

            <BarRow
              label="Resolved"
              value={resolvedIncidents}
              total={incidents.length}
              tone="success"
            />

            <BarRow
              label="Closed"
              value={closedIncidents}
              total={incidents.length}
              tone="blue"
            />

            <BarRow
              label="High / Critical"
              value={highSeverityIncidents}
              total={incidents.length}
              tone="warning"
            />

          </div>

        </AnalyticsCard>


        {/* RISK LANDSCAPE */}

        <AnalyticsCard
          title="Risk Landscape"
          subtitle="Distribution across the current risk register"
        >

          <div className="analytics-bar-list">

            <BarRow
              label="Critical"
              value={criticalRisks}
              total={risks.length}
              tone="critical"
            />

            <BarRow
              label="High"
              value={highRisks}
              total={risks.length}
              tone="high"
            />

            <BarRow
              label="Medium"
              value={mediumRisks}
              total={risks.length}
              tone="warning"
            />

            <BarRow
              label="Low"
              value={lowRisks}
              total={risks.length}
              tone="success"
            />

          </div>

        </AnalyticsCard>


        {/* REMEDIATION */}

        <AnalyticsCard
          title="Remediation Workload"
          subtitle="Treatment progress across remediation records"
        >

          <div className="analytics-bar-list">

            <BarRow
              label="Open"
              value={openRemediations}
              total={remediations.length}
              tone="high"
            />

            <BarRow
              label="In Progress"
              value={inProgressRemediations}
              total={remediations.length}
              tone="warning"
            />

            <BarRow
              label="Completed"
              value={completedRemediations}
              total={remediations.length}
              tone="success"
            />

            <BarRow
              label="Verified"
              value={verifiedRemediations}
              total={remediations.length}
              tone="blue"
            />

          </div>

        </AnalyticsCard>


        {/* VERIFICATION */}

        <AnalyticsCard
          title="Verification Results"
          subtitle="Outcome distribution across assurance activity"
        >

          <div className="analytics-bar-list">

            <BarRow
              label="PASS"
              value={passedVerifications}
              total={verifications.length}
              tone="success"
            />

            <BarRow
              label="PARTIAL"
              value={partialVerifications}
              total={verifications.length}
              tone="warning"
            />

            <BarRow
              label="FAIL"
              value={failedVerifications}
              total={verifications.length}
              tone="critical"
            />

          </div>

        </AnalyticsCard>


        {/* EVIDENCE */}

        <AnalyticsCard
          title="Evidence Readiness"
          subtitle="Current state of the evidence register"
        >

          <div className="analytics-bar-list">

            <BarRow
              label="Collected"
              value={collectedEvidence}
              total={evidence.length}
              tone="blue"
            />

            <BarRow
              label="Integrity Verified"
              value={integrityVerifiedEvidence}
              total={evidence.length}
              tone="success"
            />

            <BarRow
              label="Analyst Accepted"
              value={acceptedEvidence}
              total={evidence.length}
              tone="teal"
            />

          </div>

        </AnalyticsCard>

      </section>


      {/* =====================================================
          SECURITY POSTURE
          ===================================================== */}

      <section className="analytics-posture-section">

        <div className="analytics-section-heading">

          <div>

            <div className="eyebrow">
              AEGIS
              <span>•</span>
              POSTURE
            </div>

            <h2>
              Security Posture Indicators
            </h2>

            <p>
              Cross-domain indicators derived
              from the current AEGIS data set.
            </p>

          </div>

        </div>


        <div className="analytics-posture-grid">

          <div className="analytics-posture-panel">

            <span>
              Alerts requiring attention
            </span>

            <strong>
              {highCriticalAlerts}
            </strong>

            <small>
              High / Critical
            </small>

          </div>


          <div className="analytics-posture-panel">

            <span>
              Active incidents
            </span>

            <strong>
              {activeIncidents}
            </strong>

            <small>
              Not resolved or closed
            </small>

          </div>


          <div className="analytics-posture-panel">

            <span>
              High / Critical risks
            </span>

            <strong>
              {highCriticalRisks}
            </strong>

            <small>
              Risk register exposure
            </small>

          </div>


          <div className="analytics-posture-panel">

            <span>
              Unverified remediations
            </span>

            <strong>
              {unverifiedRemediations}
            </strong>

            <small>
              Awaiting verification
            </small>

          </div>


          <div className="analytics-posture-panel">

            <span>
              Active controls
            </span>

            <strong>
              {activeControls}
            </strong>

            <small>
              {plannedControls} planned
            </small>

          </div>


          <div className="analytics-posture-panel">

            <span>
              Compliance catalog coverage
            </span>

            <strong>
              {overallComplianceCoverage}%
            </strong>

            <small>
              Requirements mapped
            </small>

          </div>

        </div>

      </section>


      {/* =====================================================
          SECURITY → ASSURANCE PIPELINE
          ===================================================== */}

      <section className="analytics-pipeline-section">

        <div className="analytics-pipeline-header">

          <div>

            <div className="eyebrow">
              AEGIS
              <span>•</span>
              TRACEABILITY
            </div>

            <h2>
              Security → Assurance Pipeline
            </h2>

            <p>
              Live traceability from detection
              through governance, remediation,
              evidence, and compliance.
            </p>

          </div>

        </div>


        <div className="analytics-pipeline">


          <div className="analytics-pipeline-step">

            <span className="analytics-pipeline-number">
              {alerts.length}
            </span>

            <span className="analytics-pipeline-label">
              Alerts
            </span>

            <span className="analytics-pipeline-domain">
              Detection
            </span>

          </div>


          <div className="analytics-pipeline-arrow">
            →
          </div>


          <div className="analytics-pipeline-step">

            <span className="analytics-pipeline-number">
              {incidents.length}
            </span>

            <span className="analytics-pipeline-label">
              Incidents
            </span>

            <span className="analytics-pipeline-domain">
              Investigation
            </span>

          </div>


          <div className="analytics-pipeline-arrow">
            →
          </div>


          <div className="analytics-pipeline-step">

            <span className="analytics-pipeline-number">
              {highCriticalRisks}
            </span>

            <span className="analytics-pipeline-label">
              High / Critical Risks
            </span>

            <span className="analytics-pipeline-domain">
              Risk
            </span>

          </div>


          <div className="analytics-pipeline-arrow">
            →
          </div>


          <div className="analytics-pipeline-step">

            <span className="analytics-pipeline-number">
              {controls.length}
            </span>

            <span className="analytics-pipeline-label">
              Controls
            </span>

            <span className="analytics-pipeline-domain">
              Governance
            </span>

          </div>


          <div className="analytics-pipeline-arrow">
            →
          </div>


          <div className="analytics-pipeline-step">

            <span className="analytics-pipeline-number">
              {remediations.length}
            </span>

            <span className="analytics-pipeline-label">
              Remediations
            </span>

            <span className="analytics-pipeline-domain">
              Treatment
            </span>

          </div>


          <div className="analytics-pipeline-arrow">
            →
          </div>


          <div className="analytics-pipeline-step">

            <span className="analytics-pipeline-number">
              {verifications.length}
            </span>

            <span className="analytics-pipeline-label">
              Verifications
            </span>

            <span className="analytics-pipeline-domain">
              Assurance
            </span>

          </div>


          <div className="analytics-pipeline-arrow">
            →
          </div>


          <div className="analytics-pipeline-step">

            <span className="analytics-pipeline-number">
              {evidence.length}
            </span>

            <span className="analytics-pipeline-label">
              Evidence
            </span>

            <span className="analytics-pipeline-domain">
              Audit Trail
            </span>

          </div>


          <div className="analytics-pipeline-arrow">
            →
          </div>


          <div className="analytics-pipeline-step">

            <span className="analytics-pipeline-number">
              {totalMappedRequirements}
            </span>

            <span className="analytics-pipeline-label">
              Mapped Requirements
            </span>

            <span className="analytics-pipeline-domain">
              Compliance
            </span>

          </div>


        </div>

      </section>


      {/* =====================================================
          COMPLIANCE ANALYTICAL SUMMARY
          ===================================================== */}

      <section className="analytics-compliance-summary">

        <div className="analytics-section-heading">

          <div>

            <div className="eyebrow">
              GOVERNANCE
              <span>•</span>
              COMPLIANCE
            </div>

            <h2>
              Compliance Coverage Analysis
            </h2>

            <p>
              Current AEGIS catalog mapping and
              verification state across frameworks.
            </p>

          </div>

        </div>


        <div className="analytics-framework-grid">

          {complianceOverview.map(
            (framework) => (

              <div
                className="analytics-framework-card"
                key={framework.id}
              >

                <div className="analytics-framework-top">

                  <div>

                    <strong>
                      {framework.code}
                    </strong>

                    <span>
                      {framework.name}
                    </span>

                  </div>

                  <b>
                    {framework.coverage_percentage}%
                  </b>

                </div>


                <div className="analytics-framework-bar">

                  <span
                    style={{
                      width: `${Math.min(
                        framework.coverage_percentage,
                        100,
                      )}%`,
                    }}
                  />

                </div>


                <div className="analytics-framework-stats">

                  <div>
                    <span>
                      Requirements
                    </span>

                    <strong>
                      {framework.mapped_requirements}
                      {' / '}
                      {framework.total_requirements}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Controls
                    </span>

                    <strong>
                      {framework.mapped_controls}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Verified
                    </span>

                    <strong>
                      {framework.verified_controls}
                    </strong>
                  </div>

                </div>

              </div>

            ),
          )}

        </div>

      </section>

    </section>
  );
}