import asyncio
import aiomysql
import bcrypt

async def update_admin_password():
    """Update admin password with correct bcrypt hash"""
    try:
        conn = await aiomysql.connect(
            host='localhost',
            port=3306,
            user='root',
            password='root',
            db='contest_db'
        )

        async with conn.cursor() as cursor:
            # Generate new hash
            password = 'admin123'
            salt = bcrypt.gensalt(12)
            hashed = bcrypt.hashpw(password.encode('utf-8'), salt)

            # Update admin user
            await cursor.execute(
                "UPDATE users SET password = %s WHERE username = 'admin'",
                (hashed.decode('utf-8'),)
            )
            await conn.commit()

            print(f"Updated admin password hash: {hashed.decode('utf-8')}")

        conn.close()

    except Exception as e:
        print(f"Error updating password: {e}")

if __name__ == "__main__":
    asyncio.run(update_admin_password())