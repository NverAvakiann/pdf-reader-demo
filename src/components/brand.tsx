import { Link } from "../lib/router";

type BrandProps = {
  compact?: boolean;
  inverse?: boolean;
};

export function Brand({ compact = false, inverse = false }: BrandProps) {
  return (
    <Link
      to="/"
      className="group inline-flex shrink-0 items-center gap-3 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cobalt"
      aria-label="Read Room home"
    >
      <img
        src={`${import.meta.env.BASE_URL}assets/icons/file.png`}
        alt=""
        className={`read-room-logo ${compact ? "size-10" : "size-12"}`}
        aria-hidden="true"
      />
      <span
        className={`font-serif leading-[0.82] tracking-[-0.045em] ${
          compact ? "text-[1.2rem]" : "text-[1.4rem]"
        } ${inverse ? "text-white" : "text-ink"}`}
      >
        Read
        <br />
        Room
      </span>
    </Link>
  );
}
