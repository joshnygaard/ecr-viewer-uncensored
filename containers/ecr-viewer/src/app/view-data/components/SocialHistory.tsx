import { AccordionSection, AccordionSubSection } from "../component-utils";
import React from "react";
import {
  DataDisplay,
  DataTableDisplay,
  DisplayDataProps,
} from "@/app/view-data/components/DataDisplay";

interface SocialHistoryProps {
  socialData: DisplayDataProps[];
}

/**
 * Functional component for displaying social history.
 * @param props - Props for social history.
 * @param props.socialData - The fields to be displayed.
 * @returns The JSX element representing social history.
 */
const SocialHistory: React.FC<SocialHistoryProps> = ({ socialData }) => {
  return (
    <AccordionSection>
      <AccordionSubSection title="Social History">
        {socialData.map((item, index) => {
          if (item.table) {
            return <DataTableDisplay item={item} key={index} />;
          } else {
            return <DataDisplay item={item} key={index} />;
          }
        })}
      </AccordionSubSection>
    </AccordionSection>
  );
};

export default SocialHistory;
