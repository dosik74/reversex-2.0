-- Fix calculate_level function
CREATE OR REPLACE FUNCTION public.calculate_level(xp_amount INTEGER)
RETURNS INTEGER
LANGUAGE SQL
IMMUTABLE
SET search_path = public
AS $function$
  SELECT FLOOR(SQRT(xp_amount / 100.0))::INTEGER + 1;
$function$;