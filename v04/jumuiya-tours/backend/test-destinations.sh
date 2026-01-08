#!/bin/bash
# chmod +x test-destinations.sh

echo "🚀 Testing Jumuiya Tours API Endpoints..."
BASE_URL="http://localhost:5000/api"

# Health Check
curl -s $BASE_URL/health | jq '.status'

# Destinations (User)
curl -s -H "Authorization: Bearer $USER_TOKEN" $BASE_URL/destinations | jq '.destinations | length'

# Advanced Search
curl -s -H "Authorization: Bearer $USER_TOKEN" "$BASE_URL/destinations/search?region=Western&difficulty=Moderate" | jq '.destinations | length'

# Pending Moderation (Auditor)
curl -s -H "Authorization: Bearer $AUDITOR_TOKEN" $BASE_URL/content/pending | jq

echo "✅ Tests complete."

