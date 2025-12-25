/**
 * Game Persistence Schema - DML-AST Format
 *
 * Defines the schema for game_sessions and game_stats tables
 * following the pgdb2 dml-ast JSON schema pattern.
 */

// DDL definition for game_sessions table
const gameSessionsDDL = {
  create: {
    columns: {
      user_id: {
        original_col_name: 'User ID',
        computed_sql_type: 'VARCHAR',
        key_type: 'PK',
        nullable: false
      },
      game_state_json: {
        original_col_name: 'Game State JSON',
        computed_sql_type: 'TEXT',
        key_type: null,
        nullable: false
      },
      updated_at: {
        original_col_name: 'Updated At',
        computed_sql_type: 'VARCHAR',
        key_type: null,
        nullable: false
      },
      version: {
        original_col_name: 'Version',
        computed_sql_type: 'VARCHAR',
        key_type: null,
        nullable: true
      }
    },
    primary_key: ['user_id'],
    foreign_keys: {}
  },
  errors: [],
  column_order: ['user_id', 'game_state_json', 'updated_at', 'version']
};

// DDL definition for game_stats table
const gameStatsDDL = {
  create: {
    columns: {
      user_id: {
        original_col_name: 'User ID',
        computed_sql_type: 'VARCHAR',
        key_type: 'PK',
        nullable: false
      },
      wins: {
        original_col_name: 'Wins',
        computed_sql_type: 'INTEGER',
        key_type: null,
        nullable: false,
        default: 0
      },
      losses: {
        original_col_name: 'Losses',
        computed_sql_type: 'INTEGER',
        key_type: null,
        nullable: false,
        default: 0
      },
      forfeits: {
        original_col_name: 'Forfeits',
        computed_sql_type: 'INTEGER',
        key_type: null,
        nullable: false,
        default: 0
      },
      last_played: {
        original_col_name: 'Last Played',
        computed_sql_type: 'VARCHAR',
        key_type: null,
        nullable: true
      }
    },
    primary_key: ['user_id'],
    foreign_keys: {}
  },
  errors: [],
  column_order: ['user_id', 'wins', 'losses', 'forfeits', 'last_played']
};

/**
 * Creates an empty dml-ast structure for a new user
 * @returns {Object} Empty dml-ast with both tables initialized
 */
export function createEmptyUserData() {
  return {
    game_sessions: {
      ddl: gameSessionsDDL,
      data: []
    },
    game_stats: {
      ddl: gameStatsDDL,
      data: []
    }
  };
}

/**
 * Gets the column index for a given table and column name
 * @param {string} tableName - 'game_sessions' or 'game_stats'
 * @param {string} columnName - Column name to find
 * @returns {number} Index of the column in data arrays
 */
export function getColumnIndex(tableName, columnName) {
  const ddl = tableName === 'game_sessions' ? gameSessionsDDL : gameStatsDDL;
  return ddl.column_order.indexOf(columnName);
}

/**
 * Creates a new game_sessions row
 * @param {string} userId - Cognito user ID
 * @param {string} gameStateJson - Serialized game state
 * @param {string} version - App version
 * @returns {Array} Row array for game_sessions table
 */
export function createGameSessionRow(userId, gameStateJson, version = null) {
  return [
    userId,
    gameStateJson,
    new Date().toISOString(),
    version
  ];
}

/**
 * Creates a new game_stats row with default values
 * @param {string} userId - Cognito user ID
 * @returns {Array} Row array for game_stats table
 */
export function createGameStatsRow(userId) {
  return [
    userId,
    0,  // wins
    0,  // losses
    0,  // forfeits
    null  // last_played
  ];
}

// Export DDL definitions for reference
export const GAME_SESSIONS_DDL = gameSessionsDDL;
export const GAME_STATS_DDL = gameStatsDDL;

// Column indices as constants for convenience
export const GAME_SESSIONS_COLS = {
  USER_ID: 0,
  GAME_STATE_JSON: 1,
  UPDATED_AT: 2,
  VERSION: 3
};

export const GAME_STATS_COLS = {
  USER_ID: 0,
  WINS: 1,
  LOSSES: 2,
  FORFEITS: 3,
  LAST_PLAYED: 4
};
