from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import bcrypt
import jwt
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'nurse-visit-secret-key-2024')
JWT_ALGORITHM = "HS256"

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# ==================== AUTH MODELS ====================
class NurseRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    license_number: Optional[str] = None

class NurseLogin(BaseModel):
    email: EmailStr
    password: str

class NurseResponse(BaseModel):
    id: str
    email: str
    full_name: str
    license_number: Optional[str] = None
    created_at: str

class TokenResponse(BaseModel):
    token: str
    nurse: NurseResponse

# ==================== PATIENT MODELS ====================
class PatientPermanentInfo(BaseModel):
    race: Optional[str] = None
    gender: Optional[str] = None
    height: Optional[str] = None
    home_address: Optional[str] = None
    caregiver_name: Optional[str] = None
    caregiver_phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    medications: Optional[List[str]] = []
    allergies: Optional[List[str]] = []
    adult_day_program_name: Optional[str] = None
    adult_day_program_address: Optional[str] = None
    medical_diagnoses: Optional[List[str]] = []
    psychiatric_diagnoses: Optional[List[str]] = []
    visit_frequency: Optional[str] = None

class PatientCreate(BaseModel):
    full_name: str
    permanent_info: PatientPermanentInfo = PatientPermanentInfo()

class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    permanent_info: Optional[PatientPermanentInfo] = None

class PatientResponse(BaseModel):
    id: str
    full_name: str
    permanent_info: PatientPermanentInfo
    nurse_id: str
    created_at: str
    updated_at: str
    last_vitals: Optional[dict] = None

# ==================== VISIT MODELS ====================
class VitalSigns(BaseModel):
    weight: Optional[str] = None
    body_temperature: Optional[str] = None
    blood_pressure_systolic: Optional[str] = None
    blood_pressure_diastolic: Optional[str] = None
    pulse_oximeter: Optional[str] = None
    pulse: Optional[str] = None
    respirations: Optional[str] = None
    repeat_blood_pressure_systolic: Optional[str] = None
    repeat_blood_pressure_diastolic: Optional[str] = None
    bp_abnormal: Optional[bool] = False

class PhysicalAssessment(BaseModel):
    general_appearance: Optional[str] = None
    skin_assessment: Optional[str] = None
    mobility_level: Optional[str] = None
    speech_level: Optional[str] = None
    alert_oriented_level: Optional[str] = None  # 0-4

class HeadToToeAssessment(BaseModel):
    head_neck: Optional[str] = None
    eyes_vision: Optional[str] = None
    ears_hearing: Optional[str] = None
    nose_nasal_cavity: Optional[str] = None
    mouth_teeth_oral_cavity: Optional[str] = None

class GastrointestinalAssessment(BaseModel):
    last_bowel_movement: Optional[str] = None
    bowel_sounds: Optional[str] = None
    nutritional_diet: Optional[str] = None  # regular, puree/blended, tube, dash, restricted fluids

class GenitoUrinaryAssessment(BaseModel):
    toileting_level: Optional[str] = None  # self, catheter, adult diapers

class RespiratoryAssessment(BaseModel):
    lung_sounds: Optional[str] = None
    oxygen_type: Optional[str] = None  # room air, nasal cannula, mask, bipap, cpap

class EndocrineAssessment(BaseModel):
    is_diabetic: Optional[bool] = False
    diabetic_notes: Optional[str] = None
    blood_sugar: Optional[str] = None

class ChangesSinceLastVisit(BaseModel):
    medication_changes: Optional[str] = None
    diagnosis_changes: Optional[str] = None
    er_urgent_care_visits: Optional[str] = None
    upcoming_appointments: Optional[str] = None

class VisitCreate(BaseModel):
    visit_date: Optional[str] = None
    visit_type: str = "nurse_visit"  # nurse_visit, vitals_only, daily_note
    organization: Optional[str] = None  # POSH-Able Living, Ebenezer Private Home Care
    vital_signs: VitalSigns = VitalSigns()
    physical_assessment: PhysicalAssessment = PhysicalAssessment()
    head_to_toe: HeadToToeAssessment = HeadToToeAssessment()
    gastrointestinal: GastrointestinalAssessment = GastrointestinalAssessment()
    genito_urinary: GenitoUrinaryAssessment = GenitoUrinaryAssessment()
    respiratory: RespiratoryAssessment = RespiratoryAssessment()
    endocrine: EndocrineAssessment = EndocrineAssessment()
    changes_since_last: ChangesSinceLastVisit = ChangesSinceLastVisit()
    overall_health_status: Optional[str] = None  # stable, unstable, deteriorating, needs immediate attention
    nurse_notes: Optional[str] = None
    daily_note_content: Optional[str] = None  # For daily notes

class VisitResponse(BaseModel):
    id: str
    patient_id: str
    nurse_id: str
    visit_date: str
    visit_type: str = "nurse_visit"
    organization: Optional[str] = None
    vital_signs: VitalSigns
    physical_assessment: PhysicalAssessment
    head_to_toe: HeadToToeAssessment
    gastrointestinal: GastrointestinalAssessment
    genito_urinary: GenitoUrinaryAssessment
    respiratory: RespiratoryAssessment
    endocrine: EndocrineAssessment
    changes_since_last: ChangesSinceLastVisit
    overall_health_status: Optional[str] = None
    nurse_notes: Optional[str] = None
    daily_note_content: Optional[str] = None
    created_at: str

# ==================== AUTH HELPERS ====================
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(nurse_id: str) -> str:
    payload = {
        "nurse_id": nurse_id,
        "exp": datetime.now(timezone.utc).timestamp() + 86400 * 7  # 7 days
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_nurse(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        nurse_id = payload.get("nurse_id")
        if not nurse_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        nurse = await db.nurses.find_one({"id": nurse_id}, {"_id": 0})
        if not nurse:
            raise HTTPException(status_code=401, detail="Nurse not found")
        return nurse
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ==================== AUTH ENDPOINTS ====================
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(data: NurseRegister):
    existing = await db.nurses.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    nurse_id = str(uuid.uuid4())
    nurse_doc = {
        "id": nurse_id,
        "email": data.email,
        "password_hash": hash_password(data.password),
        "full_name": data.full_name,
        "license_number": data.license_number,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.nurses.insert_one(nurse_doc)
    
    token = create_token(nurse_id)
    return TokenResponse(
        token=token,
        nurse=NurseResponse(
            id=nurse_id,
            email=data.email,
            full_name=data.full_name,
            license_number=data.license_number,
            created_at=nurse_doc["created_at"]
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(data: NurseLogin):
    nurse = await db.nurses.find_one({"email": data.email})
    if not nurse or not verify_password(data.password, nurse["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(nurse["id"])
    return TokenResponse(
        token=token,
        nurse=NurseResponse(
            id=nurse["id"],
            email=nurse["email"],
            full_name=nurse["full_name"],
            license_number=nurse.get("license_number"),
            created_at=nurse["created_at"]
        )
    )

@api_router.get("/auth/me", response_model=NurseResponse)
async def get_me(nurse: dict = Depends(get_current_nurse)):
    return NurseResponse(
        id=nurse["id"],
        email=nurse["email"],
        full_name=nurse["full_name"],
        license_number=nurse.get("license_number"),
        created_at=nurse["created_at"]
    )

# ==================== PATIENT ENDPOINTS ====================
@api_router.post("/patients", response_model=PatientResponse)
async def create_patient(data: PatientCreate, nurse: dict = Depends(get_current_nurse)):
    patient_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    patient_doc = {
        "id": patient_id,
        "full_name": data.full_name,
        "permanent_info": data.permanent_info.model_dump(),
        "nurse_id": nurse["id"],
        "created_at": now,
        "updated_at": now,
        "last_vitals": None
    }
    await db.patients.insert_one(patient_doc)
    
    return PatientResponse(
        id=patient_id,
        full_name=data.full_name,
        permanent_info=data.permanent_info,
        nurse_id=nurse["id"],
        created_at=now,
        updated_at=now,
        last_vitals=None
    )

@api_router.get("/patients", response_model=List[PatientResponse])
async def list_patients(nurse: dict = Depends(get_current_nurse)):
    patients = await db.patients.find({"nurse_id": nurse["id"]}, {"_id": 0}).to_list(1000)
    return [PatientResponse(**p) for p in patients]

@api_router.get("/patients/{patient_id}", response_model=PatientResponse)
async def get_patient(patient_id: str, nurse: dict = Depends(get_current_nurse)):
    patient = await db.patients.find_one({"id": patient_id, "nurse_id": nurse["id"]}, {"_id": 0})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return PatientResponse(**patient)

@api_router.put("/patients/{patient_id}", response_model=PatientResponse)
async def update_patient(patient_id: str, data: PatientUpdate, nurse: dict = Depends(get_current_nurse)):
    patient = await db.patients.find_one({"id": patient_id, "nurse_id": nurse["id"]})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    update_data = {}
    if data.full_name:
        update_data["full_name"] = data.full_name
    if data.permanent_info:
        update_data["permanent_info"] = data.permanent_info.model_dump()
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.patients.update_one({"id": patient_id}, {"$set": update_data})
    updated = await db.patients.find_one({"id": patient_id}, {"_id": 0})
    return PatientResponse(**updated)

@api_router.delete("/patients/{patient_id}")
async def delete_patient(patient_id: str, nurse: dict = Depends(get_current_nurse)):
    result = await db.patients.delete_one({"id": patient_id, "nurse_id": nurse["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Patient not found")
    # Also delete all visits for this patient
    await db.visits.delete_many({"patient_id": patient_id})
    return {"message": "Patient deleted successfully"}

# ==================== VISIT ENDPOINTS ====================
@api_router.post("/patients/{patient_id}/visits", response_model=VisitResponse)
async def create_visit(patient_id: str, data: VisitCreate, nurse: dict = Depends(get_current_nurse)):
    patient = await db.patients.find_one({"id": patient_id, "nurse_id": nurse["id"]})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    visit_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    visit_date = data.visit_date or now
    
    visit_doc = {
        "id": visit_id,
        "patient_id": patient_id,
        "nurse_id": nurse["id"],
        "visit_date": visit_date,
        "visit_type": data.visit_type,
        "organization": data.organization,
        "vital_signs": data.vital_signs.model_dump(),
        "physical_assessment": data.physical_assessment.model_dump(),
        "head_to_toe": data.head_to_toe.model_dump(),
        "gastrointestinal": data.gastrointestinal.model_dump(),
        "genito_urinary": data.genito_urinary.model_dump(),
        "respiratory": data.respiratory.model_dump(),
        "endocrine": data.endocrine.model_dump(),
        "changes_since_last": data.changes_since_last.model_dump(),
        "overall_health_status": data.overall_health_status,
        "nurse_notes": data.nurse_notes,
        "daily_note_content": data.daily_note_content,
        "created_at": now
    }
    await db.visits.insert_one(visit_doc)
    
    # Update patient's last_vitals
    await db.patients.update_one(
        {"id": patient_id},
        {"$set": {
            "last_vitals": data.vital_signs.model_dump(),
            "updated_at": now
        }}
    )
    
    return VisitResponse(
        id=visit_id,
        patient_id=patient_id,
        nurse_id=nurse["id"],
        visit_date=visit_date,
        visit_type=data.visit_type,
        organization=data.organization,
        vital_signs=data.vital_signs,
        physical_assessment=data.physical_assessment,
        head_to_toe=data.head_to_toe,
        gastrointestinal=data.gastrointestinal,
        genito_urinary=data.genito_urinary,
        respiratory=data.respiratory,
        endocrine=data.endocrine,
        changes_since_last=data.changes_since_last,
        overall_health_status=data.overall_health_status,
        nurse_notes=data.nurse_notes,
        daily_note_content=data.daily_note_content,
        created_at=now
    )

@api_router.get("/patients/{patient_id}/visits", response_model=List[VisitResponse])
async def list_visits(patient_id: str, nurse: dict = Depends(get_current_nurse)):
    patient = await db.patients.find_one({"id": patient_id, "nurse_id": nurse["id"]})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    visits = await db.visits.find({"patient_id": patient_id}, {"_id": 0}).sort("visit_date", -1).to_list(1000)
    return [VisitResponse(**v) for v in visits]

@api_router.get("/visits/{visit_id}", response_model=VisitResponse)
async def get_visit(visit_id: str, nurse: dict = Depends(get_current_nurse)):
    visit = await db.visits.find_one({"id": visit_id, "nurse_id": nurse["id"]}, {"_id": 0})
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    return VisitResponse(**visit)

@api_router.delete("/visits/{visit_id}")
async def delete_visit(visit_id: str, nurse: dict = Depends(get_current_nurse)):
    result = await db.visits.delete_one({"id": visit_id, "nurse_id": nurse["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Visit not found")
    return {"message": "Visit deleted successfully"}

# ==================== HEALTH CHECK ====================
@api_router.get("/")
async def root():
    return {"message": "Home Nurse Visit API", "status": "healthy"}

# Include router and middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
