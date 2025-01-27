import React from "react";
import { render, screen } from "@testing-library/react";
import ECRViewerPage from "../view-data/page";

jest.mock("../view-data/component-utils", () => ({
  metrics: jest.fn(),
}));

jest.mock("../view-data/components/LoadingComponent", () => ({
  EcrLoadingSkeleton: () => <div>Loading...</div>,
}));

function mockFetch(data: any, status?: number, statusText?: string) {
  return jest.fn().mockImplementation(() =>
    Promise.resolve({
      ok: status === 200 ? true : false,
      status: status,
      statusText: statusText,
      json: () => data,
    }),
  );
}

describe("ECRViewerPage", () => {
  beforeAll(() => {
    process.env.BASE_PATH = "ecr-viewer";
  });
  afterAll(() => {
    delete process.env.BASE_PATH;
  });

  it("should handle 404 error", async () => {
    window.fetch = mockFetch({}, 404);

    render(<ECRViewerPage />);

    expect(await screen.findByText("eCR retrieval failed"));
  });

  it("should handle 500 error", async () => {
    window.fetch = mockFetch({}, 500, "uh oh something went wrong");

    render(<ECRViewerPage />);

    expect(await screen.findByText("500: uh oh something went wrong"));
  });

  it("should handle invalid response", async () => {
    window.fetch = mockFetch(null, 200);

    render(<ECRViewerPage />);

    expect(
      await screen.findByText(
        "500: TypeError: Cannot read properties of null (reading 'fhirBundle')",
      ),
    );
  });
});
