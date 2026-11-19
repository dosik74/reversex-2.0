import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import supabase from "@/lib/supabase";
import FriendsSystem from "@/components/FriendsSystem";
import ChatWindow from "@/components/ChatWindow";

interface ChatTarget {
  id: string;
  username: string;
  avatar_url: string | null;
}

const FriendsPage = () => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatTarget, setChatTarget] = useState<ChatTarget | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id || null);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-400">
        Загрузка...
      </div>
    );
  }

  if (!currentUserId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-zinc-950 text-white">
        <h1 className="bk-title text-3xl">Друзья</h1>
        <p className="text-zinc-400">Войдите в аккаунт, чтобы найти друзей и писать им.</p>
        <Link to="/auth" className="bk-benzin rounded-full bg-white px-6 py-3 text-black">
          Войти
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-16">
      <div className="max-w-5xl mx-auto px-4 pt-8">
        <div className="mb-6">
          <p className="bk-eyebrow text-zinc-400 mb-2">Сообщество ReverseX</p>
          <h1 className="bk-title text-4xl">Друзья</h1>
        </div>

        <FriendsSystem
          userId={currentUserId}
          currentUserId={currentUserId}
          onMessage={(friend) =>
            setChatTarget({
              id: friend.id,
              username: friend.display_name || friend.username,
              avatar_url: friend.avatar_url,
            })
          }
        />
      </div>

      {chatTarget && (
        <ChatWindow
          open={!!chatTarget}
          onClose={() => setChatTarget(null)}
          friendId={chatTarget.id}
          friendUsername={chatTarget.username}
          friendAvatar={chatTarget.avatar_url}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
};

export default FriendsPage;
