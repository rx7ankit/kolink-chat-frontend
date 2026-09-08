export default async function DataDeletionPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">User data deletion</h1>
      <p className="mt-2 text-sm text-muted-foreground">For Meta / Instagram connected users</p>
      <div className="mt-8 space-y-4 text-sm leading-relaxed text-muted-foreground">
        {code ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-900">
            Deletion request received. Confirmation code:{" "}
            <code className="text-xs">{code}</code>
          </p>
        ) : null}
        <p>
          To delete Instagram or Facebook data stored by koLink Chat, disconnect the channel in the
          app (Channels → Disconnect) or ask the workspace owner to remove the connected account.
        </p>
        <p>
          Disconnecting clears stored access tokens for that channel. Deleting the workspace removes
          conversations, contacts, and messages stored for that workspace.
        </p>
        <p>
          If you submitted a deletion request through Facebook or Instagram, we honor it by removing
          the linked channel tokens and associated connection records for that identity. You can also
          follow our{" "}
          <a className="text-primary underline" href="/privacy">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}
