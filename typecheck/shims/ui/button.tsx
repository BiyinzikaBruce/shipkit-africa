import type { ComponentProps } from "react";
export const Button = ({ variant: _v, size: _s, ...p }: ComponentProps<"button"> & { variant?: "default" | "outline" | "destructive" | "ghost" | "secondary"; size?: "default" | "sm" | "lg" | "icon" }) => <button {...p} />;
