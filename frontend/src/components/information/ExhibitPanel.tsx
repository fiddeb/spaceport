import type { InfoExhibit, InfoLink } from "@/data/informationDesk";

function ExhibitLink({ link }: { link: InfoLink }) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-baseline gap-3 border-l-2 border-transparent pl-3 transition-colors hover:border-primary/40"
    >
      <span className="font-medium text-primary group-hover:underline">
        {link.label}
      </span>
      <span className="text-xs text-muted-foreground/50">{"\u2197"}</span>
      {link.description && (
        <span className="text-sm text-muted-foreground">
          — {link.description}
        </span>
      )}
    </a>
  );
}

interface ExhibitPanelProps {
  exhibit: InfoExhibit;
}

export function ExhibitPanel({ exhibit }: ExhibitPanelProps) {
  const num = String(exhibit.number).padStart(2, "0");

  return (
    <section
      id={exhibit.id}
      className="flex min-h-[calc(100vh-3.5rem)] snap-start flex-col justify-center py-16"
    >
      {/* Section number + title block */}
      <div className="mb-6">
        <span className="block font-mono text-[5rem] leading-none font-extralight tracking-tighter text-primary/15 select-none sm:text-[7rem]">
          {num}
        </span>
        <h2 className="mt-[-0.6em] pl-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {exhibit.title}
        </h2>
      </div>

      {/* Intro paragraph */}
      <p className="mb-6 max-w-[65ch] text-base leading-relaxed text-muted-foreground">
        {exhibit.intro}
      </p>

      {/* Slide title */}
      <h3 className="mb-4 border-l-2 border-primary/60 pl-4 text-lg font-semibold text-foreground">
        {exhibit.slideTitle}
      </h3>

      {/* Key points */}
      <div className="mb-6 flex flex-col gap-3">
        {exhibit.points.map((point) => (
          <div key={point.label} className="pl-4">
            <div className="flex items-baseline gap-2">
              <span className="mt-[0.35em] h-1.5 w-1.5 shrink-0 bg-primary/70" />
              <div>
                <span className="font-semibold text-foreground">
                  {point.label}
                </span>
                {point.text && (
                  <span className="text-muted-foreground"> — {point.text}</span>
                )}
              </div>
            </div>
            {point.subPoints && point.subPoints.length > 0 && (
              <ul className="ml-6 mt-2 flex flex-col gap-1.5">
                {point.subPoints.map((sub, i) => (
                  <li
                    key={i}
                    className="flex items-baseline gap-2 text-sm text-muted-foreground"
                  >
                    <span className="mt-[0.45em] h-1 w-1 shrink-0 bg-muted-foreground/40" />
                    {sub}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {/* Optional image */}
      {exhibit.image && (
        <div className="mb-6 overflow-hidden border border-border">
          <img
            src={exhibit.image}
            alt={exhibit.imageAlt ?? exhibit.title}
            className="w-full object-cover"
          />
        </div>
      )}

      {/* Optional links */}
      {exhibit.links && exhibit.links.length > 0 && (
        <div className="mb-6 flex flex-col gap-3">
          {exhibit.links.map((link) => (
            <ExhibitLink key={link.url} link={link} />
          ))}
        </div>
      )}

      {/* Optional editorial note */}
      {exhibit.note && (
        <aside className="border-l border-border/60 pl-4 text-sm italic text-muted-foreground/70">
          {exhibit.note}
        </aside>
      )}
    </section>
  );
}
