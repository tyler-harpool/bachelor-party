import React from "react";

export const Button: React.FC<React.ComponentProps<"button">> = (props) => {
  return (
    <button
      {...props}
      style={{
        display: "flex",
        margin: "1rem auto",
        padding: "0.5rem 1rem",
        gap: "0.5rem",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: "0.375rem",
        height: "2.5rem",
        fontSize: "0.875rem",
        lineHeight: "1.25rem",
        fontWeight: 500,
        whiteSpace: "nowrap",
        transitionProperty:
          "color, background-color, border-color, text-decoration-color, fill, stroke",
        transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
        transitionDuration: "300ms",
      }}
    />
  );
};
