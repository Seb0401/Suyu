import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/authServer";
import { checkIn } from "@/lib/passport";

/**
 * POST /api/passport/checkin — multipart/form-data:
 * site_id, lat, lng, accessibility_rating, review?, photo? (File).
 */
export async function POST(request: Request) {
  const auth = await getUserIdFromRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "No pudimos leer el formulario." }, { status: 400 });
  }

  const photo = form.get("photo");

  const result = await checkIn(auth.userId, {
    site_id: form.get("site_id"),
    lat: form.get("lat"),
    lng: form.get("lng"),
    accessibility_rating: form.get("accessibility_rating"),
    review: form.get("review"),
    photo: photo instanceof File ? photo : null,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ stamp: result.stamp }, { status: 201 });
}
