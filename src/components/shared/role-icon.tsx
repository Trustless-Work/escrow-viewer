import { ROLE_ICONS } from '@/lib/escrow-constants';

interface RoleIconProps {
  title: keyof typeof ROLE_ICONS;
}

const RoleIcon: React.FC<RoleIconProps> = ({ title }) => {
  const { icon: IconComponent, color } = ROLE_ICONS[title] || { icon: null, color: "text-black" };

  if (!IconComponent) return null; // Handle case where role is not found

  return (
    <div className={`icon ${color}`}>
      <IconComponent className="w-5 h-5"/>
    </div>
  );
};

export default RoleIcon;