import { useEffect, useMemo, useState } from 'react';
import type { Alert, Incident } from '../api/dashboard';

interface ThreatIntelligencePageProps {
  alerts: Alert[];
  incidents: Incident[];
}

interface EnrichmentIOC {
  type: string;
  value: string;
}

interface IncidentEnrichment {
  iocs?: EnrichmentIOC[];
}

interface IndicatorRecord {
  value: string;
  type: string;
  incidents: string[];
  occurrences: number;
}

export default function ThreatIntelligencePage({
  alerts,
  incidents,
}: ThreatIntelligencePageProps) {
  const [indicatorRecords, setIndicatorRecords] = useState<
    IndicatorRecord[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadThreatIntelligence() {
      setLoading(true);

      const indicatorMap = new Map<
        string,
        {
          type: string;
          incidents: Set<string>;
          occurrences: number;
        }
      >();

      await Promise.all(
        incidents.map(async (incident) => {
          try {
            const response = await fetch(
              `http://127.0.0.1:8000/incidents/${incident.id}/enrichment`,
            );

            if (!response.ok) {
              return;
            }

            const enrichment: IncidentEnrichment =
              await response.json();

            for (const ioc of enrichment.iocs ?? []) {
              if (
                ioc.type !== 'ipv4' &&
                ioc.type !== 'url'
              ) {
                continue;
              }

              const key = `${ioc.type}:${ioc.value}`;

              const existing = indicatorMap.get(key);

              if (existing) {
                existing.incidents.add(
                  incident.incident_number,
                );
                existing.occurrences += 1;
              } else {
                indicatorMap.set(key, {
                  type: ioc.type,
                  incidents: new Set([
                    incident.incident_number,
                  ]),
                  occurrences: 1,
                });
              }
            }
          } catch (error) {
            console.error(
              `AEGIS THREAT INTELLIGENCE ERROR for ${incident.incident_number}:`,
              error,
            );
          }
        }),
      );

      if (!cancelled) {
        const records: IndicatorRecord[] =
          Array.from(indicatorMap.entries())
            .map(([key, record]) => ({
              value: key.substring(
                record.type.length + 1,
              ),
              type: record.type,
              incidents: Array.from(
                record.incidents,
              ).sort(),
              occurrences: record.occurrences,
            }))
            .sort((a, b) => {
              if (b.incidents.length !== a.incidents.length) {
                return (
                  b.incidents.length -
                  a.incidents.length
                );
              }

              return a.value.localeCompare(
                b.value,
              );
            });

        setIndicatorRecords(records);
        setLoading(false);
      }
    }

    loadThreatIntelligence();

    return () => {
      cancelled = true;
    };
  }, [incidents]);

  const observedIPs = useMemo(
    () =>
      indicatorRecords.filter(
        (indicator) =>
          indicator.type === 'ipv4',
      ),
    [indicatorRecords],
  );

  const observedURLs = useMemo(
    () =>
      indicatorRecords.filter(
        (indicator) =>
          indicator.type === 'url',
      ),
    [indicatorRecords],
  );

  const relatedIncidents = useMemo(
    () =>
      new Set(
        indicatorRecords.flatMap(
          (indicator) =>
            indicator.incidents,
        ),
      ).size,
    [indicatorRecords],
  );

  const observedUsers = useMemo(
    () =>
      new Set(
        alerts
          .map((alert) => alert.username)
          .filter(Boolean),
      ).size,
    [alerts],
  );

  return (
    <section className="page-content">
      <div className="page-header">
        <div>
          <div className="eyebrow">
            SOC OPERATIONS <span>•</span> INTELLIGENCE
          </div>

          <h1>Threat Intelligence</h1>

          <p>
            Observed indicators derived from AEGIS
            incident enrichment and security activity.
          </p>
        </div>
      </div>

      <div className="metric-grid page-metrics">
        <div className="metric-card warning">
          <div className="metric-top">
            <span>Observed IPs</span>
          </div>

          <div className="metric-value">
            {loading ? '—' : observedIPs.length}
          </div>
        </div>

        <div className="metric-card cyan">
          <div className="metric-top">
            <span>Observed URLs</span>
          </div>

          <div className="metric-value">
            {loading ? '—' : observedURLs.length}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span>Total IOCs</span>
          </div>

          <div className="metric-value">
            {loading
              ? '—'
              : indicatorRecords.length}
          </div>
        </div>

        <div className="metric-card teal">
          <div className="metric-top">
            <span>Related Incidents</span>
          </div>

          <div className="metric-value">
            {loading ? '—' : relatedIncidents}
          </div>
        </div>
      </div>

      <div className="table-card page-table">
        <div className="table-header">
          <div>
            <h3>Observed Indicators</h3>

            <span>
              Indicators observed through AEGIS
              incident enrichment
            </span>
          </div>

          <span className="live-badge">
            <span />
            LOCAL INTELLIGENCE
          </span>
        </div>

        <div className="page-table-scroll">
          {loading ? (
            <div className="empty-state">
              Loading observed indicators...
            </div>
          ) : indicatorRecords.length === 0 ? (
            <div className="empty-state">
              No enriched indicators available.
            </div>
          ) : (
            indicatorRecords.map((indicator) => (
              <div
                className="page-record"
                key={`${indicator.type}:${indicator.value}`}
              >
                <div className="page-record-main">
                  <strong>
                    {indicator.value}
                  </strong>

                  <span>
                    {indicator.type === 'ipv4'
                      ? 'IPv4 indicator'
                      : 'URL indicator'}
                    {' • '}
                    Observed in{' '}
                    {indicator.incidents.length}{' '}
                    {indicator.incidents.length === 1
                      ? 'incident'
                      : 'incidents'}
                    {' • '}
                    {indicator.occurrences}{' '}
                    {indicator.occurrences === 1
                      ? 'occurrence'
                      : 'occurrences'}
                  </span>

                  <span>
                    {indicator.incidents.join(
                      ' • ',
                    )}
                  </span>
                </div>

                <span className="table-badge cyan">
                  Observed
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="table-card page-table">
        <div className="table-header">
          <div>
            <h3>Alert Context</h3>

            <span>
              User identities observed in the alert
              stream
            </span>
          </div>
        </div>

        <div className="page-table-scroll">
          {observedUsers === 0 ? (
            <div className="empty-state">
              No user indicators available.
            </div>
          ) : (
            <div className="page-record">
              <div className="page-record-main">
                <strong>
                  {observedUsers}
                </strong>

                <span>
                  Unique users observed in AEGIS
                  alerts
                </span>
              </div>

              <span className="table-badge cyan">
                Observed
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}