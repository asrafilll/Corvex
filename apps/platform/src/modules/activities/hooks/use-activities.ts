import { queryOptions } from "@tanstack/react-query";
import { listActivities } from "../services";

export function activitiesQueryOptions(projectId: string) {
  return queryOptions({
    queryKey: ["projects", projectId, "activities"],
    queryFn: () => listActivities(projectId),
  });
}
