/**
 * @jest-environment node
 */
import { GET } from "@/app/api/conditions/route";
import {
  get_conditions_postgres,
  get_conditions_sqlserver,
} from "@/app/api/conditions/service";

jest.mock("../../../api/conditions/service", () => ({
  get_conditions_postgres: jest.fn(),
  get_conditions_sqlserver: jest.fn(),
}));

describe("GET Conditions", () => {
  afterEach(() => {
    delete process.env.METADATA_DATABASE_TYPE;
    jest.resetAllMocks();
  });

  it("should return a 200 response with postgres conditions when metadataSaveLocation is postgres", async () => {
    process.env.METADATA_DATABASE_TYPE = "postgres";
    const mockConditions = ["Condition X", "Condition Y"];
    (get_conditions_postgres as jest.Mock).mockResolvedValue(mockConditions);

    const response = await GET();

    expect(get_conditions_postgres).toHaveBeenCalledOnce();
    expect(get_conditions_sqlserver).not.toHaveBeenCalled();
    expect(response.status).toEqual(200);
    expect(await response.json()).toEqual(mockConditions);
  });

  it("should return a 200 response with sqlserver conditions when metadataSaveLocation is sqlserver", async () => {
    process.env.METADATA_DATABASE_TYPE = "sqlserver";
    const mockConditions = ["Condition A", "Condition B"];
    (get_conditions_sqlserver as jest.Mock).mockResolvedValue(mockConditions);

    const response = await GET();

    expect(get_conditions_sqlserver).toHaveBeenCalledOnce();
    expect(get_conditions_postgres).not.toHaveBeenCalled();
    expect(response.status).toEqual(200);
    expect(await response.json()).toEqual(mockConditions);
  });

  it("should return a 500 response when METADATA_DATABASE_TYPE is invalid", async () => {
    delete process.env.METADATA_DATABASE_TYPE;

    const response = await GET();

    expect(response.status).toEqual(500);
    expect(await response.json()).toEqual({
      message: "Invalid metadata location.",
    });
  });

  it("should return a 500 response when an error occurs", async () => {
    process.env.METADATA_DATABASE_TYPE = "postgres";
    const mockError = new Error("Test error");
    (get_conditions_postgres as jest.Mock).mockRejectedValue(mockError);

    const response = await GET();

    expect(get_conditions_postgres).toHaveBeenCalled();
    expect(get_conditions_sqlserver).not.toHaveBeenCalled();
    expect(response.status).toEqual(500);
    expect(await response.json()).toEqual({
      message: "Failed to get conditions.",
    });
  });
});
