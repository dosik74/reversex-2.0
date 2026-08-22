-- Fix search_path for all remaining functions
CREATE OR REPLACE FUNCTION public.award_xp(user_id UUID, xp_amount INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  new_xp INTEGER;
  new_level INTEGER;
BEGIN
  UPDATE profiles
  SET xp = xp + xp_amount
  WHERE id = user_id
  RETURNING xp INTO new_xp;
  
  new_level := calculate_level(new_xp);
  
  UPDATE profiles
  SET level = new_level
  WHERE id = user_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.award_xp_on_favorite()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM award_xp(NEW.user_id, 5);
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.award_xp_on_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM award_xp(NEW.user_id, 3);
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.award_xp_on_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM award_xp(NEW.user_id, 10);
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_friend_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;