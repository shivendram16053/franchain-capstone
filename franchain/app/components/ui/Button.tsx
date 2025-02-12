import React from "react";
import clsx from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost" | "outline";
  className?: string;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ variant = "default", className, children, ...props }) => {
  const baseStyles = "px-6 py-2 rounded-2xl font-medium transition-all";
  const variants = {
    default: "bg-[#00D1FF] hover:bg-[#00BFE0] text-black shadow-md",
    ghost: "bg-transparent hover:bg-[#1D2B64] text-[#A9B7C6]",
    outline: "border border-[#00D1FF] text-[#00D1FF] hover:bg-[#00D1FF] hover:text-black",
  };

  return (
    <button
      className={clsx(baseStyles, variants[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
