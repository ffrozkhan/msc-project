import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import authService from "../../services/authService";
import { BrainCircuit, Mail, Lock, ArrowRight, User } from "lucide-react";
import toast from "react-hot-toast";
import styles from "./Auth.module.css";

const RegisterPage = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await authService.register(username, email, password);
      toast.success("Registration successful! Please Login.");
      navigate("/login");
    } catch (err) {
      setError(err.message || "Failed to register. Please try again.");
      toast.error(err.message || "Failed to register.");
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
            <h1 className={styles.cardTitle}>Create an account</h1>
            <p className={styles.cardSubtitle}>Start your AI-powered learning experience</p>
          </div>

          <div className={styles.fields}>
            {[
              { id: 'username', label: 'Username', type: 'text', icon: User, value: username, setter: setUsername, placeholder: 'yourusername' },
              { id: 'email', label: 'Email', type: 'email', icon: Mail, value: email, setter: setEmail, placeholder: 'you@example.com' },
              { id: 'password', label: 'Password', type: 'password', icon: Lock, value: password, setter: setPassword, placeholder: '••••••••' },
            ].map(({ id, label, type, icon: Icon, value, setter, placeholder }) => (
              <div key={id} className={styles.fieldGroup}>
                <label className={styles.label}>{label}</label>
                <div className={styles.inputWrap}>
                  <div className={[styles.inputIcon, focusedField === id ? styles.inputIconFocused : styles.inputIconDefault].join(' ')}>
                    <Icon size={20} strokeWidth={2} />
                  </div>
                  <input
                    type={type}
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    onFocus={() => setFocusedField(id)}
                    onBlur={() => setFocusedField(null)}
                    className={styles.input}
                    placeholder={placeholder}
                  />
                </div>
              </div>
            ))}

            {error && (
              <div className={styles.error}>
                <p className={styles.errorText}>{error}</p>
              </div>
            )}

            <button onClick={handleSubmit} disabled={loading} className={styles.submitBtn}>
              <span className={styles.submitBtnInner}>
                {loading ? (
                  <><span className={styles.spinnerRing} /> Creating account...</>
                ) : (
                  <>Create account <ArrowRight size={16} strokeWidth={2.5} /></>
                )}
              </span>
            </button>
          </div>

          <div className={styles.cardFooter}>
            <p className={styles.footerText}>
              Already have an account?{" "}
              <Link to="/login" className={styles.footerLink}>Sign in</Link>
            </p>
          </div>
        </div>

        <p className={styles.legalText}>By continuing, you agree to our Terms & Privacy Policy</p>
      </div>
    </div>
  );
};

export default RegisterPage;
