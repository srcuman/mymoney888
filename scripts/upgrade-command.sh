#!/bin/sh
cd /app
git pull origin main
npm install
npm run build