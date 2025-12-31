import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { patientsAPI, visitsAPI } from '../lib/api';
import { isBloodPressureAbnormal } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import { 
  Stethoscope, 
  ArrowLeft, 
  Activity,
  Heart,
  Eye,
  Ear,
  Brain,
  Thermometer,
  Wind,
  Droplet,
  AlertCircle,
  Save,
  User
} from 'lucide-react';
import { toast } from 'sonner';

const initialVisitData = {
  visit_date: new Date().toISOString().split('T')[0],
  vital_signs: {
    weight: '',
    body_temperature: '',
    blood_pressure_systolic: '',
    blood_pressure_diastolic: '',
    pulse_oximeter: '',
    pulse: '',
    respirations: '',
    repeat_blood_pressure_systolic: '',
    repeat_blood_pressure_diastolic: '',
    bp_abnormal: false
  },
  physical_assessment: {
    general_appearance: '',
    skin_assessment: '',
    mobility_level: '',
    speech_level: '',
    alert_oriented_level: ''
  },
  head_to_toe: {
    head_neck: '',
    eyes_vision: '',
    ears_hearing: '',
    nose_nasal_cavity: '',
    mouth_teeth_oral_cavity: ''
  },
  gastrointestinal: {
    last_bowel_movement: '',
    bowel_sounds: '',
    nutritional_diet: ''
  },
  genito_urinary: {
    toileting_level: ''
  },
  respiratory: {
    lung_sounds: '',
    oxygen_type: ''
  },
  endocrine: {
    is_diabetic: false,
    diabetic_notes: '',
    blood_sugar: ''
  },
  changes_since_last: {
    medication_changes: '',
    diagnosis_changes: '',
    er_urgent_care_visits: '',
    upcoming_appointments: ''
  },
  overall_health_status: '',
  nurse_notes: ''
};

export default function NewVisitPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [visitData, setVisitData] = useState(initialVisitData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bpAbnormal, setBpAbnormal] = useState(false);

  useEffect(() => {
    fetchPatient();
  }, [patientId]);

  useEffect(() => {
    // Check if BP is abnormal
    const { blood_pressure_systolic, blood_pressure_diastolic } = visitData.vital_signs;
    const abnormal = isBloodPressureAbnormal(blood_pressure_systolic, blood_pressure_diastolic);
    setBpAbnormal(abnormal);
    if (abnormal && !visitData.vital_signs.bp_abnormal) {
      updateVitalSign('bp_abnormal', true);
    }
  }, [visitData.vital_signs.blood_pressure_systolic, visitData.vital_signs.blood_pressure_diastolic]);

  const fetchPatient = async () => {
    try {
      const response = await patientsAPI.get(patientId);
      setPatient(response.data);
      
      // Pre-fill with last vitals if available
      if (response.data.last_vitals) {
        setVisitData(prev => ({
          ...prev,
          vital_signs: {
            ...prev.vital_signs,
            ...response.data.last_vitals
          }
        }));
      }
    } catch (error) {
      toast.error('Failed to load patient');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const updateVitalSign = (field, value) => {
    setVisitData(prev => ({
      ...prev,
      vital_signs: { ...prev.vital_signs, [field]: value }
    }));
  };

  const updatePhysicalAssessment = (field, value) => {
    setVisitData(prev => ({
      ...prev,
      physical_assessment: { ...prev.physical_assessment, [field]: value }
    }));
  };

  const updateHeadToToe = (field, value) => {
    setVisitData(prev => ({
      ...prev,
      head_to_toe: { ...prev.head_to_toe, [field]: value }
    }));
  };

  const updateGI = (field, value) => {
    setVisitData(prev => ({
      ...prev,
      gastrointestinal: { ...prev.gastrointestinal, [field]: value }
    }));
  };

  const updateGU = (field, value) => {
    setVisitData(prev => ({
      ...prev,
      genito_urinary: { ...prev.genito_urinary, [field]: value }
    }));
  };

  const updateRespiratory = (field, value) => {
    setVisitData(prev => ({
      ...prev,
      respiratory: { ...prev.respiratory, [field]: value }
    }));
  };

  const updateEndocrine = (field, value) => {
    setVisitData(prev => ({
      ...prev,
      endocrine: { ...prev.endocrine, [field]: value }
    }));
  };

  const updateChanges = (field, value) => {
    setVisitData(prev => ({
      ...prev,
      changes_since_last: { ...prev.changes_since_last, [field]: value }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      await visitsAPI.create(patientId, visitData);
      toast.success('Visit saved successfully');
      navigate(`/patients/${patientId}`);
    } catch (error) {
      toast.error('Failed to save visit');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse text-slate-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="new-visit-page">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate(`/patients/${patientId}`)}
                data-testid="back-btn"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-700 rounded-xl flex items-center justify-center">
                  <Stethoscope className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-slate-900">New Visit</h1>
                  <p className="text-sm text-slate-500">{patient?.full_name}</p>
                </div>
              </div>
            </div>
            
            <Button 
              className="bg-teal-700 hover:bg-teal-600"
              onClick={handleSubmit}
              disabled={saving}
              data-testid="save-visit-btn"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Visit'}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Visit Date */}
          <Card className="bg-white border-slate-100">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-teal-700" />
                Visit Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Visit Date</Label>
                  <Input
                    type="date"
                    value={visitData.visit_date}
                    onChange={(e) => setVisitData(prev => ({ ...prev, visit_date: e.target.value }))}
                    className="mt-1"
                    data-testid="visit-date-input"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vital Signs */}
          <Card className="bg-white border-slate-100">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500" />
                Vital Signs
              </CardTitle>
              <CardDescription>Record the patient's current vital signs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div>
                  <Label>Weight (lbs)</Label>
                  <Input
                    value={visitData.vital_signs.weight}
                    onChange={(e) => updateVitalSign('weight', e.target.value)}
                    placeholder="e.g., 150"
                    className="mt-1"
                    data-testid="weight-input"
                  />
                </div>
                <div>
                  <Label>Temperature (°F)</Label>
                  <Input
                    value={visitData.vital_signs.body_temperature}
                    onChange={(e) => updateVitalSign('body_temperature', e.target.value)}
                    placeholder="e.g., 98.6"
                    className="mt-1"
                    data-testid="temperature-input"
                  />
                </div>
                <div>
                  <Label>BP Systolic</Label>
                  <Input
                    value={visitData.vital_signs.blood_pressure_systolic}
                    onChange={(e) => updateVitalSign('blood_pressure_systolic', e.target.value)}
                    placeholder="e.g., 120"
                    className={`mt-1 ${bpAbnormal ? 'border-rose-300 bg-rose-50' : ''}`}
                    data-testid="bp-systolic-input"
                  />
                </div>
                <div>
                  <Label>BP Diastolic</Label>
                  <Input
                    value={visitData.vital_signs.blood_pressure_diastolic}
                    onChange={(e) => updateVitalSign('blood_pressure_diastolic', e.target.value)}
                    placeholder="e.g., 80"
                    className={`mt-1 ${bpAbnormal ? 'border-rose-300 bg-rose-50' : ''}`}
                    data-testid="bp-diastolic-input"
                  />
                </div>
                <div>
                  <Label>Pulse Oximeter (%)</Label>
                  <Input
                    value={visitData.vital_signs.pulse_oximeter}
                    onChange={(e) => updateVitalSign('pulse_oximeter', e.target.value)}
                    placeholder="e.g., 98"
                    className="mt-1"
                    data-testid="spo2-input"
                  />
                </div>
                <div>
                  <Label>Pulse (bpm)</Label>
                  <Input
                    value={visitData.vital_signs.pulse}
                    onChange={(e) => updateVitalSign('pulse', e.target.value)}
                    placeholder="e.g., 72"
                    className="mt-1"
                    data-testid="pulse-input"
                  />
                </div>
                <div>
                  <Label>Respirations (/min)</Label>
                  <Input
                    value={visitData.vital_signs.respirations}
                    onChange={(e) => updateVitalSign('respirations', e.target.value)}
                    placeholder="e.g., 16"
                    className="mt-1"
                    data-testid="respirations-input"
                  />
                </div>
              </div>

              {/* Repeat BP if abnormal */}
              {bpAbnormal && (
                <div className="mt-6 p-4 bg-rose-50 border border-rose-200 rounded-xl">
                  <div className="flex items-center gap-2 text-rose-700 mb-3">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">Blood pressure appears abnormal. Please repeat.</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Repeat BP Systolic</Label>
                      <Input
                        value={visitData.vital_signs.repeat_blood_pressure_systolic}
                        onChange={(e) => updateVitalSign('repeat_blood_pressure_systolic', e.target.value)}
                        placeholder="e.g., 120"
                        className="mt-1"
                        data-testid="repeat-bp-systolic-input"
                      />
                    </div>
                    <div>
                      <Label>Repeat BP Diastolic</Label>
                      <Input
                        value={visitData.vital_signs.repeat_blood_pressure_diastolic}
                        onChange={(e) => updateVitalSign('repeat_blood_pressure_diastolic', e.target.value)}
                        placeholder="e.g., 80"
                        className="mt-1"
                        data-testid="repeat-bp-diastolic-input"
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Physical Assessment */}
          <Card className="bg-white border-slate-100">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-teal-700" />
                Physical Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>General Appearance</Label>
                <Textarea
                  value={visitData.physical_assessment.general_appearance}
                  onChange={(e) => updatePhysicalAssessment('general_appearance', e.target.value)}
                  placeholder="Describe patient's general appearance..."
                  className="mt-1"
                  rows={2}
                  data-testid="general-appearance-input"
                />
              </div>
              <div>
                <Label>Skin Assessment</Label>
                <Textarea
                  value={visitData.physical_assessment.skin_assessment}
                  onChange={(e) => updatePhysicalAssessment('skin_assessment', e.target.value)}
                  placeholder="Describe skin condition, integrity, wounds..."
                  className="mt-1"
                  rows={2}
                  data-testid="skin-assessment-input"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Mobility Level</Label>
                  <Select
                    value={visitData.physical_assessment.mobility_level}
                    onValueChange={(value) => updatePhysicalAssessment('mobility_level', value)}
                  >
                    <SelectTrigger className="mt-1" data-testid="mobility-select">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Independent">Independent</SelectItem>
                      <SelectItem value="Minimal Assistance">Minimal Assistance</SelectItem>
                      <SelectItem value="Moderate Assistance">Moderate Assistance</SelectItem>
                      <SelectItem value="Maximum Assistance">Maximum Assistance</SelectItem>
                      <SelectItem value="Total Dependence">Total Dependence</SelectItem>
                      <SelectItem value="Bedbound">Bedbound</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Speech Level</Label>
                  <Select
                    value={visitData.physical_assessment.speech_level}
                    onValueChange={(value) => updatePhysicalAssessment('speech_level', value)}
                  >
                    <SelectTrigger className="mt-1" data-testid="speech-select">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Clear & Coherent">Clear & Coherent</SelectItem>
                      <SelectItem value="Slurred">Slurred</SelectItem>
                      <SelectItem value="Impaired">Impaired</SelectItem>
                      <SelectItem value="Non-verbal">Non-verbal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Alert & Oriented Level</Label>
                  <Select
                    value={visitData.physical_assessment.alert_oriented_level}
                    onValueChange={(value) => updatePhysicalAssessment('alert_oriented_level', value)}
                  >
                    <SelectTrigger className="mt-1" data-testid="orientation-select">
                      <SelectValue placeholder="Select level (0-4)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="x4 - Person, Place, Time, Situation">x4 - Person, Place, Time, Situation</SelectItem>
                      <SelectItem value="x3 - Person, Place, Time">x3 - Person, Place, Time</SelectItem>
                      <SelectItem value="x2 - Person, Place">x2 - Person, Place</SelectItem>
                      <SelectItem value="x1 - Person only">x1 - Person only</SelectItem>
                      <SelectItem value="x0 - Unresponsive">x0 - Unresponsive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Assessments */}
          <Accordion type="multiple" defaultValue={["head-to-toe"]} className="space-y-4">
            {/* Head to Toe */}
            <AccordionItem value="head-to-toe" className="bg-white border border-slate-100 rounded-xl px-6">
              <AccordionTrigger className="hover:no-underline">
                <span className="flex items-center gap-2 text-lg font-semibold">
                  <Eye className="w-5 h-5 text-teal-700" />
                  Head to Toe Assessment
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div>
                  <Label>Head & Neck</Label>
                  <Textarea
                    value={visitData.head_to_toe.head_neck}
                    onChange={(e) => updateHeadToToe('head_neck', e.target.value)}
                    placeholder="Describe findings..."
                    className="mt-1"
                    rows={2}
                    data-testid="head-neck-input"
                  />
                </div>
                <div>
                  <Label>Eyes / Vision</Label>
                  <Textarea
                    value={visitData.head_to_toe.eyes_vision}
                    onChange={(e) => updateHeadToToe('eyes_vision', e.target.value)}
                    placeholder="Describe findings..."
                    className="mt-1"
                    rows={2}
                    data-testid="eyes-vision-input"
                  />
                </div>
                <div>
                  <Label>Ears / Hearing</Label>
                  <Textarea
                    value={visitData.head_to_toe.ears_hearing}
                    onChange={(e) => updateHeadToToe('ears_hearing', e.target.value)}
                    placeholder="Describe findings..."
                    className="mt-1"
                    rows={2}
                    data-testid="ears-hearing-input"
                  />
                </div>
                <div>
                  <Label>Nose / Nasal Cavity</Label>
                  <Textarea
                    value={visitData.head_to_toe.nose_nasal_cavity}
                    onChange={(e) => updateHeadToToe('nose_nasal_cavity', e.target.value)}
                    placeholder="Describe findings..."
                    className="mt-1"
                    rows={2}
                    data-testid="nose-input"
                  />
                </div>
                <div>
                  <Label>Mouth / Teeth / Oral Cavity</Label>
                  <Textarea
                    value={visitData.head_to_toe.mouth_teeth_oral_cavity}
                    onChange={(e) => updateHeadToToe('mouth_teeth_oral_cavity', e.target.value)}
                    placeholder="Describe findings..."
                    className="mt-1"
                    rows={2}
                    data-testid="mouth-input"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Gastrointestinal */}
            <AccordionItem value="gi" className="bg-white border border-slate-100 rounded-xl px-6">
              <AccordionTrigger className="hover:no-underline">
                <span className="flex items-center gap-2 text-lg font-semibold">
                  <Droplet className="w-5 h-5 text-amber-600" />
                  Gastrointestinal Assessment
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Last Bowel Movement</Label>
                    <Input
                      type="date"
                      value={visitData.gastrointestinal.last_bowel_movement}
                      onChange={(e) => updateGI('last_bowel_movement', e.target.value)}
                      className="mt-1"
                      data-testid="last-bm-input"
                    />
                  </div>
                  <div>
                    <Label>Bowel Sounds</Label>
                    <Select
                      value={visitData.gastrointestinal.bowel_sounds}
                      onValueChange={(value) => updateGI('bowel_sounds', value)}
                    >
                      <SelectTrigger className="mt-1" data-testid="bowel-sounds-select">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Present - Normal">Present - Normal</SelectItem>
                        <SelectItem value="Hyperactive">Hyperactive</SelectItem>
                        <SelectItem value="Hypoactive">Hypoactive</SelectItem>
                        <SelectItem value="Absent">Absent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Nutritional Diet</Label>
                  <Select
                    value={visitData.gastrointestinal.nutritional_diet}
                    onValueChange={(value) => updateGI('nutritional_diet', value)}
                  >
                    <SelectTrigger className="mt-1" data-testid="diet-select">
                      <SelectValue placeholder="Select diet type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Regular">Regular</SelectItem>
                      <SelectItem value="Puree/Blended">Puree/Blended</SelectItem>
                      <SelectItem value="Tube Feeding">Tube Feeding</SelectItem>
                      <SelectItem value="DASH Diet">DASH Diet</SelectItem>
                      <SelectItem value="Restricted Fluids">Restricted Fluids</SelectItem>
                      <SelectItem value="Diabetic Diet">Diabetic Diet</SelectItem>
                      <SelectItem value="Low Sodium">Low Sodium</SelectItem>
                      <SelectItem value="Thickened Liquids">Thickened Liquids</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Genito-Urinary */}
            <AccordionItem value="gu" className="bg-white border border-slate-100 rounded-xl px-6">
              <AccordionTrigger className="hover:no-underline">
                <span className="flex items-center gap-2 text-lg font-semibold">
                  <Droplet className="w-5 h-5 text-blue-600" />
                  Genito-Urinary Assessment
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div>
                  <Label>Toileting Level</Label>
                  <Select
                    value={visitData.genito_urinary.toileting_level}
                    onValueChange={(value) => updateGU('toileting_level', value)}
                  >
                    <SelectTrigger className="mt-1" data-testid="toileting-select">
                      <SelectValue placeholder="Select toileting level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Self-Toileting">Self-Toileting</SelectItem>
                      <SelectItem value="Assisted Toileting">Assisted Toileting</SelectItem>
                      <SelectItem value="Bedpan/Urinal">Bedpan/Urinal</SelectItem>
                      <SelectItem value="Indwelling Catheter">Indwelling Catheter</SelectItem>
                      <SelectItem value="Intermittent Catheter">Intermittent Catheter</SelectItem>
                      <SelectItem value="Adult Diapers/Brief">Adult Diapers/Brief</SelectItem>
                      <SelectItem value="Ostomy">Ostomy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Respiratory */}
            <AccordionItem value="respiratory" className="bg-white border border-slate-100 rounded-xl px-6">
              <AccordionTrigger className="hover:no-underline">
                <span className="flex items-center gap-2 text-lg font-semibold">
                  <Wind className="w-5 h-5 text-cyan-600" />
                  Respiratory Assessment
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Lung Sounds</Label>
                    <Select
                      value={visitData.respiratory.lung_sounds}
                      onValueChange={(value) => updateRespiratory('lung_sounds', value)}
                    >
                      <SelectTrigger className="mt-1" data-testid="lung-sounds-select">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Clear">Clear</SelectItem>
                        <SelectItem value="Wheezing">Wheezing</SelectItem>
                        <SelectItem value="Crackles">Crackles</SelectItem>
                        <SelectItem value="Rhonchi">Rhonchi</SelectItem>
                        <SelectItem value="Diminished">Diminished</SelectItem>
                        <SelectItem value="Absent">Absent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Oxygen Type</Label>
                    <Select
                      value={visitData.respiratory.oxygen_type}
                      onValueChange={(value) => updateRespiratory('oxygen_type', value)}
                    >
                      <SelectTrigger className="mt-1" data-testid="oxygen-type-select">
                        <SelectValue placeholder="Select oxygen type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Room Air">Room Air</SelectItem>
                        <SelectItem value="Nasal Cannula">Nasal Cannula</SelectItem>
                        <SelectItem value="Simple Mask">Simple Mask</SelectItem>
                        <SelectItem value="Non-Rebreather">Non-Rebreather</SelectItem>
                        <SelectItem value="BiPAP">BiPAP</SelectItem>
                        <SelectItem value="CPAP">CPAP</SelectItem>
                        <SelectItem value="Ventilator">Ventilator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Endocrine */}
            <AccordionItem value="endocrine" className="bg-white border border-slate-100 rounded-xl px-6">
              <AccordionTrigger className="hover:no-underline">
                <span className="flex items-center gap-2 text-lg font-semibold">
                  <Thermometer className="w-5 h-5 text-purple-600" />
                  Endocrine Assessment
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="isDiabetic"
                    checked={visitData.endocrine.is_diabetic}
                    onCheckedChange={(checked) => updateEndocrine('is_diabetic', checked)}
                    data-testid="diabetic-checkbox"
                  />
                  <Label htmlFor="isDiabetic" className="cursor-pointer">Patient is diabetic</Label>
                </div>
                {visitData.endocrine.is_diabetic && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Blood Sugar (mg/dL)</Label>
                      <Input
                        value={visitData.endocrine.blood_sugar}
                        onChange={(e) => updateEndocrine('blood_sugar', e.target.value)}
                        placeholder="e.g., 120"
                        className="mt-1"
                        data-testid="blood-sugar-input"
                      />
                    </div>
                    <div>
                      <Label>Diabetic Notes</Label>
                      <Textarea
                        value={visitData.endocrine.diabetic_notes}
                        onChange={(e) => updateEndocrine('diabetic_notes', e.target.value)}
                        placeholder="Additional notes..."
                        className="mt-1"
                        rows={2}
                        data-testid="diabetic-notes-input"
                      />
                    </div>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Changes Since Last Visit */}
            <AccordionItem value="changes" className="bg-white border border-slate-100 rounded-xl px-6">
              <AccordionTrigger className="hover:no-underline">
                <span className="flex items-center gap-2 text-lg font-semibold">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  Changes Since Last Visit
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div>
                  <Label>Medication Changes (Start/Stop)</Label>
                  <Textarea
                    value={visitData.changes_since_last.medication_changes}
                    onChange={(e) => updateChanges('medication_changes', e.target.value)}
                    placeholder="Any medication changes since last visit..."
                    className="mt-1"
                    rows={2}
                    data-testid="med-changes-input"
                  />
                </div>
                <div>
                  <Label>Diagnosis Changes</Label>
                  <Textarea
                    value={visitData.changes_since_last.diagnosis_changes}
                    onChange={(e) => updateChanges('diagnosis_changes', e.target.value)}
                    placeholder="Any new diagnoses or changes..."
                    className="mt-1"
                    rows={2}
                    data-testid="diagnosis-changes-input"
                  />
                </div>
                <div>
                  <Label>ER / Urgent Care Visits</Label>
                  <Textarea
                    value={visitData.changes_since_last.er_urgent_care_visits}
                    onChange={(e) => updateChanges('er_urgent_care_visits', e.target.value)}
                    placeholder="Any ER or urgent care visits since last seen..."
                    className="mt-1"
                    rows={2}
                    data-testid="er-visits-input"
                  />
                </div>
                <div>
                  <Label>Upcoming Appointments (Next 30 Days)</Label>
                  <Textarea
                    value={visitData.changes_since_last.upcoming_appointments}
                    onChange={(e) => updateChanges('upcoming_appointments', e.target.value)}
                    placeholder="Any scheduled appointments..."
                    className="mt-1"
                    rows={2}
                    data-testid="upcoming-appts-input"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Overall Status */}
          <Card className="bg-white border-slate-100">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="w-5 h-5 text-teal-700" />
                Overall Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Current Overall Health Condition</Label>
                <Select
                  value={visitData.overall_health_status}
                  onValueChange={(value) => setVisitData(prev => ({ ...prev, overall_health_status: value }))}
                >
                  <SelectTrigger className="mt-1" data-testid="health-status-select">
                    <SelectValue placeholder="Select health status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Stable">Stable</SelectItem>
                    <SelectItem value="Unstable">Unstable</SelectItem>
                    <SelectItem value="Deteriorating">Deteriorating</SelectItem>
                    <SelectItem value="Needs Immediate Attention">Needs Immediate Medical Attention at Hospital</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nurse Notes</Label>
                <Textarea
                  value={visitData.nurse_notes}
                  onChange={(e) => setVisitData(prev => ({ ...prev, nurse_notes: e.target.value }))}
                  placeholder="Additional observations, recommendations, or concerns..."
                  className="mt-1"
                  rows={4}
                  data-testid="nurse-notes-input"
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button 
              type="submit"
              className="bg-teal-700 hover:bg-teal-600 h-12 px-8"
              disabled={saving}
              data-testid="submit-visit-btn"
            >
              <Save className="w-5 h-5 mr-2" />
              {saving ? 'Saving Visit...' : 'Save Visit'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
