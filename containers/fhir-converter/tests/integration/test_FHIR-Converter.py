from pathlib import Path

import httpx
import pytest
from syrupy.matchers import path_type

CONVERTER_URL = "http://localhost:8080"
CONVERT_TO_FHIR = CONVERTER_URL + "/convert-to-fhir"


# Ignore all non-mutable fields in a FHIR bundle:
# ids, references, etc, will not be evaluated in snapshot testing.
ignore_mutable_fields_regex_mapping = {
    ".*id": (str,),
    ".*fullUrl": (str,),
    ".*url": (str,),
    ".*div": (str,),
    ".*reference": (str,),
}
match_excluding_mutable_fields = path_type(
    mapping=ignore_mutable_fields_regex_mapping, regex=True
)


@pytest.mark.integration
def test_health_check(setup):
    health_check_response = httpx.get(CONVERTER_URL)
    assert health_check_response.status_code == 200


@pytest.mark.integration
def test_openapi():
    actual_response = httpx.get(CONVERTER_URL + "/fhir-converter/openapi.json")
    assert actual_response.status_code == 200


@pytest.mark.integration
def test_vxu_conversion(setup, snapshot):
    input_data = open(
        Path(__file__).parent.parent.parent / "assets" / "sample_request.hl7"
    ).read()
    request = {
        "input_data": input_data,
        "input_type": "vxu",
        "root_template": "VXU_V04",
    }
    vxu_conversion_response = httpx.post(CONVERT_TO_FHIR, json=request)

    assert vxu_conversion_response.status_code == 200
    assert vxu_conversion_response.json()["response"] == snapshot(
        matcher=match_excluding_mutable_fields
    )


@pytest.mark.integration
def test_ecr_conversion(setup, snapshot):
    input_data = open(
        Path(__file__).parent.parent.parent.parent.parent
        / "tests"
        / "assets"
        / "fhir-converter"
        / "ccda"
        / "ccda_sample.xml"
    ).read()
    request = {"input_data": input_data, "input_type": "ecr", "root_template": "EICR"}
    ecr_conversion_response = httpx.post(CONVERT_TO_FHIR, json=request)
    assert ecr_conversion_response.status_code == 200
    assert ecr_conversion_response.json()["response"] == snapshot(
        matcher=match_excluding_mutable_fields
    )


@pytest.mark.integration
@pytest.mark.parametrize(
    "dir_name",
    [
        (case.name)
        for case in (Path(__file__).parent.parent / "test_files/snapshot").iterdir()
        if case.is_dir()
    ],
)
def test_ecr_conversion_with_rr(dir_name, snapshot):
    rr_data = open(
        Path(__file__).parent.parent / "test_files/snapshot" / dir_name / "CDA_RR.xml"
    ).read()
    input_data = open(
        Path(__file__).parent.parent / "test_files/snapshot" / dir_name / "CDA_eICR.xml"
    ).read()
    request = {
        "input_data": input_data,
        "input_type": "ecr",
        "root_template": "EICR",
        "rr_data": rr_data,
    }
    ecr_conversion_response = httpx.post(CONVERT_TO_FHIR, json=request, timeout=20.0)

    assert ecr_conversion_response.status_code == 200
    assert ecr_conversion_response.json()["response"] == snapshot(
        matcher=match_excluding_mutable_fields
    )


@pytest.mark.integration
def test_invalid_rr_format(setup):
    request = {
        "input_data": "not valid xml",
        "input_type": "ecr",
        "root_template": "EICR",
        "rr_data": "also not valid xml",
    }
    ecr_conversion_response = httpx.post(CONVERT_TO_FHIR, json=request)

    assert ecr_conversion_response.status_code == 422
    assert (
        ecr_conversion_response.json()["detail"]
        == "Reportability Response and eICR message both "
        "must be valid XML messages."
    )


@pytest.mark.integration
def test_single_administrated_medications():
    input_data = open(
        Path(__file__).parent.parent
        / "test_files/eICR_with_single_administrated_medication.xml"
    ).read()
    request = {"input_data": input_data, "input_type": "ecr", "root_template": "EICR"}
    ecr_conversion_response = httpx.post(CONVERT_TO_FHIR, json=request)
    assert ecr_conversion_response.status_code == 200

    medication_administration = list(
        filter(
            lambda x: x.get("fullUrl")
            == "urn:uuid:620f71f8-1ab2-93c8-e0f5-44aec35c7aba",
            ecr_conversion_response.json()["response"]["FhirResource"]["entry"],
        )
    )
    assert len(medication_administration) == 1


@pytest.mark.integration
def test_multiple_administrated_medications():
    input_data = open(
        Path(__file__).parent.parent
        / "test_files/eICR_with_multiple_administrated_medication.xml"
    ).read()
    request = {"input_data": input_data, "input_type": "ecr", "root_template": "EICR"}
    ecr_conversion_response = httpx.post(CONVERT_TO_FHIR, json=request)
    assert ecr_conversion_response.status_code == 200

    entry = ecr_conversion_response.json()["response"]["FhirResource"]["entry"]

    medication_administrations = {
        x["fullUrl"]: x
        for x in filter(
            lambda x: x["resource"]["resourceType"] == "MedicationAdministration",
            entry,
        )
    }
    medications = {
        x["request"]["url"]: x
        for x in filter(
            lambda x: x["resource"]["resourceType"] == "Medication",
            entry,
        )
    }

    # Ensure both medications administrations are there
    assert len(medication_administrations) == 2

    assert "urn:uuid:2ea4f9c3-6568-b453-70a9-490616e7a452" in medication_administrations
    assert "urn:uuid:2ed1497b-2355-83ab-dd76-00c67d6b69c8" in medication_administrations

    # Ensure all medication codes are passed through and mapped
    medication_reference = medication_administrations[
        "urn:uuid:2ea4f9c3-6568-b453-70a9-490616e7a452"
    ]["resource"]["medicationReference"]["reference"]

    medication = medications[medication_reference]
    codes = {x["code"]: x for x in medication["resource"]["code"]["coding"]}
    assert len(codes) == 2
    rxnorm = codes["198352"]
    # This display name was added via conversion and is not present on xml
    assert rxnorm["display"] == "zidovudine 100 MG Oral Capsule"
    assert "rxnorm" in rxnorm["system"]
    translation = codes["10135-150-01"]
    assert "display" not in translation


@pytest.mark.integration
def test_encounter_diagnosis():
    input_data = open(
        Path(__file__).parent.parent / "test_files/eICR_with_diagnosis.xml"
    ).read()
    request = {"input_data": input_data, "input_type": "ecr", "root_template": "EICR"}
    ecr_conversion_response = httpx.post(CONVERT_TO_FHIR, json=request)
    assert ecr_conversion_response.status_code == 200

    entryDiagnoses = [
        entry["resource"]["diagnosis"]
        for entry in filter(
            lambda entry: entry["resource"]["resourceType"] == "Encounter",
            ecr_conversion_response.json()["response"]["FhirResource"]["entry"],
        )
    ]

    diagnosis_references = []
    for diagnoses in entryDiagnoses:
        for diagnosis in diagnoses:
            diagnosis_references.append(diagnosis["condition"]["reference"])

    assert len(diagnosis_references) == 1

    assert "Condition/d282a8e7-21b0-49ff-d7b0-1ce84b5d9b07" in diagnosis_references


@pytest.mark.integration
def test_lab_specimen():
    input_data = open(
        Path(__file__).parent.parent / "test_files/eICR_with_single_lab.xml"
    ).read()
    request = {"input_data": input_data, "input_type": "ecr", "root_template": "EICR"}
    ecr_conversion_response = httpx.post(CONVERT_TO_FHIR, json=request)
    assert ecr_conversion_response.status_code == 200

    specimen_sources = []
    for entry in filter(
        lambda entry: entry["resource"]["resourceType"] == "Observation",
        ecr_conversion_response.json()["response"]["FhirResource"]["entry"],
    ):
        for ext in entry["resource"].get("extension", []):
            if ext["url"] == "http://hl7.org/fhir/R4/specimen.html":
                for sub_ext in ext.get("extension", []):
                    if sub_ext["url"] == "specimen source":
                        specimen_sources.append(sub_ext["valueString"])

    assert len(specimen_sources) == 4
