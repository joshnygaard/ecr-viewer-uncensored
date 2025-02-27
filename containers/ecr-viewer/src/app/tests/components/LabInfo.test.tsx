import { render, screen } from "@testing-library/react";
import LabInfo from "@/app/view-data/components/LabInfo";
import userEvent from "@testing-library/user-event";
import React from "react";
import BundleLab from "@/app/tests/assets/BundleLab.json";
import BundleLabNoLabIds from "@/app/tests/assets/BundleLabNoLabIds.json";
import { loadYamlConfig } from "@/app/api/utils";
import { Bundle } from "fhir/r4";
import {
  evaluateLabInfoData,
  LabReportElementData,
} from "@/app/services/labsService";
import { evaluate } from "@/app/utils/evaluate";

const mappings = loadYamlConfig();

describe("LabInfo", () => {
  describe("when labResults is LabReportElementData[]", () => {
    let labInfoJsx: React.ReactElement;
    beforeAll(() => {
      const labinfoOrg = evaluateLabInfoData(
        BundleLab as unknown as Bundle,
        evaluate(BundleLab, mappings["diagnosticReports"]),
        mappings,
      ) as LabReportElementData[];

      // Empty out one of the lab names for testing
      labinfoOrg[0].organizationDisplayDataProps[0].value = "";

      labInfoJsx = <LabInfo labResults={labinfoOrg} />;
    });
    it("all should be collapsed by default", () => {
      render(labInfoJsx);

      screen
        .getAllByTestId("accordionButton", { exact: false })
        .forEach((button) => {
          expect(button).toHaveAttribute("aria-expanded", "false");
        });
      screen
        .getAllByTestId("accordionItem", { exact: false })
        .forEach((accordion) => {
          expect(accordion).not.toBeVisible();
        });
    });
    it("should expand all labs when collapse button is clicked", async () => {
      const user = userEvent.setup();
      render(labInfoJsx);
      const expandButtons = screen.getAllByText("Expand all labs");
      for (const button of expandButtons) {
        await user.click(button);
      }
      screen
        .getAllByTestId("accordionButton", { exact: false })
        .forEach((button) => {
          expect(button).toHaveAttribute("aria-expanded", "true");
        });
      screen
        .getAllByTestId("accordionItem", { exact: false })
        .forEach((accordion) => {
          expect(accordion).toBeVisible();
        });
    });
    it("should hide all labs when collapse button is clicked", async () => {
      const user = userEvent.setup();
      render(labInfoJsx);
      const expandButtons = screen.getAllByText("Expand all labs");
      for (const button of expandButtons) {
        await user.click(button);
      }
      screen
        .getAllByTestId("accordionButton", { exact: false })
        .forEach((button) => {
          expect(button).toHaveAttribute("aria-expanded", "true");
        });
      screen
        .getAllByTestId("accordionItem", { exact: false })
        .forEach((accordion) => {
          expect(accordion).toBeVisible();
        });

      const collapseButtons = screen.getAllByText("Collapse all labs");
      for (const button of collapseButtons) {
        await user.click(button);
      }
      screen
        .getAllByTestId("accordionButton", { exact: false })
        .forEach((button) => {
          expect(button).toHaveAttribute("aria-expanded", "false");
        });
      screen
        .getAllByTestId("accordionItem", { exact: false })
        .forEach((accordion) => {
          expect(accordion).not.toBeVisible();
        });
    });
    it("should match snapshot test", () => {
      const { container } = render(labInfoJsx);
      expect(container).toMatchSnapshot();
    });
  });

  describe("when labResults is DisplayDataProps[]", () => {
    let labInfoJsx: React.ReactElement;
    beforeAll(() => {
      const labinfo = evaluateLabInfoData(
        BundleLabNoLabIds as unknown as Bundle,
        evaluate(BundleLabNoLabIds, mappings["diagnosticReports"]),
        mappings,
      );
      labInfoJsx = <LabInfo labResults={labinfo} />;
    });
    it("should be collapsed by default", () => {
      render(labInfoJsx);

      screen
        .getAllByTestId("accordionButton", { exact: false })
        .forEach((button) => {
          expect(button).toHaveAttribute("aria-expanded", "false");
        });
      screen
        .getAllByTestId("accordionItem", { exact: false })
        .forEach((accordion) => {
          expect(accordion).not.toBeVisible();
        });
    });
    it("should match snapshot test", () => {
      const { container } = render(labInfoJsx);
      expect(container).toMatchSnapshot();
    });
  });
});
