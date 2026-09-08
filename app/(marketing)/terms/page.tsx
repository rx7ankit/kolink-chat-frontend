export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated 8 September 2026</p>
      <div className="mt-8 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          These terms govern use of koLink Chat at chat.getkolink.com. By creating an account or
          connecting a channel, you agree to them.
        </p>
        <p>
          You must have the right to connect each channel (Instagram, Facebook, WhatsApp, and others)
          and to process the conversations that land in your workspace. You are responsible for how your
          team uses the inbox, automations, and broadcasts.
        </p>
        <p>
          The service is provided as-is. Platform APIs (Meta, X, Google, LinkedIn) can change,
          rate-limit, or revoke access. We may suspend a workspace that abuses APIs, spam, or violates
          a connected platform’s policies.
        </p>
        <p>
          You can disconnect channels or delete a workspace at any time. Our{" "}
          <a className="text-primary underline" href="/privacy">
            Privacy Policy
          </a>{" "}
          and{" "}
          <a className="text-primary underline" href="/data-deletion">
            user data deletion
          </a>{" "}
          page explain how connected-account data is handled.
        </p>
      </div>
    </div>
  );
}
