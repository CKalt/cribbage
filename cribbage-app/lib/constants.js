// Card constants for Cribbage game

// Card suits
export const suits = ['♠', '♥', '♦', '♣'];

// Card ranks in order
export const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// Card values for scoring (face cards = 10, Ace = 1)
export const rankValues = {
  'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6,
  '7': 7, '8': 8, '9': 9, '10': 10, 'J': 10, 'Q': 10, 'K': 10
};

// Card order for runs (Ace low, King high)
export const rankOrder = {
  'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6,
  '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13
};
