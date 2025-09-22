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
      <h2 className="mb-3 font-[var(--font-display)] text-xl tracking-tight text-[var(--lux-text)]">
        FAQ
      </h2>

      <div className="rounded-2xl border border-[var(--lux-line)] bg-[var(--lux-panel)] p-2">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="onchain" className="border-b border-[var(--lux-line)]">
            <AccordionTrigger className="text-[var(--lux-text)] hover:no-underline data-[state=open]:text-[var(--lux-gold)]">
              Is my USDC held on-chain?
            </AccordionTrigger>
            <AccordionContent className="text-[var(--lux-muted)]">
              Yes. Funds are escrowed by a Soroban smart contract on the Stellar
              network. You can verify the contract and all state changes on the public
              explorer.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="noncustodial" className="border-b border-[var(--lux-line)]">
            <AccordionTrigger className="text-[var(--lux-text)] hover:no-underline data-[state=open]:text-[var(--lux-gold)]">
              Is this custodial?
            </AccordionTrigger>
            <AccordionContent className="text-[var(--lux-muted)]">
              Non-custodial. Trustless Work provides contract tooling; funds are
              controlled by the contract, not by Trustless Work or the project team.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="milestones" className="border-b border-[var(--lux-line)]">
            <AccordionTrigger className="text-[var(--lux-text)] hover:no-underline data-[state=open]:text-[var(--lux-gold)]">
              How do milestones work?
            </AccordionTrigger>
            <AccordionContent className="text-[var(--lux-muted)]">
              The project defines milestones with amounts. As milestones are approved
              on-chain, the contract becomes eligible to release funds per the schedule.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="wallet">
            <AccordionTrigger className="text-[var(--lux-text)] hover:no-underline data-[state=open]:text-[var(--lux-gold)]">
              What do I need to fund?
            </AccordionTrigger>
            <AccordionContent className="text-[var(--lux-muted)]">
              A Stellar wallet (e.g., Freighter) and a USDC trustline on the selected
              network. Connect your wallet and use the Fund dialog; it will guide you if
              a trustline is missing.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  );
}
