from pydantic import BaseModel, Field


class RefineECRResponse(BaseModel):
    """
    Return for the /ecr endpoint.
    """

    refined_message: str = Field(description="Refined XML as a string.")
