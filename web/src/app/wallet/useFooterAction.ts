import { useLayoutEffect } from "react";

export const PIT_LABEL = "Open the pit";
export const PIT_HREF = "#top";
export const CONNECTED_LEAD = "Your wallet is connected. Take your seat; three bots take the rest.";

/** The closing section's one control as it stands now: the static button, or the link in its place. */
export const footerAction = (): HTMLElement | null => document.querySelector<HTMLElement>("#contact .closing__cta .btn");

/** Puts one element where the other stands; the focus, when it was on the old one, moves with it. */
function swap(from: HTMLElement, to: HTMLElement): void {
  const held = document.activeElement === from;
  from.replaceWith(to);
  if (held) to.focus({ preventScroll: true });
}

/**
 * The closing section's lead and button are static markup (the page's inline script writes the wallet-mode
 * words, with "Connect wallet" on the button). A connected wallet has nothing left to connect, so the lead
 * says it is connected and a link to the pit, in the same primary look, stands in the button's place; a
 * disconnect puts the same words and the same button back. A layout effect, so both change before the
 * browser paints. Express mode's markup has no wallet button and is left alone.
 */
export function useFooterAction(connected: boolean): void {
  useLayoutEffect(() => {
    if (!connected) return;
    const button = document.querySelector<HTMLElement>("#contact .closing__cta [data-wallet-connect]");
    if (!button) return;
    const link = document.createElement("a");
    link.className = button.className;
    link.href = PIT_HREF;
    link.textContent = PIT_LABEL;
    const lead = document.querySelector<HTMLElement>("#contact #close-h + p");
    const asked = lead?.textContent ?? "";
    if (lead) lead.textContent = CONNECTED_LEAD;
    swap(button, link);
    return () => {
      if (lead) lead.textContent = asked;
      swap(link, button);
    };
  }, [connected]);
}
