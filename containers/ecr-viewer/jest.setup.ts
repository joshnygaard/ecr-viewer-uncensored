import "@testing-library/jest-dom";
import { toHaveNoViolations } from "jest-axe";
import failOnConsole from "jest-fail-on-console";
import * as matchers from "jest-extended";
import { TextEncoder } from "util";
import router from "next-router-mock";
import { clearEvaluateCache } from "@/app/view-data/utils/evaluate";

global.TextEncoder = TextEncoder;

failOnConsole();

expect.extend(toHaveNoViolations);
expect.extend(matchers);

// Mocking `next/navigation` hooks
jest.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => router.pathname,
  useSearchParams: () => {
    const params = new URLSearchParams(router.asPath.split("?")[1]);
    return {
      get: params.get.bind(params),
      toString: () => params.toString(),
    };
  },
}));

beforeEach(() => {
  clearEvaluateCache();
});
