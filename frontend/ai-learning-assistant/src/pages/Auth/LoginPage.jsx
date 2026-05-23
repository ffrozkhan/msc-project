import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import { BrainCircuit, Mail, Lock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './Auth.module.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await authService.login(email, password);
      login(user, token);
      toast.success('Logged in successfully!');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to login. Please check your credentials.');
      toast.error(err.message || 'Failed to login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.dotPattern} />
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.logoWrap}>
              <BrainCircuit size={28} strokeWidth={2} />
            </div>
            <h1 className={styles.cardTitle}>Welcome back</h1>
            <p className={styles.cardSubtitle}>Sign in to continue your journey</p>
          </div>

          <div className={styles.fields}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Email</label>
              <div className={styles.inputWrap}>
                <div className={[styles.inputIcon, focusedField === 'email' ? styles.inputIconFocused : styles.inputIconDefault].join(' ')}>
                  <Mail size={20} strokeWidth={2} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className={styles.input}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Password</label>
              <div className={styles.inputWrap}>
                <div className={[styles.inputIcon, focusedField === 'password' ? styles.inputIconFocused : styles.inputIconDefault].join(' ')}>
                  <Lock size={20} strokeWidth={2} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className={styles.input}
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className={styles.error}>
                <p className={styles.errorText}>{error}</p>
              </div>
            )}

            <button onClick={handleSubmit} disabled={loading} className={styles.submitBtn}>
              <span className={styles.submitBtnInner}>
                {loading ? (
                  <><span className={styles.spinnerRing} /> Signing in...</>
                ) : (
                  <>Sign in <ArrowRight size={16} strokeWidth={2.5} /></>
                )}
              </span>
            </button>
          </div>

          <div className={styles.cardFooter}>
            <p className={styles.footerText}>
              Don't have an account?{' '}
              <Link to="/register" className={styles.footerLink}>Sign up</Link>
            </p>
          </div>
        </div>

        <p className={styles.legalText}>By continuing, you agree to our Terms & Privacy Policy</p>
      </div>
    </div>
  );
};

export default LoginPage;
