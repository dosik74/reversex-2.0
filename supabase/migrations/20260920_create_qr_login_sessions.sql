-- QR-вход: одноразовые сессии для входа на втором устройстве.
-- Ссылка с id сессии = capability-URL (id не угадать), живёт 3 минуты,
-- magiclink одноразовый и проверяется самим Supabase Auth.

CREATE TABLE IF NOT EXISTS qr_login_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'pending'
    CONSTRAINT qr_login_sessions_status_check
    CHECK (status IN ('pending', 'approved', 'consumed', 'cancelled', 'expired')),
  device_label TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (TIMEZONE('utc'::text, NOW()) + INTERVAL '3 minutes'),
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  login_token_hash TEXT,
  consumed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_qr_login_sessions_expires ON qr_login_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_qr_login_sessions_status ON qr_login_sessions(status);

ALTER TABLE qr_login_sessions ENABLE ROW LEVEL SECURITY;

-- Создание сессии: любой (десктоп анонимно заводит QR)
CREATE POLICY "Anyone can create a QR login session"
  ON qr_login_sessions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Чтение: у кого есть ссылка (id), тот и читает — для опроса статуса и экрана approve
CREATE POLICY "Anyone with the link can read the session"
  ON qr_login_sessions
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Десктоп может только завершить свою сессию (потребить/отменить).
-- Подтвердить (approved + токен) может только edge-функция с service_role.
CREATE POLICY "Anyone with the link can finish the session"
  ON qr_login_sessions
  FOR UPDATE
  TO anon, authenticated
  USING (status IN ('pending', 'approved'))
  WITH CHECK (status IN ('consumed', 'cancelled'));

-- Десктоп подчищает за собой
CREATE POLICY "Anyone with the link can delete the session"
  ON qr_login_sessions
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- Мгновенные апдейты статуса на десктопе
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'qr_login_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE qr_login_sessions;
  END IF;
END $$;
