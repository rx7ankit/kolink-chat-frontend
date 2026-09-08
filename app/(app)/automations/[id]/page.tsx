"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import type { Edge, Node } from "@xyflow/react";

import { FlowCanvas } from "@/components/flow/flow-canvas";
import { Button } from "@/components/ui/button";
import { getAutomation, publishAutomation, saveAutomationFlow } from "@/lib/api/automations";
import { ApiError } from "@/lib/api/client";

type FlowData = { title: string; body: string };

export default function FlowBuilderPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [name, setName] = useState("Flow");
  const [nodes, setNodes] = useState<Node<FlowData>[] | undefined>();
  const [edges, setEdges] = useState<Edge[] | undefined>();
  const [draft, setDraft] = useState<{ nodes: Node<FlowData>[]; edges: Edge[] } | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const row = await getAutomation(id);
        setName(row.name);
        const flow = row.flow || {};
        setNodes((flow.nodes as Node<FlowData>[]) || []);
        setEdges((flow.edges as Edge[]) || []);
      } catch (error) {
        toast.error(error instanceof ApiError ? error.detail : "Flow not found");
      } finally {
        setReady(true);
      }
    })();
  }, [id]);

  async function save(andPublish = false) {
    const flow = draft ?? { nodes: nodes ?? [], edges: edges ?? [] };
    try {
      await saveAutomationFlow(id, {
        nodes: flow.nodes.map(({ id: nid, position, data, style }) => ({
          id: nid,
          position,
          data: { title: data.title, body: data.body },
          style,
        })),
        edges: flow.edges.map(({ id: eid, source, target }) => ({ id: eid, source, target })),
      });
      if (andPublish) {
        await publishAutomation(id);
        toast.success("Published");
      } else {
        toast.success("Flow saved");
      }
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Could not save");
    }
  }

  return (
    <div className="flex h-[calc(100svh-3.5rem)] min-h-0 flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-white/35 bg-white/30 backdrop-blur-xl px-3 py-3 sm:px-5">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">
            <Link href="/automations" className="hover:text-foreground">
              Automations
            </Link>{" "}
            / Flow
          </p>
          <h1 className="truncate text-base font-semibold">{name}</h1>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" className="hidden sm:inline-flex" asChild>
            <Link href="/automations">Back</Link>
          </Button>
          <Button variant="outline" onClick={() => void save(false)}>
            Save
          </Button>
          <Button onClick={() => void save(true)}>Publish</Button>
        </div>
      </div>
      <div className="min-h-0 flex-1 bg-[#f4f7fa]">
        {ready ? (
          <FlowCanvas
            initialNodes={nodes}
            initialEdges={edges}
            onPersist={(flow) => setDraft(flow)}
          />
        ) : null}
      </div>
    </div>
  );
}
