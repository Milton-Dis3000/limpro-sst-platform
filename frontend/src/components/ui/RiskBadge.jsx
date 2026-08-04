import { riskLabels } from "../../utils/constants.js";

export default function RiskBadge({ risk = "sin_clasificar" }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-normal risk-${risk}`}>
      {riskLabels[risk] || risk}
    </span>
  );
}
