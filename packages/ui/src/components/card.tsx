import React from "react";

interface CardProps {
  children: React.ReactNode;
  title?: string;
}

export const Card: React.FC<CardProps> = ({ children, title }) => {
  return (
    <div
      style={{
        padding: "1rem",
        borderRadius: "0.5rem",
        border: "1px solid #d1d5db",
        boxShadow:
          "0 0 0 1px rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        marginLeft: "auto",
        marginRight: "auto",
      }}
    >
      {title && (
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            lineHeight: "2rem",
            marginBottom: "1rem",
            marginTop: 0,
          }}
        >
          {title}
        </h1>
      )}
      {children}
    </div>
  );
};
