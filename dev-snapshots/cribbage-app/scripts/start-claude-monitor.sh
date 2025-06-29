#!/bin/bash

# Start Claude Monitor in a screen session

echo "Starting Claude Monitor in screen session..."

# Create necessary directories
mkdir -p feedback pending-fixes

# Check if screen session already exists
if screen -list | grep -q "claude-monitor"; then
    echo "Claude Monitor screen session already exists."
    echo "To attach: screen -r claude-monitor"
else
    # Start the monitor in a new screen session
    screen -dmS claude-monitor node claude-monitor/monitor.js
    
    echo "Claude Monitor started in screen session 'claude-monitor'"
    echo ""
    echo "Commands:"
    echo "  Attach to session:  screen -r claude-monitor"
    echo "  Detach:            Ctrl+A, then D"
    echo "  Kill session:      screen -X -S claude-monitor quit"
    echo ""
    echo "Claude is now monitoring for bug reports!"
fi