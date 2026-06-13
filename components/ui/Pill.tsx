// The Few — Pastille prix : libellé or + montant or clair, contour discret.

export default function Pill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-line bg-gradient-to-b from-gold/[0.06] to-transparent px-8 py-3">
      <span className="text-sm font-semibold uppercase tracking-[0.3em] text-gold">
        {label}
      </span>
      <span className="text-2xl font-semibold text-gold-bright">{value}</span>
    </div>
  );
}
