/* eslint-disable @typescript-eslint/no-explicit-any */
import {
	ShieldCheck,
	Wrench,
	FileSignature,
	Scale,
	Server,
	User,
} from "lucide-react";

//? Mapping contract fields to human-readable role names
export const ROLE_MAPPING: { [key: string]: string } = {
	"Milestone Approver": "Milestone Approver",
	approver: "Milestone Approver",
	service_provider: "Service Provider",
	"Release Signer": "Release Signer",
	release_signer: "Release Signer",
	"Dispute Resolver": "Dispute Resolver",
	dispute_resolver: "Dispute Resolver",
	"Platform Address": "Platform Address",
	platform_address: "Platform Address",
	receiver: "Receiver",
};

//? Permissions based on roles
export const ROLE_PERMISSIONS: { [key: string]: string } = {
	"Milestone Approver": "Approves or disputes milestones marked as completed.",
	"Service Provider": "Delivers the product, service, or objective set on the milestone. Marks milestones as completed and ready for approval.",
	"Release Signer": "Approves the release of funds for the amount set.",
	"Dispute Resolver": "Resolves disputes by adjusting milestone amounts, updating status, or canceling the contract.",
	"Platform Address": "An address designated to receive the platform fee.",
	Receiver: "The final recipient of funds after conditions are met or disputes are resolved.",
}

//? Field tooltips
export const FIELD_TOOLTIPS: { [key: string]: string } = {
	escrow_id: "Unique contract address where funds are held.",
	balance: "Current amount of funds held in escrow.",
	amount: "Expected total amount to be held in escrow.",
	platform_fee: "Fee charged by the platform, deducted from escrow amount.",
	engagement_id: "External reference ID (e.g., invoice, order, project ID).",
	dispute_flag: "Set to true if a dispute is raised.",
	release_flag: "Set to true when funds have been released.",
	resolved_flag: "Set to true when the dispute resolver takes action.",
	milestone_title: "Name of the milestone.",
	milestone_description: "Details of the milestone's deliverable.",
	milestone_status: "Indicates if milestone is pending or completed.",
	milestone_approved: "Set to true if the milestone has been approved.",
	title: "Title of the escrow contract.",
	description: "Description of the escrow purpose.",
	trustline: "Stellar asset that is used for the escrow.",
	transaction_history: "Recent transaction history fetched from Soroban RPC. Note: RPC typically retains 24h-7 days of history.",
	transaction_retention: "RPC history retention limits (~24h default, up to 7 days). For older data, recommend full indexers (e.g. Hubble/BigQuery).",
};

//? Role icons with colors
export const ROLE_ICONS = {
	"Milestone Approver": { icon: ShieldCheck, color: "text-sky-500" },
	"Service Provider": { icon: Wrench, color: "text-blue-500" },
	"Release Signer": { icon: FileSignature, color: "text-purple-500" },
	"Dispute Resolver": { icon: Scale, color: "text-orange-400" },
	"Platform Address": { icon: Server, color: "text-yellow-500" },
	Receiver: { icon: User, color: "text-emerald-500" },
};

//? Function to truncate address for mobile
export const truncateAddress = (address: string, isMobile: boolean): string => {
	if (!address) return "N/A";
	if (!isMobile) return address;

	return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`;
};

//? Helper functions for escrow data
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export const calculateProgress = (milestones: any[]): number => {
	if (!milestones.length) return 0;

	const completed = milestones.filter((m) => m.approved).length;
	return (completed / milestones.length) * 100;
};

//? Example contract ID for UI placeholders
export const EXAMPLE_CONTRACT_ID = "CAX5I6OZW27RQ5VNF3K6TBKNXCLXXQL54HJXSZFLSKYAOVLZYCLXRXLF";
