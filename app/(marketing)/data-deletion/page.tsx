export default function DataDeletionPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">User data deletion</h1>
      <p className="mt-2 text-sm text-muted-foreground">For Meta / Instagram connected users</p>
      <div className="mt-8 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          To delete Instagram or Facebook data stored by koLink Chat, disconnect the channel in the
          app (Channels → Disconnect) or email the workspace owner and ask them to remove the
          connected account.
        </p>
        <p>
          Disconnecting clears stored access tokens for that channel. You can also delete the
          workspace, which removes conversations, contacts, and messages stored for that workspace.
        </p>
        <p>
          If you submitted a deletion request through Facebook or Instagram, we honor it by removing
          the linked channel tokens and associated inbox records for that Instagram or Page identity.
        </p>
      </div>
    </div>
  );
}
