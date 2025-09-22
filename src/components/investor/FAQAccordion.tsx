"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQAccordion() {
  return (
    <section className="mt-10">
      <h2 className="mb-3 text-xl font-semibold text-gray-900">FAQ</h2>
      <div className="rounded-2xl border bg-white p-2">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="onchain">
            <AccordionTrigger>Is my USDC held on-chain?</AccordionTrigger>
            <AccordionContent>
              Yes. Funds are escrowed by a Soroban smart contract on the Stellar network.
              You can verify the contract and all state changes on the public explorer.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="noncustodial">
            <AccordionTrigger>Is this custodial?</AccordionTrigger>
            <AccordionContent>
              Non-custodial. Trustless Work provides contract tooling; funds are controlled by the contract,
              not by Trustless Work or the project team.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="milestones">
            <AccordionTrigger>How do milestones work?</AccordionTrigger>
            <AccordionContent>
              The project defines milestones with amounts. As milestones are approved on-chain, the contract
              becomes eligible to release funds per the schedule.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="wallet">
            <AccordionTrigger>What do I need to fund?</AccordionTrigger>
            <AccordionContent>
              A Stellar wallet (e.g., Freighter) and a USDC trustline on the selected network.
              Connect your wallet and use the Fund dialog; it will guide you if a trustline is missing.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  );
}
