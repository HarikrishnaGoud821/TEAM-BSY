import { apiFetch, apiFetchBlob } from "@/lib/api";

export type ChatAttachment = {
  id: string;
  messageId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  downloadUrl: string;
  createdAt: string;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  replyToId: string | null;
  replyPreview: {
    id: string;
    senderId: string;
    senderName: string;
    content: string;
    deleted: boolean;
  } | null;
  createdAt: string;
  editedAt: string | null;
  deleted: boolean;
  attachments: ChatAttachment[];
  reactions: ChatReaction[];
  readReceipts: {
    messageId: string;
    userId: string;
    userName: string;
    readAt: string;
  }[];
};

export type ChatConversation = {
  id: string;
  type: "PRIVATE" | "GROUP";
  name: string | null;
  displayName: string | null;
  otherUserId: string | null;
  description: string | null;
  onlyAdminsCanSend: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  latestMessage: ChatMessage | null;
  unreadCount: number;
};

export type ChatMember = {
  userId: string;
  fullName: string;
  mobile: string | null;
  memberRole: string;
  joinedAt: string;
  online: boolean;
  lastSeenAt: string | null;
};

export type ChatUser = {
  id: string;
  fullName: string;
};

export type ChatReaction = {
  id: string;
  messageId: string;
  userId: string;
  userName: string;
  emoji: string;
  createdAt: string;
};

export type ChatNotification = {
  id: string;
  conversationId: string;
  messageId: string | null;
  type: string;
  createdAt: string;
  readAt: string | null;
  read: boolean;
};

export type ChatEvent = {
  conversationId: string | null;
  type: string;
  payload: unknown;
};

export type ChatUploadLimits = {
  maxFileSizeBytes: number;
  maxFilesPerMessage: number;
};

const route = (conversationId: string) => `/chat/${encodeURIComponent(conversationId)}`;

export const chatApi = {
  conversations: () => apiFetch<ChatConversation[]>("/chat/conversations"),

  conversation: (id: string) =>
    apiFetch<ChatConversation>(`/chat/conversations/${encodeURIComponent(id)}`),

  searchUsers: (query: string) =>
    apiFetch<ChatUser[]>(`/chat/users/search?q=${encodeURIComponent(query)}`),

  uploadLimits: () => apiFetch<ChatUploadLimits>("/chat/upload-limits"),

  createPrivate: (targetUserId: string) =>
    apiFetch<ChatConversation>("/chat/private", {
      method: "POST",
      body: JSON.stringify({ targetUserId }),
    }),

  createGroup: (name: string, description: string, memberIds: string[]) =>
    apiFetch<ChatConversation>("/chat/groups", {
      method: "POST",
      body: JSON.stringify({ name, description, memberIds }),
    }),

  messages: (conversationId: string, page = 0, size = 50) =>
    apiFetch<ChatMessage[]>(`${route(conversationId)}/messages?page=${page}&size=${size}`),

  message: (conversationId: string, messageId: string) =>
    apiFetch<ChatMessage>(`${route(conversationId)}/messages/${encodeURIComponent(messageId)}`),

  sendMessage: (
    conversationId: string,
    content: string,
    replyToId: string | null,
    files: File[],
  ) => {
    if (files.length === 0) {
      return apiFetch<ChatMessage>(`${route(conversationId)}/messages`, {
        method: "POST",
        body: JSON.stringify({ content, replyToId }),
      });
    }

    const form = new FormData();
    form.set("content", content);
    if (replyToId) form.set("replyToId", replyToId);
    for (const file of files) form.append("files", file);
    return apiFetch<ChatMessage>(`${route(conversationId)}/messages`, {
      method: "POST",
      body: form,
    });
  },

  members: (conversationId: string) => apiFetch<ChatMember[]>(`${route(conversationId)}/members`),

  updateGroup: (
    conversationId: string,
    name: string,
    description: string,
    onlyAdminsCanSend: boolean,
  ) =>
    apiFetch<ChatConversation>(`${route(conversationId)}/group`, {
      method: "PUT",
      body: JSON.stringify({ name, description, onlyAdminsCanSend }),
    }),

  addMember: (conversationId: string, userId: string) =>
    apiFetch<void>(`${route(conversationId)}/members`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),

  removeMember: (conversationId: string, userId: string) =>
    apiFetch<void>(`${route(conversationId)}/members/${encodeURIComponent(userId)}`, {
      method: "DELETE",
    }),

  updateMemberRole: (conversationId: string, userId: string, role: "ADMIN" | "MEMBER") =>
    apiFetch<void>(
      `${route(conversationId)}/members/${encodeURIComponent(userId)}/role`,
      { method: "PUT", body: JSON.stringify({ role }) },
    ),

  searchMessages: (conversationId: string, query: string, page = 0) =>
    apiFetch<ChatMessage[]>(
      `${route(conversationId)}/search?q=${encodeURIComponent(query)}&page=${page}&size=50`,
    ),

  reactions: (conversationId: string, messageId: string) =>
    apiFetch<ChatReaction[]>(
      `${route(conversationId)}/messages/${encodeURIComponent(messageId)}/reactions`,
    ),

  toggleReaction: (conversationId: string, messageId: string, emoji: string) =>
    apiFetch<boolean>(
      `${route(conversationId)}/messages/${encodeURIComponent(messageId)}/reactions`,
      { method: "POST", body: JSON.stringify({ emoji }) },
    ),

  editMessage: (conversationId: string, messageId: string, content: string) =>
    apiFetch<ChatMessage>(`${route(conversationId)}/messages/${encodeURIComponent(messageId)}`, {
      method: "PUT",
      body: JSON.stringify({ content }),
    }),

  deleteMessage: (conversationId: string, messageId: string) =>
    apiFetch<void>(`${route(conversationId)}/messages/${encodeURIComponent(messageId)}`, {
      method: "DELETE",
    }),

  markRead: (conversationId: string, messageIds: string[]) =>
    apiFetch<unknown[]>(`${route(conversationId)}/read`, {
      method: "POST",
      body: JSON.stringify({ messageIds }),
    }),

  notifications: () => apiFetch<ChatNotification[]>("/chat/notifications?page=0&size=50"),

  unreadNotificationCount: () => apiFetch<number>("/chat/notifications/unread-count"),

  markNotificationRead: (notificationId: string) =>
    apiFetch<void>(`/chat/notifications/${encodeURIComponent(notificationId)}/read`, {
      method: "POST",
    }),

  markAllNotificationsRead: () =>
    apiFetch<void>("/chat/notifications/read-all", { method: "POST" }),

  attachment: (attachment: ChatAttachment) => apiFetchBlob(attachment.downloadUrl),
};
