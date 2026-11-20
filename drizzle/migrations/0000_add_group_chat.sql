CREATE TABLE public.chat_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);
GRANT SELECT, INSERT, UPDATE ON public.chat_groups TO authenticated;
GRANT ALL ON public.chat_groups TO service_role;
ALTER TABLE public.chat_groups ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.chat_group_members (
  group_id uuid NOT NULL REFERENCES public.chat_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  added_by uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.chat_group_members TO authenticated;
GRANT UPDATE (last_read_at) ON public.chat_group_members TO authenticated;
GRANT ALL ON public.chat_group_members TO service_role;
ALTER TABLE public.chat_group_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.chat_groups(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  reply_to_id uuid REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  content text NOT NULL DEFAULT '',
  attachment_key text,
  attachment_name text,
  attachment_mime text,
  attachment_size bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz,
  CONSTRAINT chat_messages_content_or_file CHECK (length(trim(content)) > 0 OR attachment_key IS NOT NULL),
  CONSTRAINT chat_messages_content_length CHECK (length(content) <= 10000)
);
CREATE INDEX chat_messages_group_created_idx ON public.chat_messages(group_id, created_at DESC);
GRANT SELECT, INSERT ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.chat_message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.chat_groups(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id, emoji),
  CONSTRAINT chat_reaction_emoji_length CHECK (length(emoji) BETWEEN 1 AND 16)
);
CREATE INDEX chat_reactions_group_idx ON public.chat_message_reactions(group_id, message_id);
GRANT SELECT, INSERT, DELETE ON public.chat_message_reactions TO authenticated;
GRANT ALL ON public.chat_message_reactions TO service_role;
ALTER TABLE public.chat_message_reactions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_chat_group_member(_group_id text, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.chat_group_members m WHERE m.group_id::text = _group_id AND m.user_id = _user_id)
$$;
REVOKE ALL ON FUNCTION public.is_chat_group_member(text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_chat_group_member(text, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_chat_group_members(_group_id uuid)
RETURNS TABLE(user_id uuid, full_name text, joined_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_chat_group_member(_group_id::text, auth.uid()) AND NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Not a group member' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
    SELECT m.user_id, COALESCE(p.full_name, ''), m.joined_at
    FROM public.chat_group_members m
    LEFT JOIN public.profiles p ON p.id = m.user_id
    WHERE m.group_id = _group_id
    ORDER BY m.joined_at ASC;
END; $$;
REVOKE ALL ON FUNCTION public.get_chat_group_members(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_chat_group_members(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.chat_validate_message_refs() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.reply_to_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.chat_messages parent WHERE parent.id = NEW.reply_to_id AND parent.group_id = NEW.group_id
  ) THEN
    RAISE EXCEPTION 'Reply must belong to the same group';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER chat_messages_validate_refs BEFORE INSERT OR UPDATE OF reply_to_id, group_id ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION public.chat_validate_message_refs();

CREATE OR REPLACE FUNCTION public.chat_validate_reaction_ref() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.chat_messages m WHERE m.id = NEW.message_id AND m.group_id = NEW.group_id) THEN
    RAISE EXCEPTION 'Reaction must belong to a message in the same group';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER chat_reactions_validate_ref BEFORE INSERT OR UPDATE OF message_id, group_id ON public.chat_message_reactions
FOR EACH ROW EXECUTE FUNCTION public.chat_validate_reaction_ref();

CREATE OR REPLACE FUNCTION public.chat_add_group_creator() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.chat_group_members(group_id, user_id, added_by) VALUES (NEW.id, NEW.created_by, NEW.created_by);
  RETURN NEW;
END; $$;
CREATE TRIGGER chat_groups_add_creator AFTER INSERT ON public.chat_groups FOR EACH ROW EXECUTE FUNCTION public.chat_add_group_creator();

CREATE POLICY "chat groups read" ON public.chat_groups FOR SELECT TO authenticated
USING (public.is_chat_group_member(id::text, auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "chat groups admin create" ON public.chat_groups FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid() AND public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "chat groups admin update" ON public.chat_groups FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "chat members read" ON public.chat_group_members FOR SELECT TO authenticated
USING (public.is_chat_group_member(group_id::text, auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "chat members admin add" ON public.chat_group_members FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) AND added_by = auth.uid());
CREATE POLICY "chat members admin remove" ON public.chat_group_members FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "chat members update own read time" ON public.chat_group_members FOR UPDATE TO authenticated
USING (user_id = auth.uid() AND public.is_chat_group_member(group_id::text, auth.uid()))
WITH CHECK (user_id = auth.uid() AND public.is_chat_group_member(group_id::text, auth.uid()));

CREATE POLICY "chat messages read" ON public.chat_messages FOR SELECT TO authenticated
USING (public.is_chat_group_member(group_id::text, auth.uid()));
CREATE POLICY "chat messages send" ON public.chat_messages FOR INSERT TO authenticated
WITH CHECK (sender_id = auth.uid() AND public.is_chat_group_member(group_id::text, auth.uid()));

CREATE POLICY "chat reactions read" ON public.chat_message_reactions FOR SELECT TO authenticated
USING (public.is_chat_group_member(group_id::text, auth.uid()));
CREATE POLICY "chat reactions add" ON public.chat_message_reactions FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND public.is_chat_group_member(group_id::text, auth.uid()));
CREATE POLICY "chat reactions remove" ON public.chat_message_reactions FOR DELETE TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "chat file upload by member" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'group-chat-files' AND public.is_chat_group_member((storage.foldername(name))[1], auth.uid()) AND (storage.foldername(name))[2] = auth.uid()::text);
CREATE POLICY "chat file read by member" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'group-chat-files' AND public.is_chat_group_member((storage.foldername(name))[1], auth.uid()));

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_message_reactions;