import type { Alert } from '../api/dashboard';

interface MitrePageProps {
  alerts: Alert[];
}

interface TechniqueMapping {
  id: string;
  name: string;
  rules: string[];
}

const techniqueMap: Record<string, TechniqueMapping> = {
  'AUTH-001': {
    id: 'T1110.001',
    name: 'Password Guessing',
    rules: ['AUTH-001'],
  },

  'AUTH-002': {
    id: 'T1078',
    name: 'Valid Accounts',
    rules: ['AUTH-002', 'AUTH-003', 'AUTH-005'],
  },

  'AUTH-003': {
    id: 'T1078',
    name: 'Valid Accounts',
    rules: ['AUTH-002', 'AUTH-003', 'AUTH-005'],
  },

  'AUTH-004': {
    id: 'T1110.003',
    name: 'Password Spraying',
    rules: ['AUTH-004'],
  },

  'AUTH-005': {
    id: 'T1078',
    name: 'Valid Accounts',
    rules: ['AUTH-002', 'AUTH-003', 'AUTH-005'],
  },

  'NET-001': {
    id: 'T1046',
    name: 'Network Service Discovery',
    rules: [
      'NET-001',
      'NET-002',
      'NET-003',
      'NET-004',
      'WEB-004',
    ],
  },

  'NET-002': {
    id: 'T1046',
    name: 'Network Service Discovery',
    rules: [
      'NET-001',
      'NET-002',
      'NET-003',
      'NET-004',
      'WEB-004',
    ],
  },

  'NET-003': {
    id: 'T1046',
    name: 'Network Service Discovery',
    rules: [
      'NET-001',
      'NET-002',
      'NET-003',
      'NET-004',
      'WEB-004',
    ],
  },

  'NET-004': {
    id: 'T1046',
    name: 'Network Service Discovery',
    rules: [
      'NET-001',
      'NET-002',
      'NET-003',
      'NET-004',
      'WEB-004',
    ],
  },

  'PROC-001': {
    id: 'T1059.001',
    name: 'PowerShell',
    rules: ['PROC-001', 'PROC-004'],
  },

  'PROC-002': {
    id: 'T1059.003',
    name: 'Windows Command Shell',
    rules: ['PROC-002'],
  },

  'PROC-003': {
    id: 'T1105',
    name: 'Ingress Tool Transfer',
    rules: ['PROC-003'],
  },

  'PROC-004': {
    id: 'T1059.001',
    name: 'PowerShell',
    rules: ['PROC-001', 'PROC-004'],
  },

  'PROC-005': {
    id: 'T1053.005',
    name: 'Scheduled Task',
    rules: ['PROC-005'],
  },

  'MAL-004': {
    id: 'T1547.001',
    name: 'Registry Run Keys / Startup Folder',
    rules: ['MAL-004'],
  },

  'PHISH-001': {
    id: 'T1566.002',
    name: 'Spearphishing Link',
    rules: ['PHISH-001'],
  },

  'PHISH-002': {
    id: 'T1566.001',
    name: 'Spearphishing Attachment',
    rules: ['PHISH-002'],
  },

  'PHISH-003': {
    id: 'T1056.003',
    name: 'Web Portal Capture',
    rules: ['PHISH-003'],
  },

  'WEB-001': {
    id: 'T1190',
    name: 'Exploit Public-Facing Application',
    rules: [
      'WEB-001',
      'WEB-002',
      'WEB-003',
    ],
  },

  'WEB-002': {
    id: 'T1190',
    name: 'Exploit Public-Facing Application',
    rules: [
      'WEB-001',
      'WEB-002',
      'WEB-003',
    ],
  },

  'WEB-003': {
    id: 'T1190',
    name: 'Exploit Public-Facing Application',
    rules: [
      'WEB-001',
      'WEB-002',
      'WEB-003',
    ],
  },

  'WEB-004': {
    id: 'T1046',
    name: 'Network Service Discovery',
    rules: [
      'NET-001',
      'NET-002',
      'NET-003',
      'NET-004',
      'WEB-004',
    ],
  },
};

export default function MitrePage({
  alerts,
}: MitrePageProps) {
  const counts = new Map<
    string,
    {
      id: string;
      name: string;
      rules: string[];
      count: number;
    }
  >();

  alerts.forEach((alert) => {
    const technique =
      techniqueMap[alert.rule_id];

    if (!technique) {
      return;
    }

    const existing = counts.get(
      technique.id,
    );

    if (existing) {
      existing.count += 1;
    } else {
      counts.set(technique.id, {
        id: technique.id,
        name: technique.name,
        rules: technique.rules,
        count: 1,
      });
    }
  });

  const techniques = Array.from(
    counts.values(),
  ).sort((a, b) => b.count - a.count);

  const mappedRuleIds = new Set(
    Object.keys(techniqueMap),
  );

  const mappedRules =
    mappedRuleIds.size;

  const unmappedRules =
    28 - mappedRules;

  const mappedAlerts =
    techniques.reduce(
      (total, technique) =>
        total + technique.count,
      0,
    );

  return (
    <section className="page-content">
      <div className="page-header">
        <div>
          <div className="eyebrow">
            SOC OPERATIONS <span>•</span> THREAT MAPPING
          </div>

          <h1>MITRE ATT&CK</h1>

          <p>
            ATT&CK techniques mapped from AEGIS
            detection rules and observed alert activity.
          </p>
        </div>
      </div>

      <div className="metric-grid page-metrics">
        <div className="metric-card blue">
          <div className="metric-top">
            <span>Mapped Techniques</span>
          </div>

          <div className="metric-value">
            {techniques.length}
          </div>

          <div className="metric-change">
            Observed in alert activity
          </div>
        </div>

        <div className="metric-card cyan">
          <div className="metric-top">
            <span>Mapped Rules</span>
          </div>

          <div className="metric-value">
            {mappedRules}
          </div>

          <div className="metric-change">
            Detection rules with ATT&CK mapping
          </div>
        </div>

        <div className="metric-card warning">
          <div className="metric-top">
            <span>Mapped Alerts</span>
          </div>

          <div className="metric-value">
            {mappedAlerts}
          </div>

          <div className="metric-change">
            Alert activity with ATT&CK context
          </div>
        </div>

        <div className="metric-card red">
          <div className="metric-top">
            <span>Unmapped Rules</span>
          </div>

          <div className="metric-value">
            {unmappedRules}
          </div>

          <div className="metric-change">
            No ATT&CK mapping assigned
          </div>
        </div>
      </div>

      <div className="table-card page-table">
        <div className="table-header">
          <div>
            <h3>ATT&CK Technique Register</h3>

            <span>
              Techniques observed through the AEGIS
              detection and alert pipeline
            </span>
          </div>
        </div>

        <div className="page-table-scroll">
          {techniques.length === 0 ? (
            <div className="empty-state">
              No mapped techniques available.
            </div>
          ) : (
            techniques.map((technique) => (
              <div
                className="page-record mitre-record"
                key={technique.id}
              >
                <div className="page-record-main">
                  <div className="mitre-technique-title">
                    <strong>
                      {technique.id}
                    </strong>

                    <span className="table-badge blue">
                      {technique.count} alerts
                    </span>
                  </div>

                  <span className="mitre-technique-name">
                    {technique.name}
                  </span>

                  <small>
                    Detection rules:{' '}
                    {technique.rules.join(' • ')}
                  </small>
                </div>

                <span className="table-badge active">
                  Observed
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}