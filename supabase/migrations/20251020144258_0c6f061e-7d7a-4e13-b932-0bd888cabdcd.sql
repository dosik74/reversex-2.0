-- Create trigger function for friendship notifications
CREATE OR REPLACE FUNCTION public.notify_friend_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    INSERT INTO public.notifications (user_id, type, content, related_user_id, related_item_id)
    VALUES (
      NEW.friend_id,
      'friend_request',
      'sent you a friend request',
      NEW.user_id,
      NEW.id::text
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO public.notifications (user_id, type, content, related_user_id, related_item_id)
    VALUES (
      NEW.user_id,
      'friend_accept',
      'accepted your friend request',
      NEW.friend_id,
      NEW.id::text
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for friendship notifications
DROP TRIGGER IF EXISTS on_friendship_change ON public.friendships;
CREATE TRIGGER on_friendship_change
  AFTER INSERT OR UPDATE ON public.friendships
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_friend_request();

-- Add RLS policy for inserting notifications via trigger
CREATE POLICY "System can insert notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);