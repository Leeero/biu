import { ExhibitSection } from "./showcase";

const colors = [
  ["canvas", "--biu-4188-canvas"],
  ["surface", "--biu-4188-surface"],
  ["elevated", "--biu-4188-surface-elevated"],
  ["hover", "--biu-4188-surface-hover"],
  ["action", "--biu-4188-action"],
  ["playback", "--biu-4188-playback"],
  ["success", "--biu-4188-success"],
  ["warning", "--biu-4188-warning"],
  ["error", "--biu-4188-error"],
] as const;

export const Tokens4188Exhibit = () => (
  <ExhibitSection title="4188 设计令牌" note="颜色、几何、字体和动效均引用阶段 1 锁定的语义令牌；组件不得直接写色值。">
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      {colors.map(([name, token]) => (
        <div
          key={name}
          className="overflow-hidden rounded-[var(--biu-4188-radius-card)] border border-[var(--biu-4188-border)] bg-[var(--biu-4188-surface)]"
        >
          <div className="h-20" style={{ background: `var(${token})` }} />
          <div className="px-3 py-2">
            <p className="m-0 text-[length:var(--biu-4188-type-body-size)] font-medium text-[var(--biu-4188-text-primary)]">
              {name}
            </p>
            <code className="text-[length:var(--biu-4188-type-eyebrow-size)] text-[var(--biu-4188-text-muted)]">
              {token}
            </code>
          </div>
        </div>
      ))}
    </div>
  </ExhibitSection>
);
