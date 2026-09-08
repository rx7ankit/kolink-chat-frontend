"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Contact } from "@/lib/mock";
import { cn, initials } from "@/lib/utils";

export function contactAvatarUrl(contact: Pick<Contact, "avatarUrl" | "fields">) {
  return contact.avatarUrl || contact.fields?.profile_picture_url || undefined;
}

export function ContactAvatar({
  contact,
  className,
  fallbackClassName,
}: {
  contact: Pick<Contact, "name" | "avatarUrl" | "fields">;
  className?: string;
  fallbackClassName?: string;
}) {
  const url = contactAvatarUrl(contact);
  return (
    <Avatar className={className}>
      {url ? <AvatarImage src={url} alt={contact.name} referrerPolicy="no-referrer" /> : null}
      <AvatarFallback className={fallbackClassName}>{initials(contact.name)}</AvatarFallback>
    </Avatar>
  );
}
