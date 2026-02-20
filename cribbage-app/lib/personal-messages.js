/**
 * Personal messages — targeted one-time messages for specific users.
 * Used by VersionNotification to show messages after the "Got It!" dismiss.
 */

const MESSAGES = [
  {
    id: 'shawn-expert-apology',
    recipients: ['shawnbourne@sympatico.ca', 'chris@chrisk.com'],
    title: 'Hey Shawn!',
    body: `First — we owe you an apology! We were rolling out some new features earlier and accidentally caused a login issue that may have disrupted your experience. We're truly sorry about that and it's been fixed.\n\nNow for the good news — congratulations on your amazing performance! Your win record is truly impressive and has been the benchmark we measure the AI against.\n\nWe've been working hard to make the computer more competitive. We just launched Expert Mode, where the AI evaluates every possible cut card to find optimal discards, plays smarter during pegging, and may even try to bluff overcounts to test your muggins skills.\n\nYou can switch between Normal and Expert at any time from the ⋮ menu — no need to start a new game. We hope you enjoy the challenge!\n\nYour feedback has been invaluable in making the game better for everyone. Thank you for playing!`,
  },
];

/**
 * Get the first unseen personal message for a given email.
 * @param {string} email - user's email
 * @param {object} seen - map of message IDs already seen
 * @returns {object|null} - { id, title, body } or null
 */
export function getPersonalMessage(email, seen) {
  for (const msg of MESSAGES) {
    if (msg.recipients.includes(email) && !seen[msg.id]) {
      return { id: msg.id, title: msg.title, body: msg.body };
    }
  }
  return null;
}
