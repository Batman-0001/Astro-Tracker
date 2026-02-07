import { create } from "zustand";
import { io } from "socket.io-client";
import api from "../services/api";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export const useChatStore = create((set, get) => ({
  messages: [],
  isConnected: false,
  isOpen: false,
  usersOnline: 0,
  typingUsers: [],
  hasMore: false,
  isLoadingHistory: false,
  socket: null,
  unreadCount: 0,

  // Toggle sidebar
  toggleChat: () => {
    const wasOpen = get().isOpen;
    set({ isOpen: !wasOpen });
    if (!wasOpen) set({ unreadCount: 0 });
  },

  openChat: () => set({ isOpen: true, unreadCount: 0 }),
  closeChat: () => set({ isOpen: false }),

  // Connect to /chat namespace with auth token
  connect: () => {
    const existing = get().socket;
    if (existing?.connected) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = io(`${SOCKET_URL}/chat`, {
      auth: { token },
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on("connect", () => {
      console.log("💬 Chat connected");
      set({ isConnected: true });
    });

    socket.on("disconnect", () => {
      set({ isConnected: false });
    });

    socket.on("connect_error", (err) => {
      console.log("💬 Chat auth error:", err.message);
      set({ isConnected: false });
    });

    socket.on("chat:message", (msg) => {
      set((state) => {
        const isOpen = state.isOpen;
        return {
          messages: [...state.messages, msg],
          unreadCount: isOpen ? 0 : state.unreadCount + 1,
        };
      });
    });

    socket.on("chat:users_online", (count) => {
      set({ usersOnline: count });
    });

    socket.on("chat:user_typing", ({ displayName }) => {
      set((state) => {
        if (state.typingUsers.includes(displayName)) return state;
        return { typingUsers: [...state.typingUsers, displayName] };
      });
    });

    socket.on("chat:user_stop_typing", ({ displayName }) => {
      set((state) => ({
        typingUsers: state.typingUsers.filter((n) => n !== displayName),
      }));
    });

    socket.on("chat:error", (msg) => {
      console.error("💬 Chat error:", msg);
    });

    set({ socket });
  },

  disconnect: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false, messages: [], typingUsers: [] });
    }
  },

  // Send a message
  sendMessage: (message) => {
    const socket = get().socket;
    if (socket?.connected && message.trim()) {
      socket.emit("chat:send", { message: message.trim() });
    }
  },

  // Typing indicators
  emitTyping: () => {
    const socket = get().socket;
    if (socket?.connected) socket.emit("chat:typing");
  },

  emitStopTyping: () => {
    const socket = get().socket;
    if (socket?.connected) socket.emit("chat:stop_typing");
  },

  // Load initial history via REST
  loadHistory: async () => {
    set({ isLoadingHistory: true });
    try {
      const res = await api.get("/api/chat/messages", {
        params: { limit: 50 },
      });
      set({
        messages: res.data.data,
        hasMore: res.data.hasMore,
        isLoadingHistory: false,
      });
    } catch {
      set({ isLoadingHistory: false });
    }
  },

  // Load older messages
  loadOlderMessages: async () => {
    const msgs = get().messages;
    if (!msgs.length || get().isLoadingHistory) return;

    const oldest = msgs[0]?.createdAt;
    if (!oldest) return;

    set({ isLoadingHistory: true });
    try {
      const res = await api.get("/api/chat/messages", {
        params: { before: oldest, limit: 50 },
      });
      set((state) => ({
        messages: [...res.data.data, ...state.messages],
        hasMore: res.data.hasMore,
        isLoadingHistory: false,
      }));
    } catch {
      set({ isLoadingHistory: false });
    }
  },
}));

export default useChatStore;
