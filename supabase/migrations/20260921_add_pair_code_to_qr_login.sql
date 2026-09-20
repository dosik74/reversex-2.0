-- Короткий код сопряжения для QR-входа: десктоп показывает 6 цифр,
-- телефон вводит их в приложении (или сканирует QR — код лишь алиас сессии).
-- Сам по себе код ничего не даёт: вход всё равно требует залогиненного
-- телефона и одноразовый magiclink с сервера.

ALTER TABLE qr_login_sessions
  ADD COLUMN IF NOT EXISTS pair_code TEXT;

CREATE INDEX IF NOT EXISTS idx_qr_login_sessions_pair_code
  ON qr_login_sessions(pair_code);
