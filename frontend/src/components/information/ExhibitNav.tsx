import { cn } from "@/lib/utils";
import type { InfoExhibit } from "@/data/informationDesk";

interface ExhibitNavProps {
  exhibits: InfoExhibit[];
  activeId: string | null;
}

export function ExhibitNav({ exhibits, activeId }: ExhibitNavProps) {
  return (
    <nav className="flex flex-col gap-0.5">
      {exhibits.map((e) => {
        const num = String(e.number).padStart(2, "0");
        const isActive = e.id === activeId;

        return (
          <a
            key={e.id}
            href={`#${e.id}`}
            onClick={(ev) => {
              ev.preventDefault();
              document
                .getElementById(e.id)
                ?.scrollIntoView({ behavior: "smooth" });
            }}
            className={cn(
              "group flex items-center gap-3 border-l-2 py-2 pl-3 pr-2 text-sm transition-colors duration-200",
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground/60 hover:border-border hover:text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "shrink-0 font-mono text-xs transition-colors",
                isActive ? "text-primary" : "text-muted-foreground/40 group-hover:text-muted-foreground/60",
              )}
            >
              {num}
            </span>
            <span className="truncate">{e.title}</span>
          </a>
        );
      })}
    </nav>
  );
}
