#!/bin/bash
# Run Playwright tests for multiplayer functionality

cd "$(dirname "$0")"

echo "=========================================="
echo "Running Multiplayer Playwright Tests"
echo "Target: https://beta.cribbage.chrisk.com"
echo "=========================================="
echo ""

# Run all tests
npx playwright test --config=playwright.config.js "$@"

echo ""
echo "=========================================="
echo "Test run complete!"
echo "To view HTML report: npx playwright show-report"
echo "=========================================="
