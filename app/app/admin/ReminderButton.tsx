"use client";

import { useTransition } from "react";
import { logReminder } from "./actions";

export default function ReminderButton({
  url,
  registrationId,
  month,
  label,
}: {
  url: string;
  registrationId: string;
  month: string;
  label: string;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        // WhatsApp s'ouvre avec le message pré-rempli ; l'équipe l'envoie elle-même.
        window.open(url, "_blank", "noopener,noreferrer");
        start(() => logReminder(registrationId, month));
      }}
      className="rounded-full bg-[#25d366] px-4 py-2 text-sm font-bold text-ink shadow-sm transition hover:-translate-y-0.5 disabled:opacity-50"
    >
      {label}
    </button>
  );
}
