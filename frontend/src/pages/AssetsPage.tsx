import { useEffect, useState } from 'react';

interface Asset {
  id: string;
  hostname: string;
  ip_address: string | null;
  operating_system: string | null;
  asset_type: string;
  criticality: string;
  owner: string | null;
  status: string;
}

interface AssetForm {
  ip_address: string;
  operating_system: string;
  asset_type: string;
  criticality: string;
  owner: string;
  status: string;
}

const emptyForm: AssetForm = {
  ip_address: '',
  operating_system: '',
  asset_type: 'endpoint',
  criticality: 'medium',
  owner: '',
  status: 'active',
};

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<AssetForm>(emptyForm);
  const [error, setError] = useState('');

  async function loadAssets() {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        'http://127.0.0.1:8000/assets',
      );

      if (!response.ok) {
        throw new Error('Failed to load assets');
      }

      const data = await response.json();
      setAssets(data);
    } catch (error) {
      console.error('AEGIS ASSETS ERROR:', error);
      setError('Unable to load assets.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAssets();
  }, []);

  function updateField(
    field: keyof AssetForm,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function getHostnamePrefix(
    assetType: string,
    operatingSystem: string,
  ) {
    const os = operatingSystem.toLowerCase();

    if (os.includes('windows')) {
      return 'WIN';
    }

    if (
      os.includes('linux') ||
      os.includes('ubuntu') ||
      os.includes('debian') ||
      os.includes('kali')
    ) {
      return 'LNX';
    }

    if (
      os.includes('macos') ||
      os.includes('mac os') ||
      os.includes('darwin')
    ) {
      return 'MAC';
    }

    switch (assetType) {
      case 'server':
        return 'SRV';

      case 'network':
        return 'NET';

      case 'application':
        return 'APP';

      case 'endpoint':
      default:
        return 'END';
    }
  }

  function generateHostname() {
    const prefix = getHostnamePrefix(
      form.asset_type,
      form.operating_system,
    );

    const existingNumbers = assets
      .map((asset) => {
        const match = asset.hostname.match(
          new RegExp(`^AEGIS-${prefix}-(\\d+)$`),
        );

        return match ? Number(match[1]) : null;
      })
      .filter(
        (value): value is number =>
          value !== null,
      );

    const nextNumber =
      existingNumbers.length > 0
        ? Math.max(...existingNumbers) + 1
        : 1;

    return `AEGIS-${prefix}-${String(
      nextNumber,
    ).padStart(2, '0')}`;
  }

  async function registerAsset() {
    try {
      setSaving(true);
      setError('');

      const hostname = generateHostname();

      const payload = {
        hostname,
        ip_address:
          form.ip_address.trim() || null,
        operating_system:
          form.operating_system.trim() || null,
        asset_type: form.asset_type,
        criticality: form.criticality,
        owner: form.owner.trim() || null,
        status: form.status,
      };

      const response = await fetch(
        'http://127.0.0.1:8000/assets/auto-register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const message = await response.text();

        throw new Error(
          message || 'Failed to register asset',
        );
      }

      setForm(emptyForm);
      setShowForm(false);

      await loadAssets();
    } catch (error) {
      console.error(
        'AEGIS ASSET REGISTER ERROR:',
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : 'Unable to register asset.',
      );
    } finally {
      setSaving(false);
    }
  }

  const highCriticality = assets.filter(
    (asset) =>
      asset.criticality?.toLowerCase() ===
      'high',
  ).length;

  const activeAssets = assets.filter(
    (asset) =>
      asset.status?.toLowerCase() ===
      'active',
  ).length;

  const generatedHostname =
    generateHostname();

  return (
    <section className="page-content">
      <div className="page-header">
        <div>
          <div className="eyebrow">
            SOC OPERATIONS <span>•</span> ASSET MANAGEMENT
          </div>

          <h1>Assets</h1>

          <p>
            Monitor systems and endpoints registered with AEGIS.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => {
            setError('');
            setShowForm(
              (current) => !current,
            );
          }}
        >
          {showForm
            ? 'Cancel'
            : '+ Register Asset'}
        </button>
      </div>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {showForm && (
        <div className="table-card asset-form-card">
          <div className="table-header">
            <div>
              <h3>Register Asset</h3>

              <span>
                Add a system or endpoint to the
                AEGIS asset inventory.
              </span>
            </div>
          </div>

          <div className="asset-form-grid">
            <label>
              <span>Hostname</span>

              <div className="generated-hostname">
                {generatedHostname}
              </div>

              <small>
                Automatically assigned by AEGIS
              </small>
            </label>

            <label>
              <span>IP Address</span>

              <input
                value={form.ip_address}
                onChange={(event) =>
                  updateField(
                    'ip_address',
                    event.target.value,
                  )
                }
                placeholder="192.168.1.101"
              />
            </label>

            <label>
              <span>Operating System</span>

              <input
                value={form.operating_system}
                onChange={(event) =>
                  updateField(
                    'operating_system',
                    event.target.value,
                  )
                }
                placeholder="Windows 11"
              />

              <small>
                Used to generate the hostname
              </small>
            </label>

            <label>
              <span>Asset Type</span>

              <select
                value={form.asset_type}
                onChange={(event) =>
                  updateField(
                    'asset_type',
                    event.target.value,
                  )
                }
              >
                <option value="endpoint">
                  Endpoint
                </option>

                <option value="server">
                  Server
                </option>

                <option value="network">
                  Network
                </option>

                <option value="application">
                  Application
                </option>
              </select>
            </label>

            <label>
              <span>Criticality</span>

              <select
                value={form.criticality}
                onChange={(event) =>
                  updateField(
                    'criticality',
                    event.target.value,
                  )
                }
              >
                <option value="low">
                  Low
                </option>

                <option value="medium">
                  Medium
                </option>

                <option value="high">
                  High
                </option>

                <option value="critical">
                  Critical
                </option>
              </select>
            </label>

            <label>
              <span>Owner</span>

              <input
                value={form.owner}
                onChange={(event) =>
                  updateField(
                    'owner',
                    event.target.value,
                  )
                }
                placeholder="Security Operations"
              />
            </label>

            <label>
              <span>Status</span>

              <select
                value={form.status}
                onChange={(event) =>
                  updateField(
                    'status',
                    event.target.value,
                  )
                }
              >
                <option value="active">
                  Active
                </option>

                <option value="inactive">
                  Inactive
                </option>
              </select>
            </label>
          </div>

          <div className="asset-form-actions">
            <button
              className="primary-button"
              onClick={registerAsset}
              disabled={saving}
            >
              {saving
                ? 'Registering...'
                : 'Register Asset'}
            </button>
          </div>
        </div>
      )}

      <div className="metric-grid page-metrics">
        <div className="metric-card cyan">
          <div className="metric-top">
            <span>Total Assets</span>
          </div>

          <div className="metric-value">
            {loading
              ? '—'
              : assets.length}
          </div>

          <div className="metric-change">
            Live from AEGIS API
          </div>
        </div>

        <div className="metric-card warning">
          <div className="metric-top">
            <span>High Criticality</span>
          </div>

          <div className="metric-value">
            {highCriticality}
          </div>
        </div>

        <div className="metric-card green">
          <div className="metric-top">
            <span>Active</span>
          </div>

          <div className="metric-value">
            {activeAssets}
          </div>
        </div>
      </div>

      <div className="table-card page-table">
        <div className="table-header">
          <div>
            <h3>Asset Inventory</h3>

            <span>
              Systems currently known to AEGIS
            </span>
          </div>
        </div>

        <div className="page-table-scroll">
          {loading ? (
            <div className="empty-state">
              Loading assets...
            </div>
          ) : assets.length === 0 ? (
            <div className="empty-state">
              No assets available.
            </div>
          ) : (
            assets.map((asset) => (
              <div
                className="page-record"
                key={asset.id}
              >
                <div className="page-record-main">
                  <strong>
                    {asset.hostname}
                  </strong>

                  <span>
                    {asset.ip_address ||
                      'No IP address'}{' '}
                    •{' '}
                    {asset.operating_system ||
                      'OS not specified'}
                  </span>

                  <small>
                    {asset.asset_type} •{' '}
                    {asset.owner ||
                      'Owner not specified'}
                  </small>
                </div>

                <span
                  className={`table-badge ${asset.criticality.toLowerCase()}`}
                >
                  {asset.criticality}
                </span>

                <span
                  className={`table-badge ${asset.status.toLowerCase()}`}
                >
                  {asset.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}