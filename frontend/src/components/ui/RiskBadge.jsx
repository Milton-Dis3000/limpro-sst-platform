import { riskLabels } from "../../utils/constants.js";

export default function RiskBadge({ risk = "sin_clasificar" }) {
  return (
    <span className={`inline-flex w-fit shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold uppercase leading-none tracking-normal risk-${risk}`}>
      {riskLabels[risk] || risk}
    </span>
  );
}
