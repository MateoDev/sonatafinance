import { LucideIcon } from "lucide-react";
import { 
  TrendingUp, 
  Briefcase, 
  Bitcoin, 
  Home,
  Wallet,
  HelpCircle
} from "lucide-react";

type AssetIconProps = {
  category: string;
  className?: string;
  size?: number;
}

export default function AssetIcon({ category, className = "", size = 16 }: AssetIconProps) {
  let Icon: LucideIcon;
  let bgColor: string;
  let iconColor: string;
  
  switch (category) {
    case "Stock":
      Icon = TrendingUp;
      bgColor = "bg-blue-100";
      iconColor = "text-blue-600";
      break;
    case "Bond":
      Icon = Briefcase;
      bgColor = "bg-green-100";
      iconColor = "text-green-600";
      break;
    case "Crypto":
      Icon = Bitcoin;
      bgColor = "bg-purple-100";
      iconColor = "text-purple-600";
      break;
    case "Real Estate":
      Icon = Home;
      bgColor = "bg-yellow-100";
      iconColor = "text-yellow-600";
      break;
    case "Cash":
      Icon = Wallet;
      bgColor = "bg-gray-100";
      iconColor = "text-gray-600";
      break;
    default:
      Icon = HelpCircle;
      bgColor = "bg-gray-100";
      iconColor = "text-gray-600";
  }
  
  return (
    <div className={`h-8 w-8 rounded-full ${bgColor} flex items-center justify-center ${iconColor} ${className}`}>
      <Icon size={size} />
    </div>
  );
}
