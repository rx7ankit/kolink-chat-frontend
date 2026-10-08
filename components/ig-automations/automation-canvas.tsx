"use client";

import { useEffect, useMemo } from "react";
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  useReactFlow,
  useStore,
  useStoreApi,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { KeyRound, MessageCircle, MessageSquareReply, Send, UserCheck, UserPlus } from "lucide-react";

import { PostThumb } from "@/components/ig-automations/post-thumb";
import { isReel, type IgAutomation } from "@/lib/api/ig-automations";
import { cn } from "@/lib/utils";

export type CanvasBlock = "post" | "keywords" | "follow" | "reply" | "dm";

type BlockData = {
  block: CanvasBlock;
  title: string;
  icon: React.ReactNode;
  accent: string;
  body: React.ReactNode;
  muted?: boolean;
  source?: boolean;
  target?: boolean;
  extraSource?: boolean;
};

function BlockNode({ data }: NodeProps<Node<BlockData>>) {
  return (
    <div
      className={cn(
        "w-[250px] cursor-pointer rounded-2xl border bg-white p-3 shadow-sm transition hover:shadow-md",
        data.muted && "opacity-60",
      )}
      style={{ borderTop: `4px solid ${data.accent}` }}
    >
      {data.target !== false ? <Handle type="target" position={Position.Left} className="!bg-slate-400" /> : null}
      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <span style={{ color: data.accent }}>{data.icon}</span>
        {data.title}
      </p>
      <div className="text-[13px]">{data.body}</div>
      {data.source !== false ? <Handle type="source" position={Position.Right} className="!bg-slate-400" /> : null}
      {data.extraSource ? (
        <Handle id="bottom" type="source" position={Position.Bottom} className="!bg-amber-500" />
      ) : null}
    </div>
  );
}

const nodeTypes = { block: BlockNode };

function FitOnReady({ layoutKey }: { layoutKey: string }) {
  const { fitView } = useReactFlow();
  const store = useStoreApi();
  // Nodes are controlled without onNodesChange, so read measurements from the internal lookup.
  const initialized = useStore(
    (state) =>
      state.nodeLookup.size > 0 && [...state.nodeLookup.values()].every((node) => Boolean(node.measured?.width)),
  );

  useEffect(() => {
    if (!initialized) return;
    const fit = () => void fitView({ padding: 0.15, duration: 0 });
    fit();
    const element = store.getState().domNode;
    if (!element) return;
    const observer = new ResizeObserver(fit);
    observer.observe(element);
    return () => observer.disconnect();
  }, [initialized, fitView, store, layoutKey]);

  return null;
}

function chips(values: string[], max = 6) {
  return (
    <div className="flex flex-wrap gap-1">
      {values.slice(0, max).map((value) => (
        <span key={value} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
          {value}
        </span>
      ))}
      {values.length > max ? (
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">+{values.length - max}</span>
      ) : null}
    </div>
  );
}

function responseSummary(row: IgAutomation) {
  const { response, greetings } = row.config;
  return (
    <div className="space-y-1.5">
      {response.media_url ? (
        <p className="text-xs text-muted-foreground">📎 {response.media_type === "video" ? "Video" : "Image"}</p>
      ) : null}
      {response.text ? <p className="line-clamp-3">{response.text}</p> : null}
      {response.link_url ? (
        <span className="inline-block max-w-full truncate rounded-lg border px-2 py-1 text-xs font-medium text-primary">
          🔗 {response.link_title}
        </span>
      ) : null}
      {greetings.length ? (
        <p className="text-xs text-muted-foreground">{greetings.length} greeting variation(s)</p>
      ) : null}
    </div>
  );
}

export function AutomationCanvas({
  automation,
  onOpen,
}: {
  automation: IgAutomation;
  onOpen: (block: CanvasBlock) => void;
}) {
  const { nodes, edges } = useMemo(() => {
    const row = automation;
    const follow = row.follow_required;
    const needsOpener = follow || Boolean(row.config.response.media_url);
    const list: Node<BlockData>[] = [
      {
        id: "post",
        type: "block",
        position: { x: 0, y: 140 },
        data: {
          block: "post",
          title: isReel(row) ? "Reel" : "Post",
          icon: <MessageCircle className="h-3.5 w-3.5" />,
          accent: "#E4405F",
          target: false,
          body: (
            <div className="flex gap-2.5">
              <PostThumb src={row.thumbnail_url} reel={isReel(row)} className="h-16 w-16" />
              <p className="line-clamp-4 text-xs text-muted-foreground">{row.caption || row.name}</p>
            </div>
          ),
        },
      },
      {
        id: "keywords",
        type: "block",
        position: { x: 320, y: 140 },
        data: {
          block: "keywords",
          title: "Comment contains",
          icon: <KeyRound className="h-3.5 w-3.5" />,
          accent: "#7C3AED",
          body: chips(row.keywords),
        },
      },
      {
        id: "reply",
        type: "block",
        position: { x: 660, y: -40 },
        data: {
          block: "reply",
          title: "Reply to comment",
          icon: <MessageSquareReply className="h-3.5 w-3.5" />,
          accent: "#0EA5E9",
          muted: !row.comment_reply_enabled,
          source: false,
          body: row.comment_reply_enabled ? (
            <div className="space-y-1">
              <p className="line-clamp-2">{row.config.comment_replies[0]}</p>
              {row.config.comment_replies.length > 1 ? (
                <p className="text-xs text-muted-foreground">+{row.config.comment_replies.length - 1} variation(s)</p>
              ) : null}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Off — tap to turn on</p>
          ),
        },
      },
    ];
    const edgeList: Edge[] = [
      { id: "post-keywords", source: "post", target: "keywords" },
      { id: "keywords-reply", source: "keywords", target: "reply", label: "Public reply" },
    ];

    const dmX = follow ? 1000 : 660;
    list.push({
      id: "dm",
      type: "block",
      position: { x: dmX, y: 200 },
      data: {
        block: "dm",
        title: "Send DM",
        icon: <Send className="h-3.5 w-3.5" />,
        accent: "#16A34A",
        source: false,
        body: (
          <div className="space-y-2">
            {needsOpener ? (
              <div className="rounded-lg bg-muted/60 p-2 text-xs">
                <p className="line-clamp-2">{row.config.opener_text}</p>
                <span className="mt-1 inline-block rounded-md border bg-white px-1.5 py-0.5 font-medium">
                  {row.config.opener_button}
                </span>
              </div>
            ) : null}
            {responseSummary(row)}
          </div>
        ),
      },
    });

    if (follow) {
      list.push(
        {
          id: "follow",
          type: "block",
          position: { x: 660, y: 200 },
          data: {
            block: "follow",
            title: "Follows you?",
            icon: <UserCheck className="h-3.5 w-3.5" />,
            accent: "#F59E0B",
            extraSource: true,
            body: <p className="text-xs text-muted-foreground">Checked when they tap the DM button</p>,
          },
        },
        {
          id: "follow-prompt",
          type: "block",
          position: { x: 660, y: 400 },
          data: {
            block: "follow",
            title: "Ask to follow",
            icon: <UserPlus className="h-3.5 w-3.5" />,
            accent: "#F59E0B",
            source: false,
            body: (
              <div className="text-xs">
                <p className="line-clamp-3">{row.config.follow_prompt}</p>
                <span className="mt-1 inline-block rounded-md border bg-white px-1.5 py-0.5 font-medium">
                  {row.config.follow_button}
                </span>
              </div>
            ),
          },
        },
      );
      edgeList.push(
        { id: "keywords-follow", source: "keywords", target: "follow", label: "DM" },
        { id: "follow-dm", source: "follow", target: "dm", label: "Yes" },
        {
          id: "follow-prompt",
          source: "follow",
          sourceHandle: "bottom",
          target: "follow-prompt",
          label: "Not yet",
          style: { stroke: "#F59E0B" },
        },
      );
    } else {
      edgeList.push({ id: "keywords-dm", source: "keywords", target: "dm", label: "DM" });
    }

    return {
      nodes: list,
      edges: edgeList.map((edge) => ({
        ...edge,
        type: "smoothstep",
        animated: automation.enabled,
        markerEnd: { type: MarkerType.ArrowClosed },
        labelBgPadding: [6, 3] as [number, number],
        labelBgBorderRadius: 6,
        labelStyle: { fontSize: 11, fontWeight: 500 },
      })),
    };
  }, [automation]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      onNodeClick={(_, node) => onOpen((node.data as BlockData).block)}
      minZoom={0.2}
      maxZoom={1.25}
      proOptions={{ hideAttribution: true }}
    >
      <FitOnReady layoutKey={`${automation.follow_required}`} />
      <Background gap={18} size={1} color="oklch(0.86 0.02 230)" />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}
