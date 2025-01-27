/**
 * @jest-environment node
 */
import {
  get_conditions_postgres,
  get_conditions_sqlserver,
} from "@/app/api/conditions/service";
import { getDB } from "@/app/api/services/postgres_db";
import { get_pool } from "@/app/api/services/sqlserver_db";

jest.mock("../../../api/services/postgres_db", () => ({
  getDB: jest.fn(),
}));

jest.mock("../../../api/services/sqlserver_db", () => ({
  get_pool: jest.fn(),
}));

describe("get_conditions_postgres", () => {
  const mockDatabase = {
    any: jest.fn(),
  };

  beforeEach(() => {
    // Mock getDB to return the mock database
    (getDB as jest.Mock).mockReturnValue({
      database: mockDatabase,
      pgPromise: {
        ParameterizedQuery: jest.fn().mockImplementation(({ text }: any) => ({
          text,
        })),
      },
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("should return conditions when database query succeeds", async () => {
    const mockConditions = [
      { condition: "condition1" },
      { condition: "condition2" },
    ];
    mockDatabase.any.mockReturnValue(mockConditions);
    const response = await get_conditions_postgres();

    expect(response).toEqual(["condition1", "condition2"]);
    expect(mockDatabase.any).toHaveBeenCalledTimes(1);
  });

  it("should return an error response when database query fails", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});

    const errorMessage = "Database error";

    mockDatabase.any.mockImplementation(async () => {
      throw new Error(errorMessage);
    });

    await expect(get_conditions_postgres()).rejects.toThrow(
      "Error fetching data",
    );
  });
});

describe("get_conditions_sqlserver", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("should return conditions when database query succeeds", async () => {
    const mockConditions = [
      { condition: "condition1" },
      { condition: "condition2" },
    ];

    const mockRequest = {
      query: jest.fn().mockResolvedValue({ recordset: mockConditions }),
    };
    (get_pool as jest.Mock).mockReturnValue({ request: () => mockRequest });

    const response = await get_conditions_sqlserver();

    expect(response).toEqual(["condition1", "condition2"]);
    expect(mockRequest.query).toHaveBeenCalledWith(
      "SELECT DISTINCT condition FROM ecr_rr_conditions ORDER BY condition",
    );
  });

  it("should handle error when database query fails", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(get_conditions_sqlserver()).rejects.toThrow(
      "Error fetching data",
    );
  });
});
