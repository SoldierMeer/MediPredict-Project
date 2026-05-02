from sqlmodel import SQLModel, Field
from pydantic import EmailStr
from typing import Optional
from enum import Enum
from datetime import time
import random
import string

class UserRole(str, Enum):
    PATIENT = "patient"
    CAREGIVER = "caregiver"
    UNASSIGNED = "unassigned"

# --- DATABASE MODELS (Tables) ---

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    password_hash: str
    role: str # 'patient' or 'caregiver'
    name: Optional[str] = Field(default=None)
    phone: Optional[str] = Field(default=None)
    dob: Optional[str] = Field(default=None)
    # The unique code patients share with caregivers (e.g., MP-1234)
    patient_code: Optional[str] = Field(default=None, index=True, unique=True)

# --- API SCHEMAS (For Requests/Responses) ---

class UserBase(SQLModel):
    email: EmailStr
    role: UserRole

class UserCreate(UserBase):
    email: str
    password: str
    name: Optional[str] = None # ✅ Add this
    role: Optional[str] = "unassigned"
    phone: Optional[str] = None
    dob: Optional[str] = None

class MedicationBase(SQLModel):
    name: str
    dosage: str
    target_time: time
    max_snoozes: int = 3
    is_critical: bool = False

class MedicationResponse(MedicationBase):
    id: str
    patient_id: str

class Medication(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    dosage: str
    dosage_time: str
    target_time: time
    max_snoozes: int = 3
    is_critical: bool = False
    is_taken: bool = False
    
    # The Link: Connects this pill to a specific user
    patient_id: int = Field(foreign_key="user.id")

class UserRelationship(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    caregiver_id: int = Field(foreign_key="user.id")
    patient_id: int = Field(foreign_key="user.id")
    status: str = Field(default="pending") # pending, accepted, rejected