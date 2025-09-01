import React from "react";

type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
  ariaLabel?: string;
};

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  type = "button",
  className = "",
  ariaLabel,
}) => (
  <button
    type={type}
    onClick={onClick}
    className={`px-6 py-2 rounded-lg font-semibold transition-colors bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 ${className}`}
    aria-label={ariaLabel}
  >
    {children}
  </button>
);