"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:glass-strong group-[.toaster]:text-foreground group-[.toaster]:border-white/45 rounded-xl",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
