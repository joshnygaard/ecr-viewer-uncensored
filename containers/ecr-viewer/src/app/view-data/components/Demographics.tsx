import { AccordionSection, AccordionSubSection } from "../component-utils";
import React from "react";
import {
  DataDisplay,
  DisplayDataProps,
} from "@/app/view-data/components/DataDisplay";

interface DemographicsProps {
  demographicsData: DisplayDataProps[];
}

/**
 * Functional component for displaying demographic data
 * @param demographicsData - Props for demographic data
 * @param demographicsData.demographicsData - The details of fields to be displayed of demographic data
 * @returns The JSX element representing demographic data
 */
const Demographics = ({ demographicsData }: DemographicsProps) => {
  return (
    <AccordionSection>
      <AccordionSubSection title="Demographics">
        {demographicsData.map((item, index) => (
          <DataDisplay item={item} key={index} />
        ))}
      </AccordionSubSection>
    </AccordionSection>
  );
};

export default Demographics;
