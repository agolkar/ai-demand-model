import type { Params } from "../model/types";

interface SliderProps {
  label: string;
  param: keyof Params;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  help: string;
  onChange: (key: keyof Params, value: number) => void;
}

export function Slider({ label, param, value, min, max, step, unit, help, onChange }: SliderProps) {
  return (
    <label className="slider">
      <div className="slider-head">
        <span className="slider-label">
          {label}
          <span className="help" tabIndex={0} aria-label={help}>
            ?
            <span className="help-tip" role="tooltip">
              {help}
            </span>
          </span>
        </span>
        <span className="slider-value">
          {value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          {unit ? <span className="slider-unit"> {unit}</span> : null}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(param, parseFloat(e.target.value))}
      />
    </label>
  );
}
