import type { ChatMessage } from "@/data/types";

/**
 * Per-thread DM scripts, keyed by counterparty handle. Each script's final
 * message matches the thread's `lastMessage` in MOCK_CHATS so the inbox
 * preview never lies. Timestamps are unix seconds against the app's fixed
 * "now" (1717372800).
 */
export const MOCK_THREAD_MESSAGES: Record<string, ChatMessage[]> = {
  alice: [
    {
      id: "msg_a1",
      from: "me",
      text: "Hi! Is this still available? Could you combine shipping if I take two?",
      at: 1717180000,
      productId: "lst_001",
    },
    { id: "msg_a2", from: "them", text: "Hey! Yes to both. Two mugs is no problem.", at: 1717183600 },
    { id: "msg_a3", from: "me", text: "Great. Same glaze on both?", at: 1717270000 },
    {
      id: "msg_a4",
      from: "them",
      text: "One oatmeal, one speckled white. Both wheel-thrown in this batch.",
      at: 1717283000,
    },
    {
      id: "msg_a5",
      from: "them",
      text: "Yes, I can ship two mugs together to save on postage.",
      at: 1717286400,
    },
  ],
  daveshoots: [
    {
      id: "msg_d1",
      from: "me",
      text: "Hi! How accurate is the meter on this one?",
      at: 1717110000,
      productId: "lst_005",
    },
    {
      id: "msg_d2",
      from: "them",
      text: "Serviced it myself. Reads within a third of a stop across the range.",
      at: 1717113600,
    },
    { id: "msg_d3", from: "me", text: "Any haze or fungus in the glass?", at: 1717196400 },
    { id: "msg_d4", from: "them", text: "Glass is clean, shutter CLA'd too.", at: 1717199000 },
    { id: "msg_d5", from: "them", text: "The light meter was recalibrated last month.", at: 1717200000 },
  ],
  "mara.knits": [
    {
      id: "msg_m1",
      from: "them",
      text: "Hi! Do you ship the zine to Iceland?",
      at: 1717300000,
      productId: "lst_007",
    },
    { id: "msg_m2", from: "me", text: "Hey! Yes, tracked letter post. Adds 3,000 sats.", at: 1717303600 },
    { id: "msg_m3", from: "them", text: "Works for me. Is no. 4 the latest issue?", at: 1717310000 },
  ],
};
