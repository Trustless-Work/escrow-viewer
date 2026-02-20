import { CheckCircle, Circle } from "lucide-react";

interface ProgressBarProps {
  value: number;
  label?: string;
  showPercentage?: boolean;
  showSteps?: boolean;
  steps?: number;
}

export const ProgressBar = ({
  value,
  label = "Progress",
  showPercentage = true,
  showSteps = false,
  steps = 4,
}: ProgressBarProps) => {
  const percentage = Math.round(value);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground font-medium">{label}</span>
        {showPercentage && (
          <span className="font-semibold text-primary">{percentage}%</span>
        )}
      </div>

      <div className="relative">
        {/* Base progress track */}
        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-700 ease-in-out"
            style={{ width: `${value}%` }}
          />
        </div>

        {/* Steps indicators (optional) */}
        {showSteps && (
          <div className="flex justify-between absolute -top-0 inset-x-0 px-1">
            {Array.from({ length: steps }).map((_, index) => {
              const stepPercentage = (index / (steps - 1)) * 100;
              const isCompleted = value >= stepPercentage;

              return (
                // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                <div key={index} className={"flex flex-col items-center -mt-3"}>
                  {isCompleted ? (
                    <CheckCircle
                      size={16}
                      className="text-primary bg-background rounded-full"
                    />
                  ) : (
                    <Circle
                      size={16}
                      className="text-muted-foreground bg-background rounded-full"
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
