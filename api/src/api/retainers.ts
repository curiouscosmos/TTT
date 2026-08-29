import express from "express";
import { z } from "zod/v4";

import * as retainers from "../services/retainers.js";

const router = express.Router();

const statusSchema = z.enum(["active", "archived"]);

const createRetainerSchema = z.object({
  clientName: z.string().trim().min(1),
  startDate: z.coerce.date(),
  status: statusSchema.optional(),
  leadEngineer: z.string().trim().min(1),
});

const updateRetainerSchema = createRetainerSchema.partial().refine(
  data => Object.keys(data).length > 0,
  "At least one field is required.",
);

router.get("/", async (req, res) => {
  res.json(await retainers.listRetainers());
});

router.get("/:id", async (req, res) => {
  res.json(await retainers.getRetainer(req.params.id));
});

router.post("/", async (req, res) => {
  const data = createRetainerSchema.parse(req.body);
  res.status(201).json(await retainers.createRetainer(data));
});

router.patch("/:id", async (req, res) => {
  const data = updateRetainerSchema.parse(req.body);
  res.json(await retainers.updateRetainer(req.params.id, data));
});

export default router;
