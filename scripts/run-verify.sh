#!/bin/bash

if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | grep -v '^$' | xargs)
fi

node scripts/verify-fix.js
