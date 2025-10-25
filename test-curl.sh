#!/bin/bash

# Test script for Railway backend API
# Usage: ./test-curl.sh https://your-railway-backend-url.railway.app

API_URL=${1:-"https://your-railway-backend-url.railway.app"}

echo "🧪 Testing Railway Backend API"
echo "=============================="
echo "API URL: $API_URL"
echo ""

# Test 1: Health check
echo "1️⃣ Testing health endpoint..."
curl -s -o /dev/null -w "Status: %{http_code}\n" "$API_URL/health" || echo "❌ Health check failed"
echo ""

# Test 2: API docs
echo "2️⃣ Testing API docs..."
curl -s -o /dev/null -w "Status: %{http_code}\n" "$API_URL/docs" || echo "❌ API docs failed"
echo ""

# Test 3: Login endpoint
echo "3️⃣ Testing login endpoint..."
echo "Sending login request..."
curl -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"admin@swrfph.com","password":"admin123"}' \
  -w "\nStatus: %{http_code}\n" \
  -s || echo "❌ Login request failed"
echo ""

# Test 4: CORS preflight
echo "4️⃣ Testing CORS preflight..."
curl -X OPTIONS "$API_URL/auth/login" \
  -H "Origin: https://your-admin.netlify.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -w "\nStatus: %{http_code}\n" \
  -s || echo "❌ CORS preflight failed"
echo ""

echo "🎯 Test Summary:"
echo "If all tests show Status: 200, your API is working correctly."
echo "If any test fails, check your Railway deployment and CORS settings."
