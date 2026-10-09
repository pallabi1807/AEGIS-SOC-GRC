import { useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  Crosshair,
  Filter,
  FlaskConical,
  Network,
  Search,
  ShieldAlert,
  Terminal,
  X,
} from 'lucide-react';

type SimulationAlert = {
  rule_id?: string;
  title?: string;
  severity?: string;
  status?: string;
  event_count?: number;
};

type SimulationDetection = {
  status?: string;
  alerts_created?: number;
  alerts_updated?: number;
  incidents_created?: number;
  incidents_existing?: number;
  alerts?: SimulationAlert[];
};

type SimulationResult = {
  scenario_id?: string;
  category?: string;
  name?: string;
  severity?: string;
  scenario_type?: string;
  mitre_technique?: string;
  detection_rules?: string[];
  asset_id?: string;
  detection?: SimulationDetection | null;
};

const API_BASE_URL = 'http://127.0.0.1:8000';

type ScenarioType = 'atomic' | 'attack-chain';
type ScenarioCategory = 'Authentication' | 'Network' | 'Endpoint' | 'Malware' | 'Phishing' | 'Web';
type Severity = 'critical' | 'high' | 'medium';

interface Scenario {
  id: string;
  category: ScenarioCategory;
  name: string;
  type: ScenarioType;
  severity: Severity;
  mitre: string;
  detection: string;
  description: string;
}

const scenarios: Scenario[] = [
  { id: 'AUTH-BRUTE-FORCE', category: 'Authentication', name: 'Brute Force → Successful Login', type: 'attack-chain', severity: 'high', mitre: 'T1110.001', detection: 'AUTH-001, AUTH-002', description: 'Simulates repeated failed authentication followed by a successful login to demonstrate credential attack detection.' },
  { id: 'NET-RECONNAISSANCE', category: 'Network', name: 'Network Reconnaissance', type: 'attack-chain', severity: 'high', mitre: 'T1046', detection: 'NET-001, NET-002', description: 'Simulates network discovery activity through port scanning and repeated connection attempts.' },
  { id: 'ENDPOINT-EXECUTION', category: 'Endpoint', name: 'Suspicious PowerShell Execution Chain', type: 'attack-chain', severity: 'high', mitre: 'T1059.001', detection: 'PROC-001, PROC-004', description: 'Simulates suspicious PowerShell execution and process-spawn telemetry without executing an attack.' },
  { id: 'PHISHING-CREDENTIAL-HARVEST', category: 'Phishing', name: 'Phishing Credential Harvest', type: 'attack-chain', severity: 'critical', mitre: 'T1566.002', detection: 'PHISH-001, PHISH-002, PHISH-003', description: 'Simulates a phishing sequence involving a suspicious link, attachment, and credential-harvesting page.' },
  { id: 'WEB-ATTACK-CHAIN', category: 'Web', name: 'Web Attack Chain', type: 'attack-chain', severity: 'high', mitre: 'T1190', detection: 'WEB-001..004', description: 'Simulates common web attack telemetry including injection, scripting, traversal, and enumeration.' },

  { id: 'AUTH-001', category: 'Authentication', name: 'Multiple Failed Logins', type: 'atomic', severity: 'high', mitre: 'T1110.001', detection: 'AUTH-001', description: 'Generates repeated failed login telemetry for one account from a single source.' },
  { id: 'AUTH-002', category: 'Authentication', name: 'Successful Login After Repeated Failures', type: 'atomic', severity: 'high', mitre: 'T1078', detection: 'AUTH-002', description: 'Creates a successful login after a sequence of failed attempts.' },
  { id: 'AUTH-003', category: 'Authentication', name: 'Login From New Source IP', type: 'atomic', severity: 'high', mitre: 'T1078', detection: 'AUTH-003', description: 'Establishes a known source and then simulates a successful login from a previously unseen source address.' },
  { id: 'AUTH-004', category: 'Authentication', name: 'Password Spraying', type: 'atomic', severity: 'high', mitre: 'T1110.003', detection: 'AUTH-004', description: 'Simulates authentication failures across multiple accounts using a common password-spray pattern.' },
  { id: 'AUTH-005', category: 'Authentication', name: 'Privileged Account Login', type: 'atomic', severity: 'high', mitre: 'T1078', detection: 'AUTH-005', description: 'Generates successful privileged-account authentication telemetry for monitoring.' },
  { id: 'AUTH-006', category: 'Authentication', name: 'Account Lockout', type: 'atomic', severity: 'medium', mitre: '—', detection: 'AUTH-006', description: 'Simulates an account lockout event caused by repeated authentication failures.' },

  { id: 'NET-001', category: 'Network', name: 'Port Scan', type: 'atomic', severity: 'high', mitre: 'T1046', detection: 'NET-001', description: 'Generates synthetic connection telemetry across multiple destination ports.' },
  { id: 'NET-002', category: 'Network', name: 'Repeated Connection Attempts', type: 'atomic', severity: 'high', mitre: 'T1046', detection: 'NET-002', description: 'Simulates repeated connections to the same service from one source.' },
  { id: 'NET-003', category: 'Network', name: 'Unusual Destination Port', type: 'atomic', severity: 'high', mitre: 'T1046', detection: 'NET-003', description: 'Generates telemetry for a connection to an unusual destination port.' },
  { id: 'NET-004', category: 'Network', name: 'High Volume Network Connections', type: 'atomic', severity: 'medium', mitre: 'T1046', detection: 'NET-004', description: 'Simulates an abnormal volume of network connection events.' },
  { id: 'NET-005', category: 'Network', name: 'Unknown External Destination', type: 'atomic', severity: 'medium', mitre: '—', detection: 'NET-005', description: 'Generates outbound telemetry to an unknown external destination.' },

  { id: 'PROC-001', category: 'Endpoint', name: 'Suspicious PowerShell Execution', type: 'atomic', severity: 'high', mitre: 'T1059.001', detection: 'PROC-001', description: 'Simulates PowerShell execution characteristics such as encoded commands and execution-policy bypass.' },
  { id: 'PROC-002', category: 'Endpoint', name: 'Suspicious Command Shell', type: 'atomic', severity: 'medium', mitre: 'T1059.003', detection: 'PROC-002', description: 'Generates suspicious Windows command-shell execution telemetry.' },
  { id: 'PROC-003', category: 'Endpoint', name: 'LOLBin Abuse', type: 'atomic', severity: 'high', mitre: 'T1105', detection: 'PROC-003', description: 'Simulates trusted Windows utility abuse using safe telemetry only.' },
  { id: 'PROC-004', category: 'Endpoint', name: 'Suspicious Process Spawn', type: 'atomic', severity: 'high', mitre: 'T1059.001', detection: 'PROC-004', description: 'Generates parent-child process telemetry indicating suspicious process spawning.' },
  { id: 'PROC-005', category: 'Endpoint', name: 'Persistence Command', type: 'atomic', severity: 'high', mitre: 'T1053.005', detection: 'PROC-005', description: 'Simulates scheduled-task persistence telemetry without creating a real persistence mechanism.' },

  { id: 'MAL-001', category: 'Malware', name: 'Suspicious File Creation', type: 'atomic', severity: 'high', mitre: '—', detection: 'MAL-001', description: 'Generates telemetry for a suspicious executable appearing in a temporary location.' },
  { id: 'MAL-002', category: 'Malware', name: 'Malicious Hash / IOC Match', type: 'atomic', severity: 'critical', mitre: '—', detection: 'MAL-002', description: 'Uses a clearly synthetic AEGIS IOC hash to demonstrate malware-indicator matching.' },
  { id: 'MAL-003', category: 'Malware', name: 'Suspicious File Execution', type: 'atomic', severity: 'high', mitre: '—', detection: 'MAL-003', description: 'Generates suspicious file-execution telemetry without executing a real file.' },
  { id: 'MAL-004', category: 'Malware', name: 'Malware Persistence', type: 'atomic', severity: 'critical', mitre: 'T1547.001', detection: 'MAL-004', description: 'Simulates registry-run-key persistence telemetry without modifying the Windows registry.' },

  { id: 'PHISH-001', category: 'Phishing', name: 'Suspicious Email Link', type: 'atomic', severity: 'high', mitre: 'T1566.002', detection: 'PHISH-001', description: 'Generates synthetic telemetry for a suspicious phishing URL.' },
  { id: 'PHISH-002', category: 'Phishing', name: 'Malicious Attachment', type: 'atomic', severity: 'critical', mitre: 'T1566.001', detection: 'PHISH-002', description: 'Simulates receipt of a suspicious executable attachment.' },
  { id: 'PHISH-003', category: 'Phishing', name: 'Credential Harvesting Page', type: 'atomic', severity: 'critical', mitre: 'T1056.003', detection: 'PHISH-003', description: 'Generates synthetic telemetry representing a credential-harvesting web page.' },
  { id: 'PHISH-004', category: 'Phishing', name: 'Suspicious Sender / Domain', type: 'atomic', severity: 'medium', mitre: '—', detection: 'PHISH-004', description: 'Simulates a suspicious sender and domain combination associated with a phishing message.' },

  { id: 'WEB-001', category: 'Web', name: 'SQL Injection', type: 'atomic', severity: 'high', mitre: 'T1190', detection: 'WEB-001', description: 'Generates safe synthetic SQL-injection telemetry; no database query is executed.' },
  { id: 'WEB-002', category: 'Web', name: 'Cross-Site Scripting', type: 'atomic', severity: 'high', mitre: 'T1190', detection: 'WEB-002', description: 'Generates safe synthetic XSS telemetry without executing script content.' },
  { id: 'WEB-003', category: 'Web', name: 'Directory Traversal', type: 'atomic', severity: 'high', mitre: 'T1190', detection: 'WEB-003', description: 'Generates synthetic traversal telemetry without accessing real files.' },
  { id: 'WEB-004', category: 'Web', name: 'Web Scanner / Enumeration', type: 'atomic', severity: 'high', mitre: 'T1046', detection: 'WEB-004', description: 'Simulates web-path enumeration against the demo application without performing real scanning.' },
];

const categoryIcon: Record<ScenarioCategory, typeof Activity> = {
  Authentication: ShieldAlert,
  Network: Network,
  Endpoint: Terminal,
  Malware: ShieldAlert,
  Phishing: Crosshair,
  Web: Activity,
};

const categoryFilters = ['All', 'Authentication', 'Network', 'Endpoint', 'Malware', 'Phishing', 'Web'] as const;
const typeFilters = ['All', 'Atomic', 'Attack Chain'] as const;

function ScenarioLibraryPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<(typeof categoryFilters)[number]>('All');
  const [type, setType] = useState<(typeof typeFilters)[number]>('All');
  const [selected, setSelected] = useState<Scenario | null>(null);
  const [runningScenario, setRunningScenario] = useState<Scenario | null>(null);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [simulationError, setSimulationError] = useState('');
  const [simulationLoading, setSimulationLoading] = useState(false);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return scenarios.filter((scenario) => {
      const matchesCategory = category === 'All' || scenario.category === category;
      const matchesType = type === 'All' || (type === 'Atomic' ? scenario.type === 'atomic' : scenario.type === 'attack-chain');
      const haystack = `${scenario.id} ${scenario.name} ${scenario.description} ${scenario.mitre} ${scenario.detection}`.toLowerCase();
      return matchesCategory && matchesType && (!query || haystack.includes(query));
    });
  }, [search, category, type]);

  async function runScenario(scenario: Scenario) {
    setSelected(null);
    setRunningScenario(scenario);
    setSimulationResult(null);
    setSimulationError('');
    setSimulationLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/scenarios/${encodeURIComponent(scenario.id)}/run`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        },
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof payload?.detail === 'string'
            ? payload.detail
            : 'Scenario execution failed.',
        );
      }

      setSimulationResult(payload.result ?? null);
    } catch (error) {
      setSimulationError(
        error instanceof Error
          ? error.message
          : 'Unable to execute the scenario.',
      );
    } finally {
      setSimulationLoading(false);
    }
  }

  function closeConsole() {
    if (simulationLoading) return;
    setRunningScenario(null);
    setSimulationResult(null);
    setSimulationError('');
  }

  return (
    <div className="scenario-page">
      <section className="page-header scenario-header">
        <div>
          <div className="eyebrow">SOC OPERATIONS <span>•</span> CONTROLLED SIMULATION</div>
          <h1>AEGIS Scenario Library</h1>
          <p>Controlled security simulations for validating detection, alerting, and incident workflows.</p>
        </div>
        <div className="scenario-count-card">
          <div className="scenario-count-icon"><FlaskConical size={18} /></div>
          <div><strong>{scenarios.length}</strong><span>selectable scenarios</span></div>
        </div>
      </section>

      <div className="simulation-banner">
        <div className="simulation-banner-icon"><FlaskConical size={17} /></div>
        <div>
          <strong>Simulation Environment</strong>
          <span>Security events shown here are synthetic and generated for controlled testing.</span>
        </div>
        <span className="simulation-pill">SAFE / SYNTHETIC</span>
      </div>

      <section className="scenario-toolbar">
        <div className="scenario-search">
          <Search size={17} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search scenarios, rules, MITRE techniques..." />
          {search && <button onClick={() => setSearch('')} aria-label="Clear search"><X size={15} /></button>}
        </div>
        <div className="scenario-filter-icon"><Filter size={16} /> Filters</div>
      </section>

      <section className="scenario-filter-row">
        <div className="filter-group">
          <span>Category</span>
          {categoryFilters.map((item) => <button key={item} className={category === item ? 'filter-chip active' : 'filter-chip'} onClick={() => setCategory(item)}>{item}</button>)}
        </div>
        <div className="filter-group">
          <span>Type</span>
          {typeFilters.map((item) => <button key={item} className={type === item ? 'filter-chip active' : 'filter-chip'} onClick={() => setType(item)}>{item}</button>)}
        </div>
      </section>

      <div className="scenario-result-line">
        <span>Showing <strong>{filtered.length}</strong> of {scenarios.length} scenarios</span>
        {(category !== 'All' || type !== 'All' || search) && <button className="clear-filters" onClick={() => { setSearch(''); setCategory('All'); setType('All'); }}>Clear filters</button>}
      </div>

      <section className="scenario-grid">
        {filtered.map((scenario) => {
          const Icon = categoryIcon[scenario.category];
          return (
            <article
  className="scenario-card"
  key={scenario.id}
  onClick={() => setSelected(scenario)}
>
              <div className="scenario-card-top">
                <div className={`scenario-icon ${scenario.category.toLowerCase()}`}><Icon size={19} /></div>
                <div className="scenario-badges">
                  <span className={`severity-badge ${scenario.severity}`}>{scenario.severity}</span>
                  <span className={`type-badge ${scenario.type}`}>{scenario.type === 'attack-chain' ? 'ATTACK CHAIN' : 'ATOMIC'}</span>
                </div>
              </div>
              <div className="scenario-rule">{scenario.id}</div>
              <h3>{scenario.name}</h3>
              <p>{scenario.description}</p>
              <div className="scenario-meta">
                <div><span>MITRE ATT&CK</span><strong>{scenario.mitre}</strong></div>
                <div><span>DETECTION</span><strong>{scenario.detection}</strong></div>
              </div>
              <button
  className="scenario-run-button"
  onClick={(event) => {
    event.stopPropagation();
    runScenario(scenario);
  }}
>
                Run scenario <ArrowRight size={15} />
              </button>
            </article>
          );
        })}
      </section>

      {filtered.length === 0 && (
        <div className="scenario-empty"><Search size={24} /><strong>No scenarios found</strong><span>Try a different search or filter combination.</span></div>
      )}

      {runningScenario && (
        <div className="scenario-modal-backdrop" onClick={closeConsole}>
          <div className="scenario-modal simulation-console-modal" onClick={(e) => e.stopPropagation()}>
            <div className="scenario-modal-head">
              <div>
                <span className="scenario-rule">SIMULATION CONSOLE • {runningScenario.id}</span>
                <h2>{runningScenario.name}</h2>
              </div>
              <button className="modal-close" onClick={closeConsole} disabled={simulationLoading}>
                <X size={18} />
              </button>
            </div>

            <div className="simulation-banner compact">
              <FlaskConical size={16} />
              <span>
                Simulation Environment — synthetic telemetry only. No real attack,
                malware, email, registry, or web exploitation is performed.
              </span>
            </div>

            <div className="simulation-console">
              <div className="console-line">
                <span className="console-dot active" />
                <span>Simulation started</span>
                <strong>{runningScenario.id}</strong>
              </div>

              <div className={`console-line ${simulationLoading ? 'working' : 'complete'}`}>
                <span className={`console-dot ${simulationLoading ? 'active' : 'complete'}`} />
                <span>{simulationLoading ? 'Generating synthetic telemetry and running detection...' : 'Synthetic telemetry generated'}</span>
              </div>

              <div className={`console-line ${simulationLoading ? 'working' : 'complete'}`}>
                <span className={`console-dot ${simulationLoading ? 'active' : 'complete'}`} />
                <span>{simulationLoading ? 'Detection pipeline in progress...' : 'AEGIS detection completed'}</span>
              </div>

              {simulationError && (
                <div className="simulation-error">
                  <ShieldAlert size={16} />
                  <div>
                    <strong>Simulation failed</strong>
                    <span>{simulationError}</span>
                  </div>
                </div>
              )}

              {simulationResult?.detection && (
                <>
                  <div className="console-section-title">PIPELINE RESULT</div>

                  <div className="simulation-status-grid">
                    <div>
                      <span>ALERTS CREATED</span>
                      <strong>{simulationResult.detection.alerts_created ?? 0}</strong>
                    </div>
                    <div>
                      <span>ALERTS UPDATED</span>
                      <strong>{simulationResult.detection.alerts_updated ?? 0}</strong>
                    </div>
                    <div>
                      <span>INCIDENTS CREATED</span>
                      <strong>{simulationResult.detection.incidents_created ?? 0}</strong>
                    </div>
                    <div>
                      <span>ASSET</span>
                      <strong>{simulationResult.asset_id ? simulationResult.asset_id.slice(0, 8) : '—'}</strong>
                    </div>
                  </div>

                  <div className="console-section-title">DETECTED ALERTS</div>

                  {simulationResult.detection.alerts?.length ? (
                    <div className="simulation-alert-list">
                      {simulationResult.detection.alerts.map((alert, index) => (
                        <div className="simulation-alert" key={`${alert.rule_id}-${index}`}>
                          <div>
                            <strong>{alert.rule_id ?? 'UNKNOWN'}</strong>
                            <span>{alert.title ?? 'Unknown alert'}</span>
                          </div>
                          <div className="simulation-alert-meta">
                            <span className={`severity-badge ${(alert.severity ?? 'medium').toLowerCase()}`}>
                              {alert.severity ?? 'unknown'}
                            </span>
                            <span>{alert.status ?? 'unknown'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="console-empty">No alerts returned by the detection run.</div>
                  )}
                </>
              )}

              {!simulationLoading && !simulationError && simulationResult && (
                <div className="simulation-complete">
                  <span className="status-dot" />
                  <div>
                    <strong>Simulation complete</strong>
                    <span>Telemetry → Detection → Alert / Incident pipeline executed.</span>
                  </div>
                </div>
              )}
            </div>

            <div className="scenario-modal-footer">
              <span className="simulation-footer-note">
                Backend: AEGIS Scenario Engine
              </span>
              <button className="secondary-button" onClick={closeConsole} disabled={simulationLoading}>
                {simulationLoading ? 'Running…' : 'Close console'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div className="scenario-modal-backdrop" onClick={() => setSelected(null)}>
          <div className="scenario-modal" onClick={(e) => e.stopPropagation()}>
            <div className="scenario-modal-head">
              <div><span className="scenario-rule">{selected.id}</span><h2>{selected.name}</h2></div>
              <button className="modal-close" onClick={() => setSelected(null)}><X size={18} /></button>
            </div>
            <div className="simulation-banner compact">
              <FlaskConical size={16} />
              <span>Safe simulation only — no real attack, malware, email, registry, or web exploitation is performed.</span>
            </div>
            <div className="scenario-modal-grid">
              <div><span>Category</span><strong>{selected.category}</strong></div>
              <div><span>Type</span><strong>{selected.type === 'attack-chain' ? 'Attack Chain' : 'Atomic'}</strong></div>
              <div><span>Severity</span><strong className={`modal-severity ${selected.severity}`}>{selected.severity.toUpperCase()}</strong></div>
              <div><span>MITRE ATT&CK</span><strong>{selected.mitre}</strong></div>
            </div>
            <div className="scenario-modal-description"><span>Description</span><p>{selected.description}</p></div>
            <div className="scenario-modal-footer">
              <button className="secondary-button" onClick={() => setSelected(null)}>Close</button>
              <button className="primary-button" onClick={() => runScenario(selected)}>
                Run scenario <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ScenarioLibraryPage;
