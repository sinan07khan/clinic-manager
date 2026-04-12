#!/bin/bash
# Auto-restart dev server script
cd /home/z/my-project
while true; do
  npx next dev -p 3000 >> /home/z/my-project/dev.log 2>&1
  echo "[$(date)] Dev server exited, restarting in 2s..." >> /home/z/my-project/dev.log
  sleep 2
done
