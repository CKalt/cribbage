#!/bin/bash
# Run Playwright tests for multiplayer functionality

cd "$(dirname "$0")"

echo "=========================================="
echo "Running Multiplayer Playwright Tests"
echo "Target: https://beta.cribbage.chrisk.com"
echo "=========================================="
echo ""

# Check for specific test file argument
if [ "$1" == "api" ]; then
    echo "Running API tests only..."
    npx playwright test api.spec.js --config=playwright.config.js "${@:2}"
elif [ "$1" == "gameplay" ]; then
    echo "Running Gameplay tests only..."
    npx playwright test gameplay.spec.js --config=playwright.config.js "${@:2}"
elif [ "$1" == "multiplayer" ]; then
    echo "Running Multiplayer flow tests only..."
    npx playwright test multiplayer.spec.js --config=playwright.config.js "${@:2}"
elif [ "$1" == "join" ]; then
    echo "Running Join game tests only..."
    npx playwright test join-game.spec.js --config=playwright.config.js "${@:2}"
else
    # Run all tests
    npx playwright test --config=playwright.config.js "$@"
fi

echo ""
echo "=========================================="
echo "Test run complete!"
echo ""
echo "Usage:"
echo "  ./run-tests.sh           # Run all tests"
echo "  ./run-tests.sh api       # Run API tests only"
echo "  ./run-tests.sh gameplay  # Run gameplay tests only"
echo "  ./run-tests.sh multiplayer # Run multiplayer flow tests"
echo "  ./run-tests.sh join      # Run join game tests"
echo ""
echo "To view HTML report: npx playwright show-report"
echo "=========================================="
