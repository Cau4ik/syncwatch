import type { FastifyInstance } from "fastify";

export async function uploadRoutes(app: FastifyInstance) {
  app.post("/api/uploads/video", async () => ({
    uploadUrl: "https://example-upload.local/presigned",
    asset: {
      id: "upload_demo_1",
      title: "demo-video.mp4",
      mimeType: "video/mp4",
      status: "pending-processing"
    }
  }));
}

