#!/bin/bash

echo "🔐 Getting authentication tokens..."

# Admin token
ADMIN_TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@jumuiya.com","password":"admin123"}' | \
  grep -o '"token":"[^"]*' | cut -d'"' -f4)

# Auditor token
AUDITOR_TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"auditor@jumuiya.com","password":"auditor123"}' | \
  grep -o '"token":"[^"]*' | cut -d'"' -f4)

# Guide token  
GUIDE_TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"guide@jumuiya.com","password":"guide123"}' | \
  grep -o '"token":"[^"]*' | cut -d'"' -f4)

# User token
USER_TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@jumuiya.com","password":"user123"}' | \
  grep -o '"token":"[^"]*' | cut -d'"' -f4)

# Pending Guide token
PENDING_GUIDE_TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"pendingguide@jumuiya.com","password":"pending123"}' | \
  grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo "✅ Tokens retrieved:"
echo "ADMIN_TOKEN=$ADMIN_TOKEN"
echo "AUDITOR_TOKEN=$AUDITOR_TOKEN"
echo "GUIDE_TOKEN=$GUIDE_TOKEN" 
echo "USER_TOKEN=$USER_TOKEN"
echo "PENDING_GUIDE_TOKEN=$PENDING_GUIDE_TOKEN"

# Export for use in other commands
export ADMIN_TOKEN AUDITOR_TOKEN GUIDE_TOKEN USER_TOKEN PENDING_GUIDE_TOKEN

# Display usage examples
echo ""
echo "🔧 Usage Examples:"
echo "  # Test auditor endpoints"
echo "  curl -H \"Authorization: Bearer \$AUDITOR_TOKEN\" http://localhost:5000/api/moderation/pending"
echo "  curl -H \"Authorization: Bearer \$AUDITOR_TOKEN\" http://localhost:5000/api/guides/pending"
echo ""
echo "  # Test admin endpoints"  
echo "  curl -H \"Authorization: Bearer \$ADMIN_TOKEN\" http://localhost:5000/api/admin/users"
echo ""
echo "  # Test guide endpoints"
echo "  curl -H \"Authorization: Bearer \$GUIDE_TOKEN\" http://localhost:5000/api/destinations"
