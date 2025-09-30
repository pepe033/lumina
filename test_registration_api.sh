#!/bin/bash

# Lumina Registration Test Script
# This script tests the registration functionality after setup

echo "🚀 Testing Lumina Registration API"
echo "=================================="

# Check if server is running
echo "📡 Checking if Laravel server is running..."
if ! curl -s http://localhost:8000 >/dev/null; then
    echo "❌ Laravel server is not running on localhost:8000"
    echo "💡 Please run: php artisan serve"
    exit 1
fi
echo "✅ Server is running"

# Test registration with valid data
echo ""
echo "🧪 Testing registration with valid data..."
response=$(curl -s -w "%{http_code}" -X POST http://localhost:8000/api/v1/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@lumina.app",
    "password": "password123",
    "password_confirmation": "password123"
  }')

http_code="${response: -3}"
body="${response%???}"

echo "HTTP Status: $http_code"

if [ "$http_code" = "201" ]; then
    echo "✅ Registration successful!"
    echo "📋 Response: $body"
else
    echo "❌ Registration failed"
    echo "📋 Response: $body"
fi

# Test registration with duplicate email
echo ""
echo "🧪 Testing registration with duplicate email..."
response2=$(curl -s -w "%{http_code}" -X POST http://localhost:8000/api/v1/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Another User",
    "email": "test@lumina.app",
    "password": "password123",
    "password_confirmation": "password123"
  }')

http_code2="${response2: -3}"
body2="${response2%???}"

echo "HTTP Status: $http_code2"

if [ "$http_code2" = "422" ]; then
    echo "✅ Duplicate email validation working!"
    echo "📋 Response: $body2"
else
    echo "⚠️  Unexpected response for duplicate email"
    echo "📋 Response: $body2"
fi

# Test registration with validation errors
echo ""
echo "🧪 Testing registration with invalid data..."
response3=$(curl -s -w "%{http_code}" -X POST http://localhost:8000/api/v1/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "",
    "email": "invalid-email",
    "password": "123",
    "password_confirmation": "456"
  }')

http_code3="${response3: -3}"
body3="${response3%???}"

echo "HTTP Status: $http_code3"

if [ "$http_code3" = "422" ]; then
    echo "✅ Input validation working!"
    echo "📋 Response: $body3"
else
    echo "⚠️  Unexpected response for invalid data"
    echo "📋 Response: $body3"
fi

echo ""
echo "🎉 Registration API testing complete!"
echo ""
echo "💡 Next steps:"
echo "   - Integrate with your frontend application"
echo "   - Test with React frontend at http://localhost:3000"
echo "   - Configure additional authentication features as needed"