import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { visitsAPI, patientsAPI } from '../lib/api';
import { formatDate, formatDateTime, getHealthStatusColor } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import jsPDF from 'jspdf';
import { 
  Stethoscope, 
  ArrowLeft, 
  Activity,
  Heart,
  Eye,
  Brain,
  Wind,
  Droplet,
  FileText,
  Trash2,
  Download,
  User,
  AlertCircle,
  Thermometer
} from 'lucide-react';
import { toast } from 'sonner';

export default function VisitDetailPage() {
  const { visitId } = useParams();
  const navigate = useNavigate();
  const [visit, setVisit] = useState(null);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    fetchVisitData();
  }, [visitId]);

  const fetchVisitData = async () => {
    try {
      const visitRes = await visitsAPI.get(visitId);
      setVisit(visitRes.data);
      
      const patientRes = await patientsAPI.get(visitRes.data.patient_id);
      setPatient(patientRes.data);
    } catch (error) {
      toast.error('Failed to load visit data');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVisit = async () => {
    try {
      await visitsAPI.delete(visitId);
      toast.success('Visit deleted successfully');
      navigate(`/patients/${visit.patient_id}`);
    } catch (error) {
      toast.error('Failed to delete visit');
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;
    const lineHeight = 7;
    const margin = 20;

    // Helper functions
    const addTitle = (text) => {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(text, margin, y);
      y += lineHeight + 2;
    };

    const addSectionTitle = (text) => {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 118, 110);
      doc.text(text, margin, y);
      doc.setTextColor(0);
      y += lineHeight;
    };

    const addField = (label, value) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}: `, margin, y);
      doc.setFont('helvetica', 'normal');
      const valueText = value || 'N/A';
      const splitText = doc.splitTextToSize(valueText, pageWidth - margin * 2 - 40);
      doc.text(splitText, margin + 40, y);
      y += lineHeight * Math.max(1, splitText.length);
    };

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 118, 110);
    doc.text('MedRounds', margin, y);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Home Nurse Visit Report', margin, y + 6);
    y += 20;

    // Patient Info
    doc.setTextColor(0);
    addTitle('Patient Information');
    addField('Name', patient?.full_name);
    addField('Date of Birth', formatDate(patient?.permanent_info?.date_of_birth));
    addField('Gender', patient?.permanent_info?.gender);
    addField('Address', patient?.permanent_info?.home_address);
    y += 5;

    // Visit Info
    addSectionTitle('Visit Information');
    addField('Visit Date', formatDateTime(visit?.visit_date));
    addField('Health Status', visit?.overall_health_status);
    y += 5;

    // Vital Signs
    addSectionTitle('Vital Signs');
    addField('Weight', visit?.vital_signs?.weight ? `${visit.vital_signs.weight} lbs` : null);
    addField('Temperature', visit?.vital_signs?.body_temperature ? `${visit.vital_signs.body_temperature}°F` : null);
    addField('Blood Pressure', visit?.vital_signs?.blood_pressure_systolic ? 
      `${visit.vital_signs.blood_pressure_systolic}/${visit.vital_signs.blood_pressure_diastolic} mmHg` : null);
    if (visit?.vital_signs?.repeat_blood_pressure_systolic) {
      addField('Repeat BP', `${visit.vital_signs.repeat_blood_pressure_systolic}/${visit.vital_signs.repeat_blood_pressure_diastolic} mmHg`);
    }
    addField('SpO2', visit?.vital_signs?.pulse_oximeter ? `${visit.vital_signs.pulse_oximeter}%` : null);
    addField('Pulse', visit?.vital_signs?.pulse ? `${visit.vital_signs.pulse} bpm` : null);
    addField('Respirations', visit?.vital_signs?.respirations ? `${visit.vital_signs.respirations}/min` : null);
    y += 5;

    // Physical Assessment
    addSectionTitle('Physical Assessment');
    addField('General Appearance', visit?.physical_assessment?.general_appearance);
    addField('Skin Assessment', visit?.physical_assessment?.skin_assessment);
    addField('Mobility Level', visit?.physical_assessment?.mobility_level);
    addField('Speech Level', visit?.physical_assessment?.speech_level);
    addField('Alert & Oriented', visit?.physical_assessment?.alert_oriented_level);
    y += 5;

    // Head to Toe
    addSectionTitle('Head to Toe Assessment');
    addField('Head & Neck', visit?.head_to_toe?.head_neck);
    addField('Eyes/Vision', visit?.head_to_toe?.eyes_vision);
    addField('Ears/Hearing', visit?.head_to_toe?.ears_hearing);
    addField('Nose/Nasal', visit?.head_to_toe?.nose_nasal_cavity);
    addField('Mouth/Oral', visit?.head_to_toe?.mouth_teeth_oral_cavity);
    y += 5;

    // GI Assessment
    addSectionTitle('Gastrointestinal Assessment');
    addField('Last Bowel Movement', formatDate(visit?.gastrointestinal?.last_bowel_movement));
    addField('Bowel Sounds', visit?.gastrointestinal?.bowel_sounds);
    addField('Diet Type', visit?.gastrointestinal?.nutritional_diet);
    y += 5;

    // GU Assessment
    addSectionTitle('Genito-Urinary Assessment');
    addField('Toileting Level', visit?.genito_urinary?.toileting_level);
    y += 5;

    // Respiratory
    addSectionTitle('Respiratory Assessment');
    addField('Lung Sounds', visit?.respiratory?.lung_sounds);
    addField('Oxygen Type', visit?.respiratory?.oxygen_type);
    y += 5;

    // Endocrine
    if (visit?.endocrine?.is_diabetic) {
      addSectionTitle('Endocrine Assessment');
      addField('Diabetic', 'Yes');
      addField('Blood Sugar', visit?.endocrine?.blood_sugar ? `${visit.endocrine.blood_sugar} mg/dL` : null);
      addField('Notes', visit?.endocrine?.diabetic_notes);
      y += 5;
    }

    // Changes
    addSectionTitle('Changes Since Last Visit');
    addField('Medication Changes', visit?.changes_since_last?.medication_changes);
    addField('Diagnosis Changes', visit?.changes_since_last?.diagnosis_changes);
    addField('ER/Urgent Care', visit?.changes_since_last?.er_urgent_care_visits);
    addField('Upcoming Appointments', visit?.changes_since_last?.upcoming_appointments);
    y += 5;

    // Nurse Notes
    if (visit?.nurse_notes) {
      addSectionTitle('Nurse Notes');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const notesText = doc.splitTextToSize(visit.nurse_notes, pageWidth - margin * 2);
      doc.text(notesText, margin, y);
    }

    // Footer
    const pages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Page ${i} of ${pages}`, pageWidth - margin - 20, doc.internal.pageSize.getHeight() - 10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, margin, doc.internal.pageSize.getHeight() - 10);
    }

    // Save
    doc.save(`visit_${patient?.full_name?.replace(/\s+/g, '_')}_${formatDate(visit?.visit_date)}.pdf`);
    toast.success('PDF downloaded successfully');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse text-slate-500">Loading visit data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="visit-detail-page">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 no-print">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate(`/patients/${visit.patient_id}`)}
                data-testid="back-btn"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-700 rounded-xl flex items-center justify-center">
                  <Stethoscope className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-slate-900">Visit Details</h1>
                  <p className="text-sm text-slate-500">{patient?.full_name}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline"
                onClick={generatePDF}
                data-testid="download-pdf-btn"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              <Button 
                variant="outline" 
                className="text-rose-600 border-rose-200 hover:bg-rose-50"
                onClick={() => setShowDeleteDialog(true)}
                data-testid="delete-visit-btn"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Visit Summary */}
        <Card className="bg-white border-slate-100 mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-teal-700" />
                Visit Summary
              </CardTitle>
              {visit.overall_health_status && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getHealthStatusColor(visit.overall_health_status)}`}>
                  {visit.overall_health_status}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600">
              Visit Date: <span className="font-medium text-slate-900">{formatDateTime(visit.visit_date)}</span>
            </p>
          </CardContent>
        </Card>

        {/* Vital Signs */}
        <Card className="bg-white border-slate-100 mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500" />
              Vital Signs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl">
                <p className="text-sm text-slate-500">Weight</p>
                <p className="text-xl font-bold text-slate-900 font-mono">
                  {visit.vital_signs?.weight || 'N/A'} {visit.vital_signs?.weight && 'lbs'}
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl">
                <p className="text-sm text-slate-500">Temperature</p>
                <p className="text-xl font-bold text-slate-900 font-mono">
                  {visit.vital_signs?.body_temperature || 'N/A'} {visit.vital_signs?.body_temperature && '°F'}
                </p>
              </div>
              <div className={`p-4 rounded-xl ${visit.vital_signs?.bp_abnormal ? 'bg-rose-50' : 'bg-slate-50'}`}>
                <p className="text-sm text-slate-500">Blood Pressure</p>
                <p className="text-xl font-bold text-slate-900 font-mono">
                  {visit.vital_signs?.blood_pressure_systolic 
                    ? `${visit.vital_signs.blood_pressure_systolic}/${visit.vital_signs.blood_pressure_diastolic}` 
                    : 'N/A'}
                </p>
              </div>
              {visit.vital_signs?.repeat_blood_pressure_systolic && (
                <div className="bg-amber-50 p-4 rounded-xl">
                  <p className="text-sm text-slate-500">Repeat BP</p>
                  <p className="text-xl font-bold text-slate-900 font-mono">
                    {visit.vital_signs.repeat_blood_pressure_systolic}/{visit.vital_signs.repeat_blood_pressure_diastolic}
                  </p>
                </div>
              )}
              <div className="bg-slate-50 p-4 rounded-xl">
                <p className="text-sm text-slate-500">SpO2</p>
                <p className="text-xl font-bold text-slate-900 font-mono">
                  {visit.vital_signs?.pulse_oximeter || 'N/A'}{visit.vital_signs?.pulse_oximeter && '%'}
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl">
                <p className="text-sm text-slate-500">Pulse</p>
                <p className="text-xl font-bold text-slate-900 font-mono">
                  {visit.vital_signs?.pulse || 'N/A'} {visit.vital_signs?.pulse && 'bpm'}
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl">
                <p className="text-sm text-slate-500">Respirations</p>
                <p className="text-xl font-bold text-slate-900 font-mono">
                  {visit.vital_signs?.respirations || 'N/A'}{visit.vital_signs?.respirations && '/min'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Physical Assessment */}
        <Card className="bg-white border-slate-100 mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-teal-700" />
              Physical Assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-slate-500">Mobility Level</p>
                <p className="font-medium text-slate-900">{visit.physical_assessment?.mobility_level || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Speech Level</p>
                <p className="font-medium text-slate-900">{visit.physical_assessment?.speech_level || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Alert & Oriented</p>
                <p className="font-medium text-slate-900">{visit.physical_assessment?.alert_oriented_level || 'N/A'}</p>
              </div>
            </div>
            {visit.physical_assessment?.general_appearance && (
              <div>
                <p className="text-sm text-slate-500">General Appearance</p>
                <p className="text-slate-900">{visit.physical_assessment.general_appearance}</p>
              </div>
            )}
            {visit.physical_assessment?.skin_assessment && (
              <div>
                <p className="text-sm text-slate-500">Skin Assessment</p>
                <p className="text-slate-900">{visit.physical_assessment.skin_assessment}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Head to Toe */}
        <Card className="bg-white border-slate-100 mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="w-5 h-5 text-teal-700" />
              Head to Toe Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visit.head_to_toe?.head_neck && (
                <div>
                  <p className="text-sm text-slate-500">Head & Neck</p>
                  <p className="text-slate-900">{visit.head_to_toe.head_neck}</p>
                </div>
              )}
              {visit.head_to_toe?.eyes_vision && (
                <div>
                  <p className="text-sm text-slate-500">Eyes / Vision</p>
                  <p className="text-slate-900">{visit.head_to_toe.eyes_vision}</p>
                </div>
              )}
              {visit.head_to_toe?.ears_hearing && (
                <div>
                  <p className="text-sm text-slate-500">Ears / Hearing</p>
                  <p className="text-slate-900">{visit.head_to_toe.ears_hearing}</p>
                </div>
              )}
              {visit.head_to_toe?.nose_nasal_cavity && (
                <div>
                  <p className="text-sm text-slate-500">Nose / Nasal Cavity</p>
                  <p className="text-slate-900">{visit.head_to_toe.nose_nasal_cavity}</p>
                </div>
              )}
              {visit.head_to_toe?.mouth_teeth_oral_cavity && (
                <div>
                  <p className="text-sm text-slate-500">Mouth / Oral Cavity</p>
                  <p className="text-slate-900">{visit.head_to_toe.mouth_teeth_oral_cavity}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* System Assessments */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* GI */}
          <Card className="bg-white border-slate-100">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Droplet className="w-4 h-4 text-amber-600" />
                Gastrointestinal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-slate-500">Last Bowel Movement</p>
                <p className="font-medium">{formatDate(visit.gastrointestinal?.last_bowel_movement) || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Bowel Sounds</p>
                <p className="font-medium">{visit.gastrointestinal?.bowel_sounds || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Diet</p>
                <p className="font-medium">{visit.gastrointestinal?.nutritional_diet || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Respiratory */}
          <Card className="bg-white border-slate-100">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Wind className="w-4 h-4 text-cyan-600" />
                Respiratory
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-slate-500">Lung Sounds</p>
                <p className="font-medium">{visit.respiratory?.lung_sounds || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Oxygen Type</p>
                <p className="font-medium">{visit.respiratory?.oxygen_type || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>

          {/* GU */}
          <Card className="bg-white border-slate-100">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Droplet className="w-4 h-4 text-blue-600" />
                Genito-Urinary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <p className="text-sm text-slate-500">Toileting Level</p>
                <p className="font-medium">{visit.genito_urinary?.toileting_level || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Endocrine */}
          {visit.endocrine?.is_diabetic && (
            <Card className="bg-white border-slate-100">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-purple-600" />
                  Endocrine (Diabetic)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-slate-500">Blood Sugar</p>
                  <p className="font-medium">{visit.endocrine?.blood_sugar ? `${visit.endocrine.blood_sugar} mg/dL` : 'N/A'}</p>
                </div>
                {visit.endocrine?.diabetic_notes && (
                  <div>
                    <p className="text-sm text-slate-500">Notes</p>
                    <p className="text-slate-900">{visit.endocrine.diabetic_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Changes Since Last */}
        <Card className="bg-white border-slate-100 mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Changes Since Last Visit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {visit.changes_since_last?.medication_changes && (
              <div>
                <p className="text-sm text-slate-500">Medication Changes</p>
                <p className="text-slate-900">{visit.changes_since_last.medication_changes}</p>
              </div>
            )}
            {visit.changes_since_last?.diagnosis_changes && (
              <div>
                <p className="text-sm text-slate-500">Diagnosis Changes</p>
                <p className="text-slate-900">{visit.changes_since_last.diagnosis_changes}</p>
              </div>
            )}
            {visit.changes_since_last?.er_urgent_care_visits && (
              <div>
                <p className="text-sm text-slate-500">ER / Urgent Care Visits</p>
                <p className="text-slate-900">{visit.changes_since_last.er_urgent_care_visits}</p>
              </div>
            )}
            {visit.changes_since_last?.upcoming_appointments && (
              <div>
                <p className="text-sm text-slate-500">Upcoming Appointments</p>
                <p className="text-slate-900">{visit.changes_since_last.upcoming_appointments}</p>
              </div>
            )}
            {!visit.changes_since_last?.medication_changes && 
             !visit.changes_since_last?.diagnosis_changes && 
             !visit.changes_since_last?.er_urgent_care_visits && 
             !visit.changes_since_last?.upcoming_appointments && (
              <p className="text-slate-500 text-center py-4">No changes recorded</p>
            )}
          </CardContent>
        </Card>

        {/* Nurse Notes */}
        {visit.nurse_notes && (
          <Card className="bg-white border-slate-100">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-700" />
                Nurse Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-900 whitespace-pre-wrap">{visit.nurse_notes}</p>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Visit?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this visit record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteVisit}
              className="bg-rose-600 hover:bg-rose-700"
              data-testid="confirm-delete-visit-btn"
            >
              Delete Visit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
