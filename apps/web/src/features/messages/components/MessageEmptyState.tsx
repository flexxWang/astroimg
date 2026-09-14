import { MessageCircle } from "lucide-react";

export function MessageEmptyState({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <div className="flex h-full min-h-[360px] items-center justify-center px-6 text-center">
      <div className="max-w-sm">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">
          <MessageCircle className="size-7" />
        </div>
        <div className="mt-4 text-sm font-medium text-slate-900">{title}</div>
        <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </div>
  );
}
