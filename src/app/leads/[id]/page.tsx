import { LeadDetail } from "@/components/leads/LeadDetail";

interface LeadDetailPageProps {
  params: {
    id: string;
  };
}

export default function LeadDetailPage({ params }: LeadDetailPageProps) {
  return <LeadDetail leadId={params.id} />;
}
