import { useMemo, useState } from 'react';
import { FiArrowRight, FiLock, FiMail, FiMap, FiShield } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import './MainPage.css';

type LoginFormState = {
  email: string;
  password: string;
  remember: boolean;
};

const initialForm: LoginFormState = {
  email: 'driver@roadsafe.ai',
  password: '12345678',
  remember: true,
};

const MainPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<LoginFormState>(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    return form.email.trim().length > 3 && form.password.trim().length >= 6;
  }, [form.email, form.password]);

  const handleChange = (field: keyof LoginFormState, value: string | boolean) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    setIsSubmitting(true);

    const now = new Date().toISOString();
    const mockUser = {
      user_id: 12,
      email: form.email,
      nickname: 'Alex',
      skill_level: Number(localStorage.getItem('survey_skill_level') ?? '0'),
      vulnerability_type_id: Number(localStorage.getItem('survey_primary_vulnerability_type_id') ?? '0') || null,
      created_at: localStorage.getItem('mock_user_created_at') ?? now,
      updated_at: now,
    };

    window.setTimeout(() => {
      localStorage.setItem('mock_access_token', 'local-demo-token');
      localStorage.setItem('mock_user_created_at', mockUser.created_at);
      localStorage.setItem('mock_user', JSON.stringify(mockUser));
      localStorage.setItem(
        'mock_session',
        JSON.stringify({
          remember: form.remember,
          logged_in_at: now,
        }),
      );

      setIsSubmitting(false);
      navigate('/survey');
    }, 500);
  };

  return (
    <div className="login-page">
      <header className="login-topbar">
        <div className="brand-lockup">
          <div className="brand-mark">
            <FiMap />
          </div>
          <div>
            <div className="brand-title">RoadEase</div>
            <div className="brand-subtitle">Difficulty Intelligence</div>
          </div>
        </div>
        <button type="button" className="help-chip">
          Help Center
        </button>
      </header>

      <main className="login-shell">
        <section className="login-panel">
          <div className="login-hero" aria-hidden="true">
            <div className="hero-grid" />
            <div className="hero-copy">
              <span className="hero-badge">
                <FiShield />
                Safe routing preview
              </span>
              <h1>Welcome Back</h1>
              <p>실시간 도로 난이도와 취약 특성을 고려한 안전 경로 탐색을 시작해보세요.</p>
            </div>
          </div>

          <form className="login-card" onSubmit={handleSubmit}>
            <div className="login-copy">
              <h2>Sign In</h2>
              <p>로컬 데모 로그인입니다. 입력값은 프론트에만 저장됩니다.</p>
            </div>

            <label className="field">
              <span>Email Address</span>
              <div className="field-input">
                <FiMail />
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={form.email}
                  onChange={(event) => handleChange('email', event.target.value)}
                />
              </div>
            </label>

            <label className="field">
              <div className="field-label-row">
                <span>Password</span>
                <button type="button" className="text-link">
                  Forgot?
                </button>
              </div>
              <div className="field-input">
                <FiLock />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="8자 이상 입력"
                  value={form.password}
                  onChange={(event) => handleChange('password', event.target.value)}
                />
                <button
                  type="button"
                  className="toggle-visibility"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>

            <label className="remember-row">
              <input
                type="checkbox"
                checked={form.remember}
                onChange={(event) => handleChange('remember', event.target.checked)}
              />
              <span>Remember this device</span>
            </label>

            <button type="submit" className="primary-button" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? 'Signing In...' : 'Sign In'}
              {!isSubmitting && <FiArrowRight />}
            </button>

            <div className="divider">
              <span>OR</span>
            </div>

            <button type="button" className="secondary-button">
              <span className="google-dot">G</span>
              Continue with Google
            </button>

            <p className="login-footnote">
              계정이 없더라도 데모용으로 바로 진행할 수 있습니다. 로그인 후 설문으로 이동합니다.
            </p>
          </form>
        </section>
      </main>
    </div>
  );
};

export default MainPage;
