import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { patientsAPI, visitsAPI } from '../lib/api';
import { formatDate, formatDateTime, calculateAge, getHealthStatusColor } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
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
import { 
  Stethoscope, 
  ArrowLeft, 
  User, 
  Calendar,
  MapPin,
  Phone,
  Pill,
  AlertTriangle,
  Activity,
  Edit,
  Save,
  X,
  Plus,
  FileText,
  Trash2,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

export default function PatientDetailPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    fetchPatientData();
  }, [patientId]);

  const fetchPatientData = async () => {
    try {
      const [patientRes, visitsRes] = await Promise.all([
        patientsAPI.get(patientId),
        visitsAPI.list(patientId)
      ]);
      setPatient(patientRes.data);
      setProfileData(patientRes.data.permanent_info || {});
      setVisits(visitsRes.data);
    } catch (error) {
      toast.error('Failed to load patient data');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayFieldChange = (field, value) => {
    const items = value.split(',').map(item => item.trim()).filter(Boolean);
    setProfileData(prev => ({ ...prev, [field]: items }));
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const response = await patientsAPI.update(patientId, { permanent_info: profileData });
      setPatient(response.data);
      setEditingProfile(false);
      toast.success('Profile saved successfully');
    } catch (error) {
      toast.error('Failed to save profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDeletePatient = async () => {
    try {
      await patientsAPI.delete(patientId);
      toast.success('Patient deleted successfully');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to delete patient');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse text-slate-500">Loading patient data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="patient-detail-page">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate('/dashboard')}
                data-testid="back-to-dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-700 rounded-xl flex items-center justify-center">
                  <Stethoscope className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-slate-900">MedRounds</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                className="text-rose-600 border-rose-200 hover:bg-rose-50"
                onClick={() => setShowDeleteDialog(true)}
                data-testid="delete-patient-btn"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Patient Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-teal-50 rounded-2xl flex items-center justify-center">
                <User className="w-10 h-10 text-teal-700" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">{patient.full_name}</h1>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-slate-500">
                  {patient.permanent_info?.date_of_birth && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {calculateAge(patient.permanent_info.date_of_birth)} years old
                    </span>
                  )}
                  {patient.permanent_info?.gender && (
                    <span className="bg-slate-100 px-2 py-1 rounded text-sm">
                      {patient.permanent_info.gender}
                    </span>
                  )}
                  {patient.permanent_info?.visit_frequency && (
                    <span className="bg-teal-50 text-teal-700 px-2 py-1 rounded text-sm">
                      {patient.permanent_info.visit_frequency}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Button 
              className="bg-teal-700 hover:bg-teal-600 h-12 px-6"
              onClick={() => navigate(`/patients/${patientId}/new-visit`)}
              data-testid="new-visit-btn"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Visit
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-white border border-slate-100 p-1">
            <TabsTrigger value="profile" className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700">
              Profile
            </TabsTrigger>
            <TabsTrigger value="visits" className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700">
              Visit History ({visits.length})
            </TabsTrigger>
            <TabsTrigger value="vitals" className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700">
              Last Vitals
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="bg-white border-slate-100">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold">Permanent Information</CardTitle>
                {editingProfile ? (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setEditingProfile(false)}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-teal-700 hover:bg-teal-600"
                      onClick={saveProfile}
                      disabled={savingProfile}
                      data-testid="save-profile-btn"
                    >
                      <Save className="w-4 h-4 mr-1" />
                      {savingProfile ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setEditingProfile(true)}
                    data-testid="edit-profile-btn"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-slate-700 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Basic Information
                    </h3>
                    
                    <div className="space-y-3">
                      <div>
                        <Label className="text-slate-500">Date of Birth</Label>
                        {editingProfile ? (
                          <Input
                            type="date"
                            value={profileData.date_of_birth || ''}
                            onChange={(e) => handleProfileChange('date_of_birth', e.target.value)}
                            className="mt-1"
                          />
                        ) : (
                          <p className="text-slate-900">{formatDate(profileData.date_of_birth) || 'Not set'}</p>
                        )}
                      </div>

                      <div>
                        <Label className="text-slate-500">Gender</Label>
                        {editingProfile ? (
                          <Select
                            value={profileData.gender || ''}
                            onValueChange={(value) => handleProfileChange('gender', value)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-slate-900">{profileData.gender || 'Not set'}</p>
                        )}
                      </div>

                      <div>
                        <Label className="text-slate-500">Race</Label>
                        {editingProfile ? (
                          <Input
                            value={profileData.race || ''}
                            onChange={(e) => handleProfileChange('race', e.target.value)}
                            className="mt-1"
                            placeholder="e.g., Caucasian"
                          />
                        ) : (
                          <p className="text-slate-900">{profileData.race || 'Not set'}</p>
                        )}
                      </div>

                      <div>
                        <Label className="text-slate-500">Height</Label>
                        {editingProfile ? (
                          <Input
                            value={profileData.height || ''}
                            onChange={(e) => handleProfileChange('height', e.target.value)}
                            className="mt-1"
                            placeholder="e.g., 5'8\""
                          />
                        ) : (
                          <p className="text-slate-900">{profileData.height || 'Not set'}</p>
                        )}
                      </div>

                      <div>
                        <Label className="text-slate-500">Visit Frequency</Label>
                        {editingProfile ? (
                          <Select
                            value={profileData.visit_frequency || ''}
                            onValueChange={(value) => handleProfileChange('visit_frequency', value)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Weekly">Weekly</SelectItem>
                              <SelectItem value="Bi-weekly">Bi-weekly</SelectItem>
                              <SelectItem value="Monthly">Monthly</SelectItem>
                              <SelectItem value="As needed">As needed</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-slate-900">{profileData.visit_frequency || 'Not set'}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-slate-700 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Contact & Caregiver
                    </h3>
                    
                    <div className="space-y-3">
                      <div>
                        <Label className="text-slate-500">Home Address</Label>
                        {editingProfile ? (
                          <Textarea
                            value={profileData.home_address || ''}
                            onChange={(e) => handleProfileChange('home_address', e.target.value)}
                            className="mt-1"
                            placeholder="Enter full address"
                            rows={2}
                          />
                        ) : (
                          <p className="text-slate-900">{profileData.home_address || 'Not set'}</p>
                        )}
                      </div>

                      <div>
                        <Label className="text-slate-500">Caregiver Name</Label>
                        {editingProfile ? (
                          <Input
                            value={profileData.caregiver_name || ''}
                            onChange={(e) => handleProfileChange('caregiver_name', e.target.value)}
                            className="mt-1"
                            placeholder="Primary caregiver"
                          />
                        ) : (
                          <p className="text-slate-900">{profileData.caregiver_name || 'Not set'}</p>
                        )}
                      </div>

                      <div>
                        <Label className="text-slate-500">Caregiver Phone</Label>
                        {editingProfile ? (
                          <Input
                            value={profileData.caregiver_phone || ''}
                            onChange={(e) => handleProfileChange('caregiver_phone', e.target.value)}
                            className="mt-1"
                            placeholder="(555) 555-5555"
                          />
                        ) : (
                          <p className="text-slate-900">{profileData.caregiver_phone || 'Not set'}</p>
                        )}
                      </div>

                      <div>
                        <Label className="text-slate-500">Adult Day Program Name</Label>
                        {editingProfile ? (
                          <Input
                            value={profileData.adult_day_program_name || ''}
                            onChange={(e) => handleProfileChange('adult_day_program_name', e.target.value)}
                            className="mt-1"
                            placeholder="Program name"
                          />
                        ) : (
                          <p className="text-slate-900">{profileData.adult_day_program_name || 'Not set'}</p>
                        )}
                      </div>

                      <div>
                        <Label className="text-slate-500">Adult Day Program Address</Label>
                        {editingProfile ? (
                          <Textarea
                            value={profileData.adult_day_program_address || ''}
                            onChange={(e) => handleProfileChange('adult_day_program_address', e.target.value)}
                            className="mt-1"
                            placeholder="Program address"
                            rows={2}
                          />
                        ) : (
                          <p className="text-slate-900">{profileData.adult_day_program_address || 'Not set'}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Medical Info */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-slate-700 flex items-center gap-2">
                      <Pill className="w-4 h-4" />
                      Medical Information
                    </h3>
                    
                    <div className="space-y-3">
                      <div>
                        <Label className="text-slate-500">Medications</Label>
                        {editingProfile ? (
                          <Textarea
                            value={(profileData.medications || []).join(', ')}
                            onChange={(e) => handleArrayFieldChange('medications', e.target.value)}
                            className="mt-1"
                            placeholder="Separate with commas"
                            rows={3}
                          />
                        ) : (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(profileData.medications || []).length > 0 ? (
                              profileData.medications.map((med, i) => (
                                <span key={i} className="bg-teal-50 text-teal-700 px-2 py-1 rounded text-sm">
                                  {med}
                                </span>
                              ))
                            ) : (
                              <p className="text-slate-400">None listed</p>
                            )}
                          </div>
                        )}
                      </div>

                      <div>
                        <Label className="text-slate-500 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-500" />
                          Allergies
                        </Label>
                        {editingProfile ? (
                          <Textarea
                            value={(profileData.allergies || []).join(', ')}
                            onChange={(e) => handleArrayFieldChange('allergies', e.target.value)}
                            className="mt-1"
                            placeholder="Separate with commas"
                            rows={2}
                          />
                        ) : (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(profileData.allergies || []).length > 0 ? (
                              profileData.allergies.map((allergy, i) => (
                                <span key={i} className="bg-rose-50 text-rose-700 px-2 py-1 rounded text-sm">
                                  {allergy}
                                </span>
                              ))
                            ) : (
                              <p className="text-slate-400">None listed</p>
                            )}
                          </div>
                        )}
                      </div>

                      <div>
                        <Label className="text-slate-500">Medical Diagnoses</Label>
                        {editingProfile ? (
                          <Textarea
                            value={(profileData.medical_diagnoses || []).join(', ')}
                            onChange={(e) => handleArrayFieldChange('medical_diagnoses', e.target.value)}
                            className="mt-1"
                            placeholder="Separate with commas"
                            rows={2}
                          />
                        ) : (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(profileData.medical_diagnoses || []).length > 0 ? (
                              profileData.medical_diagnoses.map((dx, i) => (
                                <span key={i} className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-sm">
                                  {dx}
                                </span>
                              ))
                            ) : (
                              <p className="text-slate-400">None listed</p>
                            )}
                          </div>
                        )}
                      </div>

                      <div>
                        <Label className="text-slate-500">Psychiatric Diagnoses</Label>
                        {editingProfile ? (
                          <Textarea
                            value={(profileData.psychiatric_diagnoses || []).join(', ')}
                            onChange={(e) => handleArrayFieldChange('psychiatric_diagnoses', e.target.value)}
                            className="mt-1"
                            placeholder="Separate with commas"
                            rows={2}
                          />
                        ) : (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(profileData.psychiatric_diagnoses || []).length > 0 ? (
                              profileData.psychiatric_diagnoses.map((dx, i) => (
                                <span key={i} className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-sm">
                                  {dx}
                                </span>
                              ))
                            ) : (
                              <p className="text-slate-400">None listed</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Visits Tab */}
          <TabsContent value="visits" className="space-y-4">
            {visits.length === 0 ? (
              <Card className="bg-white border-slate-100">
                <CardContent className="py-12">
                  <div className="empty-state">
                    <FileText className="empty-state-icon" />
                    <h3 className="empty-state-title">No visits recorded</h3>
                    <p className="empty-state-description">
                      Start documenting this patient's visits by clicking the "New Visit" button above.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              visits.map(visit => (
                <Card 
                  key={visit.id} 
                  className="bg-white border-slate-100 cursor-pointer hover:border-teal-200 transition-all"
                  onClick={() => navigate(`/visits/${visit.id}`)}
                  data-testid={`visit-card-${visit.id}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center">
                          <Activity className="w-6 h-6 text-teal-700" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            Visit on {formatDateTime(visit.visit_date)}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {visit.vital_signs?.blood_pressure_systolic && (
                              <span className="bg-slate-100 px-2 py-1 rounded text-xs font-mono">
                                BP: {visit.vital_signs.blood_pressure_systolic}/{visit.vital_signs.blood_pressure_diastolic}
                              </span>
                            )}
                            {visit.vital_signs?.pulse && (
                              <span className="bg-slate-100 px-2 py-1 rounded text-xs font-mono">
                                HR: {visit.vital_signs.pulse}
                              </span>
                            )}
                            {visit.vital_signs?.body_temperature && (
                              <span className="bg-slate-100 px-2 py-1 rounded text-xs font-mono">
                                Temp: {visit.vital_signs.body_temperature}
                              </span>
                            )}
                            {visit.overall_health_status && (
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getHealthStatusColor(visit.overall_health_status)}`}>
                                {visit.overall_health_status}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-slate-400 text-sm flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDate(visit.created_at)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Last Vitals Tab */}
          <TabsContent value="vitals">
            <Card className="bg-white border-slate-100">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Activity className="w-5 h-5 text-teal-700" />
                  Last Recorded Vitals
                </CardTitle>
              </CardHeader>
              <CardContent>
                {patient.last_vitals ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {patient.last_vitals.weight && (
                      <div className="bg-slate-50 p-4 rounded-xl">
                        <p className="text-sm text-slate-500">Weight</p>
                        <p className="text-2xl font-bold text-slate-900 font-mono">
                          {patient.last_vitals.weight}
                        </p>
                      </div>
                    )}
                    {patient.last_vitals.body_temperature && (
                      <div className="bg-slate-50 p-4 rounded-xl">
                        <p className="text-sm text-slate-500">Temperature</p>
                        <p className="text-2xl font-bold text-slate-900 font-mono">
                          {patient.last_vitals.body_temperature}
                        </p>
                      </div>
                    )}
                    {patient.last_vitals.blood_pressure_systolic && (
                      <div className="bg-slate-50 p-4 rounded-xl">
                        <p className="text-sm text-slate-500">Blood Pressure</p>
                        <p className="text-2xl font-bold text-slate-900 font-mono">
                          {patient.last_vitals.blood_pressure_systolic}/{patient.last_vitals.blood_pressure_diastolic}
                        </p>
                      </div>
                    )}
                    {patient.last_vitals.pulse_oximeter && (
                      <div className="bg-slate-50 p-4 rounded-xl">
                        <p className="text-sm text-slate-500">SpO2</p>
                        <p className="text-2xl font-bold text-slate-900 font-mono">
                          {patient.last_vitals.pulse_oximeter}%
                        </p>
                      </div>
                    )}
                    {patient.last_vitals.pulse && (
                      <div className="bg-slate-50 p-4 rounded-xl">
                        <p className="text-sm text-slate-500">Pulse</p>
                        <p className="text-2xl font-bold text-slate-900 font-mono">
                          {patient.last_vitals.pulse} bpm
                        </p>
                      </div>
                    )}
                    {patient.last_vitals.respirations && (
                      <div className="bg-slate-50 p-4 rounded-xl">
                        <p className="text-sm text-slate-500">Respirations</p>
                        <p className="text-2xl font-bold text-slate-900 font-mono">
                          {patient.last_vitals.respirations}/min
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    No vitals recorded yet. Complete a visit to record vitals.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Patient?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {patient?.full_name} and all their visit records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeletePatient}
              className="bg-rose-600 hover:bg-rose-700"
              data-testid="confirm-delete-btn"
            >
              Delete Patient
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
