"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { CloseIcon, MenuIcon } from "../icons";

type Props = {
  labels: { open: string; close: string; title: string };
  links: { href: string; label: string }[];
};

/** Menu button and side drawer (a modal <dialog>, so focus, Esc and the backdrop work natively). */
export function Menu({ labels, links }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();
  const close = () => dialog.current?.close();

  return (
    <>
      <button
        type="button"
        aria-label={labels.open}
        title={labels.open}
        aria-haspopup="dialog"
        onClick={() => dialog.current?.showModal()}
        className="grid size-10 place-items-center rounded-full border border-line transition-colors hover:border-gold hover:text-gold focus-visible:outline-2 focus-visible:outline-gold"
      >
        <MenuIcon />
      </button>
      <dialog
        ref={dialog}
        aria-label={labels.title}
        // Clicking the backdrop (outside the panel) closes the drawer.
        onClick={(e) => e.target === dialog.current && close()}
        className="fixed inset-y-0 end-0 start-auto m-0 h-dvh max-h-none w-80 max-w-[85vw] border-s border-line bg-surface p-0 text-fg backdrop:bg-black/50 backdrop:backdrop-blur-sm"
      >
        <nav className="flex h-full flex-col gap-1 p-4">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-lg font-bold text-gold">{labels.title}</p>
            <button
              type="button"
              aria-label={labels.close}
              title={labels.close}
              onClick={close}
              className="grid size-10 place-items-center rounded-full hover:text-gold focus-visible:outline-2 focus-visible:outline-gold"
            >
              <CloseIcon />
            </button>
          </div>
          {links.map((link) => {
            const current = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={close}
                aria-current={current ? "page" : undefined}
                className={`rounded-xl px-4 py-3 transition-colors hover:bg-bg focus-visible:outline-2 focus-visible:outline-gold ${current ? "bg-bg font-bold text-gold" : ""}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </dialog>
    </>
  );
}
