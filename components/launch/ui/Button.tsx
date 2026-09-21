import type { ElementType, ComponentPropsWithoutRef, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold text-center leading-tight transition-[background-color,color,transform,box-shadow] duration-200 select-none " +
  "disabled:cursor-not-allowed disabled:opacity-60 active:translate-y-px";

const variants: Record<Variant, string> = {
  primary:
    "bg-signal-500 text-ink-950 shadow-[0_8px_30px_-10px_rgb(90_200_255/0.55)] " +
    "hover:bg-signal-400 hover:shadow-[0_12px_36px_-10px_rgb(90_200_255/0.7)]",
  secondary:
    "border border-ink-600 bg-ink-900/40 text-ink-100 hover:border-ink-400 hover:bg-ink-800",
  ghost: "text-ink-200 hover:text-white hover:bg-white/5",
};

const sizes: Record<Size, string> = {
  sm: "min-h-10 px-4 text-sm",
  md: "min-h-12 px-6 text-base",
  lg: "min-h-14 px-8 text-base sm:text-lg",
};

type ButtonProps<T extends ElementType> = {
  as?: T;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className" | "children">;

/**
 * Botão polimórfico: `<Button>` vira <button>; `<Button as="a" href=...>`
 * ou `<Button as={Link} href=...>` vira um link com a mesma aparência.
 * Área de toque mínima de 44px em todos os tamanhos.
 */
export function Button<T extends ElementType = "button">({
  as,
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}: ButtonProps<T>) {
  const Component = (as ?? "button") as ElementType;
  const typeProp = Component === "button" && !("type" in rest) ? { type: "button" } : {};

  return (
    <Component
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...typeProp}
      {...rest}
    >
      {children}
    </Component>
  );
}
