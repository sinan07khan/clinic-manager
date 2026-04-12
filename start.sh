#!/bin/bash
cd /home/z/my-project

# Kill existing process on port 3000
fuser -k 3000/tcp 2>/dev/null
sleep 2

# Clean .next cache
rm -rf .next

# Start the dev server
echo "Starting Oxygen Health Care dev server..."
exec bun --hot run dev
