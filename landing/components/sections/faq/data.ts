export const faq = {
  eyebrow: "§11 · FAQ",
  lines: ["Questions at the", "*information desk.*"],
  body: "Straight answers about what koLink Chat does today.",
};

/**
 * Eight questions buyers actually ask, each answered in thirty words or fewer. Checked against
 * lib/capabilities.ts and the verified facts: the agent is Instagram + Messenger DMs only,
 * comment-to-DM is Instagram-only, LinkedIn publishing is text-only, and team roles are not
 * promised as permissions (only Owner/Admin team management is enforced).
 */
export const questions: { q: string; a: string }[] = [
  {
    q: "Which channels can I connect?",
    a: "Instagram, Facebook Pages, Messenger, WhatsApp, Threads, X, LinkedIn and Gmail. One Facebook Login brings in your Page, Messenger and the linked Instagram Professional account.",
  },
  {
    q: "Where does the AI agent reply?",
    a: "Only in Instagram and Messenger DMs. Set each to Off, Menu (buttons, no AI) or Agentic. Everything else lands in your team inbox.",
  },
  {
    q: "How does it know what to say?",
    a: "Only from your knowledge library: pasted text, .txt, .md or .csv files, and web links (one page each). PDF uploads aren’t supported.",
  },
  {
    q: "What happens when it doesn’t know?",
    a: "It replies “We’ll connect someone from our team to help you out”, pauses the thread and flags it Needs attention. Resume the bot whenever you like.",
  },
  {
    q: "How does comment-to-DM work?",
    a: "On Instagram, someone comments a trigger word and koLink DMs them your link, with an optional public reply and follow check. Facebook and Threads get keyword reply and delete.",
  },
  {
    q: "Can I post to every network at once?",
    a: "Broadcasts publishes one post to Instagram, Facebook Page, Threads, X and LinkedIn, each with its own status. LinkedIn posts are text-only.",
  },
  {
    q: "Can my team share the inbox?",
    a: "Yes. Invite teammates, assign and label threads, and stop or resume the bot on any thread.",
  },
  {
    q: "Is anything I type in the demo sent?",
    a: "No. The demo runs entirely in your browser. Nothing is posted, sent or stored.",
  },
];
