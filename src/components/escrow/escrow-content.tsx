import { motion, AnimatePresence } from "framer-motion"
import type { OrganizedEscrowData } from "@/mappers/escrow-mapper";
import { staggerContainer } from "@/utils/animations/animation-variants"
import { LoadingLogo } from "@/components/shared/loading-logo"
import { TitleCard } from "@/components/escrow/title-card"
import { TabView } from "@/components/escrow/tab-view"
import { DesktopView } from "@/components/escrow/desktop-view"
import { WelcomeState } from "@/components/escrow/welcome-state"
import { useNetwork } from "@/contexts/NetworkContext";


interface EscrowContentProps {
	loading: boolean;
	organized: OrganizedEscrowData | null;
	isMobile: boolean;
}

export const EscrowContent = ({
	loading,
	organized,
	isMobile,
}: EscrowContentProps) => {
	const { currentNetwork } = useNetwork(); // Get network from context

	return (
		<div className="flex flex-col items-center">
			{/* Loading state */}
			<AnimatePresence>
				{loading && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="py-10 flex justify-center"
					>
						<LoadingLogo loading={true} />
					</motion.div>
				)}
			</AnimatePresence>

			{/* Data display */}
			<AnimatePresence>
				{organized && !loading && (
					<motion.div
						initial="hidden"
						animate="visible"
						variants={staggerContainer}
						className="w-full max-w-5xl"
					>
						{/* Title Card */}
						<TitleCard
							title={typeof organized.title === "string" ? organized.title : ""}
							description={
								typeof organized.description === "string"
									? organized.description
									: ""
							}
							progress={organized.progress}
							escrowType={organized.escrowType}
						/>

						{/* Mobile view: Use tabs for compact display */}
						{isMobile && <TabView organized={organized} network={currentNetwork}/>}

						{/* Desktop view: Show all sections at once */}
						{!isMobile && <DesktopView organized={organized} network={currentNetwork}/>}
					</motion.div>
				)}
			</AnimatePresence>

			{/* No data state */}
			<WelcomeState showWelcome={!organized && !loading} network={currentNetwork} />
		</div>
	)
}
