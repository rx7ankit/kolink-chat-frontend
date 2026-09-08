export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated 8 September 2026</p>
      <div className="mt-8 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          koLink Chat (“we”, “koLink”) provides an omnichannel inbox at chat.getkolink.com. This policy
          explains how we process data when you create a workspace and connect messaging channels.
        </p>
        <p>
          When you connect Instagram, Facebook, Messenger, WhatsApp, Threads, X, LinkedIn, or
          Gmail, we process messages, comments, media, profile names, handles, and account identifiers
          needed to display, search, automate, and reply to those conversations.
        </p>
        <p>
          We use this data only to operate the product: inbox, automations, publishing, analytics, and
          support. We do not sell customer message content. Access tokens are stored so we can send and
          receive on your behalf until you disconnect the channel.
        </p>
        <p>
          Meta products: we receive Instagram, Facebook, Messenger, WhatsApp, and Threads data only after
          you authorize our Meta apps, and only for the permissions you grant.
        </p>
        <p>
          You can disconnect a channel at any time in Channels. You may request deletion of workspace
          data from the workspace owner. Meta-connected users can also use our{" "}
          <a className="text-primary underline" href="/data-deletion">
            user data deletion
          </a>{" "}
          instructions. See our{" "}
          <a className="text-primary underline" href="/terms">
            Terms of Service
          </a>
          .
        </p>
        <p>Questions: use the in-app support contact for your workspace, or the workspace owner email.</p>
      </div>
    </div>
  );
}
