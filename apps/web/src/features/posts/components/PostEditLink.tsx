import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PostEditLink({ postId }: { postId: string }) {
  return (
    <Button
      asChild
      type="button"
      variant="secondary"
      size="sm"
      className="border border-[#d7e7ff] bg-[#f3f8ff] text-[#1772f6] shadow-none transition hover:-translate-y-px hover:border-[#1772f6] hover:bg-[#e8f2ff] hover:text-[#0f67e6] hover:shadow-sm"
    >
      <Link href={`/post/${postId}/edit`}>
        <Pencil className="mr-1 size-3.5 transition-transform group-hover/button:rotate-[-8deg]" />
        编辑
      </Link>
    </Button>
  );
}
