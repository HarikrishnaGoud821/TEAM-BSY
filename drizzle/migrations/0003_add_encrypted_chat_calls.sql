CREATE TABLE public.chat_call_devices (
  user_id uuid PRIMARY KEY,
  public_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.chat_call_devices TO authenticated;
GRANT ALL ON public.chat_call_devices TO service_role;
ALTER TABLE public.chat_call_devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat call device keys read by shared group members" ON public.chat_call_devices FOR SELECT TO authenticated
USING (user_id = auth.uid() OR EXISTS (
  SELECT 1 FROM public.chat_group_members m
  WHERE m.user_id = chat_call_devices.user_id
    AND public.is_chat_group_member(m.group_id::text, auth.uid())
));
CREATE POLICY "chat call device key owner write" ON public.chat_call_devices FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());
CREATE POLICY "chat call device key owner update" ON public.chat_call_devices FOR UPDATE TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.chat_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.chat_groups(id) ON DELETE CASCADE,
  caller_id uuid NOT NULL,
  recipient_id uuid,
  room_name text NOT NULL UNIQUE,
  call_type text NOT NULL CHECK (call_type IN ('AUDIO', 'VIDEO')),
  status text NOT NULL DEFAULT 'RINGING' CHECK (status IN ('RINGING', 'ACTIVE', 'ENDED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  CONSTRAINT chat_calls_direct_not_self CHECK (recipient_id IS NULL OR recipient_id <> caller_id)
);
GRANT SELECT, INSERT ON public.chat_calls TO authenticated;
GRANT UPDATE (status, ended_at) ON public.chat_calls TO authenticated;
GRANT ALL ON public.chat_calls TO service_role;
ALTER TABLE public.chat_calls ENABLE ROW LEVEL SECURITY;
CREATE INDEX chat_calls_group_status_idx ON public.chat_calls(group_id, status, created_at DESC);

CREATE TABLE public.chat_call_members (
  call_id uuid NOT NULL REFERENCES public.chat_calls(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'INVITED' CHECK (status IN ('INVITED', 'JOINED', 'DECLINED', 'LEFT')),
  joined_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (call_id, user_id)
);
GRANT SELECT ON public.chat_call_members TO authenticated;
GRANT UPDATE (status, joined_at, updated_at) ON public.chat_call_members TO authenticated;
GRANT ALL ON public.chat_call_members TO service_role;
ALTER TABLE public.chat_call_members ENABLE ROW LEVEL SECURITY;
CREATE INDEX chat_call_members_user_idx ON public.chat_call_members(user_id, call_id);

CREATE TABLE public.chat_call_key_packages (
  call_id uuid NOT NULL REFERENCES public.chat_calls(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_by uuid NOT NULL,
  ephemeral_public_key text NOT NULL,
  iv text NOT NULL,
  encrypted_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (call_id, user_id)
);
GRANT SELECT, INSERT ON public.chat_call_key_packages TO authenticated;
GRANT ALL ON public.chat_call_key_packages TO service_role;
ALTER TABLE public.chat_call_key_packages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_chat_call_member(_call_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.chat_call_members m WHERE m.call_id = _call_id AND m.user_id = auth.uid()
  )
$$;
REVOKE ALL ON FUNCTION public.is_chat_call_member(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_chat_call_member(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.chat_seed_call_members() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.recipient_id IS NOT NULL THEN
    IF NOT public.is_chat_group_member(NEW.group_id::text, NEW.recipient_id) THEN
      RAISE EXCEPTION 'Direct call recipient must be a group member' USING ERRCODE = '42501';
    END IF;
    INSERT INTO public.chat_call_members(call_id, user_id) VALUES (NEW.id, NEW.caller_id), (NEW.id, NEW.recipient_id);
  ELSE
    INSERT INTO public.chat_call_members(call_id, user_id)
    SELECT NEW.id, m.user_id FROM public.chat_group_members m
    JOIN public.chat_call_devices d ON d.user_id = m.user_id
    WHERE m.group_id = NEW.group_id
    ON CONFLICT DO NOTHING;
    INSERT INTO public.chat_call_members(call_id, user_id) VALUES (NEW.id, NEW.caller_id) ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER chat_calls_seed_members AFTER INSERT ON public.chat_calls
FOR EACH ROW EXECUTE FUNCTION public.chat_seed_call_members();

CREATE OR REPLACE FUNCTION public.chat_validate_call_key_package() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR NEW.created_by <> auth.uid()
     OR NOT EXISTS (SELECT 1 FROM public.chat_call_members m WHERE m.call_id = NEW.call_id AND m.user_id = NEW.user_id)
     OR NOT EXISTS (SELECT 1 FROM public.chat_call_members m WHERE m.call_id = NEW.call_id AND m.user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Invalid call key package participant' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER chat_call_key_packages_validate BEFORE INSERT ON public.chat_call_key_packages
FOR EACH ROW EXECUTE FUNCTION public.chat_validate_call_key_package();

CREATE POLICY "chat call participants read calls" ON public.chat_calls FOR SELECT TO authenticated
USING (public.is_chat_call_member(id, auth.uid()));
CREATE POLICY "chat group members create calls" ON public.chat_calls FOR INSERT TO authenticated
WITH CHECK (
  caller_id = auth.uid()
  AND public.is_chat_group_member(group_id::text, auth.uid())
  AND (recipient_id IS NULL OR public.is_chat_group_member(group_id::text, recipient_id))
);
CREATE POLICY "chat call participants update status" ON public.chat_calls FOR UPDATE TO authenticated
USING (public.is_chat_call_member(id, auth.uid()))
WITH CHECK (public.is_chat_call_member(id, auth.uid()));

CREATE POLICY "chat call participants read roster" ON public.chat_call_members FOR SELECT TO authenticated
USING (public.is_chat_call_member(call_id, auth.uid()));
CREATE POLICY "chat call member update own status" ON public.chat_call_members FOR UPDATE TO authenticated
USING (user_id = auth.uid() AND public.is_chat_call_member(call_id, auth.uid()))
WITH CHECK (user_id = auth.uid() AND public.is_chat_call_member(call_id, auth.uid()));

CREATE POLICY "chat call recipient read encrypted key" ON public.chat_call_key_packages FOR SELECT TO authenticated
USING (user_id = auth.uid() AND public.is_chat_call_member(call_id, auth.uid()));
CREATE POLICY "chat caller distribute encrypted keys" ON public.chat_call_key_packages FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid() AND public.is_chat_call_member(call_id, auth.uid()));

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_calls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_call_members;
