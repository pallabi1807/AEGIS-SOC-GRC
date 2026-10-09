import './App.css';
import AlertsPage from './pages/AlertsPage';
import IncidentsPage from './pages/IncidentsPage';
import RisksPage from './pages/RisksPage';
import ControlsPage from './pages/ControlsPage';
import RemediationPage from './pages/RemediationPage';
import VerificationPage from './pages/VerificationPage';
import ThreatIntelligencePage from './pages/ThreatIntelligencePage';
import AssetsPage from './pages/AssetsPage';
import DetectionRulesPage from './pages/DetectionRulesPage';
import MitrePage from './pages/MitrePage';
import EvidencePage from './pages/EvidencePage';
import CompliancePage from './pages/CompliancePage';
import ReportsPage from './pages/ReportsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ScenarioLibraryPage from './pages/ScenarioLibraryPage';
import AuditTrailPage from './pages/AuditTrailPage';
import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  Activity,
  Bell,
  CheckCircle2,
  CircleAlert,
  FileCheck2,
  FlaskConical,
  History,
  LayoutDashboard,
  Network,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Target,
  UserRound,
} from 'lucide-react';



import {
  getAlerts,
  updateAlertStatus,
  getControls,
  getIncidents,
  getRemediations,
  getRisks,
  getVerifications,
  getRiskControls,
  getComplianceOverview,
  getEvidence,
  getControlTests,
  getAuditLogs,
  type Alert,
  type Control,
  type Incident,
  type Remediation,
  type Risk,
  type Verification,
  type RiskControl,
  type ComplianceOverview,
  type Evidence,
  type ControlTest,
  type AuditLog,
} from './api/dashboard';

import LoginPage from './pages/LoginPage';
import {
  login,
  getCurrentUser,
  type CurrentUser,
} from './api/auth';

type ComplianceOverviewData = ComplianceOverview;
/* =========================================================
   NAVIGATION
   ========================================================= */

const navigation = [
  {
    section: 'SOC OPERATIONS',
    items: [
      {
        label: 'Dashboard',
        icon: LayoutDashboard,
        active: true,
      },
      {
        label: 'Alerts',
        icon: Bell,
      },
      {
        label: 'Incidents',
        icon: Siren,
      },
      {
        label: 'Threat Intelligence',
        icon: Target,
      },
      {
        label: 'Assets',
        icon: Shield,
      },
      {
        label: 'Detection Rules',
        icon: Activity,
      },
      {
        label: 'MITRE ATT&CK',
        icon: CircleAlert,
      },
      {
        label: 'Scenario Library',
        icon: FlaskConical,
      },
    ],
  },
  {
    section: 'GRC MANAGEMENT',
    items: [
      {
        label: 'Risks',
        icon: CircleAlert,
      },
      {
        label: 'Controls',
        icon: ShieldCheck,
      },
      {
        label: 'Evidence',
        icon: FileCheck2,
      },
      {
        label: 'Remediation',
        icon: Activity,
      },
      {
        label: 'Verification',
        icon: ShieldCheck,
      },
      {
        label: 'Compliance',
        icon: FileCheck2,
      },
       {
        label: 'Audit Trail',
        icon: History,
      },
    ],
  },
  {
    section: 'REPORTING',
    items: [
      {
        label: 'Reports',
        icon: FileCheck2,
      },
      {
        label: 'Analytics',
        icon: Network,
      },
    ],
  },
];


/* =========================================================
   APP
   ========================================================= */

function App() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [riskControls, setRiskControls] = useState<RiskControl[]>([]);
  const [controls, setControls] = useState<Control[]>([]);
  const [remediations, setRemediations] = useState<Remediation[]>([]);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [activePage, setActivePage] = useState(
  () => localStorage.getItem('aegis_active_page') || 'Dashboard',
);
  const [complianceOverview, setComplianceOverview] = useState<ComplianceOverview[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [controlTests, setControlTests] = useState<ControlTest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
const [auditLoading, setAuditLoading] = useState(false);
  

  const [loading, setLoading] = useState(true);
  const [authToken, setAuthToken] = useState<string | null>(
  localStorage.getItem('aegis_auth_token'),
);

const [currentUser, setCurrentUser] = useState<CurrentUser | null>(
  null,
);

const [authLoading, setAuthLoading] = useState(true);
useEffect(() => {
  const token = localStorage.getItem('aegis_auth_token');

  if (!token) {
    setAuthLoading(false);
    return;
  }

  getCurrentUser(token)
    .then((user) => {
      setCurrentUser(user);
      setAuthToken(token);
    })
    .catch(() => {
      localStorage.removeItem('aegis_auth_token');
      setAuthToken(null);
      setCurrentUser(null);
    })
    .finally(() => {
      setAuthLoading(false);
    });
}, []);
const handleLogin = async (
  username: string,
  password: string,
) => {
  
  const response = await login({
    username,
    password,
  });

  localStorage.setItem(
    'aegis_auth_token',
    response.access_token,
  );

  const user = await getCurrentUser(
    response.access_token,
  );

  setAuthToken(response.access_token);
  setCurrentUser(user);
};
const handleLogout = () => {
  localStorage.removeItem('aegis_auth_token');
  setAuthToken(null);
  setCurrentUser(null);
};
const handleAlertStatusChange = async (
  alertId: string,
  status: 'open' | 'investigating' | 'resolved',
) => {
  const updatedAlert = await updateAlertStatus(
    alertId,
    status,
  );

  setAlerts((currentAlerts) =>
    currentAlerts.map((alert) =>
      alert.id === updatedAlert.id
        ? updatedAlert
        : alert,
    ),
  );

  return updatedAlert;
};
  const [notificationsOpen, setNotificationsOpen] = useState(false);
const notificationReadKey = currentUser
  ? `aegis_notifications_read_${currentUser.username}`
  : 'aegis_notifications_read';

const [notificationsRead, setNotificationsRead] = useState(
  () => localStorage.getItem(notificationReadKey) === 'true',
);
useEffect(() => {
  if (!currentUser) {
    return;
  }

  setNotificationsRead(
    localStorage.getItem(
      `aegis_notifications_read_${currentUser.username}`,
    ) === 'true',
  );
}, [currentUser]);
  const [pageSearch, setPageSearch] = useState('');
  const [pageSearchOpen, setPageSearchOpen] = useState(false);
   
useEffect(() => {
  localStorage.setItem(
    'aegis_active_page',
    activePage,
  );
}, [activePage]);

  useEffect(() => {
    document.title = `${activePage} | AEGIS SOC-GRC`;
  }, [activePage]);

  useEffect(() => {
    setPageSearch('');
    setPageSearchOpen(false);
  }, [activePage]);


  /* =======================================================
     LOAD ALL DASHBOARD DATA
     ======================================================= */

  useEffect(() => {
    async function loadDashboard() {
      try {
        const results =
          await Promise.allSettled([
            getAlerts(),
            getIncidents(),
            getRisks(),
            getControls(),
            getRemediations(),
            getVerifications(),
            getEvidence(),
            getControlTests(),
            getRiskControls(),
            getComplianceOverview(),
          ]);

        const [
          alertsResult,
          incidentsResult,
          risksResult,
          controlsResult,
          remediationsResult,
          verificationsResult,
          evidenceResult,
          controlTestsResult,
          riskControlsResult,
          complianceResult,
        ] = results;

        if (
          alertsResult.status === 'fulfilled'
        ) {
          setAlerts(alertsResult.value);
        } else {
          console.error(
            'AEGIS ALERTS ERROR:',
            alertsResult.reason,
          );
        }

        if (
          incidentsResult.status === 'fulfilled'
        ) {
          setIncidents(
            incidentsResult.value,
          );
        } else {
          console.error(
            'AEGIS INCIDENTS ERROR:',
            incidentsResult.reason,
          );
        }

        if (
          risksResult.status === 'fulfilled'
        ) {
          setRisks(
            risksResult.value,
          );
        } else {
          console.error(
            'AEGIS RISKS ERROR:',
            risksResult.reason,
          );
        }

        if (riskControlsResult.status === 'fulfilled') {
  setRiskControls(riskControlsResult.value);
} else {
  console.error(
    'AEGIS RISK-CONTROLS ERROR:',
    riskControlsResult.reason,
  );
}
if (complianceResult.status === 'fulfilled') {
  setComplianceOverview(
    complianceResult.value,
  );
} else {
  console.error(
    'AEGIS COMPLIANCE ERROR:',
    complianceResult.reason,
  );
}

        if (
          controlsResult.status === 'fulfilled'
        ) {
          setControls(
            controlsResult.value,
          );
        } else {
          console.error(
            'AEGIS CONTROLS ERROR:',
            controlsResult.reason,
          );
        }
if (evidenceResult.status === 'fulfilled') {
  setEvidence(evidenceResult.value);
} else {
  console.error(
    'AEGIS EVIDENCE ERROR:',
    evidenceResult.reason,
  );
}

if (controlTestsResult.status === 'fulfilled') {
  setControlTests(controlTestsResult.value);
} else {
  console.error(
    'AEGIS CONTROL-TESTS ERROR:',
    controlTestsResult.reason,
  );
}
        if (
          remediationsResult.status === 'fulfilled'
        ) {
          setRemediations(
            remediationsResult.value,
          );
        } else {
          console.error(
            'AEGIS REMEDIATIONS ERROR:',
            remediationsResult.reason,
          );
        }

        if (
          verificationsResult.status === 'fulfilled'
        ) {
          setVerifications(
            verificationsResult.value,
          );
        } else {
          console.error(
            'AEGIS VERIFICATIONS ERROR:',
            verificationsResult.reason,
          );
        }
      } finally {
        setLoading(false);
      }

      
    }

    loadDashboard();
  }, []);
  /* =======================================================
   LOAD AUDIT TRAIL
   ======================================================= */

useEffect(() => {
  if (activePage !== 'Audit Trail') {
    return;
  }

  let cancelled = false;

  async function loadAuditLogs() {
    setAuditLoading(true);

    try {
      const logs = await getAuditLogs();

      if (!cancelled) {
        setAuditLogs(logs);
      }
    } catch (error) {
      console.error(
        'AEGIS AUDIT TRAIL ERROR:',
        error,
      );
    } finally {
      if (!cancelled) {
        setAuditLoading(false);
      }
    }
  }

  loadAuditLogs();

  return () => {
    cancelled = true;
  };
}, [activePage]);


  /* =======================================================
     DERIVED DASHBOARD DATA
     ======================================================= */

  const activeIncidents = useMemo(
    () =>
      incidents.filter((incident) => {
        const status =
          incident.status.toLowerCase();

        return (
          status !== 'resolved' &&
          status !== 'closed'
        );
      }),
    [incidents],
  );


  const openRisks = useMemo(
    () =>
      risks.filter(
        (risk) =>
          risk.status.toLowerCase() ===
          'open',
      ),
    [risks],
  );


  const activeRemediations = useMemo(
    () =>
      remediations.filter((remediation) => {
        const status =
          remediation.status.toLowerCase();

        return (
          status !== 'completed' &&
          status !== 'closed'
        );
      }),
    [remediations],
  );


  const verifiedCount = useMemo(
    () =>
      verifications.filter(
        (verification) =>
          verification.result.toUpperCase() ===
          'PASS',
      ).length,
    [verifications],
  );

  const workflowStats = useMemo(() => {
    const incidentRiskCount = risks.filter(
      (risk) => Boolean(risk.incident_id),
    ).length;

    const riskControlCount = riskControls.length;

    const remediationCount = remediations.filter(
      (remediation) =>
        Boolean(remediation.risk_id) &&
        Boolean(remediation.control_id),
    ).length;

    const verificationCount = verifications.filter(
      (verification) =>
        remediations.some(
          (remediation) =>
            remediation.id === verification.remediation_id,
        ),
    ).length;

    return {
      incidentRiskCount,
      riskControlCount,
      remediationCount,
      verificationCount,
    };
  }, [
    risks,
    riskControls,
    remediations,
    verifications,
  ]);



  const recentAlerts = useMemo(
    () =>
      [...alerts]
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime(),
        )
        .slice(0, 5),
    [alerts],
  );


  const recentIncidents = useMemo(
    () =>
      [...incidents]
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime(),
        )
        .slice(0, 4),
    [incidents],
  );



  const pageSearchPlaceholder = useMemo(() => {
    switch (activePage) {
      case 'Dashboard':
        return 'Search alerts, incidents, risks, controls...';
      case 'Alerts':
        return 'Search alerts, rules, severity, IPs...';
      case 'Incidents':
        return 'Search incidents, severity, status...';
      case 'Threat Intelligence':
        return 'Search observed indicators...';
      case 'Assets':
        return 'Search assets, hostname, IP...';
      case 'Detection Rules':
        return 'Search detection rules...';
      case 'MITRE ATT&CK':
        return 'Search techniques, detection rules...';
      case 'Scenario Library':
        return 'Search scenarios...';
      case 'Risks':
        return 'Search risks, treatment, status...';
      case 'Controls':
        return 'Search controls, type, status...';
      case 'Evidence':
        return 'Search evidence, source, type...';
      case 'Remediation':
        return 'Search remediation records...';
      case 'Verification':
        return 'Search verification records...';
      case 'Compliance':
        return 'Search frameworks, requirements...';
      case 'Audit Trail':
  return 'Search audit activity...';
      case 'Reports':
        return 'Search reports...';
      case 'Analytics':
        return 'Search analytics...';
      default:
        return 'Search AEGIS...';
    }
  }, [activePage]);

  const pageSearchResults = useMemo(() => {
    const query = pageSearch.trim().toLowerCase();

    if (!query) {
      return [];
    }

    const results: Array<{
      id: string;
      title: string;
      subtitle: string;
      type: string;
      page: string;
    }> = [];

    const matches = (value: unknown) =>
      String(value ?? '').toLowerCase().includes(query);

    if (activePage === 'Dashboard') {
      alerts.forEach((alert) => {
        if (
          matches(alert.title) ||
          matches(alert.rule_id) ||
          matches(alert.severity) ||
          matches(alert.status) ||
          matches(alert.source_ip) ||
          matches(alert.username)
        ) {
          results.push({
            id: `dashboard-alert-${alert.id}`,
            title: alert.title,
            subtitle: `${alert.rule_id} • ${formatSeverity(alert.severity)}`,
            type: 'Alert',
            page: 'Alerts',
          });
        }
      });

      incidents.forEach((incident) => {
        if (
          matches(incident.incident_number) ||
          matches(incident.title) ||
          matches(incident.severity) ||
          matches(incident.status)
        ) {
          results.push({
            id: `dashboard-incident-${incident.id}`,
            title: incident.title,
            subtitle: `${incident.incident_number} • ${formatSeverity(incident.severity)}`,
            type: 'Incident',
            page: 'Incidents',
          });
        }
      });

      risks.forEach((risk) => {
        if (
          matches(risk.risk_number) ||
          matches(risk.title) ||
          matches(risk.risk_level) ||
          matches(risk.status) ||
          matches(risk.treatment)
        ) {
          results.push({
            id: `dashboard-risk-${risk.id}`,
            title: risk.title,
            subtitle: `${risk.risk_number} • ${risk.risk_level}`,
            type: 'Risk',
            page: 'Risks',
          });
        }
      });

      controls.forEach((control) => {
        if (
          matches(control.control_id) ||
          matches(control.name) ||
          matches(control.control_type) ||
          matches(control.status)
        ) {
          results.push({
            id: `dashboard-control-${control.id}`,
            title: control.name,
            subtitle: `${control.control_id} • ${control.control_type}`,
            type: 'Control',
            page: 'Controls',
          });
        }
      });

      remediations.forEach((remediation) => {
        if (
          matches(remediation.remediation_number) ||
          matches(remediation.title) ||
          matches(remediation.status)
        ) {
          results.push({
            id: `dashboard-remediation-${remediation.id}`,
            title: remediation.title,
            subtitle: `${remediation.remediation_number} • ${formatStatus(remediation.status)}`,
            type: 'Remediation',
            page: 'Remediation',
          });
        }
      });
    }

    if (activePage === 'Alerts') {
      alerts.forEach((alert) => {
        if (
          matches(alert.title) ||
          matches(alert.rule_id) ||
          matches(alert.severity) ||
          matches(alert.status) ||
          matches(alert.source_ip) ||
          matches(alert.username)
        ) {
          results.push({
            id: `alert-${alert.id}`,
            title: alert.title,
            subtitle: `${alert.rule_id} • ${formatSeverity(alert.severity)}`,
            type: 'Alert',
            page: 'Alerts',
          });
        }
      });
    }

    if (activePage === 'Incidents') {
      incidents.forEach((incident) => {
        if (
          matches(incident.incident_number) ||
          matches(incident.title) ||
          matches(incident.severity) ||
          matches(incident.status)
        ) {
          results.push({
            id: `incident-${incident.id}`,
            title: incident.title,
            subtitle: `${incident.incident_number} • ${formatSeverity(incident.severity)}`,
            type: 'Incident',
            page: 'Incidents',
          });
        }
      });
    }

    if (activePage === 'Risks') {
      risks.forEach((risk) => {
        if (
          matches(risk.risk_number) ||
          matches(risk.title) ||
          matches(risk.risk_level) ||
          matches(risk.status) ||
          matches(risk.treatment)
        ) {
          results.push({
            id: `risk-${risk.id}`,
            title: risk.title,
            subtitle: `${risk.risk_number} • ${risk.risk_level}`,
            type: 'Risk',
            page: 'Risks',
          });
        }
      });
    }

    if (activePage === 'Controls') {
      controls.forEach((control) => {
        if (
          matches(control.control_id) ||
          matches(control.name) ||
          matches(control.description) ||
          matches(control.control_type) ||
          matches(control.status)
        ) {
          results.push({
            id: `control-${control.id}`,
            title: control.name,
            subtitle: `${control.control_id} • ${control.control_type}`,
            type: 'Control',
            page: 'Controls',
          });
        }
      });
    }

    if (activePage === 'Remediation') {
      remediations.forEach((remediation) => {
        if (
          matches(remediation.remediation_number) ||
          matches(remediation.title) ||
          matches(remediation.description) ||
          matches(remediation.status)
        ) {
          results.push({
            id: `remediation-${remediation.id}`,
            title: remediation.title,
            subtitle: `${remediation.remediation_number} • ${formatStatus(remediation.status)}`,
            type: 'Remediation',
            page: 'Remediation',
          });
        }
      });
    }

    if (activePage === 'Verification') {
      verifications.forEach((verification) => {
        if (
          matches(verification.verification_number) ||
          matches(verification.result) ||
          matches(verification.verifier) ||
          matches(verification.findings) ||
          matches(verification.notes)
        ) {
          results.push({
            id: `verification-${verification.id}`,
            title: verification.verification_number,
            subtitle: `${verification.result} • ${verification.verifier}`,
            type: 'Verification',
            page: 'Verification',
          });
        }
      });
    }

    if (activePage === 'Evidence') {
      evidence.forEach((item) => {
        if (
          matches(item.evidence_number) ||
          matches(item.title) ||
          matches(item.description) ||
          matches(item.evidence_type) ||
          matches(item.source) ||
          matches(item.status)
        ) {
          results.push({
            id: `evidence-${item.id}`,
            title: item.title,
            subtitle: `${item.evidence_number} • ${item.evidence_type}`,
            type: 'Evidence',
            page: 'Evidence',
          });
        }
      });
    }

    if (activePage === 'Compliance') {
      complianceOverview.forEach((framework) => {
        if (matches(framework.name) || matches(framework.code)) {
          results.push({
            id: `compliance-${framework.id}`,
            title: framework.name,
            subtitle: `${framework.code} • ${framework.coverage_percentage}% coverage`,
            type: 'Framework',
            page: 'Compliance',
          });
        }
      });
    }
    {activePage === 'Audit Trail' && (
  <AuditTrailPage
    auditLogs={auditLogs}
    loading={auditLoading}
    onRefresh={async () => {
      setAuditLoading(true);

      try {
        const logs = await getAuditLogs();
        setAuditLogs(logs);
      } catch (error) {
        console.error(
          'AEGIS AUDIT TRAIL REFRESH ERROR:',
          error,
        );
      } finally {
        setAuditLoading(false);
      }
    }}
  />
)}

    if (activePage === 'Detection Rules') {
      const uniqueRules = new Map<string, Alert>();

      alerts.forEach((alert) => {
        if (alert.rule_id) {
          uniqueRules.set(alert.rule_id, alert);
        }
      });

      uniqueRules.forEach((alert, ruleId) => {
        if (
          matches(ruleId) ||
          matches(alert.title) ||
          matches(alert.severity)
        ) {
          results.push({
            id: `rule-${ruleId}`,
            title: ruleId,
            subtitle: `${alert.title} • ${formatSeverity(alert.severity)}`,
            type: 'Detection Rule',
            page: 'Detection Rules',
          });
        }
      });
    }

    if (activePage === 'Threat Intelligence') {
      alerts.forEach((alert) => {
        if (
          matches(alert.source_ip) ||
          matches(alert.username) ||
          matches(alert.title)
        ) {
          results.push({
            id: `intel-${alert.id}`,
            title: alert.source_ip || alert.title,
            subtitle: `Observed through ${alert.rule_id}`,
            type: 'Observed Indicator',
            page: 'Threat Intelligence',
          });
        }
      });
    }

    if (activePage === 'Reports') {
      [
        'SOC Operations Summary',
        'Risk Register Summary',
        'Control Assurance Summary',
        'Remediation Summary',
      ].forEach((title) => {
        if (matches(title)) {
          results.push({
            id: `report-${title}`,
            title,
            subtitle: 'Management report',
            type: 'Report',
            page: 'Reports',
          });
        }
      });
    }

    if (activePage === 'Analytics') {
      [
        'Alert Severity',
        'Incident Status',
        'Risk Landscape',
        'Remediation Status',
        'Verification Results',
        'Security Posture',
      ].forEach((title) => {
        if (matches(title)) {
          results.push({
            id: `analytics-${title}`,
            title,
            subtitle: 'AEGIS analytics view',
            type: 'Analytics',
            page: 'Analytics',
          });
        }
      });
    }
    

    return results.slice(0, 10);
  }, [
    activePage,
    pageSearch,
    alerts,
    incidents,
    risks,
    controls,
    remediations,
    verifications,
    evidence,
    complianceOverview,
  ]);

  const handlePageSearchSelect = (page: string) => {
    setActivePage(page);
    setPageSearch('');
    setPageSearchOpen(false);
  };
  const notifications = useMemo(() => {
  const items: Array<{
    id: string;
    type: 'alert' | 'incident' | 'risk' | 'remediation' | 'verification';
    title: string;
    message: string;
    time: string;
    page: string;
  }> = [];

  const importantAlert = [...alerts]
    .filter((alert) =>
      ['high', 'critical'].includes(
        alert.severity.toLowerCase(),
      ),
    )
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime(),
    )[0];

  if (importantAlert) {
    items.push({
      id: `alert-${importantAlert.id}`,
      type: 'alert',
      title: 'High-severity alert detected',
      message: importantAlert.title,
      time: importantAlert.created_at,
      page: 'Alerts',
    });
  }

  const activeIncident = [...incidents]
    .filter((incident) => {
      const status = incident.status.toLowerCase();

      return (
        status !== 'resolved' &&
        status !== 'closed'
      );
    })
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime(),
    )[0];

  if (activeIncident) {
    items.push({
      id: `incident-${activeIncident.id}`,
      type: 'incident',
      title: 'Active incident requires attention',
      message: activeIncident.title,
      time: activeIncident.created_at,
      page: 'Incidents',
    });
  }

  const importantRisk = [...risks]
    .filter((risk) =>
      ['high', 'critical'].includes(
        risk.risk_level.toLowerCase(),
      ),
    )
    .filter(
      (risk) =>
        !['closed', 'resolved'].includes(
          risk.status.toLowerCase(),
        ),
    )
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime(),
    )[0];

  if (importantRisk) {
    items.push({
      id: `risk-${importantRisk.id}`,
      type: 'risk',
      title: 'High-risk item requires review',
      message: importantRisk.title,
      time: importantRisk.created_at,
      page: 'Risks',
    });
  }

  const pendingRemediation = [...remediations]
    .filter((remediation) =>
      ['open', 'in_progress'].includes(
        remediation.status.toLowerCase(),
      ),
    )
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() -
        new Date(a.updated_at).getTime(),
    )[0];

  if (pendingRemediation) {
    items.push({
      id: `remediation-${pendingRemediation.id}`,
      type: 'remediation',
      title: 'Remediation requires action',
      message: pendingRemediation.title,
      time: pendingRemediation.updated_at,
      page: 'Remediation',
    });
  }

  const latestVerification = [...verifications]
    .sort(
      (a, b) =>
        new Date(b.verified_at).getTime() -
        new Date(a.verified_at).getTime(),
    )[0];

  if (latestVerification) {
    items.push({
      id: `verification-${latestVerification.id}`,
      type: 'verification',
      title: 'Verification activity recorded',
      message: `${latestVerification.result} verification completed`,
      time: latestVerification.verified_at,
      page: 'Verification',
    });
  }

  return items;
}, [
  alerts,
  incidents,
  risks,
  remediations,
  verifications,
]);

if (authLoading) {
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-logo">
            <ShieldCheck size={30} />
          </div>

          <h1>AEGIS SOC-GRC</h1>
          <p>Loading secure session...</p>
        </div>
      </div>
    </div>
  );
}

if (!authToken || !currentUser) {
  return <LoginPage onLogin={handleLogin} />;
}

  return (
    <div className="aegis-app">

      {/* =====================================================
          SIDEBAR
          ===================================================== */}

      <aside className="sidebar">

        <div className="brand">

          <div className="brand-mark">
            <Shield
              size={25}
              strokeWidth={2.2}
            />
          </div>

          <div>
            <div className="brand-name">
              AEGIS
            </div>

            <div className="brand-subtitle">
              SOC • GRC PLATFORM
            </div>
          </div>

        </div>


        <nav className="navigation">

          {navigation.map((group) => (
            <div
              className="nav-group"
              key={group.section}
            >

              <div className="nav-section-title">
                {group.section}
              </div>

              {group.items.map((item) => {

                const Icon = item.icon;

                return (
                  <button
                    className={`nav-item ${
                      activePage === item.label
                        ? 'active'
                        : ''
                    }`}
                    key={item.label}
                    onClick={() =>
                      setActivePage(item.label)
                    }

                  >

                    <Icon
                      size={18}
                      strokeWidth={1.9}
                    />

                    <span>
                      {item.label}
                    </span>

                  </button>
                );
              })}

            </div>
          ))}

        </nav>


        <div className="sidebar-status">

          <div className="status-dot" />

          <div>

            <div className="status-label">
              SYSTEM STATUS
            </div>

            <div className="status-value">
              Operational
            </div>

          </div>

        </div>

      </aside>


      {/* =====================================================
          MAIN
          ===================================================== */}

      <main className="main-content">
        


        {/* TOP BAR */}

        <header className="topbar">

          <div className="page-search">

            <div className="search-box">

              <Search size={18} />

              <input
                type="text"
                value={pageSearch}
                placeholder={pageSearchPlaceholder}
                onChange={(event) => {
                  setPageSearch(event.target.value);
                  setPageSearchOpen(true);
                }}
                onFocus={() => {
                  if (pageSearch.trim()) {
                    setPageSearchOpen(true);
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    setPageSearch('');
                    setPageSearchOpen(false);
                  }
                }}
              />

              {pageSearch && (
                <button
                  type="button"
                  className="page-search-clear"
                  aria-label="Clear search"
                  onClick={() => {
                    setPageSearch('');
                    setPageSearchOpen(false);
                  }}
                >
                  ×
                </button>
              )}

            </div>

            {pageSearchOpen && pageSearch.trim() && (
              <div className="page-search-results">

                <div className="page-search-results-header">
                  <span>
                    {activePage.toUpperCase()} SEARCH
                  </span>

                  <strong>
                    {pageSearchResults.length}
                  </strong>
                </div>

                {pageSearchResults.length === 0 ? (
                  <div className="page-search-empty">
                    <Search size={17} />

                    <div>
                      <strong>
                        No matching records
                      </strong>

                      <span>
                        Try another keyword or identifier.
                      </span>
                    </div>
                  </div>
                ) : (
                  pageSearchResults.map((result) => (
                    <button
                      key={result.id}
                      type="button"
                      className="page-search-result"
                      onClick={() =>
                        handlePageSearchSelect(result.page)
                      }
                    >
                      <div className="page-search-result-icon">
                        <Search size={14} />
                      </div>

                      <div className="page-search-result-content">
                        <strong>
                          {result.title}
                        </strong>

                        <span>
                          {result.subtitle}
                        </span>
                      </div>

                      <span className="page-search-result-type">
                        {result.type}
                      </span>
                    </button>
                  ))
                )}

              </div>
            )}

          </div>


          <div className="topbar-actions">

            <div className="notification-wrapper">

  <button
    className={`icon-button ${
      notificationsOpen ? 'notification-active' : ''
    }`}
    type="button"
    aria-label="Notifications"
    onClick={() =>
      setNotificationsOpen((open) => !open)
    }
  >
    <Bell size={19} />

    {!notificationsRead && notifications.length > 0 && (
      <span className="notification-dot" />
    )}

   <span className="notification-count">
  {notificationsRead ? 0 : notifications.length}
</span>
  </button>


  {notificationsOpen && (
    <div className="notification-panel">

      <div className="notification-header">

        <div>
          <strong>Notifications</strong>

          <span>
            Live AEGIS operational activity
          </span>
        </div>

        <button
          type="button"
          className="notification-mark-read"
          onClick={() => {
  if (!currentUser) {
    return;
  }

  localStorage.setItem(
    `aegis_notifications_read_${currentUser.username}`,
    'true',
  );

  setNotificationsRead(true);
}}
        >
          Mark read
        </button>

      </div>


      <div className="notification-list">

        {notifications.length === 0 ? (
          <div className="notification-empty">
            <CheckCircle2 size={22} />

            <strong>You're all caught up</strong>

            <span>
              No actionable notifications right now.
            </span>
          </div>
        ) : (
          notifications.map((notification) => {

            const NotificationIcon =
              notification.type === 'alert'
                ? ShieldAlert
                : notification.type === 'incident'
                  ? Siren
                  : notification.type === 'risk'
                    ? CircleAlert
                    : notification.type === 'remediation'
                      ? Activity
                      : CheckCircle2;

            return (
              <button
                type="button"
                className={`notification-item ${
                  notificationsRead ? 'read' : ''
                }`}
                key={notification.id}
                onClick={() => {
                  setActivePage(notification.page);
                  setNotificationsOpen(false);
                  setNotificationsRead(true);
                }}
              >

                <div
                  className={`notification-icon ${notification.type}`}
                >
                  <NotificationIcon size={16} />
                </div>


                <div className="notification-content">

                  <strong>
                    {notification.title}
                  </strong>

                  <span>
                    {notification.message}
                  </span>

                  <small>
                    {new Date(
                      notification.time,
                    ).toLocaleString()}
                  </small>

                </div>

                <span className="notification-arrow">
                  →
                </span>

              </button>
            );
          })
        )}

      </div>


      <div className="notification-footer">
        <button
          type="button"
          onClick={() => {
            setActivePage('Alerts');
            setNotificationsOpen(false);
          }}
        >
          View Alerts
        </button>
      </div>

    </div>
  )}

</div>

<div className="profile">

  <div className="profile-avatar">
    <UserRound size={17} />
  </div>

  <div className="profile-info">

    <div className="profile-name">
      {currentUser?.username || 'Analyst'}
    </div>

    <div className="profile-role">
      {currentUser?.role || 'SOC & GRC'}
    </div>

  </div>

  <button
    type="button"
    className="logout-button"
    onClick={handleLogout}
    title="Sign out"
    aria-label="Sign out"
  >
    Sign Out
  </button>

</div>

          </div>

        </header>

      


{activePage === 'Alerts' && (
  <AlertsPage
    alerts={alerts}
    onAlertStatusChange={handleAlertStatusChange}
  />
)}

       {activePage === 'Incidents' && (
  <IncidentsPage
    incidents={incidents}
    risks={risks}
    controls={controls}
    remediations={remediations}
    verifications={verifications}
    evidence={evidence}
    controlTests={controlTests}
    onNavigate={setActivePage}
  />
)}

  {activePage === 'Risks' && (
  <RisksPage
    risks={risks}
    incidents={incidents}
    controls={controls}
    remediations={remediations}
    verifications={verifications}
    riskControls={riskControls}
    onNavigate={setActivePage}
  />
)}
       

       {activePage === 'Controls' && (
  <ControlsPage
    controls={controls}
    risks={risks}
    riskControls={riskControls}
    remediations={remediations}
    verifications={verifications}
  />
)}

        {activePage === 'Remediation' && (
          <RemediationPage remediations={remediations} />
        )}

        {activePage === 'Verification' && (
          <VerificationPage verifications={verifications} />
        )}

        {activePage === 'Threat Intelligence' && (
  <ThreatIntelligencePage
    alerts={alerts}
    incidents={incidents}
  />
)}

        {activePage === 'Assets' && (
          <AssetsPage />
        )}

        {activePage === 'Detection Rules' && (
          <DetectionRulesPage alerts={alerts} />
        )}

        {activePage === 'MITRE ATT&CK' && (
          <MitrePage alerts={alerts} />
        )}

        {activePage === 'Scenario Library' && (
          <ScenarioLibraryPage />
        )}

        {activePage === 'Evidence' && (
          <EvidencePage />
        )}

        {activePage === 'Compliance' && (
          <CompliancePage
          frameworks={complianceOverview}
          />
        )}
        {activePage === 'Audit Trail' && (
  <AuditTrailPage
    auditLogs={auditLogs}
    loading={auditLoading}
    onRefresh={async () => {
      setAuditLoading(true);

      try {
        const logs = await getAuditLogs();
        setAuditLogs(logs);
      } catch (error) {
        console.error(
          'AEGIS AUDIT TRAIL REFRESH ERROR:',
          error,
        );
      } finally {
        setAuditLoading(false);
      }
    }}
  />
)}

        {activePage === 'Reports' && (
          <ReportsPage
            alerts={alerts}
            incidents={incidents}
            risks={risks}
            controls={controls}
            remediations={remediations}
            verifications={verifications}
          />
        )}

       {activePage === 'Analytics' && (
  <AnalyticsPage
    alerts={alerts}
    incidents={incidents}
    risks={risks}
    controls={controls}
    remediations={remediations}
    verifications={verifications}
    evidence={evidence}
    complianceOverview={complianceOverview}
  />
)}
        {activePage === 'Dashboard' && (
          <>
        
          {/* PAGE HEADER */}

        <section className="page-header">

          <div>

            <div className="eyebrow">

              SECURITY OPERATIONS

              <span>•</span>

              RISK GOVERNANCE

            </div>


            <h1>
              Security Operations & Risk Governance
            </h1>


            <p>
              Detect <span>›</span>
              Investigate <span>›</span>
              Assess <span>›</span>
              Mitigate <span>›</span>
              Assure
            </p>

          </div>


          <div className="operational-badge">

            <div className="status-dot" />

            <div>

              <span>
                AEGIS CORE
              </span>

              <strong>
                Operational
              </strong>

            </div>

          </div>

        </section>


        {/* =====================================================
            LIVE METRICS
            ===================================================== */}

        <section className="metric-grid">

          <MetricCard
            label="Security Alerts"
            value={
              loading
                ? '—'
                : String(alerts.length)
            }
            change={
              loading
                ? 'Loading'
                : 'Live'
            }
            icon={<Bell size={20} />}
            tone="blue"
          />


          <MetricCard
            label="Active Incidents"
            value={
              loading
                ? '—'
                : String(
                    activeIncidents.length,
                  )
            }
            change={
              loading
                ? 'Loading'
                : 'Live'
            }
            icon={<Siren size={20} />}
            tone="cyan"
          />


          <MetricCard
            label="Open Risks"
            value={
              loading
                ? '—'
                : String(openRisks.length)
            }
            change={
              loading
                ? 'Loading'
                : 'Live'
            }
            icon={
              <CircleAlert size={20} />
            }
            tone="warning"
          />


          <MetricCard
            label="Controls"
            value={
              loading
                ? '—'
                : String(controls.length)
            }
            change={
              loading
                ? 'Loading'
                : 'Live'
            }
            icon={
              <ShieldCheck size={20} />
            }
            tone="teal"
          />


          <MetricCard
            label="Remediation"
            value={
              loading
                ? '—'
                : String(
                    activeRemediations.length,
                  )
            }
            change={
              loading
                ? 'Loading'
                : 'Live'
            }
            icon={
              <Activity size={20} />
            }
            tone="orange"
          />


          <MetricCard
            label="Verified"
            value={
              loading
                ? '—'
                : String(verifiedCount)
            }
            change={
              loading
                ? 'Loading'
                : 'Live'
            }
            icon={
              <FileCheck2 size={20} />
            }
            tone="green"
          />

        </section>
        {/* =====================================================
    SOC → GRC WORKFLOW HEALTH
    ===================================================== */}

<section className="workflow-health panel">

  <div className="panel-header">
    <div>
      <h2>SOC → GRC Workflow Health</h2>

      <p>
        Trace security activity from detection through verification
      </p>
    </div>

    <span className="live-badge">
      <span />
      LIVE
    </span>
  </div>


  <div className="workflow-steps">

    <WorkflowStep
      label="Incident → Risk"
      statusText="linked"
      value={workflowStats.incidentRiskCount}
      icon={<Siren size={17} />}
      loading={loading}
    />

    <div className="workflow-arrow">→</div>

    <WorkflowStep
      label="Risk → Control"
      statusText="linked"
      value={workflowStats.riskControlCount}
      icon={<ShieldCheck size={17} />}
      loading={loading}
    />

    <div className="workflow-arrow">→</div>

    <WorkflowStep
      label="Control → Remediation"
      statusText="linked"
      value={workflowStats.remediationCount}
      icon={<Activity size={17} />}
      loading={loading}
    />

    <div className="workflow-arrow">→</div>

    <WorkflowStep
      label="Remediation → Verification"
      statusText="verified"
      value={workflowStats.verificationCount}
      icon={<FileCheck2 size={17} />}
      loading={loading}
    />

  </div>

</section>



        {/* =====================================================
            GLOBAL SECURITY VIEW + LIVE FEED
            ===================================================== */}

        <section className="dashboard-grid">


          {/* GLOBAL VIEW */}

          <div className="panel global-panel">

            <div className="panel-header">

              <div>

                <h2>
                  Global Security View
                </h2>

                <p>
                  Global threat activity and monitored security landscape
                </p>

              </div>


              <span className="live-badge">

                <span />

                LIVE

              </span>

            </div>


            <div className="global-map-placeholder">

              <div className="map-grid" />


              <div className="globe">

                <div className="globe-ring ring-one" />

                <div className="globe-ring ring-two" />


                <div className="globe-core">

                  <Shield
                    size={62}
                    strokeWidth={1.2}
                  />

                </div>


                <div className="threat-point point-one" />

                <div className="threat-point point-two" />

                <div className="threat-point point-three" />

              </div>


              <div className="map-label label-one">

                <span />

                Authentication anomaly

              </div>


              <div className="map-label label-two">

                <span />

                Network activity

              </div>


              <div className="map-label label-three">

                <span />

                Monitored asset

              </div>


              <div className="map-stat stat-sources">

                <strong>
                  {alerts.length}
                </strong>

                <span>
                  Security Alerts
                </span>

              </div>


              <div className="map-stat stat-assets">

                <strong>
                  {controls.length}
                </strong>

                <span>
                  Active Controls
                </span>

              </div>


              <div className="map-stat stat-events">

                <strong>
                  {incidents.length}
                </strong>

                <span>
                  Incidents Tracked
                </span>

              </div>

            </div>

          </div>


          {/* LIVE SECURITY FEED */}

          <div className="panel threat-panel">

            <div className="panel-header">

              <div>

                <h2>
                  Live Security Feed
                </h2>

                <p>
                  Recent security activity
                </p>

              </div>


              <span className="live-badge red">

                <span />

                LIVE

              </span>

            </div>


            <div className="feed">

              {recentAlerts.length === 0 ? (

                <div className="empty-state">
                  No security activity available.
                </div>

              ) : (

                recentAlerts.map((alert) => (

                  <FeedItem
                    key={alert.id}
                    time={formatTime(
                      alert.created_at,
                    )}
                    title={alert.title}
                    detail={
                      alert.source_ip ??
                      alert.username ??
                      alert.rule_id
                    }
                    severity={formatSeverity(
                      alert.severity,
                    )}
                    tone={severityTone(
                      alert.severity,
                    )}
                  />

                ))

              )}

            </div>

          </div>

        </section>


        {/* =====================================================
            ANALYTICS
            ===================================================== */}

        <section className="analytics-grid">

          <RiskOverview
            risks={risks}
          />


          <MitreOverview
            alerts={alerts}
          />


          <IncidentStatus
            incidents={incidents}
          />


          <ControlEffectiveness
            controls={controls}
            verifications={verifications}
          />

        </section>


        {/* =====================================================
            DATA TABLES
            ===================================================== */}

        <section className="data-grid">

          <RecentIncidents
            incidents={recentIncidents}
            onViewAll={() =>
              setActivePage('Incidents')
            }
          />


          <ActiveRemediation
            remediations={remediations}
            onViewAll={() =>
              setActivePage('Remediation')
            }
          />


          <ComplianceOverview
            frameworks={complianceOverview}
            onViewAll={() =>
              setActivePage('Compliance')
            }
          />

        </section>

          </>
        )}

      </main>

    </div>
  );
}


/* =========================================================
   SOC → GRC WORKFLOW STEP
   ========================================================= */

function WorkflowStep({
  label,
  statusText,
  value,
  icon,
  loading,
}: {
  label: string;
  statusText: string;
  value: number;
  icon: ReactNode;
  loading: boolean;
}) {
  const healthy = value > 0;

  return (
    <div className="workflow-step">
      <div
        className={`workflow-icon ${
          healthy ? 'healthy' : ''
        }`}
      >
        {icon}
      </div>

      <div className="workflow-step-content">
        <span>{label}</span>

        <strong>
          {loading
            ? 'Loading'
            : healthy
              ? statusText
              : 'pending'}
        </strong>
      </div>

      <div
        className={`workflow-count ${
          healthy ? 'healthy' : ''
        }`}
      >
        {loading ? '—' : value}
      </div>
    </div>
  );
}


/* =========================================================
   METRIC CARD
   ========================================================= */

function MetricCard({
  label,
  value,
  change,
  icon,
  tone,
}: {
  label: string;
  value: string;
  change: string;
  icon: ReactNode;
  tone: string;
}) {
  return (
    <div
      className={`metric-card ${tone}`}
    >

      <div className="metric-top">

        <span>
          {label}
        </span>

        <div className="metric-icon">
          {icon}
        </div>

      </div>


      <div className="metric-value">
        {value}
      </div>


      <div className="metric-change">
        {change}
      </div>


      <div className="metric-wave" />

    </div>
  );
}


/* =========================================================
   FEED ITEM
   ========================================================= */

function FeedItem({
  time,
  title,
  detail,
  severity,
  tone,
}: {
  time: string;
  title: string;
  detail: string;
  severity: string;
  tone: string;
}) {
  return (
    <div className="feed-item">

      <span
        className={`feed-dot ${tone}`}
      />


      <span className="feed-time">
        {time}
      </span>


      <div className="feed-content">

        <strong>
          {title}
        </strong>

        <span>
          {detail}
        </span>

      </div>


      <span
        className={`feed-severity ${tone}`}
      >
        {severity}
      </span>

    </div>
  );
}


/* =========================================================
   RISK OVERVIEW
   ========================================================= */

function RiskOverview({
  risks,
}: {
  risks: Risk[];
}) {
  const high = risks.filter(
    (risk) =>
      risk.risk_level.toLowerCase() ===
      'high',
  ).length;

  const medium = risks.filter(
    (risk) =>
      risk.risk_level.toLowerCase() ===
      'medium',
  ).length;

  const low = risks.filter(
    (risk) =>
      risk.risk_level.toLowerCase() ===
      'low',
  ).length;

  const critical = risks.filter(
    (risk) =>
      risk.risk_level.toLowerCase() ===
      'critical',
  ).length;


  return (
    <div className="analytics-card">

      <AnalyticsTitle
        title="Risk Overview"
        subtitle="Current risk landscape"
        icon={<CircleAlert size={19} />}
      />


      <div className="risk-content">

        <div className="risk-donut">

          <div>

            <strong>
              {risks.length}
            </strong>

            <span>
              Total Risks
            </span>

          </div>

        </div>


        <div className="legend">

          <LegendItem
            label="High"
            value={String(high)}
            tone="high"
          />

          <LegendItem
            label="Medium"
            value={String(medium)}
            tone="medium"
          />

          <LegendItem
            label="Low"
            value={String(low)}
            tone="low"
          />

          <LegendItem
            label="Critical"
            value={String(critical)}
            tone="critical"
          />

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   MITRE OVERVIEW
   ========================================================= */

function MitreOverview({
  alerts,
}: {
  alerts: Alert[];
}) {
  const techniqueMap: Record<
    string,
    {
      id: string;
      name: string;
    }
  > = {
    'AUTH-001': {
      id: 'T1110',
      name: 'Brute Force',
    },
    'AUTH-002': {
      id: 'T1078',
      name: 'Valid Accounts',
    },
    'AUTH-004': {
      id: 'T1110',
      name: 'Brute Force',
    },
    'AUTH-005': {
      id: 'T1078',
      name: 'Valid Accounts',
    },
    'NET-001': {
      id: 'T1046',
      name: 'Network Service Discovery',
    },
    'NET-002': {
      id: 'T1046',
      name: 'Network Service Discovery',
    },
    'NET-003': {
      id: 'T1046',
      name: 'Network Service Discovery',
    },
    'PROC-001': {
      id: 'T1059',
      name: 'Command & Scripting',
    },
    'PROC-002': {
      id: 'T1059',
      name: 'Command & Scripting',
    },
    'PROC-004': {
      id: 'T1059',
      name: 'Command & Scripting',
    },
    'PHISH-001': {
      id: 'T1566',
      name: 'Phishing',
    },
    'PHISH-002': {
      id: 'T1566',
      name: 'Phishing',
    },
  };


  const counts = new Map<
    string,
    {
      id: string;
      name: string;
      count: number;
    }
  >();


  alerts.forEach((alert) => {

    const technique =
      techniqueMap[alert.rule_id];

    if (!technique) {
      return;
    }

    const existing =
      counts.get(technique.id);

    if (existing) {
      existing.count += 1;
    } else {
      counts.set(
        technique.id,
        {
          ...technique,
          count: 1,
        },
      );
    }

  });


  const techniques = Array.from(
    counts.values(),
  )
    .sort(
      (a, b) =>
        b.count - a.count,
    )
    .slice(0, 4);


  const maximum =
    techniques[0]?.count || 1;


  return (
    <div className="analytics-card">

      <AnalyticsTitle
        title="MITRE ATT&CK"
        subtitle="Observed techniques"
        icon={<Target size={19} />}
      />


      <div className="mitre-list">

        {techniques.length === 0 ? (

          <div className="empty-state">
            No mapped techniques available.
          </div>

        ) : (

          techniques.map(
            (technique) => (

              <Technique
                key={technique.id}
                id={technique.id}
                name={technique.name}
                count={String(
                  technique.count,
                )}
                width={`${
                  (technique.count /
                    maximum) *
                  100
                }%`}
              />

            ),
          )

        )}

      </div>

    </div>
  );
}


/* =========================================================
   INCIDENT STATUS
   ========================================================= */

function IncidentStatus({
  incidents,
}: {
  incidents: Incident[];
}) {
  const open = incidents.filter(
    (incident) =>
      incident.status.toLowerCase() ===
      'open',
  ).length;

  const investigating =
    incidents.filter(
      (incident) =>
        incident.status.toLowerCase() ===
        'investigating',
    ).length;

  const containment =
    incidents.filter(
      (incident) =>
        incident.status.toLowerCase() ===
        'containment',
    ).length;

  const remediation =
    incidents.filter(
      (incident) =>
        incident.status.toLowerCase() ===
        'remediation',
    ).length;

  const resolved =
    incidents.filter(
      (incident) =>
        incident.status.toLowerCase() ===
        'resolved',
    ).length;


  return (
    <div className="analytics-card">

      <AnalyticsTitle
        title="Incident Status"
        subtitle="Current incident lifecycle"
        icon={<Siren size={19} />}
      />


      <div className="incident-status">

        <div className="incident-donut">

          <strong>
            {incidents.length}
          </strong>

          <span>
            Incidents
          </span>

        </div>


        <div className="status-list">

          <LegendItem
            label="Open"
            value={String(open)}
            tone="blue"
          />

          <LegendItem
            label="Investigating"
            value={String(
              investigating,
            )}
            tone="cyan"
          />

          <LegendItem
            label="Containment"
            value={String(
              containment,
            )}
            tone="orange"
          />

          <LegendItem
            label="Remediation"
            value={String(
              remediation,
            )}
            tone="medium"
          />

          <LegendItem
            label="Resolved"
            value={String(
              resolved,
            )}
            tone="low"
          />

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   CONTROL EFFECTIVENESS
   ========================================================= */

function ControlEffectiveness({
  controls,
  verifications,
}: {
  controls: Control[];
  verifications: Verification[];
}) {
  const verified =
    verifications.filter(
      (verification) =>
        verification.result.toUpperCase() ===
        'PASS',
    ).length;


  const testing =
    controls.filter(
      (control) =>
        control.status.toLowerCase() ===
        'testing',
    ).length;


  const implemented =
    controls.filter(
      (control) =>
        control.status.toLowerCase() ===
        'implemented',
    ).length;


  const planned =
    controls.filter(
      (control) =>
        control.status.toLowerCase() ===
        'planned',
    ).length;


  return (
    <div className="analytics-card">

      <AnalyticsTitle
        title="Control Effectiveness"
        subtitle="GRC assurance status"
        icon={<ShieldCheck size={19} />}
      />


      <div className="control-content">

        <div className="control-donut">

          <strong>
            {controls.length}
          </strong>

          <span>
            Controls
          </span>

        </div>


        <div className="status-list">

          <LegendItem
            label="Verified"
            value={String(verified)}
            tone="low"
          />

          <LegendItem
            label="Testing"
            value={String(testing)}
            tone="blue"
          />

          <LegendItem
            label="Implemented"
            value={String(
              implemented,
            )}
            tone="cyan"
          />

          <LegendItem
            label="Planned"
            value={String(planned)}
            tone="medium"
          />

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   ANALYTICS TITLE
   ========================================================= */

function AnalyticsTitle({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
}) {
  return (
    <div className="analytics-title">

      <div>

        <h3>
          {title}
        </h3>

        <span>
          {subtitle}
        </span>

      </div>

      {icon}

    </div>
  );
}


/* =========================================================
   LEGEND
   ========================================================= */

function LegendItem({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="legend-item">

      <div>

        <span
          className={`legend-dot ${tone}`}
        />

        {label}

      </div>

      <strong>
        {value}
      </strong>

    </div>
  );
}


/* =========================================================
   TECHNIQUE
   ========================================================= */

function Technique({
  id,
  name,
  count,
  width,
}: {
  id: string;
  name: string;
  count: string;
  width: string;
}) {
  return (
    <div className="technique">

      <div className="technique-top">

        <span>

          <strong>
            {id}
          </strong>

          {name}

        </span>

        <b>
          {count}
        </b>

      </div>


      <div className="technique-bar">

        <span
          style={{
            width,
          }}
        />

      </div>

    </div>
  );
}


/* =========================================================
   RECENT INCIDENTS
   ========================================================= */

function RecentIncidents({
  incidents,
  onViewAll,
}: {
  incidents: Incident[];
  onViewAll: () => void;
}) {
  return (
    <div className="table-card incidents-table">

      <TableHeader
        title="Recent Incidents"
        subtitle="Latest SOC investigations"
        onViewAll={onViewAll}
      />


      <div className="table-head">

        <span>
          Incident
        </span>

        <span>
          Severity
        </span>

        <span>
          Status
        </span>

        <span>
          Time
        </span>

      </div>


      {incidents.length === 0 ? (

        <div className="empty-state">
          No incidents available.
        </div>

      ) : (

        incidents.map((incident) => (

          <TableRow
            key={incident.id}
            incident={
              incident.incident_number
            }
            title={incident.title}
            severity={formatSeverity(
              incident.severity,
            )}
            status={formatStatus(
              incident.status,
            )}
            time={formatDateTime(
              incident.created_at,
            )}
            severityTone={severityTone(
              incident.severity,
            )}
            statusTone={statusTone(
              incident.status,
            )}
          />

        ))

      )}

    </div>
  );
}


/* =========================================================
   ACTIVE REMEDIATION
   ========================================================= */

function ActiveRemediation({
  remediations,
  onViewAll,
}: {
  remediations: Remediation[];
  onViewAll: () => void;
}) {
  const sorted =
    [...remediations]
      .sort(
        (a, b) =>
          new Date(
            b.updated_at,
          ).getTime() -
          new Date(
            a.updated_at,
          ).getTime(),
      )
      .slice(0, 4);


  return (
    <div className="table-card">

      <TableHeader
        title="Active Remediation"
        subtitle="Risk treatment activities"
        onViewAll={onViewAll}
      />


      <div className="remediation-list">

        {sorted.length === 0 ? (

          <div className="empty-state">
            No remediation records available.
          </div>

        ) : (

          sorted.map((remediation) => (

            <RemediationRow
              key={remediation.id}
              number={
                remediation.remediation_number
              }
              title={
                remediation.title
              }
              status={
                formatStatus(
                  remediation.status,
                )
              }
              tone={remediationTone(
                remediation.status,
              )}
            />

          ))

        )}

      </div>

    </div>
  );
}


/* =========================================================
   COMPLIANCE
   ========================================================= */

function ComplianceOverview({
  frameworks,
  onViewAll,
}: {
  frameworks: ComplianceOverviewData[];
  onViewAll: () => void;
}) {
  return (
    <div className="table-card">

      <TableHeader
        title="Compliance Frameworks"
        subtitle="AEGIS catalog coverage"
        onViewAll={onViewAll}
      />

      <div className="framework-list">

        {frameworks.length === 0 ? (

          <div className="empty-state">
            No compliance framework data available.
          </div>

        ) : (

          frameworks.map((framework) => (

            <Framework
              key={framework.id}
              name={framework.name}
              percentage={`${framework.coverage_percentage}%`}
              width={`${framework.coverage_percentage}%`}
              tone={frameworkTone(framework.code)}
            />

          ))

        )}

      </div>

    </div>
  );
}
function frameworkTone(code: string): string {
  switch (code) {
    case 'ISO27001':
      return 'blue';

    case 'NIST-CSF':
      return 'cyan';

    case 'CIS-CONTROLS':
      return 'orange';

    case 'SOC2':
      return 'critical';

    default:
      return 'blue';
  }
}


/* =========================================================
   TABLE HEADER
   ========================================================= */

function TableHeader({
  title,
  subtitle,
  onViewAll,
}: {
  title: string;
  subtitle: string;
  onViewAll?: () => void;
}) {
  return (
    <div className="table-header">

      <div>

        <h3>
          {title}
        </h3>

        <span>
          {subtitle}
        </span>

      </div>


      <button
        type="button"
        className="table-view-all"
        onClick={onViewAll}
        disabled={!onViewAll}
      >
        View All
        <span>→</span>
      </button>

    </div>
  );
}


/* =========================================================
   INCIDENT TABLE ROW
   ========================================================= */

function TableRow({
  incident,
  title,
  severity,
  status,
  time,
  severityTone,
  statusTone,
}: {
  incident: string;
  title: string;
  severity: string;
  status: string;
  time: string;
  severityTone: string;
  statusTone: string;
}) {
  return (
    <div className="table-row">

      <div className="incident-name">

        <strong>
          {incident}
        </strong>

        <span>
          {title}
        </span>

      </div>


      <span
        className={`table-badge ${severityTone}`}
      >
        {severity}
      </span>


      <span
        className={`table-badge ${statusTone}`}
      >
        {status}
      </span>


      <span className="table-time">
        {time}
      </span>

    </div>
  );
}


/* =========================================================
   REMEDIATION ROW
   ========================================================= */

function RemediationRow({
  number,
  title,
  status,
  tone,
}: {
  number: string;
  title: string;
  status: string;
  tone: string;
}) {
  return (
    <div className="remediation-row">

      <div className="remediation-icon">

        {tone === 'success' ? (

          <CheckCircle2 size={16} />

        ) : (

          <ShieldAlert size={16} />

        )}

      </div>


      <div className="remediation-text">

        <strong>
          {number}
        </strong>

        <span>
          {title}
        </span>

      </div>


      <span
        className={`table-badge ${tone}`}
      >
        {status}
      </span>

    </div>
  );
}


/* =========================================================
   FRAMEWORK
   ========================================================= */

function Framework({
  name,
  percentage,
  width,
  tone,
}: {
  name: string;
  percentage: string;
  width: string;
  tone: string;
}) {
  return (
    <div className="framework">

      <div className="framework-top">

        <span>
          {name}
        </span>

        <strong>
          {percentage}
        </strong>

      </div>


      <div className="framework-bar">

        <span
          className={tone}
          style={{
            width,
          }}
        />

      </div>

    </div>
  );
}


/* =========================================================
   HELPERS
   ========================================================= */

function formatSeverity(
  severity: string,
): string {
  if (!severity) {
    return 'Unknown';
  }

  return (
    severity.charAt(0).toUpperCase() +
    severity.slice(1).toLowerCase()
  );
}


function formatStatus(
  status: string,
): string {
  if (!status) {
    return 'Unknown';
  }

  return status
    .split('_')
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1).toLowerCase(),
    )
    .join(' ');
}


function formatTime(
  value: string,
): string {
  return new Date(value).toLocaleTimeString(
    [],
    {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    },
  );
}


function formatDateTime(
  value: string,
): string {
  const date =
    new Date(value);

  return `${date.toLocaleDateString(
    [],
    {
      day: '2-digit',
      month: 'short',
    },
  )}, ${date.toLocaleTimeString(
    [],
    {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    },
  )}`;
}


function severityTone(
  severity: string,
): string {
  switch (
    severity.toLowerCase()
  ) {
    case 'critical':
      return 'critical';

    case 'high':
      return 'high';

    case 'medium':
      return 'medium';

    case 'low':
      return 'low';

    default:
      return 'blue';
  }
}


function statusTone(
  status: string,
): string {
  switch (
    status.toLowerCase()
  ) {
    case 'open':
      return 'blue';

    case 'investigating':
      return 'blue';

    case 'containment':
      return 'orange';

    case 'remediation':
      return 'cyan';

    case 'resolved':
    case 'closed':
      return 'success';

    default:
      return 'blue';
  }
}


function remediationTone(
  status: string,
): string {
  switch (
    status.toLowerCase()
  ) {
    case 'completed':
    case 'closed':
      return 'success';

    case 'in_progress':
    case 'in progress':
      return 'blue';

    case 'open':
      return 'orange';

    default:
      return 'blue';
  }
}


export default App;
