export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated 3 September 2026</p>
      <div className="mt-8 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          koLink Chat (“we”) provides an omnichannel inbox for brands. When you connect Instagram,
          Facebook, WhatsApp, or other channels, we process messages, comments, profile names, media,
          and account identifiers needed to display and reply to those conversations.
        </p>
        <p>
          We use this data to operate the product: inbox, automations, publishing, analytics, and
          customer support. We do not sell your customer message content. Tokens are stored so we can
          send and receive on your behalf until you disconnect the channel.
        </p>
        <p>
          You can disconnect a channel at any time in Settings → Channels. You may request deletion of
          workspace data by emailing the account owner or using the data deletion instructions for
          Meta-connected users.
        </p>
        <p>
          Meta products: we receive Instagram and Facebook data only after you authorize our Meta apps,
          and only for the permissions you grant (messaging, comments, publishing, insights).
        </p>
        <p>
          Data deletion requests from Meta are handled at{" "}
          <a className="text-primary underline" href="/data-deletion">
            /data-deletion
          </a>
          .
        </p>
      </div>
    </div>
  );
}
