from fastapi import APIRouter, HTTPException, status, Depends
from app.models import UserCreate, User, UserRole, UserRelationship # Ensure UserRelationship is in models.py
from passlib.context import CryptContext
from sqlmodel import Session, select
from app.database import get_session
import random
import string

router = APIRouter(prefix="/auth", tags=["Authentication"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def generate_patient_code():
    """Generates a unique code like MP-1234"""
    digits = ''.join(random.choices(string.digits, k=4))
    return f"MP-{digits}"

@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(user_data: UserCreate, session: Session = Depends(get_session)):
    statement = select(User).where(User.email == user_data.email)
    existing_user = session.exec(statement).first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # We create everyone as UNASSIGNED initially
    new_user = User(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        role=UserRole.UNASSIGNED,
        name=user_data.name,   # ✅ Map name
        phone=user_data.phone, # ✅ Map phone
        dob=user_data.dob,     # ✅ Map DOB
        patient_code=None
    )
    
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    
    # Return the data explicitly
    return {
        "message": "User created successfully",
        "user_id": int(new_user.id), # Force cast to int to ensure it's not null
        "role": str(new_user.role),
        "patient_code": None
    }

@router.post("/login")
async def login(credentials: UserCreate, session: Session = Depends(get_session)):
    statement = select(User).where(User.email == credentials.email)
    user = session.exec(statement).first()
    
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # 1. Check Relationship Status
    link_status = "none"
    rel_statement = select(UserRelationship).where(
        (UserRelationship.caregiver_id == user.id) | 
        (UserRelationship.patient_id == user.id)
    )
    relationship = session.exec(rel_statement).first()
    
    if relationship:
        link_status = relationship.status # 'pending' or 'accepted'

    # 2. Return everything the frontend context needs
    return {
        "message": "Login successful",
        "role": user.role,
        "user_id": user.id,
        "name": user.name or "User", # ✅ Add this
        "email": user.email,         # ✅ Add this
        "phone": user.phone,         # ✅ Add this
        "link_status": link_status,
        "patient_code": user.patient_code,
        "token": "mock-jwt-token"
    }

@router.put("/update-role")
async def update_role(user_id: int, new_role: str, session: Session = Depends(get_session)):
    statement = select(User).where(User.id == user_id)
    user = session.exec(statement).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.role = new_role
    
    # Generate code ONLY if they are becoming a patient
    generated_code = None
    if new_role == "patient" and not user.patient_code:
        generated_code = generate_patient_code()
        user.patient_code = generated_code
        
    session.add(user)
    session.commit()
    session.refresh(user)
    
    return {
        "message": "Role updated", 
        "role": user.role, 
        "patient_code": user.patient_code
    }

@router.post("/links/request")
async def create_link_request(data: dict, session: Session = Depends(get_session)):
    # 1. Find the patient using the CODE (e.g., MP-2948)
    patient_statement = select(User).where(User.patient_code == data['patient_code'])
    patient = session.exec(patient_statement).first()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Invalid Patient Code")
        
    # 2. Create the relationship
    new_rel = UserRelationship(
        caregiver_id=data['caregiver_id'],
        patient_id=patient.id, # Map the code back to the real ID
        status="pending"
    )
    session.add(new_rel)
    session.commit()
    return {"message": "Link request sent to patient"}

# 1. Get all pending requests for a patient
@router.get("/links/pending/{patient_id}")
async def get_pending_requests(patient_id: int, session: Session = Depends(get_session)):
    statement = select(UserRelationship, User.email).join(User, User.id == UserRelationship.caregiver_id).where(
        UserRelationship.patient_id == patient_id,
        UserRelationship.status == "pending"
    )
    results = session.exec(statement).all()
    # Returns a list of caregivers waiting for approval
    return [{"rel_id": r[0].id, "caregiver_email": r[1]} for r in results]

# 2. Accept or Reject a request
@router.post("/links/respond")
async def respond_to_link(rel_id: int, action: str, session: Session = Depends(get_session)):
    statement = select(UserRelationship).where(UserRelationship.id == rel_id)
    rel = session.exec(statement).first()
    
    if not rel:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if action == "accept":
        rel.status = "accepted"
    else:
        session.delete(rel) # Delete if rejected
        
    session.add(rel)
    session.commit()
    return {"message": f"Link {action}ed successfully"}

# In backend/app/routes/auth.py

@router.get("/links/status/{caregiver_id}")
async def check_link_status(caregiver_id: int, session: Session = Depends(get_session)):
    statement = select(UserRelationship).where(UserRelationship.caregiver_id == caregiver_id)
    relationship = session.exec(statement).first()
    if not relationship:
        return {"status": "none"}
        
    # 2. Return whatever the actual status is in the DB
    return {"status": relationship.status} #

# In backend/app/routes/auth.py

@router.get("/links/caregiver-detail/{patient_id}")
async def get_linked_caregiver(patient_id: int, session: Session = Depends(get_session)):
    print(f"DEBUG: Looking for caregiver for Patient ID: {patient_id}")
    # 1. Find the accepted relationship where this user is the patient
    statement = select(UserRelationship).where(
        UserRelationship.patient_id == patient_id,
        UserRelationship.status == "accepted"
    )
    rel = session.exec(statement).first()
    
    if not rel:
        print(f"DEBUG: No relationship found in DB for Patient {patient_id}")
        raise HTTPException(status_code=404, detail="No linked caregiver found")
        
    # 2. Fetch the caregiver's actual account info from the User table
    caregiver = session.get(User, rel.caregiver_id)
    
    if not caregiver:
        raise HTTPException(status_code=404, detail="Caregiver account not found")

    return {
        "email": caregiver.email,
        "name": caregiver.name or "Unnamed Caregiver", # Falls back if name is empty
        "phone": caregiver.phone or "+1 (000) 000-0000",
        "role_type": "Primary Caregiver" # You can expand this logic later
    }

# Check your endpoint that handles the 'Accept' button click
@router.put("/links/accept/{relationship_id}")
async def accept_link(relationship_id: int, session: Session = Depends(get_session)):
    rel = session.get(UserRelationship, relationship_id)
    if not rel:
        raise HTTPException(status_code=404, detail="Request not found")
    
    rel.status = "accepted" # Ensure this matches your query string
    session.add(rel)
    session.commit()
    session.refresh(rel)
    return {"message": "Link accepted"}

@router.get("/links/patient-detail/{caregiver_id}")
async def get_linked_patient(caregiver_id: int, session: Session = Depends(get_session)):
    statement = select(UserRelationship).where(
        UserRelationship.caregiver_id == caregiver_id,
        UserRelationship.status == "accepted"
    )
    rel = session.exec(statement).first()
    
    if not rel:
        raise HTTPException(status_code=404, detail="No linked patient")
        
    patient = session.get(User, rel.patient_id)
    return {
        "name": patient.name or "Unnamed Patient",
        "patient_code": patient.patient_code
    }