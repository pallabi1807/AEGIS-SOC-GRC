const API_BASE_URL = 'http://127.0.0.1:8000';

async function apiGet<T>(endpoint: string): Promise<T> {
  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
  );

  if (!response.ok) {
    throw new Error(
      `AEGIS API ${response.status}: ${response.statusText}`,
    );
  }

  return response.json();
}


/* =========================================================
   ALERTS
   ========================================================= */

export interface Alert {
  id: string;
  rule_id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  asset_id: string | null;
  source_ip: string | null;
  username: string | null;
  event_count: number;
  created_at: string;
}

export async function getAlerts(): Promise<Alert[]> {
  return apiGet<Alert[]>('/alerts');
}
export type AlertStatus =
  | 'open'
  | 'investigating'
  | 'resolved';

export async function updateAlertStatus(
  alertId: string,
  status: AlertStatus,
): Promise<Alert> {
  const response = await fetch(
    `${API_BASE_URL}/alerts/${alertId}/status`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status,
      }),
    },
  );

  if (!response.ok) {
    let detail = response.statusText;

    try {
      const error = await response.json();
      detail = error.detail || detail;
    } catch {
      // Keep the HTTP status text when the API does not return JSON.
    }

    throw new Error(
      `AEGIS API ${response.status}: ${detail}`,
    );
  }

  return response.json();
}


/* =========================================================
   INCIDENTS
   ========================================================= */

export interface Incident {
  id: string;
  incident_number: string;
  alert_id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  asset_id: string | null;
  source_ip: string | null;
  username: string | null;
  created_at: string;
  updated_at: string;
}

export async function getIncidents(): Promise<Incident[]> {
  return apiGet<Incident[]>('/incidents');
}


/* =========================================================
   RISKS
   ========================================================= */

export interface Risk {
  id: string;
  risk_number: string;
  title: string;
  description: string;
  risk_score: number;
  risk_level: string;
  status: string;
  treatment: string;
  owner: string | null;
  incident_id: string | null;
  asset_id: string | null;
  created_at: string;
  updated_at: string;
}

export async function getRisks(): Promise<Risk[]> {
  return apiGet<Risk[]>('/risks');
}


/* =========================================================
   CONTROLS
   ========================================================= */

export interface Control {
  id: string;
  control_id: string;
  name: string;
  description: string;
  control_type: string;
  status: string;
  owner: string | null;
  created_at: string;
  updated_at: string;
}

export async function getControls(): Promise<Control[]> {
  return apiGet<Control[]>('/controls');
}


/* =========================================================
   REMEDIATIONS
   ========================================================= */

export interface Remediation {
  id: string;
  remediation_number: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  risk_id: string | null;
  control_id: string | null;
  owner: string | null;
  due_date: string | null;
  completed_at: string | null;
  verification_status: string;
  verification_notes: string | null;
  created_at: string;
  updated_at: string;
}

export async function getRemediations(): Promise<Remediation[]> {
  return apiGet<Remediation[]>('/remediations');
}


/* =========================================================
   VERIFICATIONS
   ========================================================= */

export interface Verification {
  id: string;
  verification_number: string;
  remediation_id: string;
  control_id: string;
  verification_procedure: string;
  result: string;
  findings: string | null;
  verifier: string;
  verified_at: string;
  notes: string | null;
  created_at: string;
}
export interface Evidence {
  id: string;
  evidence_number: string;
  title: string;
  description: string;
  evidence_type: string;
  source: string;
  status: string;
  control_id: string;
  collected_at: string;
  created_at: string;

  artifact_name?: string | null;
  artifact_path?: string | null;
  collection_method?: string | null;
  sha256_hash?: string | null;

  integrity_status?: string | null;
  review_status?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
}

export interface ControlTest {
  id: string;
  test_number: string;
  control_id: string;
  evidence_id: string;
  test_procedure: string;
  result: string;
  findings: string | null;
  tester: string;
  tested_at: string;
  notes: string | null;
  created_at: string;
}

export async function getEvidence(): Promise<Evidence[]> {
  return apiGet('/evidence');
}

export async function getControlTests(): Promise<ControlTest[]> {
  return apiGet('/control-tests');
}
export interface RiskControl {
  id: string;
  risk_id: string;
  control_id: string;
  risk_number?: string;
  control_identifier?: string;
  control_name?: string;
  relationship: string;
  created_at: string;
}
export async function getRiskControls(): Promise<RiskControl[]> {
  return apiGet('/risk-controls');
}

export async function getVerifications(): Promise<Verification[]> {
  return apiGet<Verification[]>('/verifications');
}
export interface ComplianceOverview {
  id: string;
  code: string;
  name: string;
  version: string;
  total_requirements: number;
  mapped_requirements: number;
  mapped_controls: number;
  verified_controls: number;
  coverage_percentage: number;
}
export async function getComplianceOverview(): Promise<ComplianceOverview[]> {
  return apiGet('/compliance/overview');
}
export interface ComplianceRequirement {
  id: string;
  framework_id: string;
  requirement_id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ComplianceMapping {
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
}

export async function getComplianceRequirements(
  frameworkId: string,
): Promise<ComplianceRequirement[]> {
  return apiGet(
    `/compliance/frameworks/${frameworkId}/requirements`,
  );
}

export async function getComplianceMappings(
  frameworkId: string,
): Promise<ComplianceMapping[]> {
  return apiGet(
    `/compliance/frameworks/${frameworkId}/controls`,
  );
}
/* =========================================================
   AUDIT TRAIL
   ========================================================= */

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  description: string;
  old_value: string | null;
  new_value: string | null;
  source: string;
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  return apiGet<AuditLog[]>('/audit-logs');
}