from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ai.recommendations import get_all_recommendations
from ai.track_classifier import get_track_prediction

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])

class RecommendationsRequest(BaseModel):
    subject_thetas: dict[str, float]

@router.post("/")
async def get_recommendations(req: RecommendationsRequest):
    """Get personalized recommendations based on student performance thetas."""
    try:
        if not req.subject_thetas:
            return {
                "short_term": [],
                "long_term": [],
                "predicted_track": None,
                "track_confidence": None,
                "message": "Take exams in multiple subjects to get personalized recommendations."
            }
        
        # Generate recommendations
        result = get_all_recommendations(req.subject_thetas)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/track")
async def get_track(req: RecommendationsRequest):
    """Get track classification prediction."""
    try:
        if not req.subject_thetas:
            return {"predicted_track": None, "message": "Insufficient data"}
            
        return get_track_prediction(req.subject_thetas)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
