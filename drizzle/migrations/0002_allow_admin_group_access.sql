CREATE OR REPLACE FUNCTION public.is_chat_group_member(_group_id text, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _user_id = auth.uid() AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1 FROM public.chat_group_members m
      WHERE m.group_id::text = _group_id AND m.user_id = auth.uid()
    )
  )
$$;
REVOKE ALL ON FUNCTION public.is_chat_group_member(text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_chat_group_member(text, uuid) TO authenticated;