-- ============================================================
-- Система цифровых карт волонтеров — Инициализация БД
-- ============================================================

-- Таблица пользователей (admin, volunteer, partner)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'volunteer'
        CHECK (role IN ('admin', 'volunteer', 'partner')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Таблица волонтеров
CREATE TABLE IF NOT EXISTS volunteers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    passport_data VARCHAR(255) NOT NULL,
    card_id VARCHAR(50) UNIQUE NOT NULL,
    expiration_date TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'expired', 'suspended', 'revoked')),
    photo_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Лог проверок QR-кодов
CREATE TABLE IF NOT EXISTS verification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    volunteer_id UUID REFERENCES volunteers(id) ON DELETE CASCADE,
    partner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_valid BOOLEAN NOT NULL,
    reason VARCHAR(255),
    verified_at TIMESTAMP DEFAULT NOW()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_volunteers_card_id ON volunteers(card_id);
CREATE INDEX IF NOT EXISTS idx_volunteers_status ON volunteers(status);
CREATE INDEX IF NOT EXISTS idx_volunteers_expiration ON volunteers(expiration_date);
CREATE INDEX IF NOT EXISTS idx_verification_volunteer ON verification_logs(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_verification_partner ON verification_logs(partner_id);

-- Триггер для auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_volunteers_updated_at
    BEFORE UPDATE ON volunteers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Дефолтный админ (пароль: admin123)
INSERT INTO users (email, hashed_password, full_name, role)
VALUES (
    'admin@volunteer.ru',
    '$2b$12$LJ3m4ys1Lp0bMHZbJGqFYeJqA7xKqG5rT8vN2cW1mE9kO3hF6dS5u',
    'Системный Администратор',
    'admin'
) ON CONFLICT (email) DO NOTHING;
