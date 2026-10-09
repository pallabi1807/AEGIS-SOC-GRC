import { useState } from 'react';
import {
  Eye,
  EyeOff,
  ShieldCheck,
} from 'lucide-react';

interface LoginPageProps {
  onLogin: (username: string, password: string) => Promise<void>;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setError('');
    setLoading(true);

    try {
      await onLogin(username, password);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Login failed',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-logo">
            <ShieldCheck size={30} />
          </div>

          <h1>AEGIS SOC-GRC</h1>
          <p>Security Operations & Governance Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">

          {/* Username */}
          <div className="form-group">
            <label>Username</label>

            <input
              type="text"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              placeholder="Enter username"
              autoComplete="username"
              required
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label>Password</label>

            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Enter password"
                autoComplete="current-password"
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword((current) => !current)
                }
                aria-label={
                  showPassword
                    ? 'Hide password'
                    : 'Show password'
                }
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          {/* Login */}
          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

        </form>

        <div className="login-footer">
          Authorized AEGIS users only
        </div>
      </div>
    </div>
  );
}