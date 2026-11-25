#!/usr/bin/env bash
# Render runs this on every deploy (see render.yaml). Stops at the first error.
set -o errexit

pip install -r backend/requirements.txt
