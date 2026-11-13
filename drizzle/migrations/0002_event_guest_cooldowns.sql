ALTER TABLE public.events ADD COLUMN cooldown_minutes integer NOT NULL DEFAULT 5 CHECK (cooldown_minutes BETWEEN 0 AND 60);
CREATE TABLE public.guest_request_activity (
 event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
 guest_hash text NOT NULL,
 last_requested_at timestamptz NOT NULL,
 PRIMARY KEY (event_id, guest_hash)
);
GRANT ALL ON public.guest_request_activity TO service_role;
ALTER TABLE public.guest_request_activity ENABLE ROW LEVEL SECURITY;
CREATE INDEX song_requests_guest_time_idx ON public.song_requests (event_id, client_hash, created_at DESC);
CREATE OR REPLACE FUNCTION public.submit_event_song_request(p_slug text, p_guest_hash text, p_title text, p_artist text, p_guest_name text, p_message text, p_normalized_key text)
RETURNS jsonb LANGUAGE plpgsql SET search_path = public AS $$
DECLARE ev public.events%ROWTYPE; last_request timestamptz; remaining integer; request_count integer; accepted_at timestamptz;
BEGIN
 SELECT * INTO ev FROM public.events WHERE slug = p_slug FOR SHARE;
 IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'This party link isn''t valid. Ask the DJ for the QR code.'); END IF;
 IF NOT ev.is_open THEN RETURN jsonb_build_object('ok', false, 'error', 'Requests are closed for this party.'); END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(ev.id::text || ':guest:' || p_guest_hash, 0));
 PERFORM pg_advisory_xact_lock(hashtextextended(ev.id::text || ':song:' || p_normalized_key, 0));
 accepted_at := clock_timestamp();
 SELECT last_requested_at INTO last_request FROM public.guest_request_activity WHERE event_id = ev.id AND guest_hash = p_guest_hash;
 remaining := CASE WHEN ev.cooldown_minutes = 0 OR last_request IS NULL THEN 0 ELSE greatest(0, ceil(extract(epoch FROM (last_request + make_interval(mins => ev.cooldown_minutes) - accepted_at)))::integer) END;
 IF remaining > 0 THEN RETURN jsonb_build_object('ok', false, 'error', 'Please wait before requesting another song.', 'remainingSeconds', remaining, 'cooldownMinutes', ev.cooldown_minutes); END IF;
 SELECT count(*) INTO request_count FROM public.song_requests WHERE event_id = ev.id AND client_hash = p_guest_hash AND created_at >= accepted_at - interval '10 minutes';
 IF request_count >= 3 THEN RETURN jsonb_build_object('ok', false, 'error', 'Easy there! Max 3 requests every 10 minutes.'); END IF;
 IF EXISTS (SELECT 1 FROM public.song_requests WHERE event_id = ev.id AND normalized_key = p_normalized_key AND status IN ('pending', 'approved') AND created_at >= accepted_at - interval '3 hours') THEN
 RETURN jsonb_build_object('ok', false, 'error', 'Someone already requested this one — it''s in the queue!'); END IF;
 INSERT INTO public.song_requests(event_id, title, artist, guest_name, message, normalized_key, client_hash, created_at)
 VALUES(ev.id, p_title, p_artist, nullif(p_guest_name, ''), nullif(p_message, ''), p_normalized_key, p_guest_hash, accepted_at);
 INSERT INTO public.guest_request_activity(event_id, guest_hash, last_requested_at) VALUES(ev.id, p_guest_hash, accepted_at)
 ON CONFLICT(event_id, guest_hash) DO UPDATE SET last_requested_at = EXCLUDED.last_requested_at;
 RETURN jsonb_build_object('ok', true, 'remainingSeconds', ev.cooldown_minutes * 60, 'cooldownMinutes', ev.cooldown_minutes);
END;
$$;
REVOKE ALL ON FUNCTION public.submit_event_song_request(text,text,text,text,text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_event_song_request(text,text,text,text,text,text,text) TO service_role;