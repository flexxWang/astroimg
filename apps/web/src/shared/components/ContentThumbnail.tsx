import Link from "next/link";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContentThumbnailProps {
  href: string;
  src?: string | null;
  alt: string;
  className?: string;
}

export default function ContentThumbnail({
  href,
  src,
  alt,
  className,
}: ContentThumbnailProps) {
  const frameClassName = cn(
    "relative block aspect-[4/3] w-full overflow-hidden rounded-md border bg-slate-100",
    className,
  );

  if (!src) {
    return (
      <div className={cn(frameClassName, "flex items-center justify-center text-slate-300")}>
        <ImageIcon className="size-6" />
      </div>
    );
  }

  return (
    <Link href={href} className={frameClassName} aria-label={alt}>
      {/* Rich text image URLs are user-uploaded editor content. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
      />
    </Link>
  );
}
