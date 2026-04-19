#!/bin/sh
cd /app
npm run build
cp -r dist/* public/ 2>/dev/null || true