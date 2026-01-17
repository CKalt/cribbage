/**
 * Test helpers index
 * Re-exports all helper modules for convenient importing
 */

const dualBrowser = require('./dual-browser');
const auth = require('./auth');
const gameSync = require('./game-sync');
const debug = require('./debug');
const scoring = require('./scoring');

module.exports = {
  // Dual browser harness
  DualBrowserHarness: dualBrowser.DualBrowserHarness,

  // Auth helpers
  login: auth.login,
  loginBothUsers: auth.loginBothUsers,
  logout: auth.logout,
  isLoggedIn: auth.isLoggedIn,
  getBaseUrl: auth.getBaseUrl,

  // Game sync helpers
  waitForGameUpdate: gameSync.waitForGameUpdate,
  waitForMyTurn: gameSync.waitForMyTurn,
  waitForOpponentTurn: gameSync.waitForOpponentTurn,
  getGamePhase: gameSync.getGamePhase,
  syncPlayers: gameSync.syncPlayers,
  setDeckSeed: gameSync.setDeckSeed,
  clearDeckSeed: gameSync.clearDeckSeed,
  getTestState: gameSync.getTestState,
  openGameLobby: gameSync.openGameLobby,
  closeGameLobby: gameSync.closeGameLobby,
  searchForPlayer: gameSync.searchForPlayer,
  sendInvitation: gameSync.sendInvitation,
  acceptInvitation: gameSync.acceptInvitation,

  // Debug helpers
  screenshot: debug.screenshot,
  screenshotBoth: debug.screenshotBoth,
  logGameState: debug.logGameState,
  logStep: debug.logStep,
  logSection: debug.logSection,
  logTimed: debug.logTimed,
  getPageText: debug.getPageText,
  hasText: debug.hasText,
  waitForConsoleLog: debug.waitForConsoleLog,

  // Scoring helpers
  parseCard: scoring.parseCard,
  countFifteens: scoring.countFifteens,
  countPairs: scoring.countPairs,
  countRuns: scoring.countRuns,
  countFlush: scoring.countFlush,
  countNobs: scoring.countNobs,
  calculateHandScore: scoring.calculateHandScore,
  verifyScore: scoring.verifyScore,
  getDisplayedScore: scoring.getDisplayedScore
};
