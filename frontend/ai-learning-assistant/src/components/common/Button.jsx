import React from "react";
import styles from "./Button.module.css";

const Button = ({
  children,
  onClick,
  type = "button",
  disabled = false,
  className = "",
  variant = "primary",
  size = "md",
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={[
        styles.button,
        styles[variant],
        styles[size],
        className,
      ].filter(Boolean).join(" ")}
    >
      {children}
    </button>
  );
};

export default Button;
