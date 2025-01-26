import React from "react";

export const Textarea: React.FC<React.ComponentProps<"textarea">> = (props) => {
  return (
    <textarea
      {...props}
      style={{
        display: "flex",
        paddingTop: "0.5rem",
        paddingBottom: "0.5rem",
        paddingLeft: "0.75rem",
        paddingRight: "0.75rem",
        borderRadius: "0.375rem",
        border: "1px solid #d1d5db",
        width: "100%",
        fontSize: "0.875rem",
        lineHeight: "1.25rem",
      }}
    />
  );
};
