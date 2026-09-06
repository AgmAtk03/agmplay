import catalog from "@/data/demo-catalog.json";

export function demoTitleIds(): string[] {
  return catalog.titles.map((item) => item.id);
}
