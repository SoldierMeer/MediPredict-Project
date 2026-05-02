from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database import get_session
from app.models import Medication, MedicationBase

router = APIRouter(prefix="/medications", tags=["Medications"])

@router.post("/add")
async def add_medication(med_data: Medication, session: Session = Depends(get_session)):
    session.add(med_data)
    session.commit()
    session.refresh(med_data)
    return {"message": "Medication added", "med_id": med_data.id}

@router.get("/list/{patient_id}")
async def list_medications(patient_id: int, session: Session = Depends(get_session)):
    statement = select(Medication).where(Medication.patient_id == patient_id)
    results = session.exec(statement).all()
    return results