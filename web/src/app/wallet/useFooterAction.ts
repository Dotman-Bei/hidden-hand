import { useEffect } from "react";

export const PIT_LABEL = "Open the pit";
export const PIT_HREF = "#top";

/** The closing section's one control as it stands now: the static button, or the link in its place. */
export const footerAction = (): HTMLElement | null => document.querySelector<HTMLElement>("#contact .closing__cta .btn");

/** Puts one element where the other stands; the focus, when it was on the old one, moves with it. */
function swap(from: HTMLElement, to: HTMLElement): void {
  const held = document.activeElement === from;
  from.replaceWith(to);
  if (held) to.focus({ preventScroll: true });
}

/**
 * The closing section's button is static markup (the page's inline script labels it "Connect wallet"). A
 * connected wallet has nothing left to connect, so a link to the pit, in the same primary look, stands in
 * its place; a disconnect puts the same button back.
 */
export function useFooterAction(connected: boolean): void {
  useEffect(() => {
    if (!connected) return;
    const button = document.querySelector<HTMLElement>("#contact .closing__cta [data-wallet-connect]");
    if (!button) return;
    const link = document.createElement("a");
    link.className = button.className;
    link.href = PIT_HREF;
    link.textContent = PIT_LABEL;
    swap(button, link);
    return () => swap(link, button);
  }, [connected]);
}
