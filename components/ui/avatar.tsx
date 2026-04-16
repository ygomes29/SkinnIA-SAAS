import Image from "next/image";

import { cn } from "@/lib/utils/cn";

export function Avatar({
  name,
  imageUrl,
  className
}: {
  name: string;
  imageUrl?: string | null;
  className?: string;
}) {
  if (imageUrl) {
    return (
      <Image
        alt={name}
        className={cn("h-10 w-10 rounded-2xl object-cover ring-1 ring-violet-500/20", className)}
        height={40}
        src={imageUrl}
        width={40}
      />
    );
  }

  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

  return (
    <div
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-violet/45 to-brand-cyan/35 text-sm font-semibold text-white ring-1 ring-violet-500/20",
        className
      )}
    >
      {initials}
    </div>
  );
}
