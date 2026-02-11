import { useParams } from "react-router-dom";
import { ReportForm } from "@/components/report-form";

export default function RelatorioEditarPage() {
  const { id } = useParams();
  if (!id) return null;
  return <ReportForm reportId={id} />;
}
