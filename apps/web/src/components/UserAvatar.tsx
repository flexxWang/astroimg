import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
};

export default function UserAvatar({
  name,
  size = "md",
  className,
}: UserAvatarProps) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-primary/10 text-primary",
        sizes[size],
        className,
      )}
      aria-label={name}
    >
      {initials || "?"}
    </div>
  );
}
