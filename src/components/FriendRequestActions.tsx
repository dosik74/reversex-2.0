import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import supabase from "@/utils/supabase";
import { toast } from "sonner";
import { useState } from "react";
interface FriendRequestActionsProps {
  friendshipId: string;
  onAction?: (payload?: { friendshipId: string; status: 'accepted' | 'rejected' }) => void;
}

const FriendRequestActions = ({ friendshipId, onAction }: FriendRequestActionsProps) => {
  const [loading, setLoading] = useState(false);
  const handleAccept = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', friendshipId);

      if (error) throw error;
      toast.success('Friend request accepted!');
      onAction?.({ friendshipId, status: 'accepted' });
    } catch (error: any) {
      toast.error('Failed to accept request');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

      if (error) throw error;
      toast.success('Friend request rejected');
      onAction?.({ friendshipId, status: 'rejected' });
    } catch (error: any) {
      toast.error('Failed to reject request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button onClick={handleAccept} size="sm" className="gap-1">
        <Check className="w-4 h-4" />
        Accept
      </Button>
      <Button onClick={handleReject} size="sm" variant="outline" className="gap-1">
        <X className="w-4 h-4" />
        Reject
      </Button>
    </div>
  );
};

export default FriendRequestActions;
