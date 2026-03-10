#!/bin/bash
set -e

# Load environment variables
export VITE_POCKETBASE_URL="http://api.unfoold.space"
export VITE_VAPID_PUBLIC_KEY="BCz53E3BrX344cD6fkhzRPlLOMA2Mc84Cnt7Y-z090_BlegkTINsPylD7GMGhO4YAMwNQOGxI7qdpY_ccCVPg_I"
export VITE_NOTIFICATIONS_OPTIONAL="true"

# Run build
npm run build --prefix ../web 2>&1 || npm run build
