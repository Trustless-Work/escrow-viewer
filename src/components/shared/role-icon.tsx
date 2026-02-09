import { ROLE_ICONS } from "@/lib/escrow-constants";
import type { ComponentType, SVGProps } from "react";

interface RoleIconProps {
  title: string;
  className?: string;
}

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

export const RoleIcon: React.FC<RoleIconProps> = ({
  title,
  className = "w-5 h-5",
}) => {
  const roleData = (
    ROLE_ICONS as Record<string, { icon: IconType; color: string }>
  )[title];

  if (!roleData) {
    const FallbackIcon = ROLE_ICONS["Service Provider"].icon;
    return (
      <div className="text-muted-foreground">
        <FallbackIcon className={className} />
      </div>
    );
  }

  const { icon: IconComponent, color } = roleData;

  return (
    <div className={color}>
      <IconComponent className={className} />
    </div>
  );
};

export default RoleIcon;
