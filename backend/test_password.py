import bcrypt

# Test the stored hash
stored_hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RXwuEw/aO'
test_password = 'admin123'

print(f"Testing password: {test_password}")
print(f"Stored hash: {stored_hash}")

# Test if the password matches
result = bcrypt.checkpw(test_password.encode('utf-8'), stored_hash.encode('utf-8'))
print(f"Password matches: {result}")

# Generate a new hash for comparison
new_hash = bcrypt.hashpw(test_password.encode('utf-8'), bcrypt.gensalt(12))
print(f"New hash: {new_hash.decode('utf-8')}")