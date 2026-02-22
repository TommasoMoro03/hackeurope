export const EXPERIMENT_CONFIG = {
  id: 12,
  project_id: 9,
  name: "Color Change Button Test",
  description: "Button change color",
  percentage: 100.0,
  metrics: "Proportion of clicks",
  segments: [
    {
      id: 23,
      name: "A",
      instructions: "Keep original layout. No changes. Baseline for comparison.",
      percentage: 0.5,
      preview_hash: "c4VaNsYGI5g"
    },
    {
      id: 24,
      name: "B",
      instructions: "Please, make the button apperar once again. Follow only this, And change the color of the signin button",
      percentage: 0.5,
      preview_hash: "IDoGIptTAJw"
    }
  ]
};

export const WEBHOOK_URL = "http://localhost:9000/webhook/event";
