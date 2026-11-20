import { createFileRoute } from "@tanstack/react-router";
import { Client } from "@stomp/stompjs";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  Bell,
  Check,
  FileText,
  ImagePlus,
  MessageCircle,
  Paperclip,
  Pencil,
  Plus,
  Reply,
  Search,
  Send,
  Smile,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { can, useMe } from "@/lib/auth";
import { getAuthToken } from "@/lib/api";
import {
  chatApi,
  type ChatAttachment,
  type ChatConversation,
  type ChatEvent,
  type ChatMember,
  type ChatMessage,
  type ChatNotification,
  type ChatReaction,
  type ChatUploadLimits,
  type ChatUser,
} from "@/lib/chat-api";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({
    meta: [
      { title: "Chat — TEAM BSY" },
      {
        name: "description",
        content: "Private TEAM BSY conversations for members and organizers.",
      },
    ],
  }),
  component: ChatPage,
});

type ReplyPreview = Pick<ChatMessage, "id" | "content" | "senderId">;

const EMOJI = ["👍", "❤️", "😂", "🙏", "🎉"];
const DEFAULT_UPLOAD_LIMITS: ChatUploadLimits = {
  maxFileSizeBytes: 20 * 1024 * 1024,
  maxFilesPerMessage: 10,
};
const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "pdf", "txt", "csv"]);
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] ?? "")
      .join("")
      .toUpperCase() || "B"
  );
}

function clockLabel(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function fileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function displayName(conversation: ChatConversation) {
  return conversation.displayName || conversation.name || "Conversation";
}

function addMessage(
  current: InfiniteData<ChatMessage[]> | undefined,
  message: ChatMessage,
): InfiniteData<ChatMessage[]> | undefined {
  if (!current) return current;
  if (current.pages.some((page) => page.some((item) => item.id === message.id))) {
    return current;
  }
  const pages = [...current.pages];
  pages[0] = [...(pages[0] ?? []), message].sort(
    (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
  );
  return { ...current, pages };
}

function ChatPage() {
  const { data: me } = useMe();
  const isAdmin = can(me, ["admin"]);
  const token = getAuthToken();
  const queryClient = useQueryClient();
  const stompClient = useRef<Client | null>(null);
  const readMessageIds = useRef(new Set<string>());
  const [connected, setConnected] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [groupSearch, setGroupSearch] = useState("");
  const [messageSearch, setMessageSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<ReplyPreview | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const [mobileShowConversation, setMobileShowConversation] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [privateOpen, setPrivateOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [onlyAdminsCanSend, setOnlyAdminsCanSend] = useState(false);
  const [chosenMembers, setChosenMembers] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [privateSearch, setPrivateSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const messageEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const conversationsQuery = useQuery({
    queryKey: ["chat-conversations"],
    queryFn: chatApi.conversations,
  });
  const conversations = conversationsQuery.data ?? [];
  const activeConversation = conversations.find((item) => item.id === activeConversationId) ?? null;

  useEffect(() => {
    if (!activeConversationId && conversations.length > 0) {
      setActiveConversationId(conversations[0]?.id ?? null);
    } else if (
      activeConversationId &&
      conversations.length > 0 &&
      !conversations.some((item) => item.id === activeConversationId)
    ) {
      setActiveConversationId(conversations[0]?.id ?? null);
    }
  }, [activeConversationId, conversations]);

  const membersQuery = useQuery({
    queryKey: ["chat-members", activeConversationId],
    enabled: Boolean(activeConversationId),
    queryFn: () =>
      activeConversationId
        ? chatApi.members(activeConversationId)
        : Promise.resolve([] as ChatMember[]),
  });
  const members = membersQuery.data ?? [];
  const currentMember = members.find((member) => member.userId === me?.id);
  const canManageGroup =
    Boolean(activeConversation?.type === "GROUP") &&
    (isAdmin || currentMember?.memberRole === "OWNER" || currentMember?.memberRole === "ADMIN");
  const canManageAdminRoles =
    Boolean(activeConversation?.type === "GROUP") &&
    (isAdmin || currentMember?.memberRole === "OWNER");
  const canSendMessages =
    !activeConversation?.onlyAdminsCanSend ||
    isAdmin ||
    currentMember?.memberRole === "OWNER" ||
    currentMember?.memberRole === "ADMIN";

  const messagesQuery = useInfiniteQuery({
    queryKey: ["chat-messages", activeConversationId],
    enabled: Boolean(activeConversationId),
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      activeConversationId
        ? chatApi.messages(activeConversationId, pageParam, 50)
        : Promise.resolve([] as ChatMessage[]),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === 50 ? allPages.length : undefined,
  });
  const messages = useMemo(
    () =>
      [...(messagesQuery.data?.pages ?? [])]
        .reverse()
        .flat()
        .sort(
          (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
        ),
    [messagesQuery.data],
  );
  const searchQuery = useQuery({
    queryKey: ["chat-search", activeConversationId, messageSearch.trim()],
    enabled: Boolean(activeConversationId && messageSearch.trim().length >= 2),
    queryFn: () =>
      activeConversationId
        ? chatApi.searchMessages(activeConversationId, messageSearch.trim())
        : Promise.resolve([] as ChatMessage[]),
  });
  const displayedMessages = messageSearch.trim().length >= 2 ? (searchQuery.data ?? []) : messages;

  const directoryQuery = useQuery({
    queryKey: ["chat-directory", memberSearch.trim()],
    enabled:
      ((isAdmin && createOpen) || (canManageGroup && showMembers)) &&
      memberSearch.trim().length >= 2,
    queryFn: () => chatApi.searchUsers(memberSearch.trim()),
  });
  const directory = directoryQuery.data ?? [];
  const privateUsersQuery = useQuery({
    queryKey: ["chat-private-users", privateSearch.trim()],
    enabled: privateOpen && privateSearch.trim().length >= 2,
    queryFn: () => chatApi.searchUsers(privateSearch.trim()),
  });
  const privateUsers = privateUsersQuery.data ?? [];

  const notificationsQuery = useQuery({
    queryKey: ["chat-notifications"],
    queryFn: chatApi.notifications,
  });
  const uploadLimitsQuery = useQuery({
    queryKey: ["chat-upload-limits"],
    queryFn: chatApi.uploadLimits,
  });
  const uploadLimits = uploadLimitsQuery.data ?? DEFAULT_UPLOAD_LIMITS;
  const unreadNotificationsQuery = useQuery({
    queryKey: ["chat-unread-notifications"],
    queryFn: chatApi.unreadNotificationCount,
  });

  useEffect(() => {
    if (!token) return;
    const brokerUrl = API_URL.replace(/\/api\/?$/, "")
      .replace(/^http/, "ws")
      .concat("/ws");
    const client = new Client({
      brokerURL: brokerUrl,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        setConnected(true);
        client.subscribe("/user/queue/chat", (frame) => {
          try {
            const event = JSON.parse(frame.body) as ChatEvent;
            handleChatEvent(event, queryClient);
          } catch (error) {
            console.error("Could not read a chat event", error);
          }
        });
        client.subscribe("/topic/presence", (frame) => {
          try {
            const presence = JSON.parse(frame.body) as {
              userId: string;
              online: boolean;
              lastSeenAt: string | null;
            };
            queryClient.setQueriesData<ChatMember[]>({ queryKey: ["chat-members"] }, (current) =>
              current?.map((member) =>
                member.userId === presence.userId
                  ? {
                      ...member,
                      online: presence.online,
                      lastSeenAt: presence.lastSeenAt,
                    }
                  : member,
              ),
            );
          } catch (error) {
            console.error("Could not read a presence update", error);
          }
        });
      },
      onWebSocketClose: () => setConnected(false),
      onStompError: (frame) => console.error("Chat WebSocket error", frame.headers["message"]),
    });
    stompClient.current = client;
    client.activate();
    return () => {
      setConnected(false);
      stompClient.current = null;
      void client.deactivate();
    };
  }, [queryClient, token]);

  useEffect(() => {
    if (!activeConversationId || !me?.id || !connected) return;
    const unreadIds = messages
      .filter((message) => message.senderId !== me.id && !readMessageIds.current.has(message.id))
      .map((message) => message.id);
    if (unreadIds.length === 0) return;
    unreadIds.forEach((id) => readMessageIds.current.add(id));
    stompClient.current?.publish({
      destination: `/app/chat/${activeConversationId}/read`,
      body: JSON.stringify({ messageIds: unreadIds }),
    });
  }, [activeConversationId, connected, me?.id, messages]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({
      block: "end",
      behavior: "smooth",
    });
  }, [activeConversationId, displayedMessages.length]);

  const memberNames = useMemo(
    () => new Map(members.map((member) => [member.userId, member.fullName || "TEAM BSY member"])),
    [members],
  );
  const latestMessage = activeConversation?.latestMessage ?? null;
  const filteredConversations = conversations.filter((conversation) =>
    `${displayName(conversation)} ${conversation.description ?? ""}`
      .toLowerCase()
      .includes(groupSearch.toLowerCase()),
  );

  async function createPrivateConversation(user: ChatUser) {
    setBusy(true);
    try {
      const conversation = await chatApi.createPrivate(user.id);
      setPrivateOpen(false);
      setPrivateSearch("");
      await queryClient.invalidateQueries({
        queryKey: ["chat-conversations"],
      });
      setActiveConversationId(conversation.id);
      setMobileShowConversation(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not start chat");
    } finally {
      setBusy(false);
    }
  }

  async function createGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!groupName.trim()) return;
    setBusy(true);
    try {
      const conversation = await chatApi.createGroup(
        groupName.trim(),
        groupDescription.trim(),
        chosenMembers,
      );
      setActiveConversationId(conversation.id);
      setMobileShowConversation(true);
      setGroupName("");
      setGroupDescription("");
      setChosenMembers([]);
      setMemberSearch("");
      setCreateOpen(false);
      await queryClient.invalidateQueries({
        queryKey: ["chat-conversations"],
      });
      toast.success("Group created");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create group");
    } finally {
      setBusy(false);
    }
  }

  async function updateGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeConversation || !groupName.trim()) return;
    setBusy(true);
    try {
      await chatApi.updateGroup(
        activeConversation.id,
        groupName.trim(),
        groupDescription.trim(),
        onlyAdminsCanSend,
      );
      setEditOpen(false);
      await queryClient.invalidateQueries({
        queryKey: ["chat-conversations"],
      });
      toast.success("Group details updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update group");
    } finally {
      setBusy(false);
    }
  }

  async function addMember(userId: string) {
    if (!activeConversation) return;
    try {
      await chatApi.addMember(activeConversation.id, userId);
      await queryClient.invalidateQueries({
        queryKey: ["chat-members", activeConversation.id],
      });
      toast.success("Member added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add member");
    }
  }

  async function removeMember(userId: string) {
    if (!activeConversation || userId === me?.id) return;
    try {
      await chatApi.removeMember(activeConversation.id, userId);
      await queryClient.invalidateQueries({
        queryKey: ["chat-members", activeConversation.id],
      });
      toast.success("Member removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove member");
    }
  }

  async function updateMemberRole(userId: string, role: "ADMIN" | "MEMBER") {
    if (!activeConversation) return;
    try {
      await chatApi.updateMemberRole(activeConversation.id, userId, role);
      await queryClient.invalidateQueries({
        queryKey: ["chat-members", activeConversation.id],
      });
      toast.success(role === "ADMIN" ? "Group admin added" : "Admin role removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update member role");
    }
  }

  function selectFiles(files: FileList | null) {
    if (!files) return;
    const selected = Array.from(files);
    const unsupported = selected.find((file) => {
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
      return !ALLOWED_EXTENSIONS.has(extension);
    });
    if (unsupported) {
      toast.error(`${unsupported.name}: unsupported file type`);
      return;
    }
    if (selected.some((file) => file.size > uploadLimits.maxFileSizeBytes)) {
      toast.error(`Each attachment must be ${fileSize(uploadLimits.maxFileSizeBytes)} or smaller`);
      return;
    }
    setPendingFiles((current) => {
      const combined = [...current, ...selected];
      if (combined.length > uploadLimits.maxFilesPerMessage) {
        toast.error(`Attach no more than ${uploadLimits.maxFilesPerMessage} files to a message`);
        return current;
      }
      return combined.filter(
        (file, index, list) =>
          list.findIndex(
            (item) =>
              item.name === file.name &&
              item.size === file.size &&
              item.lastModified === file.lastModified,
          ) === index,
      );
    });
  }

  async function sendMessage(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!activeConversation || busy || (!draft.trim() && pendingFiles.length === 0)) {
      return;
    }
    setBusy(true);
    const content = draft.trim();
    const files = pendingFiles;
    try {
      if (files.length === 0 && stompClient.current?.connected) {
        stompClient.current.publish({
          destination: `/app/chat/${activeConversation.id}/send`,
          body: JSON.stringify({
            content,
            replyToId: replyTo?.id ?? null,
          }),
        });
      } else {
        const saved = await chatApi.sendMessage(
          activeConversation.id,
          content,
          replyTo?.id ?? null,
          files,
        );
        queryClient.setQueryData<InfiniteData<ChatMessage[]>>(
          ["chat-messages", activeConversation.id],
          (current) => addMessage(current, saved),
        );
      }
      setDraft("");
      setReplyTo(null);
      setPendingFiles([]);
      readMessageIds.current.clear();
      void queryClient.invalidateQueries({
        queryKey: ["chat-conversations"],
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Message could not be sent");
    } finally {
      setBusy(false);
    }
  }

  function toggleReaction(messageId: string, emoji: string) {
    if (!activeConversation) return;
    if (stompClient.current?.connected) {
      stompClient.current.publish({
        destination: `/app/chat/${activeConversation.id}/messages/${messageId}/react`,
        body: JSON.stringify({ emoji }),
      });
      return;
    }
    void chatApi
      .toggleReaction(activeConversation.id, messageId, emoji)
      .then(() =>
        queryClient.invalidateQueries({
          queryKey: ["chat-messages", activeConversation.id],
        }),
      )
      .catch((error: unknown) =>
        toast.error(error instanceof Error ? error.message : "Could not update reaction"),
      );
  }

  async function saveEditedMessage(messageId: string) {
    if (!activeConversation || !editDraft.trim()) return;
    try {
      await chatApi.editMessage(activeConversation.id, messageId, editDraft.trim());
      setEditingMessageId(null);
      await queryClient.invalidateQueries({
        queryKey: ["chat-messages", activeConversation.id],
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not edit message");
    }
  }

  async function deleteMessage(messageId: string) {
    if (!activeConversation || !window.confirm("Delete this message?")) return;
    try {
      await chatApi.deleteMessage(activeConversation.id, messageId);
      await queryClient.invalidateQueries({
        queryKey: ["chat-messages", activeConversation.id],
      });
      toast.success("Message deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete message");
    }
  }

  async function jumpToMessage(messageId: string) {
    if (!activeConversation) return;
    setMessageSearch("");
    if (!messages.some((message) => message.id === messageId)) {
      try {
        const original = await chatApi.message(activeConversation.id, messageId);
        queryClient.setQueryData<InfiniteData<ChatMessage[]>>(
          ["chat-messages", activeConversation.id],
          (current) =>
            current ? addMessage(current, original) : { pages: [[original]], pageParams: [0] },
        );
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not load original message");
        return;
      }
    }
    window.setTimeout(
      () =>
        document
          .getElementById(`message-${messageId}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" }),
      50,
    );
  }

  async function openNotification(notification: ChatNotification) {
    try {
      await chatApi.markNotificationRead(notification.id);
      setNotificationsOpen(false);
      setActiveConversationId(notification.conversationId);
      setMobileShowConversation(true);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["chat-notifications"] }),
        queryClient.invalidateQueries({
          queryKey: ["chat-unread-notifications"],
        }),
      ]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not open notification");
    }
  }

  const conversationList = (
    <div className="flex h-full min-h-0 flex-col border-r bg-card">
      <div className="flex items-center justify-between border-b px-4 py-4">
        <div>
          <p className="font-display text-lg font-semibold">Conversations</p>
          <p className="text-xs text-muted-foreground">
            {conversations.length} conversation
            {conversations.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Start private chat"
            title="Start private chat"
            onClick={() => setPrivateOpen(true)}
          >
            <MessageCircle />
          </Button>
          {isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Create group"
              title="Create group"
              onClick={() => setCreateOpen(true)}
            >
              <Plus />
            </Button>
          )}
        </div>
      </div>
      <div className="border-b p-3">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={groupSearch}
            onChange={(event) => setGroupSearch(event.target.value)}
            placeholder="Find a conversation"
            className="pl-9"
            aria-label="Find a conversation"
          />
        </label>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {conversationsQuery.isLoading ? (
          <div className="space-y-2 p-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-16 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <MessageCircle className="mx-auto h-8 w-8 text-muted-foreground/60" />
            <p className="mt-3 text-sm font-medium">
              {conversations.length ? "No conversations match" : "No conversations yet"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {conversations.length
                ? "Try a different search."
                : "Start a private chat or create a group."}
            </p>
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => {
                setActiveConversationId(conversation.id);
                setMessageSearch("");
                setShowMembers(false);
                setMobileShowConversation(true);
              }}
              className={`flex w-full items-center gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-muted/50 ${
                activeConversationId === conversation.id ? "bg-accent/60" : ""
              }`}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                {conversation.type === "GROUP" ? (
                  <Users className="h-5 w-5" />
                ) : (
                  <MessageCircle className="h-5 w-5" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">
                  {displayName(conversation)}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {conversation.latestMessage?.content ||
                    (conversation.latestMessage?.attachments.length
                      ? "Attachment"
                      : conversation.description || "Start a conversation")}
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1">
                {conversation.latestMessage && (
                  <span className="text-[10px] text-muted-foreground">
                    {clockLabel(conversation.latestMessage.createdAt)}
                  </span>
                )}
                {conversation.unreadCount > 0 && (
                  <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">
                    {conversation.unreadCount}
                  </span>
                )}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );

  const conversationView = !activeConversation ? (
    <div className="flex h-full min-h-[420px] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <MessageCircle className="h-7 w-7" />
      </div>
      <h2 className="mt-4 font-display text-xl font-semibold">Team conversations</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Select a conversation or start a private chat with a TEAM BSY member.
      </p>
    </div>
  ) : (
    <div className="flex h-full min-h-[500px] min-w-0 flex-col bg-background">
      <div className="flex items-center gap-3 border-b bg-card px-3 py-3 sm:px-5">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Back to conversations"
          onClick={() => setMobileShowConversation(false)}
        >
          <ArrowLeft />
        </Button>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          {activeConversation.type === "GROUP" ? (
            <Users className="h-5 w-5" />
          ) : (
            <MessageCircle className="h-5 w-5" />
          )}
        </div>
        <button
          className="min-w-0 flex-1 text-left"
          onClick={() => setShowMembers((value) => !value)}
        >
          <span className="block truncate text-sm font-semibold">
            {displayName(activeConversation)}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {activeConversation.type === "GROUP"
              ? `${members.length} members`
              : members.find((member) => member.userId !== me?.id)?.online
                ? "Online"
                : "Private conversation"}
          </span>
        </button>
        {canManageGroup && (
          <Button
            variant="ghost"
            size="icon"
            title="Edit group"
            aria-label="Edit group"
            onClick={() => {
              setGroupName(activeConversation.name ?? "");
              setGroupDescription(activeConversation.description ?? "");
              setOnlyAdminsCanSend(activeConversation.onlyAdminsCanSend);
              setEditOpen(true);
            }}
          >
            <Pencil />
          </Button>
        )}
        <Button
          variant={showMembers ? "secondary" : "ghost"}
          size="icon"
          title="Conversation members"
          aria-label="Conversation members"
          onClick={() => setShowMembers((value) => !value)}
        >
          <Users />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          title="Notifications"
          aria-label="Notifications"
          onClick={() => setNotificationsOpen(true)}
        >
          <span className="relative">
            <Bell className="h-4 w-4" />
            {(unreadNotificationsQuery.data ?? 0) > 0 && (
              <span className="absolute -right-2 -top-2 h-2 w-2 rounded-full bg-destructive" />
            )}
          </span>
        </Button>
      </div>

      <div className="border-b px-3 py-2 sm:px-5">
        <label className="relative block max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={messageSearch}
            onChange={(event) => setMessageSearch(event.target.value)}
            placeholder="Search this conversation"
            className="h-9 pl-9"
            aria-label="Search this conversation"
          />
        </label>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-6">
            {!messageSearch.trim() && messagesQuery.hasNextPage && (
              <div className="mb-4 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={messagesQuery.isFetchingNextPage}
                  onClick={() => void messagesQuery.fetchNextPage()}
                >
                  {messagesQuery.isFetchingNextPage ? "Loading…" : "Load older messages"}
                </Button>
              </div>
            )}
            {messagesQuery.isLoading || searchQuery.isLoading ? (
              <div className="space-y-4">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="h-16 max-w-md animate-pulse rounded-md bg-muted" />
                ))}
              </div>
            ) : displayedMessages.length === 0 ? (
              <div className="flex h-full min-h-48 flex-col items-center justify-center text-center">
                <MessageCircle className="h-8 w-8 text-muted-foreground/50" />
                <p className="mt-3 text-sm font-medium">
                  {messageSearch.trim() ? "No messages found" : "Start the conversation"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {messageSearch.trim()
                    ? "Try another search."
                    : "Send a message to this conversation."}
                </p>
              </div>
            ) : (
              <div className="mx-auto flex max-w-3xl flex-col gap-4">
                {displayedMessages.map((message) => {
                  const own = message.senderId === me?.id;
                  const author =
                    memberNames.get(message.senderId) || message.senderName || "TEAM BSY member";
                  const replyTargetId = message.replyPreview?.id ?? message.replyToId;
                  const groupedReactions = EMOJI.map((emoji) => ({
                    emoji,
                    users: message.reactions.filter((reaction) => reaction.emoji === emoji),
                  })).filter((entry) => entry.users.length > 0);
                  return (
                    <div
                      key={message.id}
                      id={`message-${message.id}`}
                      className={`flex items-end gap-2 ${own ? "justify-end" : "justify-start"}`}
                    >
                      {!own && (
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] font-semibold text-secondary-foreground"
                          title={author}
                        >
                          {initials(author)}
                        </span>
                      )}
                      <div
                        className={`group max-w-[88%] sm:max-w-[72%] ${
                          own ? "items-end" : "items-start"
                        }`}
                      >
                        {!own && (
                          <p className="mb-1 ml-1 text-[11px] font-semibold text-muted-foreground">
                            {author}
                          </p>
                        )}
                        <div
                          className={`rounded-lg border px-3 py-2 shadow-sm ${
                            own ? "border-primary/20 bg-accent/70" : "bg-card"
                          }`}
                        >
                          {message.replyToId && (
                            <button
                              className="mb-2 block w-full border-l-2 border-primary/60 pl-2 text-left text-xs text-muted-foreground"
                              onClick={() => replyTargetId && void jumpToMessage(replyTargetId)}
                            >
                              {message.replyPreview ? (
                                <>
                                  <span className="block font-semibold text-foreground">
                                    Replying to {message.replyPreview.senderName}
                                  </span>
                                  {message.replyPreview.deleted
                                    ? "This message was deleted"
                                    : message.replyPreview.content || "Attachment"}
                                </>
                              ) : (
                                "Open original message"
                              )}
                            </button>
                          )}
                          {message.deleted ? (
                            <p className="text-sm italic text-muted-foreground">Message deleted</p>
                          ) : editingMessageId === message.id ? (
                            <div className="flex gap-2">
                              <Input
                                value={editDraft}
                                onChange={(event) => setEditDraft(event.target.value)}
                                aria-label="Edit message"
                              />
                              <Button size="sm" onClick={() => void saveEditedMessage(message.id)}>
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingMessageId(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            message.content && (
                              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                                {message.content}
                                {message.editedAt && (
                                  <span className="ml-1 text-[10px] text-muted-foreground">
                                    (edited)
                                  </span>
                                )}
                              </p>
                            )
                          )}
                          {message.attachments.map((attachment) => (
                            <AttachmentItem key={attachment.id} attachment={attachment} />
                          ))}
                          <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
                            <span>{clockLabel(message.createdAt)}</span>
                            {own && (
                              <span
                                title={
                                  message.readReceipts.length > 0
                                    ? `Read by ${message.readReceipts
                                        .map((receipt) => receipt.userName)
                                        .join(", ")}`
                                    : "Sent"
                                }
                              >
                                <Check className="h-3 w-3 text-success" />
                              </span>
                            )}
                          </div>
                        </div>
                        {!message.deleted && (
                          <div
                            className={`mt-1 flex flex-wrap items-center gap-1 ${
                              own ? "justify-end" : "justify-start"
                            }`}
                          >
                            {groupedReactions.map(({ emoji, users }) => (
                              <button
                                key={emoji}
                                title={users.map((reaction) => reaction.userName).join(", ")}
                                onClick={() => toggleReaction(message.id, emoji)}
                                className={`rounded-full border px-2 py-0.5 text-xs ${
                                  users.some((reaction) => reaction.userId === me?.id)
                                    ? "border-primary bg-primary/10"
                                    : "bg-card"
                                }`}
                              >
                                {emoji} {users.length}
                              </button>
                            ))}
                            <div className="flex items-center opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                              {EMOJI.slice(0, 3).map((emoji) => (
                                <Button
                                  key={emoji}
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  title={`React ${emoji}`}
                                  aria-label={`React ${emoji}`}
                                  onClick={() => toggleReaction(message.id, emoji)}
                                >
                                  {emoji}
                                </Button>
                              ))}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                title="Reply"
                                aria-label="Reply"
                                onClick={() =>
                                  setReplyTo({
                                    id: message.id,
                                    content: message.content,
                                    senderId: message.senderId,
                                  })
                                }
                              >
                                <Reply className="h-4 w-4" />
                              </Button>
                              {(own || isAdmin) && (
                                <>
                                  {own && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      title="Edit message"
                                      aria-label="Edit message"
                                      onClick={() => {
                                        setEditingMessageId(message.id);
                                        setEditDraft(message.content);
                                      }}
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    title="Delete message"
                                    aria-label="Delete message"
                                    onClick={() => void deleteMessage(message.id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      {own && (
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground"
                          title="You"
                        >
                          {initials(me?.profile?.full_name || "You")}
                        </span>
                      )}
                    </div>
                  );
                })}
                <div ref={messageEndRef} />
              </div>
            )}
          </div>
          <div className="border-t bg-card px-3 py-3 sm:px-5">
            {replyTo && (
              <div className="mb-2 flex items-center gap-2 border-l-2 border-primary pl-2 text-xs">
                <span className="min-w-0 flex-1 truncate text-muted-foreground">
                  Replying to {memberNames.get(replyTo.senderId) ?? "member"}:{" "}
                  {replyTo.content || "Attachment"}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  aria-label="Cancel reply"
                  onClick={() => setReplyTo(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            {pendingFiles.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {pendingFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${file.lastModified}`}
                    className="flex max-w-full items-center gap-2 rounded-md bg-muted px-3 py-2 text-xs"
                  >
                    <Paperclip className="h-4 w-4 shrink-0" />
                    <span className="max-w-48 truncate">{file.name}</span>
                    <span className="text-muted-foreground">{fileSize(file.size)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      aria-label={`Remove ${file.name}`}
                      onClick={() =>
                        setPendingFiles((current) =>
                          current.filter((_, itemIndex) => itemIndex !== index),
                        )
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {!canSendMessages ? (
              <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                Only group admins can send messages.
              </p>
            ) : (
              <form className="flex items-end gap-2" onSubmit={(event) => void sendMessage(event)}>
                <input
                  ref={fileInputRef}
                  className="hidden"
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.webp,.pdf,.txt,.csv"
                  onChange={(event) => {
                    selectFiles(event.target.files);
                    event.target.value = "";
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  title="Attach files"
                  aria-label="Attach files"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus />
                </Button>
                <Textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void sendMessage();
                    }
                  }}
                  placeholder={`Message ${displayName(activeConversation)}`}
                  className="max-h-36 min-h-11 resize-y bg-background text-sm"
                  aria-label="Message"
                />
                <Button
                  type="submit"
                  size="icon"
                  aria-label="Send message"
                  disabled={busy || (!draft.trim() && pendingFiles.length === 0)}
                >
                  <Send />
                </Button>
              </form>
            )}
            <p className="mt-2 flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
              <Smile className="h-3 w-3" />
              Messages, replies, reactions and files stay within this conversation.
            </p>
          </div>
        </div>

        {showMembers && (
          <aside className="hidden w-64 shrink-0 border-l bg-card p-4 md:block">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">
                  {activeConversation.type === "GROUP" ? "Members" : "People"}
                </h3>
                <p className="text-xs text-muted-foreground">{members.length} people</p>
              </div>
              {canManageGroup && (
                <span className="text-xs text-muted-foreground">Admin controls</span>
              )}
            </div>
            <div className="space-y-1">
              {members.map((member) => (
                <div key={member.userId} className="flex items-center gap-2 py-2">
                  <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold">
                    {initials(member.fullName)}
                    <span
                      className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card ${
                        member.online ? "bg-success" : "bg-muted-foreground/50"
                      }`}
                    />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs">
                    {member.fullName || "TEAM BSY member"}
                    {member.userId === me?.id ? " · You" : ""}
                    {activeConversation.type === "GROUP" && (
                      <span className="block text-[10px] text-muted-foreground">
                        {member.memberRole}
                      </span>
                    )}
                    {!member.online && member.lastSeenAt && (
                      <span className="block text-[10px] text-muted-foreground">
                        Last seen {clockLabel(member.lastSeenAt)}
                      </span>
                    )}
                  </span>
                  {canManageGroup && member.userId !== me?.id && member.memberRole !== "OWNER" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      title="Remove member"
                      aria-label={`Remove ${member.fullName}`}
                      onClick={() => void removeMember(member.userId)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {canManageAdminRoles &&
                    member.userId !== me?.id &&
                    member.memberRole !== "OWNER" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-[10px]"
                        onClick={() =>
                          void updateMemberRole(
                            member.userId,
                            member.memberRole === "ADMIN" ? "MEMBER" : "ADMIN",
                          )
                        }
                      >
                        {member.memberRole === "ADMIN" ? "Remove admin" : "Make admin"}
                      </Button>
                    )}
                </div>
              ))}
            </div>
            {canManageGroup && (
              <div className="mt-3 border-t pt-3">
                <p className="mb-2 text-xs font-semibold">Add a member</p>
                <Input
                  className="mb-2"
                  placeholder="Search members"
                  aria-label="Search members"
                  value={memberSearch}
                  onChange={(event) => setMemberSearch(event.target.value)}
                />
                <div className="max-h-48 space-y-1 overflow-y-auto">
                  {directory
                    .filter((person) => !members.some((member) => member.userId === person.id))
                    .slice(0, 20)
                    .map((person) => (
                      <button
                        key={person.id}
                        onClick={() => void addMember(person.id)}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs hover:bg-muted"
                      >
                        <Plus className="h-3.5 w-3.5 text-primary" />
                        <span className="truncate">{person.fullName}</span>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );

  return (
    <AppShell
      title="Chat"
      actions={
        <span className="hidden text-xs text-muted-foreground sm:inline">
          {connected ? "Live connection" : "Reconnecting…"}
        </span>
      }
    >
      <div className="overflow-hidden rounded-lg border bg-card shadow-card">
        <div className="grid h-[calc(100dvh-11rem)] min-h-[540px] grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className={mobileShowConversation ? "hidden lg:block" : "block"}>
            {conversationList}
          </div>
          <div className={mobileShowConversation ? "block" : "hidden lg:block"}>
            {conversationView}
          </div>
        </div>
      </div>

      <Dialog open={privateOpen} onOpenChange={setPrivateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start a private chat</DialogTitle>
            <DialogDescription>Search registered TEAM BSY members by name.</DialogDescription>
          </DialogHeader>
          <Input
            value={privateSearch}
            onChange={(event) => setPrivateSearch(event.target.value)}
            placeholder="Search members"
            aria-label="Search members for private chat"
          />
          <div className="max-h-72 overflow-y-auto">
            {privateSearch.trim().length < 2 ? (
              <p className="p-3 text-xs text-muted-foreground">Enter at least two characters.</p>
            ) : privateUsersQuery.isLoading ? (
              <p className="p-3 text-xs text-muted-foreground">Searching…</p>
            ) : (
              privateUsers.map((user) => (
                <button
                  key={user.id}
                  disabled={busy}
                  onClick={() => void createPrivateConversation(user)}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-muted"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {initials(user.fullName)}
                  </span>
                  <span className="text-sm">{user.fullName}</span>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a group</DialogTitle>
            <DialogDescription>
              Bring TEAM BSY members together in a private conversation.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(event) => void createGroup(event)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="chat-group-name">
                Group name
              </label>
              <Input
                id="chat-group-name"
                required
                maxLength={150}
                value={groupName}
                onChange={(event) => setGroupName(event.target.value)}
                placeholder="e.g. Damganpur Volunteers"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="chat-group-description">
                Description
              </label>
              <Textarea
                id="chat-group-description"
                maxLength={1000}
                value={groupDescription}
                onChange={(event) => setGroupDescription(event.target.value)}
                placeholder="What is this group for?"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Add members</label>
              <Input
                placeholder="Search members"
                aria-label="Search members to add"
                value={memberSearch}
                onChange={(event) => setMemberSearch(event.target.value)}
              />
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border p-2">
                {directory.map((person) => (
                  <label
                    key={person.id}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 text-sm hover:bg-muted"
                  >
                    <input
                      type="checkbox"
                      checked={chosenMembers.includes(person.id)}
                      onChange={(event) =>
                        setChosenMembers((current) =>
                          event.target.checked
                            ? [...current, person.id]
                            : current.filter((id) => id !== person.id),
                        )
                      }
                    />
                    {person.fullName}
                  </label>
                ))}
                {memberSearch.trim().length < 2 && (
                  <p className="p-2 text-xs text-muted-foreground">
                    Enter at least two characters to find members.
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy || !groupName.trim()}>
                {busy ? "Creating…" : "Create group"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit group</DialogTitle>
            <DialogDescription>Update this group’s name and description.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(event) => void updateGroup(event)} className="space-y-4">
            <Input
              required
              maxLength={150}
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
              aria-label="Group name"
            />
            <Textarea
              maxLength={1000}
              value={groupDescription}
              onChange={(event) => setGroupDescription(event.target.value)}
              aria-label="Group description"
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={onlyAdminsCanSend}
                onChange={(event) => setOnlyAdminsCanSend(event.target.checked)}
                className="h-4 w-4"
              />
              Only admins can send messages
            </label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy || !groupName.trim()}>
                {busy ? "Saving…" : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chat notifications</DialogTitle>
            <DialogDescription>
              Unread notifications: {unreadNotificationsQuery.data ?? 0}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-80 space-y-1 overflow-y-auto">
            {(notificationsQuery.data ?? []).map((notification) => {
              const conversation = conversations.find(
                (item) => item.id === notification.conversationId,
              );
              return (
                <button
                  key={notification.id}
                  onClick={() => void openNotification(notification)}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-muted"
                >
                  <MessageCircle className="h-4 w-4 text-primary" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">
                      New message in {conversation ? displayName(conversation) : "conversation"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {clockLabel(notification.createdAt)}
                    </span>
                  </span>
                  {!notification.read && <span className="h-2 w-2 rounded-full bg-primary" />}
                </button>
              );
            })}
            {notificationsQuery.data?.length === 0 && (
              <p className="p-4 text-center text-sm text-muted-foreground">No notifications.</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                void chatApi
                  .markAllNotificationsRead()
                  .then(() =>
                    Promise.all([
                      queryClient.invalidateQueries({
                        queryKey: ["chat-notifications"],
                      }),
                      queryClient.invalidateQueries({
                        queryKey: ["chat-unread-notifications"],
                      }),
                    ]),
                  )
                  .catch((error: unknown) =>
                    toast.error(
                      error instanceof Error ? error.message : "Could not mark notifications read",
                    ),
                  )
              }
            >
              Mark all read
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function handleChatEvent(event: ChatEvent, queryClient: ReturnType<typeof useQueryClient>) {
  if (event.type === "MESSAGE") {
    const message = event.payload as ChatMessage;
    queryClient.setQueryData<InfiniteData<ChatMessage[]>>(
      ["chat-messages", event.conversationId],
      (current) => addMessage(current, message),
    );
    void queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
  } else if (event.type === "REACTIONS") {
    const update = event.payload as {
      messageId: string;
      reactions: ChatReaction[];
    };
    queryClient.setQueryData<InfiniteData<ChatMessage[]>>(
      ["chat-messages", event.conversationId],
      (current) =>
        current && {
          ...current,
          pages: current.pages.map((page) =>
            page.map((message) =>
              message.id === update.messageId
                ? { ...message, reactions: update.reactions }
                : message,
            ),
          ),
        },
    );
  } else if (event.type === "MESSAGE_UPDATED") {
    const updated = event.payload as ChatMessage;
    queryClient.setQueryData<InfiniteData<ChatMessage[]>>(
      ["chat-messages", event.conversationId],
      (current) =>
        current && {
          ...current,
          pages: current.pages.map((page) =>
            page.map((message) => (message.id === updated.id ? updated : message)),
          ),
        },
    );
    void queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
  } else if (event.type === "MESSAGE_DELETED") {
    const messageId = event.payload as string;
    queryClient.setQueryData<InfiniteData<ChatMessage[]>>(
      ["chat-messages", event.conversationId],
      (current) =>
        current && {
          ...current,
          pages: current.pages.map((page) => page.filter((message) => message.id !== messageId)),
        },
    );
    void queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
    void queryClient.invalidateQueries({
      queryKey: ["chat-messages", event.conversationId],
    });
  } else if (event.type === "READ_RECEIPTS") {
    void queryClient.invalidateQueries({
      queryKey: ["chat-messages", event.conversationId],
    });
  } else if (event.type === "NOTIFICATION") {
    void queryClient.invalidateQueries({ queryKey: ["chat-notifications"] });
    void queryClient.invalidateQueries({
      queryKey: ["chat-unread-notifications"],
    });
    void queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
  } else if (event.type === "MEMBERS_UPDATED" || event.type === "GROUP_UPDATED") {
    void queryClient.invalidateQueries({
      queryKey: ["chat-members", event.conversationId],
    });
    void queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
  }
}

function AttachmentItem({ attachment }: { attachment: ChatAttachment }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewable =
    attachment.mimeType.startsWith("image/") || attachment.mimeType === "application/pdf";

  useEffect(() => {
    let objectUrl: string | null = null;
    if (!previewable) return;
    void chatApi
      .attachment(attachment)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
      })
      .catch((error: unknown) => {
        toast.error(error instanceof Error ? error.message : "Could not load attachment");
      });
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attachment, previewable]);

  async function download() {
    try {
      const blob = await chatApi.attachment(attachment);
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = attachment.originalName;
      link.click();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not download attachment");
    }
  }

  return (
    <div className="mt-2">
      {attachment.mimeType.startsWith("image/") && previewUrl && (
        <a href={previewUrl} target="_blank" rel="noreferrer">
          <img
            src={previewUrl}
            alt={attachment.originalName}
            className="mb-2 max-h-64 max-w-full rounded-md object-contain"
          />
        </a>
      )}
      <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-xs">
        {attachment.mimeType.startsWith("image/") ? (
          <ImagePlus className="h-4 w-4 shrink-0 text-primary" />
        ) : (
          <FileText className="h-4 w-4 shrink-0 text-primary" />
        )}
        <span className="min-w-0 flex-1 truncate">{attachment.originalName}</span>
        <span className="shrink-0 text-muted-foreground">
          {attachment.mimeType.split("/").pop()?.toUpperCase()} · {fileSize(attachment.sizeBytes)}
        </span>
        {previewUrl && (
          <a href={previewUrl} target="_blank" rel="noreferrer" className="text-primary underline">
            Open
          </a>
        )}
        <button type="button" onClick={() => void download()} className="text-primary underline">
          Download
        </button>
      </div>
    </div>
  );
}
