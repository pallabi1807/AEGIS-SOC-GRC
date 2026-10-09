import type {
  Risk,
  Incident,
  Control,
  Remediation,
  Verification,
  RiskControl,
} from '../api/dashboard';

interface RiskDetailPanelProps {
  risk: Risk;
  incidents: Incident[];
  controls: Control[];
  riskControls: RiskControl[];
  remediations: Remediation[];
  verifications: Verification[];
  onNavigate: (page: string) => void;
  onClose: () => void;
}

export default function RiskDetailPanel({
  risk,
  incidents,
  controls,
  riskControls,
  remediations,
  verifications,
  onNavigate,
  onClose,
}: RiskDetailPanelProps) {
  /* =========================================================
     LINKED RECORDS
     ========================================================= */

  const linkedIncident = risk.incident_id
    ? incidents.find(
        (incident) =>
          incident.id === risk.incident_id,
      )
    : null;

  const linkedRiskControls =
    riskControls.filter(
      (item) => item.risk_id === risk.id,
    );

  const linkedControls = controls.filter(
    (control) =>
      linkedRiskControls.some(
        (relationship) =>
          relationship.control_id === control.id,
      ),
  );

  const linkedRemediations =
    remediations.filter(
      (remediation) =>
        remediation.risk_id === risk.id,
    );

  const linkedRemediationIds = new Set(
    linkedRemediations.map(
      (remediation) => remediation.id,
    ),
  );

  const linkedVerifications =
    verifications.filter(
      (verification) =>
        linkedRemediationIds.has(
          verification.remediation_id,
        ),
    );

  /* =========================================================
     FORMATTERS
     ========================================================= */

  const formatDate = (
    value: string | null | undefined,
  ) => {
    if (!value) {
      return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '—';
    }

    return date.toLocaleString([], {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const formatValue = (
    value: string | null | undefined,
  ) => {
    return value || 'Not available';
  };

  const badgeClass = (
    value: string | null | undefined,
    fallback = 'blue',
  ) => {
    if (!value) {
      return fallback;
    }

    return value
      .toLowerCase()
      .replace(/\s+/g, '_');
  };

  return (
    <div className="detail-overlay">

      <div className="detail-panel">

        {/* =====================================================
           HEADER
           ===================================================== */}

        <div className="detail-panel-header">

          <div>

            <div className="eyebrow">
              RISK RECORD
              <span>•</span>
              {risk.risk_number}
            </div>

            <h2>
              {risk.title}
            </h2>

            <p>
              Risk assessment, treatment,
              controls, and remediation
              tracking.
            </p>

          </div>

          <button
            type="button"
            className="detail-close"
            onClick={onClose}
            aria-label="Close risk details"
          >
            ×
          </button>

        </div>


        {/* =====================================================
           RISK SUMMARY
           ===================================================== */}

        <div className="detail-status-row">
  <span
    className={`table-badge ${badgeClass(
      risk.risk_level,
      'blue',
    )}`}
  >
    {formatValue(risk.risk_level)}
  </span>

  <span className="table-badge blue">
    score {String(risk.risk_score)}
  </span>

  <span
    className={`table-badge ${badgeClass(
      risk.status,
      'blue',
    )}`}
  >
    {formatValue(risk.status)}
  </span>
</div>
        {/* =====================================================
           RISK DESCRIPTION
           ===================================================== */}

        <section className="detail-section">

          <div className="detail-section-title">
            Risk Description
          </div>

          <div className="detail-description">
            {formatValue(risk.description)}
          </div>

        </section>


        {/* =====================================================
           RISK INFORMATION
           ===================================================== */}

       <div className="detail-section">
  <div className="detail-section-title">
    Risk Information
  </div>

  <div className="detail-grid">
    <DetailItem
      label="Risk ID"
      value={formatValue(risk.id)}
    />

    <DetailItem
      label="Risk Number"
      value={formatValue(risk.risk_number)}
    />

    <DetailItem
      label="Owner"
      value={formatValue(risk.owner)}
    />

    <DetailItem
      label="Asset ID"
      value={formatValue(risk.asset_id)}
    />

    <DetailItem
      label="Created"
      value={formatDate(risk.created_at)}
    />

    <DetailItem
      label="Updated"
      value={formatDate(risk.updated_at)}
    />
  </div>
</div>


        {/* =====================================================
           SOURCE INCIDENT
           ===================================================== */}

        <section className="detail-section">

          <div className="detail-section-title">
            Source Incident
          </div>

          {linkedIncident ? (

            <>
              <div className="detail-linked-record">

                <div>

                  <strong>
                    {linkedIncident.incident_number}
                  </strong>

                  <span>
                    {linkedIncident.title}
                  </span>

                </div>

                <div className="detail-linked-badges">

                  <span
                    className={`table-badge ${badgeClass(
                      linkedIncident.severity,
                    )}`}
                  >
                    {linkedIncident.severity}
                  </span>

                  <span
                    className={`table-badge ${badgeClass(
                      linkedIncident.status,
                    )}`}
                  >
                    {linkedIncident.status}
                  </span>

                </div>

              </div>

              <div style={{ marginTop: '10px' }}>

                <button
                  type="button"
                  className="detail-back"
                  onClick={() =>
                    onNavigate('Incidents')
                  }
                >
                  View Incidents
                </button>

              </div>
            </>

          ) : (

            <div className="empty-state">
              No incident is linked to this risk.
            </div>

          )}

        </section>


        {/* =====================================================
           LINKED CONTROLS
           ===================================================== */}

        <section className="detail-section">

          <div className="detail-section-title">
            Linked Controls
          </div>

          <div
            style={{
              marginBottom: '12px',
              color: '#94a3b8',
              fontSize: '9px',
            }}
          >
            {linkedControls.length}{' '}
            control
            {linkedControls.length === 1
              ? ''
              : 's'}{' '}
            mapped to this risk.
          </div>

          {linkedControls.length > 0 ? (

            <>

              <div className="record-list">

                {linkedControls.map(
                  (control) => (

                    <div
                      className="detail-linked-record"
                      key={control.id}
                    >

                      <div>

                        <strong>
                          {control.control_id}
                        </strong>

                        <span>
                          {control.name}
                        </span>

                      </div>

                      <div className="detail-linked-badges">

                        <span
                          className={`table-badge ${badgeClass(
                            control.status,
                          )}`}
                        >
                          {control.status}
                        </span>

                      </div>

                    </div>

                  ),
                )}

              </div>

              <div style={{ marginTop: '10px' }}>

                <button
                  type="button"
                  className="detail-back"
                  onClick={() =>
                    onNavigate('Controls')
                  }
                >
                  View Controls
                </button>

              </div>

            </>

          ) : (

            <div className="empty-state">
              No controls are currently linked
              to this risk.
            </div>

          )}

        </section>


        {/* =====================================================
           REMEDIATION
           ===================================================== */}

        <section className="detail-section">

          <div className="detail-section-title">
            Remediation
          </div>

          <div
            style={{
              marginBottom: '12px',
              color: '#94a3b8',
              fontSize: '9px',
            }}
          >
            {linkedRemediations.length}{' '}
            remediation record
            {linkedRemediations.length === 1
              ? ''
              : 's'}.
          </div>

          {linkedRemediations.length > 0 ? (

            <>

              <div className="record-list">

                {linkedRemediations.map(
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
                            remediation.status,
                          )}`}
                        >
                          {remediation.status}
                        </span>

                      </div>

                    </div>

                  ),
                )}

              </div>

              <div style={{ marginTop: '10px' }}>

                <button
                  type="button"
                  className="detail-back"
                  onClick={() =>
                    onNavigate('Remediation')
                  }
                >
                  View Remediation
                </button>

              </div>

            </>

          ) : (

            <div className="empty-state">
              No remediation record is
              currently linked to this risk.
            </div>

          )}

        </section>


        {/* =====================================================
           VERIFICATION
           ===================================================== */}

        <section className="detail-section">

          <div className="detail-section-title">
            Verification
          </div>

          <div
            style={{
              marginBottom: '12px',
              color: '#94a3b8',
              fontSize: '9px',
            }}
          >
            {linkedVerifications.length}{' '}
            verification record
            {linkedVerifications.length === 1
              ? ''
              : 's'}.
          </div>

          {linkedVerifications.length > 0 ? (

            <>

              <div className="record-list">

                {linkedVerifications.map(
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
                          {verification.verifier}
                        </span>

                      </div>

                      <div className="detail-linked-badges">

                        <span
                          className={`table-badge ${badgeClass(
                            verification.result,
                            'blue',
                          )}`}
                        >
                          {verification.result}
                        </span>

                      </div>

                    </div>

                  ),
                )}

              </div>

              <div style={{ marginTop: '10px' }}>

                <button
                  type="button"
                  className="detail-back"
                  onClick={() =>
                    onNavigate('Verification')
                  }
                >
                  View Verification
                </button>

              </div>

            </>

          ) : (

            <div className="empty-state">
              No verification has been
              recorded for this risk.
            </div>

          )}

        </section>


        {/* =====================================================
           FOOTER
           ===================================================== */}

        <section className="detail-section">

          <button
            type="button"
            className="detail-back"
            onClick={onClose}
          >
            Close
          </button>

        </section>

      </div>
    </div>
  );
}


/* =========================================================
   DETAIL ITEM
   ========================================================= */

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="detail-field">
      <span>{label}</span>

      <strong
        style={{
          overflowWrap: 'anywhere',
          wordBreak: 'break-word',
          lineHeight: 1.4,
        }}
      >
        {value}
      </strong>
    </div>
  );
}