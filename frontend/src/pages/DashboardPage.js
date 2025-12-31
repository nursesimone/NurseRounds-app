import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { patientsAPI } from '../lib/api';
import { formatDate, calculateAge, getHealthStatusColor } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { 
  Stethoscope, 
  Users, 
  Plus, 
  Search, 
  LogOut, 
  Activity,
  Calendar,
  User,
  ChevronRight,
  ClipboardList
} from 'lucide-react';
import { toast } from 'sonner';

export default function DashboardPage() {
  const { nurse, logout } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [addingPatient, setAddingPatient] = useState(false);

  // Get visit type from session
  const visitType = sessionStorage.getItem('visitType') || 'nurse_visit';
  const organization = sessionStorage.getItem('organization') || '';

  const getVisitTypeLabel = () => {
    switch (visitType) {
      case 'nurse_visit': return 'Nurse Visit';
      case 'vitals_only': return 'Vitals Only';
      case 'daily_note': return "Resident's Daily Note";
      default: return 'Visit';
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await patientsAPI.list();
      setPatients(response.data);
    } catch (error) {
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPatient = async (e) => {
    e.preventDefault();
    if (!newPatientName.trim()) return;
    
    setAddingPatient(true);
    try {
      const response = await patientsAPI.create({ full_name: newPatientName.trim() });
      setPatients([response.data, ...patients]);
      setShowAddDialog(false);
      setNewPatientName('');
      toast.success('Patient added successfully');
      navigate(`/patients/${response.data.id}`);
    } catch (error) {
      toast.error('Failed to add patient');
    } finally {
      setAddingPatient(false);
    }
  };

  const filteredPatients = patients.filter(p => 
    p.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="dashboard-page">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-700 rounded-xl flex items-center justify-center">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">MedRounds</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900">{nurse?.full_name}</p>
                <p className="text-xs text-slate-500">{nurse?.license_number || 'Nurse'}</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout}
                className="text-slate-500 hover:text-slate-700"
                data-testid="logout-btn"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white border-slate-100">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-teal-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{patients.length}</p>
                <p className="text-sm text-slate-500">Total Patients</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-slate-100">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {patients.filter(p => p.last_vitals).length}
                </p>
                <p className="text-sm text-slate-500">With Recent Vitals</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-slate-100">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {patients.filter(p => !p.permanent_info?.date_of_birth).length}
                </p>
                <p className="text-sm text-slate-500">Incomplete Profiles</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Add */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-white"
              data-testid="search-patients-input"
            />
          </div>
          
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="h-11 bg-teal-700 hover:bg-teal-600" data-testid="add-patient-btn">
                <Plus className="w-5 h-5 mr-2" />
                Add Patient
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Patient</DialogTitle>
                <DialogDescription>
                  Enter the patient's name to create their profile. You can add more details later.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddPatient} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="patientName">Patient Full Name</Label>
                  <Input
                    id="patientName"
                    placeholder="John Doe"
                    value={newPatientName}
                    onChange={(e) => setNewPatientName(e.target.value)}
                    className="h-11"
                    required
                    data-testid="new-patient-name-input"
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-teal-700 hover:bg-teal-600"
                    disabled={addingPatient}
                    data-testid="confirm-add-patient-btn"
                  >
                    {addingPatient ? 'Adding...' : 'Add Patient'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Patient List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i} className="bg-white border-slate-100">
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-slate-200 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-3/4" />
                        <div className="h-3 bg-slate-200 rounded w-1/2" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="empty-state">
            <Users className="empty-state-icon" />
            <h3 className="empty-state-title">
              {searchQuery ? 'No patients found' : 'No patients yet'}
            </h3>
            <p className="empty-state-description">
              {searchQuery 
                ? 'Try adjusting your search terms'
                : 'Add your first patient to get started with documentation'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPatients.map(patient => (
              <Card 
                key={patient.id} 
                className="patient-card bg-white border-slate-100 cursor-pointer"
                onClick={() => navigate(`/patients/${patient.id}`)}
                data-testid={`patient-card-${patient.id}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-teal-50 rounded-full flex items-center justify-center">
                        <User className="w-7 h-7 text-teal-700" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{patient.full_name}</h3>
                        <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                          {patient.permanent_info?.date_of_birth && (
                            <>
                              <span>{calculateAge(patient.permanent_info.date_of_birth)} yrs</span>
                              <span>•</span>
                            </>
                          )}
                          <span>{patient.permanent_info?.gender || 'Unknown'}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                  
                  {patient.last_vitals && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-xs text-slate-500 mb-2">Last Vitals</p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {patient.last_vitals.blood_pressure_systolic && (
                          <span className="bg-slate-100 px-2 py-1 rounded font-mono">
                            BP: {patient.last_vitals.blood_pressure_systolic}/{patient.last_vitals.blood_pressure_diastolic}
                          </span>
                        )}
                        {patient.last_vitals.pulse && (
                          <span className="bg-slate-100 px-2 py-1 rounded font-mono">
                            HR: {patient.last_vitals.pulse}
                          </span>
                        )}
                        {patient.last_vitals.body_temperature && (
                          <span className="bg-slate-100 px-2 py-1 rounded font-mono">
                            T: {patient.last_vitals.body_temperature}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Added {formatDate(patient.created_at)}
                    </span>
                    {patient.permanent_info?.visit_frequency && (
                      <span className="bg-teal-50 text-teal-700 px-2 py-1 rounded">
                        {patient.permanent_info.visit_frequency}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
