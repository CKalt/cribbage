#!/bin/sh
cd "$(dirname "$0")/.." || exit 1
source ./source-venv.sh && python src/crop_painting.py "$@"
