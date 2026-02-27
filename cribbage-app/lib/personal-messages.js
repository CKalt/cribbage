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
  {
    id: 'shawn-expert-upgrade-notice',
    recipients: ['shawnbourne@sympatico.ca', 'chris@chrisk.com'],
    title: 'Expert Mode Just Got Tougher!',
    body: `Hi Shawn! Quick heads-up about an important change to Expert Mode.\n\nWe discovered that the Expert AI had a flaw that was actually making it WEAKER, not stronger. It was deliberately overcounting its hand about 15% of the time as a "bluff" — but if you were catching those with muggins calls, you were getting free points every time! That means the computer was essentially handing you points.\n\nWe've fixed this. The Expert AI now always counts its hand accurately — no more free muggins points. This means Expert Mode is now genuinely harder, and you may notice your win percentage drops a bit as a result.\n\nDon't worry — your past wins absolutely count! But from here on, every point the Expert claims will be the real deal. We think you're up for the challenge.\n\nMore Expert improvements are on the way. Game on!`,
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
