"use client";

import React from "react";

export default function ConfirmForm({
  action,
  method = "post",
  confirmText,
  children,
  style,
  className,
}: {
  action: string;
  method?: "post" | "get";
  confirmText: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <form
      action={action}
      method={method}
      style={style}
      className={className}
      onSubmit={(e) => {
        if (!confirm(confirmText)) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      {children}
    </form>
  );
}
