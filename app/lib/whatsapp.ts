const MONTHS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

export function monthLabel(m: string) {
  const [y, mo] = m.split("-");
  return `${MONTHS[Number(mo) - 1] ?? mo} ${y}`;
}

/** Numéro au format international sans « + » (ex: 243970000000), ou null si inexploitable. */
export function normalizePhone(raw: string): string | null {
  let d = raw.replace(/[^\d+]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  else if (d.startsWith("00")) d = d.slice(2);
  else if (d.startsWith("0") && d.length === 10) d = "243" + d.slice(1); // numéro local RDC
  d = d.replace(/\D/g, "");
  return d.length >= 9 && d.length <= 15 ? d : null;
}

export function reminderMessage(parentName: string, childName: string, month: string) {
  return (
    `Bonjour ${parentName}, ici Kids Tech-nuru Lab. ` +
    `Nous n'avons pas encore reçu les frais de ${childName} pour ${monthLabel(month)}. ` +
    `Vous pouvez régler par mobile money. ` +
    `Si c'est déjà fait, merci de nous le signaler. Merci beaucoup !`
  );
}

/** Référence d'une demande d'enseignant, ex : ENS-2026-00012. */
export function teacherRef(id: string, createdAt: string) {
  return `ENS-${createdAt.slice(0, 4)}-${String(id).padStart(5, "0")}`;
}

export function teacherReceiptMessage(name: string, school: string, ref: string) {
  return (
    `Bonjour ${name}, ici Kids Tech-nuru Lab. ` +
    `Nous avons le plaisir de vous confirmer l'acceptation de votre demande pour ${school || "votre école"} ` +
    `(référence ${ref}). ` +
    `Vous trouverez ci-joint le récépissé. Nous revenons vers vous pour convenir de la date de démarrage et des modalités. Merci de votre confiance !`
  );
}

export function teacherReceiptUrl(phone: string, name: string, school: string, ref: string) {
  const n = normalizePhone(phone);
  if (!n) return null;
  return `https://wa.me/${n}?text=${encodeURIComponent(teacherReceiptMessage(name, school, ref))}`;
}

export function reminderUrl(phone: string, parentName: string, childName: string, month: string) {
  const n = normalizePhone(phone);
  if (!n) return null;
  return `https://wa.me/${n}?text=${encodeURIComponent(reminderMessage(parentName, childName, month))}`;
}
