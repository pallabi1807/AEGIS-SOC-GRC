import type { Alert } from '../api/dashboard';

interface DetectionRulesPageProps {
  alerts: Alert[];
}

interface DetectionRule {
  id: string;
  category: string;
  name: string;
  severity: string;
  mitre: string;
  description: string;
}

const DETECTION_RULES: DetectionRule[] = [
  // Authentication
  {
    id: 'AUTH-001',
    category: 'Authentication',
    name: 'Multiple Failed Logins',
    severity: 'high',
    mitre: 'T1110.001 — Password Guessing',
    description:
      'Detects repeated failed authentication attempts against one account.',
  },
  {
    id: 'AUTH-002',
    category: 'Authentication',
    name: 'Successful Login After Repeated Failures',
    severity: 'high',
    mitre: 'T1110.001 — Password Guessing',
    description:
      'Detects a successful authentication following repeated failures.',
  },
  {
    id: 'AUTH-003',
    category: 'Authentication',
    name: 'Login From New Source IP',
    severity: 'high',
    mitre: 'T1078 — Valid Accounts',
    description:
      'Detects successful authentication from a previously unseen source address.',
  },
  {
    id: 'AUTH-004',
    category: 'Authentication',
    name: 'Password Spraying',
    severity: 'high',
    mitre: 'T1110.003 — Password Spraying',
    description:
      'Detects one source attempting authentication against multiple accounts.',
  },
  {
    id: 'AUTH-005',
    category: 'Authentication',
    name: 'Privileged Account Login',
    severity: 'high',
    mitre: 'T1078 — Valid Accounts',
    description:
      'Monitors successful authentication by privileged accounts.',
  },
  {
    id: 'AUTH-006',
    category: 'Authentication',
    name: 'Account Lockout',
    severity: 'high',
    mitre: 'Not assigned',
    description:
      'Detects account lockout activity associated with repeated authentication failures.',
  },

  // Network
  {
    id: 'NET-001',
    category: 'Network',
    name: 'Port Scan',
    severity: 'high',
    mitre: 'T1046 — Network Service Discovery',
    description:
      'Detects multi-port connection attempts against an endpoint.',
  },
  {
    id: 'NET-002',
    category: 'Network',
    name: 'Repeated Connection Attempts',
    severity: 'high',
    mitre: 'T1046 — Network Service Discovery',
    description:
      'Detects repeated connections to the same destination and port.',
  },
  {
    id: 'NET-003',
    category: 'Network',
    name: 'Unusual Destination Port',
    severity: 'medium',
    mitre: 'T1046 — Network Service Discovery',
    description:
      'Detects connections to unusual destination ports.',
  },
  {
    id: 'NET-004',
    category: 'Network',
    name: 'High Volume Network Connections',
    severity: 'medium',
    mitre: 'T1046 — Network Service Discovery',
    description:
      'Detects high-volume connection activity from one source.',
  },
  {
    id: 'NET-005',
    category: 'Network',
    name: 'Unknown External Destination',
    severity: 'medium',
    mitre: 'Not assigned',
    description:
      'Detects connections to unknown external destinations.',
  },

  // Endpoint
  {
    id: 'PROC-001',
    category: 'Endpoint',
    name: 'Suspicious PowerShell Execution',
    severity: 'high',
    mitre: 'T1059.001 — PowerShell',
    description:
      'Detects suspicious PowerShell telemetry with multiple execution indicators.',
  },
  {
    id: 'PROC-002',
    category: 'Endpoint',
    name: 'Suspicious Command Shell',
    severity: 'medium',
    mitre: 'T1059.003 — Windows Command Shell',
    description:
      'Detects suspicious cmd.exe activity.',
  },
  {
    id: 'PROC-003',
    category: 'Endpoint',
    name: 'LOLBin Abuse',
    severity: 'high',
    mitre: 'T1105 — Ingress Tool Transfer',
    description:
      'Detects telemetry involving a Windows LOLBin.',
  },
  {
    id: 'PROC-004',
    category: 'Endpoint',
    name: 'Suspicious Process Spawn',
    severity: 'high',
    mitre: 'T1059.001 — PowerShell',
    description:
      'Detects unusual parent-child process relationships.',
  },
  {
    id: 'PROC-005',
    category: 'Endpoint',
    name: 'Persistence Command',
    severity: 'high',
    mitre: 'T1053.005 — Scheduled Task/Job',
    description:
      'Detects telemetry associated with scheduled-task persistence commands.',
  },

  // Malware
  {
    id: 'MAL-001',
    category: 'Malware',
    name: 'Suspicious File Creation',
    severity: 'high',
    mitre: 'Not assigned',
    description:
      'Detects creation of suspicious executable files.',
  },
  {
    id: 'MAL-002',
    category: 'Malware',
    name: 'Malicious Hash / IOC Match',
    severity: 'critical',
    mitre: 'Not assigned',
    description:
      'Detects a file hash matching an AEGIS synthetic malicious IOC.',
  },
  {
    id: 'MAL-003',
    category: 'Malware',
    name: 'Suspicious File Execution',
    severity: 'high',
    mitre: 'Not assigned',
    description:
      'Detects execution telemetry associated with suspicious files.',
  },
  {
    id: 'MAL-004',
    category: 'Malware',
    name: 'Malware Persistence',
    severity: 'critical',
    mitre:
      'T1547.001 — Registry Run Keys / Startup Folder',
    description:
      'Detects a registry-run-key persistence indicator.',
  },

  // Phishing
  {
    id: 'PHISH-001',
    category: 'Phishing',
    name: 'Suspicious Email Link',
    severity: 'high',
    mitre:
      'T1566.002 — Phishing: Spearphishing Link',
    description:
      'Detects email containing a suspicious account-verification link.',
  },
  {
    id: 'PHISH-002',
    category: 'Phishing',
    name: 'Malicious Email Attachment',
    severity: 'high',
    mitre:
      'T1566.001 — Phishing: Spearphishing Attachment',
    description:
      'Detects suspicious executable email attachments.',
  },
  {
    id: 'PHISH-003',
    category: 'Phishing',
    name: 'Credential Harvesting Page',
    severity: 'critical',
    mitre: 'T1056.003 — Web Portal Capture',
    description:
      'Detects browser telemetry associated with credential harvesting.',
  },
  {
    id: 'PHISH-004',
    category: 'Phishing',
    name: 'Suspicious Sender / Domain',
    severity: 'medium',
    mitre: 'Not assigned',
    description:
      'Detects email received from a suspicious sender or domain.',
  },

  // Web Application
  {
    id: 'WEB-001',
    category: 'Web Application',
    name: 'SQL Injection Attempt',
    severity: 'high',
    mitre:
      'T1190 — Exploit Public-Facing Application',
    description:
      'Detects SQL injection request telemetry against the AEGIS application.',
  },
  {
    id: 'WEB-002',
    category: 'Web Application',
    name: 'Cross-Site Scripting Attempt',
    severity: 'high',
    mitre:
      'T1190 — Exploit Public-Facing Application',
    description:
      'Detects XSS requests against the AEGIS application.',
  },
  {
    id: 'WEB-003',
    category: 'Web Application',
    name: 'Directory Traversal',
    severity: 'high',
    mitre:
      'T1190 — Exploit Public-Facing Application',
    description:
      'Detects directory-traversal requests against the AEGIS application.',
  },
  {
    id: 'WEB-004',
    category: 'Web Application',
    name: 'Web Scanner / Enumeration',
    severity: 'medium',
    mitre:
      'T1046 — Network Service Discovery',
    description:
      'Detects web enumeration against common application paths.',
  },
];

export default function DetectionRulesPage({
  alerts,
}: DetectionRulesPageProps) {
  const alertCounts = new Map<string, number>();

  alerts.forEach((alert) => {
    alertCounts.set(
      alert.rule_id,
      (alertCounts.get(alert.rule_id) || 0) + 1,
    );
  });

  const observedRules = DETECTION_RULES.filter(
    (rule) => alertCounts.has(rule.id),
  );

  const totalAlerts = alerts.length;

  const criticalRules = DETECTION_RULES.filter(
    (rule) => rule.severity === 'critical',
  ).length;

  return (
    <section className="page-content">
      <div className="page-header">
        <div>
          <div className="eyebrow">
            SOC OPERATIONS <span>•</span> DETECTION
          </div>

          <h1>Detection Rules</h1>

          <p>
            Monitor detection logic and rule activity across
            the AEGIS alert pipeline.
          </p>
        </div>
      </div>

      <div className="metric-grid page-metrics">
        <div className="metric-card blue">
          <div className="metric-top">
            <span>Detection Rules</span>
          </div>

          <div className="metric-value">
            {DETECTION_RULES.length}
          </div>

          <div className="metric-change">
            Configured in AEGIS
          </div>
        </div>

        <div className="metric-card cyan">
          <div className="metric-top">
            <span>Observed Rules</span>
          </div>

          <div className="metric-value">
            {observedRules.length}
          </div>

          <div className="metric-change">
            Rules with alert activity
          </div>
        </div>

        <div className="metric-card warning">
          <div className="metric-top">
            <span>Alerts Generated</span>
          </div>

          <div className="metric-value">
            {totalAlerts}
          </div>

          <div className="metric-change">
            Current alert stream
          </div>
        </div>

        <div className="metric-card red">
          <div className="metric-top">
            <span>Critical Rules</span>
          </div>

          <div className="metric-value">
            {criticalRules}
          </div>

          <div className="metric-change">
            Configured severity
          </div>
        </div>
      </div>

      <div className="table-card page-table">
        <div className="table-header">
          <div>
            <h3>Detection Rule Catalog</h3>

            <span>
              Detection logic configured within the AEGIS
              simulation and alert pipeline
            </span>
          </div>
        </div>

        <div className="page-table-scroll">
          {DETECTION_RULES.map((rule) => {
            const alertCount =
              alertCounts.get(rule.id) || 0;

            return (
              <div
                className="page-record detection-rule-record"
                key={rule.id}
              >
                <div className="page-record-main">
                  <div className="detection-rule-title">
                    <strong>{rule.id}</strong>

                    <span
                      className={`table-badge ${rule.severity}`}
                    >
                      {rule.severity}
                    </span>
                  </div>

                  <span className="detection-rule-name">
                    {rule.name}
                  </span>

                  <small>
                    {rule.category} • {rule.mitre}
                  </small>

                  <small className="detection-rule-description">
                    {rule.description}
                  </small>
                </div>

                <div className="detection-rule-meta">
                  <span
                    className={`table-badge ${
                      alertCount > 0
                        ? 'blue'
                        : 'inactive'
                    }`}
                  >
                    {alertCount > 0
                      ? `${alertCount} alerts`
                      : 'No activity'}
                  </span>

                  <span
                    className={`table-badge ${
                      alertCount > 0
                        ? 'active'
                        : 'inactive'
                    }`}
                  >
                    {alertCount > 0
                      ? 'Observed'
                      : 'No Activity'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}