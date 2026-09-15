"""
Скрипт для генерации хэша пароля и создания администратора
Запуск: docker-compose exec backend python create_admin.py
"""
from passlib.context import CryptContext
import asyncio
from sqlalchemy import text
from app.database import async_session

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_admin():
    email = "admin@volunteer.ru"
    password = "admin123"
    hashed = pwd_context.hash(password)
    
    print(f"Email: {email}")
    print(f"Password: {password}")
    print(f"Hash: {hashed}")
    
    async with async_session() as session:
        # Проверяем, существует ли уже админ
        result = await session.execute(
            text("SELECT id FROM users WHERE email = :email"),
            {"email": email}
        )
        existing = result.fetchone()
        
        if existing:
            # Обновляем пароль
            await session.execute(
                text("UPDATE users SET hashed_password = :hash WHERE email = :email"),
                {"hash": hashed, "email": email}
            )
            print(f"Пароль обновлён для существующего админа")
        else:
            # Создаём нового админа
            await session.execute(
                text("""
                    INSERT INTO users (email, hashed_password, full_name, role, is_active)
                    VALUES (:email, :hash, :name, 'admin', true)
                """),
                {"email": email, "hash": hashed, "name": "Системный Администратор"}
            )
            print(f"Админ создан")
        
        await session.commit()

if __name__ == "__main__":
    asyncio.run(create_admin())
