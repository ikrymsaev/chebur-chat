import { View, Context, state, useCtx, computed, effect } from "@helfy/helfy";

export type TThemeMode = "light" | "dark";

@Context
export class ThemeContext {
  @state mode: TThemeMode = "dark";

  @state toggle = () => {
    this.mode = this.mode === "dark" ? "light" : "dark";
  };

  @effect
  syncToDom() {
    document.documentElement.classList.toggle("dark", this.mode === "dark");
  }
}

@View
export class ThemeSync {
  @useCtx(ThemeContext)
  private theme!: ThemeContext;

  onMount() {
    document.documentElement.classList.toggle("dark", this.theme.mode === "dark");
  }

  render() {
    document.documentElement.classList.toggle("dark", this.theme.mode === "dark");
    return <span class="hidden" aria-hidden="true"></span>;
  }
}

@View
export class ThemeToggle {
  @useCtx(ThemeContext, "toggle")
  private toggle!: ThemeContext["toggle"];

  @useCtx(ThemeContext, "mode")
  private mode!: ThemeContext["mode"];

  render() {
    const isDark = this.mode === "dark";
    return (
      <button
        type="button"
        class="theme-toggle"
        onclick={this.toggle}
        title={isDark ? "Light theme" : "Dark theme"}
        aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      >
        {isDark ? (
          <span>Светлая</span>
        ) : (
          <span>Тёмная</span>
        )}
      </button>
    );
  }
}
