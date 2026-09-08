"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createCustomField, listCustomFields, type CustomField } from "@/lib/api/settings";
import { ApiError } from "@/lib/api/client";

export default function FieldsSettingsPage() {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void listCustomFields()
      .then(setFields)
      .catch((error) => toast.error(error instanceof ApiError ? error.detail : "Failed to load fields"));
  }, []);

  const userFields = fields.filter((field) => field.scope === "user");
  const botFields = fields.filter((field) => field.scope === "bot");

  return (
    <div>
      <h1 className="text-xl font-semibold">Fields</h1>
      <p className="mt-1 text-sm text-muted-foreground">Custom user fields and bot-wide values.</p>
      <form
        className="mt-6 flex max-w-lg flex-wrap gap-2"
        onSubmit={async (event) => {
          event.preventDefault();
          const trimmed = name.trim();
          if (!trimmed) return;
          setSaving(true);
          try {
            const row = await createCustomField({ name: trimmed, field_type: "Text", scope: "user" });
            setFields((current) => [...current, row]);
            setName("");
            toast.success("Field added");
          } catch (error) {
            toast.error(error instanceof ApiError ? error.detail : "Could not add field");
          } finally {
            setSaving(false);
          }
        }}
      >
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="New user field"
          className="max-w-xs"
        />
        <Button type="submit" disabled={saving}>
          Add field
        </Button>
      </form>
      <h2 className="mt-6 text-sm font-medium">User fields</h2>
      <div className="mt-3 space-y-2">
        {userFields.map((field) => (
          <div key={field.id} className="flex items-center justify-between glass rounded-xl px-4 py-3">
            <span className="font-medium">{field.name}</span>
            <Badge variant="muted">{field.field_type}</Badge>
          </div>
        ))}
      </div>
      <h2 className="mt-8 text-sm font-medium">Bot fields</h2>
      <div className="mt-3 space-y-2">
        {botFields.map((field) => (
          <div key={field.id} className="flex items-center justify-between glass rounded-xl px-4 py-3">
            <span className="font-medium">{field.name}</span>
            <span className="text-sm text-muted-foreground">{field.default_value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
