import React, { useState, useEffect } from "react";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/common/Button";
import Spinner from "../../components/common/Spinner";
import authService from "../../services/authService";
import toast from "react-hot-toast";
import { User, Mail, Lock } from "lucide-react";
import styles from "./ProfilePage.module.css";

const ProfilePage = () => {
  const [loading, setLoading] = useState(true);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await authService.getProfile();
        setUsername(data.username);
        setEmail(data.email);
      } catch {
        toast.error("Failed to fetch profile data.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) { toast.error("New passwords do not match."); return; }
    if (newPassword.length < 6) { toast.error("New password must be at least 6 characters long."); return; }
    setPasswordLoading(true);
    try {
      await authService.changePassword({ currentPassword, newPassword });
      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (error) {
      toast.error(error.message || "Failed to change password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className={styles.page}>
      <PageHeader title="Profile Settings" />
      <div className={styles.sections}>
        {/* User Info */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>User Information</h3>
          <div className={styles.fields}>
            {[
              { label: 'Username', value: username, icon: User },
              { label: 'Email Address', value: email, icon: Mail },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className={styles.fieldGroup}>
                <label className={styles.label}>{label}</label>
                <div className={styles.inputWrap}>
                  <div className={styles.inputIcon}><Icon size={16} /></div>
                  <div className={styles.displayField}>{value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Change Password */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Change Password</h3>
          <form onSubmit={handleChangePassword} className={styles.fields}>
            {[
              { label: 'Current Password', value: currentPassword, setter: setCurrentPassword },
              { label: 'New Password', value: newPassword, setter: setNewPassword },
              { label: 'Confirm New Password', value: confirmNewPassword, setter: setConfirmNewPassword },
            ].map(({ label, value, setter }) => (
              <div key={label} className={styles.fieldGroup}>
                <label className={styles.label}>{label}</label>
                <div className={styles.inputWrap}>
                  <div className={styles.inputIcon}><Lock size={16} /></div>
                  <input
                    type="password"
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    required
                    className={styles.input}
                  />
                </div>
              </div>
            ))}
            <div className={styles.formFooter}>
              <Button type="submit" disabled={passwordLoading}>
                {passwordLoading ? "Changing..." : "Change Password"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
