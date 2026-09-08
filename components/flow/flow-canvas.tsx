"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

type FlowData = { title: string; body: string };

function pastelNode(background: string): React.CSSProperties {
  return {
    background,
    border: "1px solid oklch(0.91 0.02 300)",
    borderRadius: 16,
    padding: 12,
    width: 220,
    fontSize: 13,
  };
}

const initialNodes: Node<FlowData>[] = [
  {
    id: "1",
    position: { x: 40, y: 80 },
    data: { title: "Trigger", body: "IG comment contains PRICE" },
    style: pastelNode("#dce8f5"),
  },
  {
    id: "2",
    position: { x: 300, y: 80 },
    data: { title: "Message", body: "Send wholesale lookbook DM" },
    style: pastelNode("#dce8fb"),
  },
  {
    id: "3",
    position: { x: 560, y: 20 },
    data: { title: "Condition", body: "Has WhatsApp number?" },
    style: pastelNode("#d8f4ee"),
  },
  {
    id: "4",
    position: { x: 560, y: 180 },
    data: { title: "Delay", body: "Wait 1 hour" },
    style: pastelNode("#fde6dc"),
  },
  {
    id: "5",
    position: { x: 820, y: 20 },
    data: { title: "Action", body: "Move chat to WhatsApp" },
    style: pastelNode("#d8f4ee"),
  },
  {
    id: "6",
    position: { x: 820, y: 180 },
    data: { title: "Action", body: "Add tag Lead" },
    style: pastelNode("#fbe0ea"),
  },
];

const initialEdges: Edge[] = [
  { id: "e1-2", source: "1", target: "2" },
  { id: "e2-3", source: "2", target: "3" },
  { id: "e2-4", source: "2", target: "4" },
  { id: "e3-5", source: "3", target: "5" },
  { id: "e4-6", source: "4", target: "6" },
];

export function FlowCanvas({
  initialNodes: incomingNodes,
  initialEdges: incomingEdges,
  onPersist,
}: {
  initialNodes?: Node<FlowData>[];
  initialEdges?: Edge[];
  onPersist?: (flow: { nodes: Node<FlowData>[]; edges: Edge[] }) => void;
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState(incomingNodes?.length ? incomingNodes : initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(incomingEdges?.length ? incomingEdges : initialEdges);
  const [selected, setSelected] = useState<Node<FlowData> | null>(null);

  const persist = useCallback(() => {
    onPersist?.({ nodes, edges });
  }, [nodes, edges, onPersist]);

  useEffect(() => {
    persist();
  }, [persist]);

  const displayNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          label: (
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {node.data.title}
              </p>
              <p className="mt-1 font-medium">{node.data.body}</p>
            </div>
          ),
        },
      })),
    [nodes],
  );

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges],
  );

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={displayNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => setSelected(node as Node<FlowData>)}
        fitView
      >
        <Background gap={18} size={1} color="oklch(0.86 0.02 230)" />
        <MiniMap
          style={{ background: "oklch(0.98 0.01 230)", borderRadius: 12 }}
          maskColor="oklch(0.9 0.02 230 / 0.4)"
        />
        <Controls />
      </ReactFlow>
      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{selected?.data.title ?? "Step"}</SheetTitle>
            <SheetDescription>Edit this block. Changes stay in this session.</SheetDescription>
          </SheetHeader>
          {selected && (
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={selected.data.title}
                  onChange={(event) => {
                    const title = event.target.value;
                    setSelected({ ...selected, data: { ...selected.data, title } });
                    setNodes((current) =>
                      current.map((node) =>
                        node.id === selected.id
                          ? { ...node, data: { ...node.data, title } }
                          : node,
                      ),
                    );
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea
                  value={selected.data.body}
                  onChange={(event) => {
                    const body = event.target.value;
                    setSelected({ ...selected, data: { ...selected.data, body } });
                    setNodes((current) =>
                      current.map((node) =>
                        node.id === selected.id
                          ? { ...node, data: { ...node.data, body } }
                          : node,
                      ),
                    );
                  }}
                />
              </div>
              <Button className="w-full" onClick={() => { persist(); setSelected(null); }}>
                Done
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
