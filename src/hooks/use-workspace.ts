import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyWorkspace } from "@/lib/api/documents.functions";

export function useWorkspace() {
  const fn = useServerFn(getMyWorkspace);
  return useQuery({ queryKey: ["workspace"], queryFn: () => fn(), staleTime: 5 * 60_000 });
}
