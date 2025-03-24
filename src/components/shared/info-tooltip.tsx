import { InfoIcon } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface InfoTooltipProps {
  content: string;
  className?: string;
}

export const InfoTooltip = ({ content, className = "" }: InfoTooltipProps) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <InfoIcon 
        size={17} 
        className={`text-gray-500 hover:text-blue-600 cursor-help transition-colors ${className}`} 
      />
    </TooltipTrigger>
    <TooltipContent className="max-w-sm text-sm">
      <p>{content}</p>
    </TooltipContent>
  </Tooltip>
)