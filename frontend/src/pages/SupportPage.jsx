import { useEffect, useRef, useState } from "react";
import MobileShell from "../components/MobileShell";
import sendIcon from "../assets/Icon/support/send.png";
import supportIcon from "../assets/Icon/support/support.png";

import {
  getSupportMessages,
  sendSupportMessage,
  hideOldSupportMessages,
} from "../api/client";

function getInitialMessage() {
  return {
    id: "initial-message",
    author: "EasyGO Поддержка",
    text: "Здравствуйте, чем могу помочь?",
    isAgent: true,
    role: "ai",
    createdAt: null,
  };
}

function extractCreatedAt(item) {
  return (
    item?.created_at ||
    item?.createdAt ||
    item?.timestamp ||
    item?.date ||
    null
  );
}

function normalizeMessages(data) {
  const rawMessages = Array.isArray(data)
    ? data
    : Array.isArray(data?.messages)
      ? data.messages
      : [];

  return rawMessages.map((item, index) => {
    const role = item.role || item.sender_type || "ai";
    const createdAt = extractCreatedAt(item);

    return {
      id: item.id ?? `msg-${index}-${role}`,
      author:
        role === "user"
          ? "Вы"
          : role === "operator"
            ? "Оператор"
            : role === "system"
              ? "EasyGO"
              : "EasyGO Поддержка",
      text: item.text || item.message || "",
      isAgent: role !== "user",
      role,
      createdAt,
    };
  });
}

function getMessageStableKey(message) {
  return `${message.role}__${message.text}`;
}

function mergeMessagesKeepCreatedAt(prevMessages, nextMessages) {
  const prevById = new Map();
  const prevByStableKey = new Map();

  prevMessages.forEach((msg) => {
    prevById.set(String(msg.id), msg);

    const stableKey = getMessageStableKey(msg);
    if (!prevByStableKey.has(stableKey)) {
      prevByStableKey.set(stableKey, msg);
    }
  });

  const merged = nextMessages.map((msg) => {
    if (msg.createdAt) return msg;

    const byId = prevById.get(String(msg.id));
    if (byId?.createdAt) {
      return {
        ...msg,
        createdAt: byId.createdAt,
      };
    }

    const byStableKey = prevByStableKey.get(getMessageStableKey(msg));
    if (byStableKey?.createdAt) {
      return {
        ...msg,
        createdAt: byStableKey.createdAt,
      };
    }

    return msg;
  });

  return merged.sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return aTime - bTime;
  });
}

function isSameDay(a, b) {
  if (!a || !b) return false;

  const da = new Date(a);
  const db = new Date(b);

  if (Number.isNaN(da.getTime()) || Number.isNaN(db.getTime())) return false;

  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

function formatMessageTime(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDayLabel(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffMs = today - target;
  const diffDays = Math.round(diffMs / 86400000);

  if (diffDays === 0) return "Сегодня";
  if (diffDays === 1) return "Вчера";

  return date.toLocaleDateString([], {
    day: "2-digit",
    month: "long",
  });
}

function buildRenderItems(messages) {
  const items = [];

  messages.forEach((message, index) => {
    const prev = messages[index - 1];
    const needDayDivider =
      !!message.createdAt &&
      (!prev || !isSameDay(prev.createdAt, message.createdAt));

    if (needDayDivider) {
      items.push({
        type: "day",
        id: `day-${message.id}`,
        label: formatDayLabel(message.createdAt),
      });
    }

    items.push({
      type: "message",
      ...message,
    });
  });

  return items;
}

function SupportPage() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([getInitialMessage()]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [hiding, setHiding] = useState(false);

  const chatRef = useRef(null);
  const pollingRef = useRef(null);
  const shouldStickToBottomRef = useRef(true);
  const forceScrollAfterSendRef = useRef(false);

  const scrollToBottom = (behavior = "smooth") => {
    if (!chatRef.current) return;
    chatRef.current.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior,
    });
  };

  const checkIsNearBottom = () => {
    if (!chatRef.current) return true;

    const { scrollTop, clientHeight, scrollHeight } = chatRef.current;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);

    return distanceFromBottom < 80;
  };

  useEffect(() => {
    const chatEl = chatRef.current;
    if (!chatEl) return;

    const handleScroll = () => {
      shouldStickToBottomRef.current = checkIsNearBottom();
    };

    chatEl.addEventListener("scroll", handleScroll);

    return () => {
      chatEl.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (forceScrollAfterSendRef.current) {
      scrollToBottom("smooth");
      forceScrollAfterSendRef.current = false;
      return;
    }

    if (shouldStickToBottomRef.current) {
      scrollToBottom("smooth");
    }
  }, [messages]);

  const loadMessages = async ({ silent = false } = {}) => {
    const token = localStorage.getItem("easygo_token");
    if (!token) return;

    try {
      if (!silent) setLoading(true);

      const data = await getSupportMessages();
      const normalized = normalizeMessages(data);

      setMessages((prev) => {
        const fallback = prev.length > 0 ? prev : [getInitialMessage()];
        const merged = mergeMessagesKeepCreatedAt(fallback, normalized);

        return merged.length > 0 ? merged : [getInitialMessage()];
      });
    } catch (error) {
      console.error("Failed to load support messages:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();

    pollingRef.current = setInterval(() => {
      loadMessages({ silent: true });
    }, 3000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const handleSendToBackend = async (text) => {
    const trimmedMessage = text.trim();
    if (!trimmedMessage || sending) return;

    const token = localStorage.getItem("easygo_token");
    if (!token) {
      alert("Сначала войдите в аккаунт.");
      return;
    }

    const nowIso = new Date().toISOString();
    const tempId = `temp-${Date.now()}`;

    forceScrollAfterSendRef.current = true;
    shouldStickToBottomRef.current = true;

    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        author: "Вы",
        text: trimmedMessage,
        isAgent: false,
        role: "user",
        createdAt: nowIso,
      },
    ]);

    setSending(true);

    try {
      const result = await sendSupportMessage(trimmedMessage);

      setMessages((prev) => {
        const withoutTemp = prev.filter((item) => item.id !== tempId);

        return [
          ...withoutTemp,
          {
            id: `${tempId}-user`,
            author: "Вы",
            text: trimmedMessage,
            isAgent: false,
            role: "user",
            createdAt: nowIso,
          },
          {
            id: `${tempId}-reply`,
            author:
              result.mode === "operator" ? "EasyGO" : "EasyGO Поддержка",
            text: result.reply || "Сообщение отправлено.",
            isAgent: true,
            role: result.mode === "operator" ? "system" : "ai",
            createdAt: new Date().toISOString(),
          },
        ];
      });

      setMessage("");
      await loadMessages({ silent: true });
    } catch (error) {
      console.error("Failed to send support message:", error);
      setMessages((prev) => prev.filter((item) => item.id !== tempId));
      alert("Не удалось отправить сообщение.");
    } finally {
      setSending(false);
    }
  };

  const handleSendMessage = async () => {
    await handleSendToBackend(message);
  };

  const handleQuickMessage = async (text) => {
    await handleSendToBackend(text);
  };

  const handleKeyDown = async (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      await handleSendMessage();
    }
  };

  const handleHideOldMessages = async () => {
    if (hiding) return;

    const confirmed = window.confirm(
      "Скрыть старые сообщения и начать новый диалог?"
    );

    if (!confirmed) return;

    try {
      setHiding(true);
      await hideOldSupportMessages();
      setMessages([getInitialMessage()]);
      shouldStickToBottomRef.current = true;
      forceScrollAfterSendRef.current = true;
    } catch (error) {
      console.error("Failed to hide old messages:", error);
      alert("Не удалось скрыть старые сообщения.");
    } finally {
      setHiding(false);
    }
  };

  const renderItems = buildRenderItems(messages);

  return (
    <MobileShell activeTab="support">
      <div className="page support-page">
        <div className="support-top-gradient" />

        <div className="support-content">
          <div className="support-header-row">
            <h1 className="support-title">Поддержка</h1>

            <button
              type="button"
              className="support-hide-btn"
              onClick={handleHideOldMessages}
              disabled={hiding || sending}
            >
              {hiding ? "..." : "Новый диалог"}
            </button>
          </div>

          <div className="support-chat-area" ref={chatRef}>
            {loading && messages.length === 0 ? (
              <div className="support-message-row">
                <div className="support-agent-icon">☎</div>
                <div className="support-message-bubble">
                  <div className="support-message-header">
                    <div className="support-message-author">EasyGO Поддержка</div>
                  </div>
                  <div className="support-message-text">Загрузка...</div>
                </div>
              </div>
            ) : (
              renderItems.map((item) => {
                if (item.type === "day") {
                  return (
                    <div key={item.id} className="support-day-divider">
                      <span>{item.label}</span>
                    </div>
                  );
                }

                return (
                  <div
                    key={item.id}
                    className={`support-message-row ${
                      item.isAgent ? "" : "support-message-row--user"
                    }`}
                  >
                    {item.isAgent && <div className="support-agent-icon"><img src={supportIcon} alt="support" /></div>} 
                    <div
                      className={`support-message-bubble ${
                        item.isAgent ? "" : "support-message-bubble--user"
                      }`}
                    >
                      <div className="support-message-header">
                        <div className="support-message-author">{item.author}</div>
                        <div className="support-message-time">
                          {formatMessageTime(item.createdAt)}
                        </div>
                      </div>

                      <div className="support-message-text">{item.text}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="support-bottom-area">
            <div className="support-quick-list">
              <button
                className="support-quick-chip"
                type="button"
                onClick={() => handleQuickMessage("Проблема с водителем")}
                disabled={sending}
              >
                Проблема с водителем
              </button>

              <button
                className="support-quick-chip"
                type="button"
                onClick={() => handleQuickMessage("Как работает рейтинг?")}
                disabled={sending}
              >
                Как работает рейтинг?
              </button>

              <button
                className="support-quick-chip"
                type="button"
                onClick={() => handleQuickMessage("Как отменить поездку?")}
                disabled={sending}
              >
                Как отменить поездку?
              </button>
            </div>

            <div className="support-input-row">
              <input
                className="support-input"
                placeholder="Сообщение"
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={sending}
              />

              <button
                className="support-send-btn"
                type="button"
                onClick={handleSendMessage}
                disabled={sending || !message.trim()}
              >
                <img src={sendIcon} alt="Отправить" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </MobileShell>
  );
}

export default SupportPage;