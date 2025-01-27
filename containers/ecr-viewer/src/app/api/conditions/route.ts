import { NextResponse } from "next/server";
import { get_conditions_postgres, get_conditions_sqlserver } from "./service";

/**
 * Retrieves FHIR data from PostgreSQL database based on eCR ID.
 * @returns A promise resolving to a NextResponse object.
 */
export async function GET() {
  const metadataLocation = process.env.METADATA_DATABASE_TYPE;

  try {
    switch (metadataLocation) {
      case "postgres":
        return NextResponse.json(await get_conditions_postgres(), {
          status: 200,
        });
      case "sqlserver":
        return NextResponse.json(await get_conditions_sqlserver(), {
          status: 200,
        });
      default:
        return NextResponse.json(
          {
            message: "Invalid metadata location.",
          },
          { status: 500 },
        );
    }
  } catch (e) {
    return NextResponse.json(
      { message: "Failed to get conditions." },
      { status: 500 },
    );
  }
}
