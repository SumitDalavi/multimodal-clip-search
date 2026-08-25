import request from "supertest";
import app from "../src/index";

jest.mock("@xenova/transformers", () => ({ 
  pipeline: jest.fn(), 
  env: { allowLocalModels: false }, 
  RawImage: jest.fn() 
}));

describe("Multimodal CLIP Search API", () => {
  it("should list all images", async () => {
    const res = await request(app).get("/api/images");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("images");
    expect(Array.isArray(res.body.images)).toBe(true);
    expect(res.body).toHaveProperty("total");
  });
  
  it("should require query for search", async () => {
    const res = await request(app).post("/api/search").send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });
});
