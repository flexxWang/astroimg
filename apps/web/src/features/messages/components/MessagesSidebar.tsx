import { Input } from "@/components/ui/input";
import { formatMessagePreview } from "@/features/messages/messageContent";
import type { ConversationItem } from "@/features/messages/services/messageApi";
import type { SearchUserItem } from "@/features/users/services/userSearchApi";

export function MessagesSidebar({
  conversations,
  onSearchChange,
  onSelectConversation,
  onStartChat,
  search,
  searchOpen,
  searchedUsers,
  selectedConversationId,
}: {
  conversations: ConversationItem[];
  onSearchChange: (value: string) => void;
  onSelectConversation: (conversationId: string) => void;
  onStartChat: (userId: string) => void;
  search: string;
  searchOpen: boolean;
  searchedUsers: SearchUserItem[];
  selectedConversationId: string | null;
}) {
  return (
    <aside className="flex min-h-0 flex-col border-r border-slate-200 bg-slate-50/80">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-lg font-semibold text-slate-950">私信</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          {conversations.length > 0
            ? `${conversations.length} 个会话`
            : "还没有会话"}
        </p>
      </div>

      <div className="relative border-b border-slate-200 bg-white/70 px-4 py-3">
        <Input
          placeholder="搜索用户并发起聊天"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="h-9 rounded-lg border-slate-200 bg-white text-sm shadow-none"
        />
        {searchOpen && search.length > 0 ? (
          <div className="absolute left-4 right-4 top-[52px] z-20 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
            {searchedUsers.map((searchUser) => (
              <button
                key={searchUser.id}
                className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition hover:bg-slate-50"
                onClick={() => onStartChat(searchUser.id)}
              >
                <span className="font-medium text-slate-800">
                  {searchUser.username}
                </span>
                <span className="text-xs text-slate-500">发起聊天</span>
              </button>
            ))}
            {searchedUsers.length === 0 ? (
              <div className="px-3 py-2.5 text-xs text-slate-500">
                没有匹配用户
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto py-2">
        {conversations.map((conversation) => {
          const selected = conversation.id === selectedConversationId;
          return (
            <button
              key={conversation.id}
              className={`group relative flex w-full gap-3 px-4 py-3 text-left transition ${
                selected
                  ? "bg-white text-slate-950 shadow-[inset_3px_0_0_#0f172a]"
                  : "text-slate-700 hover:bg-white/70"
              }`}
              onClick={() => onSelectConversation(conversation.id)}
            >
              <span className="relative mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
                {conversation.otherUsername.slice(0, 1).toUpperCase()}
                <span
                  className={`absolute bottom-0 right-0 size-2.5 rounded-full ring-2 ring-white ${
                    conversation.online ? "bg-emerald-500" : "bg-slate-300"
                  }`}
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">
                    {conversation.otherUsername}
                  </span>
                  {conversation.unreadCount ? (
                    <span className="shrink-0 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-medium text-white">
                      {conversation.unreadCount}
                    </span>
                  ) : null}
                </span>
                <span className="mt-1 block truncate text-xs text-slate-500">
                  {formatMessagePreview(conversation.lastMessage) || "还没有消息"}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
