import { buildSlackLink } from "@/lib/auth";
import { buildSlackHomeView, fetchSlackProfile, publishSlackHomeView } from "@/lib/slack";
import { readSlackPayload, verifySlackRequest } from "@/lib/slack-request";

function readString(value: unknown) {
  return typeof value === "string" ? value : "";
}

export async function POST(request: Request) {
  if (!(await verifySlackRequest(request))) {
    return new Response("invalid signature", { status: 401 });
  }

  const { payload } = await readSlackPayload(request);
  const type = readString(payload.type);

  if (type === "url_verification") {
    return Response.json({ challenge: readString(payload.challenge) });
  }

  if (type !== "event_callback") {
    return new Response("ok", { status: 200 });
  }

  const event = payload.event as Record<string, unknown> | undefined;
  if (!event) {
    return new Response("ok", { status: 200 });
  }

  if (readString(event.type) !== "app_home_opened") {
    return new Response("ok", { status: 200 });
  }

  const userId = readString(event.user);
  if (!userId) {
    return new Response("ok", { status: 200 });
  }

  const authorizations = Array.isArray(payload.authorizations) ? payload.authorizations : [];
  const firstAuthorization = authorizations[0] as
    | {
        team_id?: string;
        team?: {
          id?: string;
        };
      }
    | undefined;
  const teamId =
    readString(payload.team_id) ||
    readString(firstAuthorization?.team_id) ||
    readString(firstAuthorization?.team?.id);

  const profile = await fetchSlackProfile(userId);
  const loginLink = buildSlackLink({
    userId,
    teamId,
    userName: profile.displayName,
    imageUrl: profile.imageUrl,
    source: "home_tab",
  });

  await publishSlackHomeView({
    userId,
    view: buildSlackHomeView({
      displayName: profile.displayName,
      loginLink,
    }),
  });

  return new Response("ok", { status: 200 });
}