import { buildSlackLink } from "@/lib/auth";
import { buildSlackHomeView } from "@/lib/slack";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("user_id") || "";
  const teamId = url.searchParams.get("team_id") || "";
  const userName = url.searchParams.get("user_name") || userId;

  const link = buildSlackLink({
    userId,
    teamId,
    userName,
    imageUrl: "",
    source: "home_tab",
  });

  return Response.json(
    buildSlackHomeView({
      displayName: userName,
      loginLink: link,
    }),
  );
}