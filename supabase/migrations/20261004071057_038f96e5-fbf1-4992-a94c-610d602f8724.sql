CREATE TYPE public.app_role AS ENUM ('admin','mentor','treasurer','volunteer','member','viewer');

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  mobile text,
  village text, mandal text, district text, pincode text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT, INSERT, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles public.app_role[]) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = ANY(_roles))
$$;

CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','treasurer','mentor']::public.app_role[]));
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

CREATE POLICY "roles read" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin add roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin remove roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin') AND user_id <> auth.uid());

CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, mobile)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''), NEW.raw_user_meta_data->>'mobile');
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'member');
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- receipt counters
CREATE TABLE public.receipt_counters (prefix text PRIMARY KEY, last_value bigint NOT NULL DEFAULT 0);
GRANT ALL ON public.receipt_counters TO service_role;
ALTER TABLE public.receipt_counters ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.next_receipt_number(_year int) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v bigint; p text := 'BSY-' || _year;
BEGIN
  INSERT INTO public.receipt_counters(prefix, last_value) VALUES (p, 1)
  ON CONFLICT (prefix) DO UPDATE SET last_value = receipt_counters.last_value + 1
  RETURNING last_value INTO v;
  RETURN p || '-' || lpad(v::text, 6, '0');
END; $$;
REVOKE EXECUTE ON FUNCTION public.next_receipt_number(int) FROM PUBLIC, anon, authenticated;

-- contributions
CREATE TABLE public.contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_no bigserial UNIQUE,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'INR',
  donation_mode text NOT NULL CHECK (donation_mode IN ('ONLINE','OFFLINE')),
  payment_method text NOT NULL CHECK (payment_method IN ('CASH','RAZORPAY','QR')),
  payment_provider text,
  payment_status text NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING','SUCCESS','FAILED')),
  order_id text UNIQUE,
  payment_id text UNIQUE,
  transaction_id text,
  receipt_number text UNIQUE,
  donor_name text NOT NULL,
  donor_mobile text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  village text, mandal text, district text, pincode text,
  purpose text, notes text,
  donation_date date NOT NULL DEFAULT current_date,
  entered_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  entered_by_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX contributions_user_idx ON public.contributions(user_id);
CREATE INDEX contributions_date_idx ON public.contributions(donation_date);
CREATE INDEX contributions_status_idx ON public.contributions(payment_status);
GRANT SELECT, INSERT ON public.contributions TO authenticated;
GRANT ALL ON public.contributions TO service_role;
GRANT USAGE ON SEQUENCE public.contributions_serial_no_seq TO authenticated;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contrib read" ON public.contributions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','treasurer','mentor']::public.app_role[]));
CREATE POLICY "cash by admin/mentor" ON public.contributions FOR INSERT TO authenticated
  WITH CHECK (donation_mode = 'OFFLINE' AND payment_method = 'CASH' AND payment_status = 'SUCCESS'
    AND entered_by = auth.uid() AND order_id IS NULL AND payment_id IS NULL
    AND public.has_any_role(auth.uid(), ARRAY['admin','mentor']::public.app_role[]));

CREATE OR REPLACE FUNCTION public.contribution_before() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  IF NEW.payment_status = 'SUCCESS' AND NEW.receipt_number IS NULL THEN
    NEW.receipt_number = public.next_receipt_number(EXTRACT(YEAR FROM NEW.donation_date)::int);
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER contributions_before BEFORE INSERT OR UPDATE ON public.contributions FOR EACH ROW EXECUTE FUNCTION public.contribution_before();

-- expenses
CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_no bigserial UNIQUE,
  mentor_id uuid NOT NULL REFERENCES auth.users(id),
  mentor_name text NOT NULL,
  mentor_mobile text,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  expense_date date NOT NULL DEFAULT current_date,
  category text NOT NULL,
  purpose text NOT NULL,
  description text, notes text,
  shop_name text NOT NULL,
  shop_owner text, shop_contact text, shop_address text,
  village text, mandal text, district text, pincode text,
  payment_method text NOT NULL CHECK (payment_method IN ('CASH','UPI','BANK_TRANSFER','OTHER')),
  payment_reference text,
  receipt_file_key text, receipt_file_name text, receipt_content_type text, receipt_uploaded_at timestamptz,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED')),
  rejection_reason text,
  reviewed_by uuid REFERENCES auth.users(id), reviewed_by_name text, reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX expenses_mentor_idx ON public.expenses(mentor_id);
CREATE INDEX expenses_date_idx ON public.expenses(expense_date);
GRANT SELECT, INSERT, UPDATE ON public.expenses TO authenticated;
GRANT USAGE ON SEQUENCE public.expenses_serial_no_seq TO authenticated;
GRANT ALL ON public.expenses TO service_role;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expense read" ON public.expenses FOR SELECT TO authenticated
  USING (mentor_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','treasurer']::public.app_role[]));
CREATE POLICY "expense create" ON public.expenses FOR INSERT TO authenticated
  WITH CHECK (mentor_id = auth.uid() AND status = 'PENDING' AND public.has_any_role(auth.uid(), ARRAY['admin','mentor']::public.app_role[]));
CREATE POLICY "expense update" ON public.expenses FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR (mentor_id = auth.uid() AND status = 'PENDING'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR (mentor_id = auth.uid() AND status = 'PENDING'));

CREATE OR REPLACE FUNCTION public.expense_guard() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  IF NOT public.has_role(auth.uid(),'admin') THEN
    NEW.status = OLD.status; NEW.reviewed_by = OLD.reviewed_by; NEW.reviewed_at = OLD.reviewed_at;
    NEW.reviewed_by_name = OLD.reviewed_by_name; NEW.rejection_reason = OLD.rejection_reason;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER expenses_guard BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.expense_guard();

CREATE TABLE public.expense_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  quantity numeric(10,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price numeric(12,2) NOT NULL CHECK (unit_price >= 0),
  total_price numeric(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);
CREATE INDEX expense_items_exp_idx ON public.expense_items(expense_id);
GRANT SELECT, INSERT, DELETE ON public.expense_items TO authenticated;
GRANT ALL ON public.expense_items TO service_role;
ALTER TABLE public.expense_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "items read" ON public.expense_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.expenses e WHERE e.id = expense_id));
CREATE POLICY "items write" ON public.expense_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.expenses e WHERE e.id = expense_id AND e.mentor_id = auth.uid() AND e.status = 'PENDING'));
CREATE POLICY "items delete" ON public.expense_items FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.expenses e WHERE e.id = expense_id AND e.mentor_id = auth.uid() AND e.status = 'PENDING'));

CREATE OR REPLACE FUNCTION public.recalc_expense_total() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE eid uuid := COALESCE(NEW.expense_id, OLD.expense_id);
BEGIN
  UPDATE public.expenses SET amount = COALESCE((SELECT sum(total_price) FROM public.expense_items WHERE expense_id = eid),0) WHERE id = eid;
  RETURN NULL;
END; $$;
CREATE TRIGGER expense_items_total AFTER INSERT OR DELETE ON public.expense_items FOR EACH ROW EXECUTE FUNCTION public.recalc_expense_total();

-- audit
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid, action text NOT NULL, entity text NOT NULL, entity_id text, details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_created_idx ON public.audit_logs(created_at DESC);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin audit read" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.audit_row() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE act text;
BEGIN
  IF TG_TABLE_NAME = 'contributions' THEN
    IF TG_OP = 'INSERT' THEN act := CASE WHEN NEW.payment_method='CASH' THEN 'Recorded cash contribution' ELSE 'Started online payment' END;
    ELSIF OLD.payment_status <> NEW.payment_status THEN act := 'Payment marked ' || NEW.payment_status;
    ELSE RETURN NEW; END IF;
    INSERT INTO public.audit_logs(user_id, action, entity, entity_id, details)
      VALUES (auth.uid(), act, 'contribution', NEW.id::text, jsonb_build_object('amount', NEW.amount, 'donor', NEW.donor_name, 'receipt', NEW.receipt_number));
  ELSIF TG_TABLE_NAME = 'expenses' THEN
    IF TG_OP = 'INSERT' THEN act := 'Recorded expense';
    ELSIF OLD.status <> NEW.status THEN act := 'Expense ' || lower(NEW.status);
    ELSIF OLD.receipt_file_key IS DISTINCT FROM NEW.receipt_file_key THEN act := 'Uploaded shop receipt';
    ELSE RETURN NEW; END IF;
    INSERT INTO public.audit_logs(user_id, action, entity, entity_id, details)
      VALUES (auth.uid(), act, 'expense', NEW.id::text, jsonb_build_object('amount', NEW.amount, 'shop', NEW.shop_name, 'mentor', NEW.mentor_name));
  ELSIF TG_TABLE_NAME = 'user_roles' THEN
    INSERT INTO public.audit_logs(user_id, action, entity, entity_id, details)
      VALUES (auth.uid(), CASE WHEN TG_OP='INSERT' THEN 'Role added' ELSE 'Role removed' END, 'user', COALESCE(NEW.user_id, OLD.user_id)::text,
        jsonb_build_object('role', COALESCE(NEW.role, OLD.role)));
    RETURN COALESCE(NEW, OLD);
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER contributions_audit AFTER INSERT OR UPDATE ON public.contributions FOR EACH ROW EXECUTE FUNCTION public.audit_row();
CREATE TRIGGER expenses_audit AFTER INSERT OR UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.audit_row();
CREATE TRIGGER roles_audit AFTER INSERT OR DELETE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.audit_row();

-- storage policies: path = <uid>/<file>
CREATE POLICY "receipt upload own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'expense-receipts' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "receipt read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'expense-receipts' AND ((storage.foldername(name))[1] = auth.uid()::text
    OR public.has_any_role(auth.uid(), ARRAY['admin','treasurer']::public.app_role[])));
CREATE POLICY "receipt update own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'expense-receipts' AND (storage.foldername(name))[1] = auth.uid()::text);