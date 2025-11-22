import RoomClient from "@/components/RoomClient";

export default async function RoomPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ name: string }>;
}) {
    const { id } = await params;
    const { name } = await searchParams;

    return <RoomClient roomId={id} userName={name || "Guest"} />;
}
