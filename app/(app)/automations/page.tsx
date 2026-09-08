"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ChannelBadge } from "@/components/channel-badge";
import { PageHeader } from "@/components/page-header";
import { TablePagination, usePagination } from "@/components/table-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  createAutomation,
  createKeyword,
  createRule,
  createSequence,
  listAutomations,
  listBasicAutomations,
  listKeywords,
  listRules,
  listSequences,
  toggleAutomation,
  type ApiBasic,
  type ApiKeyword,
  type ApiRule,
  type ApiSequence,
} from "@/lib/api/automations";
import { ApiError } from "@/lib/api/client";
import type { Automation } from "@/lib/mock";
import type { ChannelId } from "@/lib/mock";
import { useI18n } from "@/lib/i18n/provider";

export default function AutomationsPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [flows, setFlows] = useState<Automation[]>([]);
  const [basics, setBasics] = useState<ApiBasic[]>([]);
  const [keywords, setKeywords] = useState<ApiKeyword[]>([]);
  const [sequences, setSequences] = useState<ApiSequence[]>([]);
  const [rules, setRules] = useState<ApiRule[]>([]);
  const [creating, setCreating] = useState(false);
  const [keywordPhrase, setKeywordPhrase] = useState("");
  const [sequenceName, setSequenceName] = useState("");
  const [ruleName, setRuleName] = useState("");
  const pager = usePagination(flows, 4);

  const reload = useCallback(async () => {
    try {
      const [a, b, k, s, r] = await Promise.all([
        listAutomations(),
        listBasicAutomations(),
        listKeywords(),
        listSequences(),
        listRules(),
      ]);
      setFlows(a);
      setBasics(b);
      setKeywords(k);
      setSequences(s);
      setRules(r);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Failed to load automations");
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function toggle(id: string) {
    try {
      const row = await toggleAutomation(id);
      setFlows((current) =>
        current.map((flow) =>
          flow.id === id ? { ...flow, status: row.status } : flow,
        ),
      );
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Could not update");
    }
  }

  const firstId = flows[0]?.id;

  async function newFlow() {
    setCreating(true);
    try {
      const created = await createAutomation({
        name: "Untitled flow",
        trigger: "Keyword",
        channels: ["whatsapp"],
      });
      toast.success("Flow created");
      router.push(`/automations/${created.id}`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Could not create flow");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="page-shell">
      <PageHeader
        title={t("automations.title")}
        description="Flows, keywords, sequences, and rules"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={firstId ? `/automations/${firstId}` : "/templates"}>Open flow builder</Link>
            </Button>
            <Button disabled={creating} onClick={() => void newFlow()}>
              New automation
            </Button>
          </div>
        }
      />
      <Tabs defaultValue="flows">
        <TabsList className="h-auto w-full justify-start overflow-x-auto">
          <TabsTrigger value="flows">My Automations</TabsTrigger>
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
          <TabsTrigger value="sequences">Sequences</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
        </TabsList>
        <TabsContent value="flows">
          <div className="glass overflow-hidden rounded-2xl">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Trigger</th>
                  <th className="px-4 py-3 font-medium">Channels</th>
                  <th className="px-4 py-3 font-medium">Sent</th>
                  <th className="px-4 py-3 font-medium">Live</th>
                </tr>
              </thead>
              <tbody>
                {pager.slice.map((flow: Automation) => (
                  <tr key={flow.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <Link href={`/automations/${flow.id}`} className="font-medium hover:text-primary">
                        {flow.name}
                      </Link>
                      <p className="text-xs capitalize text-muted-foreground">{flow.status}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{flow.trigger}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {flow.channels.map((channel) => (
                          <ChannelBadge key={channel} channel={channel} />
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">{flow.sent}</td>
                    <td className="px-4 py-3">
                      <Switch
                        checked={flow.status === "live"}
                        onCheckedChange={() => void toggle(flow.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <TablePagination
              page={pager.page}
              pageCount={pager.pageCount}
              total={pager.total}
              pageSize={pager.pageSize}
              onPageChange={pager.setPage}
            />
          </div>
        </TabsContent>
        <TabsContent value="basic">
          <div className="grid gap-3 md:grid-cols-2">
            {basics.map((item) => (
              <div key={item.id} className="glass rounded-2xl p-5">
                <ChannelBadge channel={item.channel as ChannelId} />
                <h3 className="mt-3 font-medium">{item.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
              </div>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="keywords">
          <form
            className="mb-3 flex flex-wrap gap-2"
            onSubmit={async (event) => {
              event.preventDefault();
              const phrase = keywordPhrase.trim();
              if (!phrase) return;
              try {
                const row = await createKeyword({
                  phrase,
                  flow_name: "Untitled flow",
                  channel: "whatsapp",
                });
                setKeywords((current) => [...current, row]);
                setKeywordPhrase("");
                toast.success("Keyword added");
              } catch (error) {
                toast.error(error instanceof ApiError ? error.detail : "Could not add keyword");
              }
            }}
          >
            <Input
              value={keywordPhrase}
              onChange={(event) => setKeywordPhrase(event.target.value)}
              placeholder="Keyword phrase"
              className="max-w-xs"
            />
            <Button type="submit">Add keyword</Button>
          </form>
          <div className="glass p-2 rounded-2xl">
            {keywords.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-3 py-3">
                <div>
                  <p className="font-medium">{item.phrase}</p>
                  <p className="text-xs text-muted-foreground">{item.flow_name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <ChannelBadge channel={item.channel as ChannelId} />
                  <Badge variant="muted">{item.hits} hits</Badge>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="sequences">
          <form
            className="mb-3 flex flex-wrap gap-2"
            onSubmit={async (event) => {
              event.preventDefault();
              const name = sequenceName.trim();
              if (!name) return;
              try {
                const row = await createSequence({ name, step_count: 3, status: "draft" });
                setSequences((current) => [...current, row]);
                setSequenceName("");
                toast.success("Sequence added");
              } catch (error) {
                toast.error(error instanceof ApiError ? error.detail : "Could not add sequence");
              }
            }}
          >
            <Input
              value={sequenceName}
              onChange={(event) => setSequenceName(event.target.value)}
              placeholder="Sequence name"
              className="max-w-xs"
            />
            <Button type="submit">Add sequence</Button>
          </form>
          <div className="grid gap-3 md:grid-cols-3">
            {sequences.map((item) => (
              <div key={item.id} className="glass rounded-2xl p-5">
                <h3 className="font-medium">{item.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.step_count} steps · {item.subscribers} in sequence
                </p>
                <Badge className="mt-3" variant={item.status === "live" ? "mint" : "muted"}>
                  {item.status}
                </Badge>
              </div>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="rules">
          <form
            className="mb-3 flex flex-wrap gap-2"
            onSubmit={async (event) => {
              event.preventDefault();
              const name = ruleName.trim();
              if (!name) return;
              try {
                const row = await createRule({
                  name,
                  condition: "tag is VIP",
                  action: "assign to inbox",
                });
                setRules((current) => [...current, row]);
                setRuleName("");
                toast.success("Rule added");
              } catch (error) {
                toast.error(error instanceof ApiError ? error.detail : "Could not add rule");
              }
            }}
          >
            <Input
              value={ruleName}
              onChange={(event) => setRuleName(event.target.value)}
              placeholder="Rule name"
              className="max-w-xs"
            />
            <Button type="submit">Add rule</Button>
          </form>
          <div className="space-y-3">
            {rules.map((item) => (
              <div key={item.id} className="glass rounded-2xl p-5">
                <h3 className="font-medium">{item.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  If {item.condition} → {item.action}
                </p>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
