import { PipelineStage } from "mongoose";

export class PipelineBuilder<T> {
  private pipeline: any[] = [];
  constructor() {
    this.pipeline = [];
  }

  sort(sortCriteria: Record<string, 1 | -1>): PipelineBuilder<T> {
    this.pipeline.push({ type: "sort", criteria: sortCriteria });
    return this;
  }

  limit(limitNumber: number): PipelineBuilder<T> {
    const MaxLimit = 40;
    limitNumber = Math.min(limitNumber, MaxLimit);
    this.pipeline.push({ $limit: limitNumber });
    return this;
  }
  in(field: string, values: unknown): PipelineBuilder<T> {
    this.pipeline.push({ $match: { [field]: { $in: values } } });
    return this;
  }

  project(projection: Partial<Record<keyof T, 0 | 1>>): PipelineBuilder<T> {
    this.pipeline.push({ $project: projection });
    return this;
  }

  match(filter: Record<string, unknown>): PipelineBuilder<T> {
    this.pipeline.push({ $match: filter });
    return this;
  }

  unwind(path: string): PipelineBuilder<T> {
    this.pipeline.push({ $unwind: `$${path}` });
    return this;
  }

  build(): PipelineStage[] {
    return this.pipeline;
  }
}
