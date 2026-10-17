/**
 * Stock media for post mockups (Unsplash and Pexels licenses: free for commercial
 * use; sources in public/media/CREDITS.md). Swap any file for real product media
 * by keeping the same path, or add entries here.
 */

export type Photo = { src: string; width: number; height: number; alt: string };
export type Video = Photo & { poster: string };

export const photos = {
  /** 4:5 feed posts */
  linenDrop: { src: "/media/post-linen-drop.webp", width: 1080, height: 1350, alt: "Linen shirts in white, sky blue and navy hanging on a rail" },
  linenHangers: { src: "/media/post-linen-hangers.webp", width: 1080, height: 1350, alt: "A row of white linen shirts on wooden hangers" },
  greenLinen: { src: "/media/post-green-linen.webp", width: 1080, height: 1350, alt: "Green linen draped over rustic wooden frames" },
  planters: { src: "/media/post-planters.webp", width: 1080, height: 1350, alt: "Terracotta planters with succulents on a table" },
  shopWindow: { src: "/media/post-shop-window.webp", width: 1080, height: 1350, alt: "Potted plants on stools in a sunlit shop window" },
  boutique: { src: "/media/post-boutique.webp", width: 1080, height: 1350, alt: "A bright boutique with neutral linen dresses on a rack and a cactus" },
  /** 1:1 catalog items */
  linenStack: { src: "/media/item-linen-stack.webp", width: 640, height: 640, alt: "Folded linen in soft pastel colours" },
  linenShirt: { src: "/media/item-linen-shirt.webp", width: 640, height: 640, alt: "A cream linen shirt on a wooden hanger" },
  mug: { src: "/media/item-mug.webp", width: 640, height: 640, alt: "A white ceramic mug on a windowsill" },
  tote: { src: "/media/item-tote.webp", width: 640, height: 640, alt: "A natural canvas tote bag" },
  planter: { src: "/media/item-planter.webp", width: 640, height: 640, alt: "Terracotta pots with green plants" },
} satisfies Record<string, Photo>;

export type PhotoId = keyof typeof photos;

export const videos = {
  /** 9:16, 8s silent loop: the "Linen drop" Reel. */
  linenReel: {
    src: "/media/reel-linen.mp4",
    poster: "/media/reel-linen-poster.webp",
    width: 540,
    height: 960,
    alt: "Folded pastel linen stacked on a shelf beside dried pampas grass",
  },
} satisfies Record<string, Video>;

export type VideoId = keyof typeof videos;

/** Demo store catalog (the agent shows these as swipeable cards from a CSV). Prices are illustrative. */
export const catalog: { id: string; name: string; price: string; note: string; photo: PhotoId }[] = [
  { id: "linen-set", name: "Linen bedding set", price: "₹4,800", note: "Queen · 6 colours", photo: "linenStack" },
  { id: "linen-shirt", name: "Relaxed linen shirt", price: "₹2,450", note: "Pre-washed", photo: "linenShirt" },
  { id: "planter", name: "Terracotta planter", price: "₹890", note: "S · M · L", photo: "planter" },
  { id: "mug", name: "Stoneware mug", price: "₹650", note: "350 ml", photo: "mug" },
  { id: "tote", name: "Canvas market tote", price: "₹790", note: "Heavy cotton", photo: "tote" },
];

/** The demo brand used across mockups. */
export const demoBrand = { name: "Northwind Studio", handle: "northwind.studio" };
