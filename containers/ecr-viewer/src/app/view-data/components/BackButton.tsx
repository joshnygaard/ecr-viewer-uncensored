import React from "react";
import { Icon } from "@trussworks/react-uswds";
import Link from "next/link";
import classNames from "classnames";
import { env } from "next-runtime-env";
import { retrieveFromSessionStorage } from "../../components/utils";

interface BackButtonProps {
  className?: string;
  iconClassName?: string;
}

/**
 * Back button component for returning users from the eCR Viewer page to the eCR Library home page
 * @param props - Properties for the back button
 * @param props.className - Class names to be applied to the link
 * @param props.iconClassName - Class names to be applied to the icon
 * @returns <BackButton/> a react component back button
 */
export const BackButton = ({ className, iconClassName }: BackButtonProps) => {
  const isNonIntegratedViewer =
    env("NEXT_PUBLIC_NON_INTEGRATED_VIEWER") === "true";

  const savedUrlParams = retrieveFromSessionStorage("urlParams");

  return (
    <>
      {isNonIntegratedViewer ? (
        <Link
          href={savedUrlParams ? `/?${savedUrlParams}` : "/"}
          className={classNames("display-inline-block", className)}
        >
          <Icon.ArrowBack
            aria-label={"Back Arrow"}
            size={3}
            className={classNames("text-middle margin-right-1", iconClassName)}
          />
          Back to eCR Library
        </Link>
      ) : (
        ""
      )}
    </>
  );
};
