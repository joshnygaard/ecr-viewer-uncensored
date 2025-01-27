import { NextRequest } from "next/server";
import { get_fhir_data } from "./fhir-data-service";

/**
 * Handles GET requests by fetching data from different sources based on the environment configuration.
 * It supports fetching from S3 and Postgres. If the `SOURCE` environment variable is not set to
 * a supported source, it returns a JSON response indicating an invalid source.
 * @param request - The incoming request object provided by Next.js.
 * @returns A promise that resolves to a `NextResponse` object
 *   if the source is invalid, or the result of fetching from the specified source.
 *   The specific return type (e.g., the type returned by `get_s3` or `get_postgres`)
 *   may vary based on the source and is thus marked as `unknown`.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const ecr_id = params.get("id") || null;
  return get_fhir_data(ecr_id);
}
