import { PatientDetailView } from "./_components/patient-detail-view";

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = await params;
  return <PatientDetailView patientId={patientId} />;
}
