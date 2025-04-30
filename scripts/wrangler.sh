#!/bin/bash

npx wrangler d1 execute hk-immi-db --remote --command "SELECT name FROM sqlite_schema WHERE type='table' ORDER BY name;"
