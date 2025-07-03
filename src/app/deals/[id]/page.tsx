import { DealDetail } from "@/components/deals/DealDetail";

interface DealDetailPageProps {
  params: {
    id: string;
  };
}

export default function DealDetailPage({ params }: DealDetailPageProps) {
  return <DealDetail dealId={params.id} />;
}
