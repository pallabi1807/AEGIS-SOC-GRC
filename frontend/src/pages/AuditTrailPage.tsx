import {
  ClipboardList,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import type { AuditLog } from '../api/dashboard';

interface AuditTrailPageProps {
  auditLogs: AuditLog[];
  loading: boolean;
  onRefresh: () => void;
}

function formatAction(action: string) {
  return action
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function shortId(value: string | null) {
  if (!value) {
    return '—';
  }

  if (value.length <= 22) {
    return value;
  }

  return `${value.slice(0, 12)}...${value.slice(-6)}`;
}

export default function AuditTrailPage({
  auditLogs,
  loading,
  onRefresh,
}: AuditTrailPageProps) {
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const actions = useMemo(
    () =>
      Array.from(
        new Set(
          auditLogs.map((log) => log.action),
        ),
      ),
    [auditLogs],
  );

  const entities = useMemo(
    () =>
      Array.from(
        new Set(
          auditLogs.map((log) => log.entity_type),
        ),
      ),
    [auditLogs],
  );

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchesAction =
        actionFilter === 'all' ||
        log.action === actionFilter;

      const matchesEntity =
        entityFilter === 'all' ||
        log.entity_type === entityFilter;

      return matchesAction && matchesEntity;
    });
  }, [
    auditLogs,
    actionFilter,
    entityFilter,
  ]);

  const trackedEntities = new Set(
    auditLogs.map(
      (log) =>
        `${log.entity_type}:${log.entity_id ?? 'none'}`,
    ),
  ).size;

  return (
    <section className="audit-page">
      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="audit-page-header">
        <div className="audit-header-content">
          <div className="audit-eyebrow">
            GOVERNANCE
            <span>•</span>
            SECURITY AUDIT
          </div>

          <h1 className="audit-title">
            Audit Trail
          </h1>

          <p className="audit-subtitle">
            Platform-wide history of security and GRC
            activity across AEGIS.
          </p>
        </div>

        <div className="audit-integrity-badge">
          <ShieldCheck size={17} />

          <div>
            <span className="audit-integrity-label">
              AUDIT REGISTER
            </span>

            <strong className="audit-integrity-value">
              Traceable Activity
            </strong>
          </div>
        </div>
      </div>

      {/* =====================================================
          SUMMARY
          ===================================================== */}

      <div className="audit-summary-grid">

        <div className="audit-summary-card">
          <div className="audit-summary-icon blue">
            <ClipboardList size={18} />
          </div>

          <div className="audit-summary-content">
            <span className="audit-summary-label">
              Total Events
            </span>

            <strong className="audit-summary-value">
              {auditLogs.length}
            </strong>
          </div>
        </div>

        <div className="audit-summary-card">
          <div className="audit-summary-icon cyan">
            <ShieldCheck size={18} />
          </div>

          <div className="audit-summary-content">
            <span className="audit-summary-label">
              Entities Tracked
            </span>

            <strong className="audit-summary-value">
              {trackedEntities}
            </strong>
          </div>
        </div>

        <div className="audit-summary-card">
          <div className="audit-summary-icon green">
            <ClipboardList size={18} />
          </div>

          <div className="audit-summary-content">
            <span className="audit-summary-label">
              Visible Events
            </span>

            <strong className="audit-summary-value">
              {filteredLogs.length}
            </strong>
          </div>
        </div>

      </div>

      {/* =====================================================
          ACTIVITY REGISTER
          ===================================================== */}

      <div className="audit-panel">

        <div className="audit-panel-header">
          <div>
            <h3 className="audit-panel-title">
              Activity Register
            </h3>

            <span className="audit-panel-subtitle">
              Immutable-style operational history recorded
              by backend workflows.
            </span>
          </div>
        </div>

        {/* Toolbar */}

        <div className="audit-toolbar">

          <button
            type="button"
            className="audit-refresh-button"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw
              size={13}
              className={
                loading
                  ? 'audit-spin'
                  : ''
              }
            />

            {loading ? 'Refreshing...' : 'Refresh'}
          </button>

          <div className="audit-toolbar-filters">

            <select
              className="audit-filter"
              value={actionFilter}
              onChange={(event) =>
                setActionFilter(event.target.value)
              }
            >
              <option value="all">
                All actions
              </option>

              {actions.map((action) => (
                <option
                  key={action}
                  value={action}
                >
                  {formatAction(action)}
                </option>
              ))}
            </select>

            <select
              className="audit-filter"
              value={entityFilter}
              onChange={(event) =>
                setEntityFilter(event.target.value)
              }
            >
              <option value="all">
                All entities
              </option>

              {entities.map((entity) => (
                <option
                  key={entity}
                  value={entity}
                >
                  {entity}
                </option>
              ))}
            </select>

          </div>
        </div>

        {/* Register */}

        <div className="audit-table-scroll">

          {loading && auditLogs.length === 0 ? (
            <div className="audit-empty-state">
              <div className="audit-loading-spinner" />

              <strong>
                Loading audit activity...
              </strong>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="audit-empty-state">
              <ClipboardList size={28} />

              <strong>
                No audit activity found
              </strong>

              <span>
                Try changing the selected filters.
              </span>
            </div>
          ) : (
            <table className="audit-table">

              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Source</th>
                  <th />
                </tr>
              </thead>

              <tbody>

                {filteredLogs.map((log) => {
                  const expanded =
                    expandedId === log.id;

                  return (
                    <AuditRecord
                      key={log.id}
                      log={log}
                      expanded={expanded}
                      onToggle={() =>
                        setExpandedId(
                          expanded
                            ? null
                            : log.id,
                        )
                      }
                    />
                  );
                })}

              </tbody>

            </table>
          )}

        </div>
      </div>
    </section>
  );
}

/* =========================================================
   AUDIT RECORD
   ========================================================= */

function AuditRecord({
  log,
  expanded,
  onToggle,
}: {
  log: AuditLog;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr className="audit-record">

        <td className="audit-timestamp">
          {formatDateTime(log.timestamp)}
        </td>

        <td className="audit-actor">
          {log.actor}
        </td>

        <td>
          <span className="audit-action-badge">
            {formatAction(log.action)}
          </span>
        </td>

        <td className="audit-entity">
          <span>{log.entity_type}</span>

          {log.entity_id && (
            <small>
              {shortId(log.entity_id)}
            </small>
          )}
        </td>

        <td className="audit-source">
          {log.source}
        </td>

        <td className="audit-expand-cell">
          <button
            type="button"
            className="audit-expand-button"
            onClick={onToggle}
            aria-expanded={expanded}
            aria-label={
              expanded
                ? 'Collapse audit record'
                : 'Expand audit record'
            }
          >
            {expanded ? (
              <ChevronUp size={14} />
            ) : (
              <ChevronDown size={14} />
            )}
          </button>
        </td>

      </tr>

      {expanded && (
        <tr className="audit-detail-row">
          <td colSpan={6}>
            <div className="audit-details">

              <div className="audit-detail-grid">

                <div className="audit-detail-item full">
                  <span>
                    Description
                  </span>

                  <strong>
                    {log.description}
                  </strong>
                </div>

                <div className="audit-detail-item">
                  <span>
                    Entity ID
                  </span>

                  <strong className="audit-mono">
                    {log.entity_id ?? '—'}
                  </strong>
                </div>

                <div className="audit-detail-item">
                  <span>
                    Source
                  </span>

                  <strong>
                    {log.source}
                  </strong>
                </div>

                <div className="audit-detail-item">
                  <span>
                    Previous Value
                  </span>

                  <strong className="audit-mono">
                    {log.old_value ?? '—'}
                  </strong>
                </div>

                <div className="audit-detail-item">
                  <span>
                    New Value
                  </span>

                  <strong className="audit-mono">
                    {log.new_value ?? '—'}
                  </strong>
                </div>

              </div>

            </div>
          </td>
        </tr>
      )}
    </>
  );
}