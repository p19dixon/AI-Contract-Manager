#!/bin/bash

echo "========================================" 
echo "Fixing Admin Password"
echo "========================================"
echo ""

# Check if database is running
if ! docker ps | grep -q contracts_db; then
    echo "❌ Database is not running. Please start it first with ./start.sh"
    exit 1
fi

echo "🔧 Updating admin password to 'admin123'..."

# Update the password
docker exec -i contracts_db psql -U contracts_user -d contracts_db << EOF
UPDATE users 
SET password = '\$2b\$10\$UNb4dXSVcjFb6b/ZeuwJcub3wAwoU8glCRXVhrrK/h51KXHtPQ.2m' 
WHERE email = 'admin@caplocations.com';
EOF

if [ $? -eq 0 ]; then
    echo "✅ Admin password updated successfully!"
    echo ""
    echo "You can now login with:"
    echo "  Email: admin@caplocations.com"
    echo "  Password: admin123"
else
    echo "❌ Failed to update password"
    exit 1
fi