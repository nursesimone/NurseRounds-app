import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { patientsAPI, interventionsAPI } from '../lib/api';
import { formatDate } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Stethoscope, 
  ArrowLeft, 
  Syringe,
  Calendar,
  Save,
  User,
  Thermometer,
  Smile,
  TestTube,
  Pill,
  Scissors,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';

export default function InterventionPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    patient_id: patientId,
    intervention_date: new Date().toISOString().split('T')[0],
    location: '',
    body_temperature: '',
    mood_scale: null,
    intervention_type: 'injection',
    injection_details: {
      is_vaccination: true,
      vaccination_type: '',
      vaccination_other: '',
      non_vaccination_type: '',
      non_vaccination_other: '',
      dose: '',
      route: '',
      site: '',
      verified_no_allergic_reaction: false,
      cleaned_injection_site: false,
      adhered_8_rights: false
    },
    test_details: {
      test_type: '',
      test_other: '',
      tb_placement_site: '',
      tb_arm: '',
      result: '',
      notes: ''
    },
    treatment_details: {
      treatment_type: '',
      treatment_other: '',
      notes: ''
    },
    procedure_details: {
      procedure_type: '',
      procedure_other: '',
      body_site: '',
      suture_count: '',
      ear_side: '',
      notes: ''
    },
    verified_patient_identity: false,
    donned_proper_ppe: false,
    notes: ''
  });

  useEffect(() => {
    fetchPatient();
  }, [patientId]);

  const fetchPatient = async () => {
    try {
      const response = await patientsAPI.get(patientId);
      setPatient(response.data);
    } catch (error) {
      toast.error('Failed to load patient');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateInjection = (field, value) => {
    setFormData(prev => ({
      ...prev,
      injection_details: { ...prev.injection_details, [field]: value }
    }));
  };

  const updateTest = (field, value) => {
    setFormData(prev => ({
      ...prev,
      test_details: { ...prev.test_details, [field]: value }
    }));
  };

  const updateTreatment = (field, value) => {
    setFormData(prev => ({
      ...prev,
      treatment_details: { ...prev.treatment_details, [field]: value }
    }));
  };

  const updateProcedure = (field, value) => {
    setFormData(prev => ({
      ...prev,
      procedure_details: { ...prev.procedure_details, [field]: value }
    }));
  };

  const validateForm = () => {
    if (!formData.location) {
      toast.error('Please select the location');
      return false;
    }
    if (!formData.verified_patient_identity) {
      toast.error('Please verify patient identity');
      return false;
    }
    if (!formData.donned_proper_ppe) {
      toast.error('Please confirm proper PPE was donned');
      return false;
    }

    // Injection-specific validations
    if (formData.intervention_type === 'injection') {
      if (!formData.injection_details.verified_no_allergic_reaction) {
        toast.error('Please verify patient has no allergic reaction to this injection');
        return false;
      }
      if (!formData.injection_details.cleaned_injection_site) {
        toast.error('Please confirm injection site was cleaned');
        return false;
      }
      if (!formData.injection_details.adhered_8_rights) {
        toast.error('Please confirm adherence to the 8 rights of medication administration');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSaving(true);
    try {
      const submitData = {
        ...formData,
        injection_details: formData.intervention_type === 'injection' ? formData.injection_details : null,
        test_details: formData.intervention_type === 'test' ? formData.test_details : null,
        treatment_details: formData.intervention_type === 'treatment' ? formData.treatment_details : null,
        procedure_details: formData.intervention_type === 'procedure' ? formData.procedure_details : null,
      };
      
      await interventionsAPI.create(submitData);
      toast.success('Intervention saved successfully');
      navigate(`/patients/${patientId}`);
    } catch (error) {
      toast.error('Failed to save intervention');
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
    <div className="min-h-screen bg-slate-50" data-testid="intervention-page">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
                <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                  <Syringe className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-slate-900">Patient Intervention</h1>
                  <p className="text-sm text-slate-500">{patient?.full_name}</p>
                </div>
              </div>
            </div>
            
            <Button 
              className="bg-purple-600 hover:bg-purple-500"
              onClick={handleSubmit}
              disabled={saving}
              data-testid="save-btn"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Intervention'}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Info (DOB prefilled) */}
          <Card className="bg-white border-slate-100">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-purple-600" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-500">Patient Name</Label>
                  <p className="text-lg font-medium text-slate-900">{patient?.full_name}</p>
                </div>
                <div>
                  <Label className="text-slate-500">Date of Birth</Label>
                  <p className="text-lg font-medium text-slate-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {formatDate(patient?.permanent_info?.date_of_birth) || 'Not set'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Intervention Details */}
          <Card className="bg-white border-slate-100">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                Intervention Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Date of Intervention</Label>
                  <Input
                    type="date"
                    value={formData.intervention_date}
                    onChange={(e) => updateField('intervention_date', e.target.value)}
                    className="mt-1"
                    required
                    data-testid="intervention-date-input"
                  />
                </div>
                <div>
                  <Label>Location</Label>
                  <Select
                    value={formData.location}
                    onValueChange={(value) => updateField('location', value)}
                  >
                    <SelectTrigger className="mt-1" data-testid="location-select">
                      <SelectValue placeholder="Select location..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="home">Home of Residence</SelectItem>
                      <SelectItem value="adult_day_center">Adult Day Center</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-2">
                    <Thermometer className="w-4 h-4 text-rose-500" />
                    Body Temperature (°F)
                  </Label>
                  <Input
                    value={formData.body_temperature}
                    onChange={(e) => updateField('body_temperature', e.target.value)}
                    placeholder="e.g., 98.6"
                    className="mt-1"
                    data-testid="temperature-input"
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-2">
                    <Smile className="w-4 h-4 text-amber-500" />
                    Mood (Scale 1-5)
                  </Label>
                  <Select
                    value={formData.mood_scale?.toString() || ''}
                    onValueChange={(value) => updateField('mood_scale', parseInt(value))}
                  >
                    <SelectTrigger className="mt-1" data-testid="mood-select">
                      <SelectValue placeholder="Select mood..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Very Low</SelectItem>
                      <SelectItem value="2">2 - Low</SelectItem>
                      <SelectItem value="3">3 - Neutral</SelectItem>
                      <SelectItem value="4">4 - Good</SelectItem>
                      <SelectItem value="5">5 - Excellent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Intervention Type Selection */}
          <Card className="bg-white border-slate-100">
            <CardHeader>
              <CardTitle className="text-lg">Type of Intervention</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={formData.intervention_type} onValueChange={(value) => updateField('intervention_type', value)}>
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="injection" className="flex items-center gap-2">
                    <Syringe className="w-4 h-4" />
                    Injection
                  </TabsTrigger>
                  <TabsTrigger value="test" className="flex items-center gap-2">
                    <TestTube className="w-4 h-4" />
                    Test
                  </TabsTrigger>
                  <TabsTrigger value="treatment" className="flex items-center gap-2">
                    <Pill className="w-4 h-4" />
                    Treatment
                  </TabsTrigger>
                  <TabsTrigger value="procedure" className="flex items-center gap-2">
                    <Scissors className="w-4 h-4" />
                    Procedure
                  </TabsTrigger>
                </TabsList>

                {/* INJECTIONS TAB */}
                <TabsContent value="injection" className="space-y-6 pt-6">
                  <div>
                    <Label className="text-base font-medium">Is this a vaccination?</Label>
                    <RadioGroup
                      value={formData.injection_details.is_vaccination ? 'yes' : 'no'}
                      onValueChange={(value) => updateInjection('is_vaccination', value === 'yes')}
                      className="flex gap-4 mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="vax-yes" />
                        <Label htmlFor="vax-yes">Yes, Vaccination</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="vax-no" />
                        <Label htmlFor="vax-no">No, Other Injection</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {formData.injection_details.is_vaccination ? (
                    <div className="space-y-4">
                      <div>
                        <Label>Vaccination Type</Label>
                        <Select
                          value={formData.injection_details.vaccination_type}
                          onValueChange={(value) => updateInjection('vaccination_type', value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select vaccination..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="flu">Flu</SelectItem>
                            <SelectItem value="covid">Covid</SelectItem>
                            <SelectItem value="tdap">tDap</SelectItem>
                            <SelectItem value="tetanus">Tetanus</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {formData.injection_details.vaccination_type === 'other' && (
                        <div>
                          <Label>Specify Vaccination</Label>
                          <Input
                            value={formData.injection_details.vaccination_other}
                            onChange={(e) => updateInjection('vaccination_other', e.target.value)}
                            placeholder="Enter vaccination name"
                            className="mt-1"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label>Injection Type</Label>
                        <Select
                          value={formData.injection_details.non_vaccination_type}
                          onValueChange={(value) => updateInjection('non_vaccination_type', value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select injection type..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="b12">Cyanocobalamin/B-12 Shot</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {formData.injection_details.non_vaccination_type === 'other' && (
                        <div>
                          <Label>Specify Injection</Label>
                          <Input
                            value={formData.injection_details.non_vaccination_other}
                            onChange={(e) => updateInjection('non_vaccination_other', e.target.value)}
                            placeholder="Enter injection name"
                            className="mt-1"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Dose, Route, Site */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Dose</Label>
                      <Input
                        value={formData.injection_details.dose}
                        onChange={(e) => updateInjection('dose', e.target.value)}
                        placeholder="e.g., 0.5 mL"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Route</Label>
                      <Select
                        value={formData.injection_details.route}
                        onValueChange={(value) => updateInjection('route', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select route..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IM">IM (Intramuscular)</SelectItem>
                          <SelectItem value="SubQ">SubQ (Subcutaneous)</SelectItem>
                          <SelectItem value="ID">ID (Intradermal)</SelectItem>
                          <SelectItem value="IV">IV (Intravenous)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Site</Label>
                      <Input
                        value={formData.injection_details.site}
                        onChange={(e) => updateInjection('site', e.target.value)}
                        placeholder="e.g., Left deltoid"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* Injection-specific Acknowledgments */}
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 space-y-3">
                    <h4 className="font-medium text-rose-800 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Required Injection Acknowledgments
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="no-allergy"
                          checked={formData.injection_details.verified_no_allergic_reaction}
                          onCheckedChange={(checked) => updateInjection('verified_no_allergic_reaction', checked)}
                        />
                        <Label htmlFor="no-allergy" className="text-sm cursor-pointer">
                          I have verified that the patient has <strong>never had an allergic reaction</strong> to this injection
                        </Label>
                      </div>
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="cleaned-site"
                          checked={formData.injection_details.cleaned_injection_site}
                          onCheckedChange={(checked) => updateInjection('cleaned_injection_site', checked)}
                        />
                        <Label htmlFor="cleaned-site" className="text-sm cursor-pointer">
                          I have <strong>cleaned the injection site</strong> properly
                        </Label>
                      </div>
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="eight-rights"
                          checked={formData.injection_details.adhered_8_rights}
                          onCheckedChange={(checked) => updateInjection('adhered_8_rights', checked)}
                        />
                        <Label htmlFor="eight-rights" className="text-sm cursor-pointer">
                          I have adhered to the <strong>8 Rights of Medication Administration</strong>
                        </Label>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* TESTS TAB */}
                <TabsContent value="test" className="space-y-6 pt-6">
                  <div>
                    <Label>Test Type</Label>
                    <Select
                      value={formData.test_details.test_type}
                      onValueChange={(value) => updateTest('test_type', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select test type..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blood_glucose">Blood Glucose</SelectItem>
                        <SelectItem value="hcg">hCG (Pregnancy Test)</SelectItem>
                        <SelectItem value="tb_placing">TB - PPD Placing</SelectItem>
                        <SelectItem value="tb_reading">TB - PPD Reading</SelectItem>
                        <SelectItem value="rapid_strep">Rapid Strep</SelectItem>
                        <SelectItem value="covid">Covid Test</SelectItem>
                        <SelectItem value="flu">Flu Test</SelectItem>
                        <SelectItem value="throat_culture">Throat Culture</SelectItem>
                        <SelectItem value="dna">DNA Test</SelectItem>
                        <SelectItem value="vision">Vision Test</SelectItem>
                        <SelectItem value="hearing">Hearing Test</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.test_details.test_type === 'other' && (
                    <div>
                      <Label>Specify Test</Label>
                      <Input
                        value={formData.test_details.test_other}
                        onChange={(e) => updateTest('test_other', e.target.value)}
                        placeholder="Enter test name"
                        className="mt-1"
                      />
                    </div>
                  )}

                  {(formData.test_details.test_type === 'tb_placing' || formData.test_details.test_type === 'tb_reading') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Placement Site</Label>
                        <Input
                          value={formData.test_details.tb_placement_site}
                          onChange={(e) => updateTest('tb_placement_site', e.target.value)}
                          placeholder="e.g., Inner forearm"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Which Arm?</Label>
                        <Select
                          value={formData.test_details.tb_arm}
                          onValueChange={(value) => updateTest('tb_arm', value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select arm..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="left">Left</SelectItem>
                            <SelectItem value="right">Right</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  <div>
                    <Label>Result</Label>
                    <Input
                      value={formData.test_details.result}
                      onChange={(e) => updateTest('result', e.target.value)}
                      placeholder="Enter test result"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Notes</Label>
                    <Textarea
                      value={formData.test_details.notes}
                      onChange={(e) => updateTest('notes', e.target.value)}
                      placeholder="Additional notes..."
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                </TabsContent>

                {/* TREATMENTS TAB */}
                <TabsContent value="treatment" className="space-y-6 pt-6">
                  <div>
                    <Label>Treatment Type</Label>
                    <Select
                      value={formData.treatment_details.treatment_type}
                      onValueChange={(value) => updateTreatment('treatment_type', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select treatment type..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nebulizer">Breathing Treatment (Nebulizer)</SelectItem>
                        <SelectItem value="spirometry">Spirometry</SelectItem>
                        <SelectItem value="epipen">EpiPen</SelectItem>
                        <SelectItem value="insulin_fast">Insulin (Fast Acting)</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.treatment_details.treatment_type === 'other' && (
                    <div>
                      <Label>Specify Treatment</Label>
                      <Input
                        value={formData.treatment_details.treatment_other}
                        onChange={(e) => updateTreatment('treatment_other', e.target.value)}
                        placeholder="Enter treatment name"
                        className="mt-1"
                      />
                    </div>
                  )}

                  <div>
                    <Label>Notes</Label>
                    <Textarea
                      value={formData.treatment_details.notes}
                      onChange={(e) => updateTreatment('notes', e.target.value)}
                      placeholder="Additional notes..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </TabsContent>

                {/* PROCEDURES TAB */}
                <TabsContent value="procedure" className="space-y-6 pt-6">
                  <div>
                    <Label>Procedure Type</Label>
                    <Select
                      value={formData.procedure_details.procedure_type}
                      onValueChange={(value) => updateProcedure('procedure_type', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select procedure type..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="suture_removal">Suture Removal</SelectItem>
                        <SelectItem value="cerumen_removal">Cerumen Removal</SelectItem>
                        <SelectItem value="wound_dressing">Change Wound Dressing</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.procedure_details.procedure_type === 'other' && (
                    <div>
                      <Label>Specify Procedure</Label>
                      <Input
                        value={formData.procedure_details.procedure_other}
                        onChange={(e) => updateProcedure('procedure_other', e.target.value)}
                        placeholder="Enter procedure name"
                        className="mt-1"
                      />
                    </div>
                  )}

                  {formData.procedure_details.procedure_type === 'suture_removal' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Body Site</Label>
                        <Input
                          value={formData.procedure_details.body_site}
                          onChange={(e) => updateProcedure('body_site', e.target.value)}
                          placeholder="e.g., Right forearm"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Number of Sutures</Label>
                        <Input
                          type="number"
                          value={formData.procedure_details.suture_count}
                          onChange={(e) => updateProcedure('suture_count', e.target.value)}
                          placeholder="e.g., 5"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  )}

                  {formData.procedure_details.procedure_type === 'cerumen_removal' && (
                    <div>
                      <Label>Which Ear?</Label>
                      <Select
                        value={formData.procedure_details.ear_side}
                        onValueChange={(value) => updateProcedure('ear_side', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select ear..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                          <SelectItem value="both">Both</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {formData.procedure_details.procedure_type === 'wound_dressing' && (
                    <div>
                      <Label>Body Site</Label>
                      <Input
                        value={formData.procedure_details.body_site}
                        onChange={(e) => updateProcedure('body_site', e.target.value)}
                        placeholder="e.g., Left lower leg"
                        className="mt-1"
                      />
                    </div>
                  )}

                  <div>
                    <Label>Notes</Label>
                    <Textarea
                      value={formData.procedure_details.notes}
                      onChange={(e) => updateProcedure('notes', e.target.value)}
                      placeholder="Additional notes..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Universal Acknowledgments */}
          <Card className="bg-white border-slate-100">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-green-600" />
                Required Acknowledgments
              </CardTitle>
              <CardDescription>
                These acknowledgments are required for all interventions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <Checkbox
                  id="verify-identity"
                  checked={formData.verified_patient_identity}
                  onCheckedChange={(checked) => updateField('verified_patient_identity', checked)}
                  data-testid="verify-identity-checkbox"
                />
                <Label htmlFor="verify-identity" className="cursor-pointer">
                  <span className="font-medium text-green-800">I have verified patient identity</span>
                  <p className="text-sm text-green-600 mt-1">Confirmed patient name and date of birth</p>
                </Label>
              </div>
              <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <Checkbox
                  id="ppe-donned"
                  checked={formData.donned_proper_ppe}
                  onCheckedChange={(checked) => updateField('donned_proper_ppe', checked)}
                  data-testid="ppe-checkbox"
                />
                <Label htmlFor="ppe-donned" className="cursor-pointer">
                  <span className="font-medium text-green-800">I have donned proper PPE</span>
                  <p className="text-sm text-green-600 mt-1">Appropriate personal protective equipment was worn</p>
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Additional Notes */}
          <Card className="bg-white border-slate-100">
            <CardHeader>
              <CardTitle className="text-lg">Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="Any additional notes or observations..."
                className="min-h-[100px]"
                data-testid="additional-notes-input"
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button 
              type="submit"
              className="bg-purple-600 hover:bg-purple-500 h-12 px-8"
              disabled={saving}
              data-testid="submit-btn"
            >
              <Save className="w-5 h-5 mr-2" />
              {saving ? 'Saving...' : 'Save Intervention'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
