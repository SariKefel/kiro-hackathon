"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button
      type="button"
      aria-label="Toggle light and dark theme"
      title="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="flex size-10 items-center justify-center rounded-lg hover:bg-secondary"
    >
      <Sun className="hidden size-[18px] dark:block" />
      <Moon className="size-[18px] dark:hidden" />
    </button>
  );
}
