import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const RADIUS_OPTIONS = [
  { value: "5", label: "5 km" },
  { value: "10", label: "10 km" },
  { value: "15", label: "15 km" },
] as const;

export type RadiusKm = 5 | 10 | 15;

interface RadiusFilterProps {
  value: RadiusKm;
  onChange: (radius: RadiusKm) => void;
}

export function RadiusFilter({ value, onChange }: RadiusFilterProps) {
  function handleChange(raw: string) {
    const parsed = parseInt(raw, 10) as RadiusKm;
    if ([5, 10, 15].includes(parsed)) {
      onChange(parsed);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground text-sm">Search radius:</span>
      <ToggleGroup
        type="single"
        value={String(value)}
        onValueChange={handleChange}
      >
        {RADIUS_OPTIONS.map(({ value: v, label }) => (
          <ToggleGroupItem key={v} value={v} aria-label={`${label} radius`}>
            {label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
