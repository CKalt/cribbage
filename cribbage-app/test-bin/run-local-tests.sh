#!/bin/bash
# Run Playwright tests against localhost with dev server

cd "$(dirname "$0")/.."

echo "=========================================="
echo "Multiplayer Playwright Tests (Local)"
echo "Target: http://localhost:3000"
echo "=========================================="

# Set deterministic deck seed if not provided
export TEST_DECK_SEED=${TEST_DECK_SEED:-12345}
echo "Deck Seed: $TEST_DECK_SEED"
echo ""

# Parse arguments
HEADED=""
SPECIFIC_TEST=""
DEBUG=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --headed)
      HEADED="true"
      shift
      ;;
    --debug)
      DEBUG="true"
      shift
      ;;
    --test)
      SPECIFIC_TEST="$2"
      shift 2
      ;;
    --seed)
      export TEST_DECK_SEED="$2"
      echo "Deck Seed updated to: $TEST_DECK_SEED"
      shift 2
      ;;
    --beta)
      export TEST_URL="https://beta.cribbage.chrisk.com"
      echo "Target: $TEST_URL (beta)"
      shift
      ;;
    *)
      SPECIFIC_TEST="$1"
      shift
      ;;
  esac
done

# Set environment variables
if [ -n "$HEADED" ]; then
  echo "Running in HEADED mode (browser visible)"
  export HEADED=true
fi

if [ -n "$DEBUG" ]; then
  echo "Running in DEBUG mode (verbose logging)"
  export VERBOSE=true
  export DEBUG=pw:api
fi

echo ""

# Run tests
if [ -n "$SPECIFIC_TEST" ]; then
  echo "Running specific test: $SPECIFIC_TEST"
  npx playwright test "test-bin/$SPECIFIC_TEST" --config=test-bin/playwright.config.js
else
  echo "Running all multiplayer tests..."
  npx playwright test --config=test-bin/playwright.config.js
fi

EXIT_CODE=$?

echo ""
echo "=========================================="
echo "Test run complete! (Exit code: $EXIT_CODE)"
echo ""
echo "Usage:"
echo "  ./test-bin/run-local-tests.sh                    # Run all tests"
echo "  ./test-bin/run-local-tests.sh --headed           # With visible browser"
echo "  ./test-bin/run-local-tests.sh --debug            # With verbose logging"
echo "  ./test-bin/run-local-tests.sh --seed 67890       # Custom deck seed"
echo "  ./test-bin/run-local-tests.sh --beta             # Run against beta site"
echo "  ./test-bin/run-local-tests.sh multiplayer.spec.js # Specific test file"
echo ""
echo "View HTML report: npx playwright show-report"
echo "=========================================="

exit $EXIT_CODE
