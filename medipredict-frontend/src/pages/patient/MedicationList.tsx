import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Pill, Edit2, Trash2, CheckCircle2, Clock, X, Info, Hash, RotateCcw, Archive } from 'lucide-react';
// ✅ Import MASTER_MEDICATIONS instead of the old MOCK_MEDICATIONS
import { type Medication } from '../../data/mockData';
import { cn } from '../../utils/cn';
import { useMeds } from '../../context/MedicationContext';
import { useUser } from '../../context/UserContext';
import api from '../../utils/api';

const getMedicationDayLabel = (med: Medication) => {
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayIndex = new Date().getDay();
  const todayName = daysOfWeek[todayIndex];

  if (med.frequency === 'Daily') return 'Today';
  if (med.frequency.includes(todayName)) return 'Today';
  return med.frequency;
};

const convertTimeTo24 = (time12h: string) => {
  const [time, modifier] = time12h.split(' ');
  let [hours, minutes] = time.split(':');
  if (hours === '12') hours = '00';
  if (modifier === 'PM') hours = (parseInt(hours, 10) + 12).toString();
  return `${hours.padStart(2, '0')}:${minutes}`;
};

const MedicationList: React.FC = () => {
  const { userId } = useUser(); //
  const [meds, setMeds] = useState<any[]>([]); //
  const [loading, setLoading] = useState(true); //
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [newMedForm, setNewMedForm] = useState({
    name: '',
    dosage: '',
    quantity: '1',
    unit: 'Pill',
    time: '08:00',
    frequency: 'Daily',
    selectedDays: [] as string[],
    category: 'General',
    customCategory: ''
  });

  const isFormInvalid =
    !newMedForm.name.trim() ||
    !newMedForm.quantity ||
    !newMedForm.time ||
    (newMedForm.frequency === 'Custom' && newMedForm.selectedDays.length === 0) ||
    (newMedForm.category === 'Other' && !newMedForm.customCategory.trim());

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // ✅ 1. Fetch Medications from MongoDB Atlas
  useEffect(() => {
    const fetchMeds = async () => {
      if (!userId) return;
      try {
        const res = await api.get(`/medications/patient/${userId}`); //
        setMeds(res.data);
      } catch (err) {
        console.error("Cloud sync failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMeds();
  }, [userId]);

  const toggleDay = (day: string) => {
    setNewMedForm(prev => {
      const isAlreadySelected = prev.selectedDays.includes(day);
      const updatedDays = isAlreadySelected
        ? prev.selectedDays.filter(d => d !== day)
        : [...prev.selectedDays, day];
      const sortedDays = updatedDays.sort((a, b) =>
        daysOfWeek.indexOf(a) - daysOfWeek.indexOf(b)
      );
      return { ...prev, selectedDays: sortedDays };
    });
  };

  const formatTimeToAMPM = (time24: string) => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHours = h % 12 || 12;
    return `${displayHours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  };

  // ✅ 2. Handle Status Toggling (Marking as Taken)
  const handleToggleTaken = async (med: any) => {
    try {
      const res = await api.patch(`/medications/${med._id}`, { 
        isTaken: !med.isTaken,
        status: !med.isTaken ? 'taken' : 'upcoming'
      }); //
      setMeds(prev => prev.map(m => m._id === med._id ? res.data : m));
    } catch (err) {
      alert("Status update failed");
    }
  };

  // ✅ 3. Save or Update Medication in MongoDB
  const handleSaveMedication = async () => {
    const finalCategory = newMedForm.category === 'Other' ? newMedForm.customCategory : newMedForm.category;
    const finalFrequency = newMedForm.frequency === 'Custom' ? newMedForm.selectedDays.join(', ') : newMedForm.frequency;

    const medData = {
      name: newMedForm.name,
      dosage: newMedForm.dosage,
      quantity: `${newMedForm.quantity} ${newMedForm.unit}`,
      time: formatTimeToAMPM(newMedForm.time),
      category: finalCategory,
      frequency: finalFrequency,
      selectedDays: newMedForm.selectedDays,
      patientId: userId // ✅ CRITICAL: This MUST be present and not null
    };

    try {
      if (editingId) {
        const res = await api.patch(`/medications/${editingId}`, medData); //
        setMeds(prev => prev.map(m => m._id === editingId ? res.data : m));
      } else {
        const res = await api.post('/medications', medData); //
        setMeds(prev => [...prev, res.data]);
      }
      setIsAddModalOpen(false);
      setEditingId(null);
      setNewMedForm({
        name: '', dosage: '', quantity: '1', unit: 'Pill',
        time: '08:00', frequency: 'Daily', selectedDays: [],
        category: 'General', customCategory: ''
      });
    } catch (err) { 
      alert("Failed to save to cloud storage.");
    }
  };

  // ✅ 4. Cloud Deletion
  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to remove this medication permanently?")) {
      try {
        await api.delete(`/medications/${id}`); //
        setMeds(prev => prev.filter(m => m._id !== id));
      } catch (err) {
        alert("Delete failed.");
      }
    }
  };

  const handleEdit = (med: any) => {
    setEditingId(med._id);
    const presets = ['General', 'Heart', 'Antibiotic', 'Analgesic', 'Supplement'];
    const isOther = !presets.includes(med.category);

    setNewMedForm({
      name: med.name,
      dosage: med.dosage,
      quantity: med.quantity.split(' ')[0],
      unit: med.quantity.split(' ')[1] || 'Pill',
      time: convertTimeTo24(med.time),
      frequency: ['Daily', 'Weekly'].includes(med.frequency) ? med.frequency : 'Custom',
      selectedDays: med.selectedDays || [],
      category: isOther ? 'Other' : med.category,
      customCategory: isOther ? med.category : ''
    });
    setIsAddModalOpen(true);
  };

  // ✅ 5. Cloud Archiving
  const handleArchive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await api.patch(`/medications/${id}`, { isArchived: !currentStatus }); //
      setMeds(prev => prev.map(m => m._id === id ? res.data : m));
    } catch (err) {
      alert("Archive failed.");
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-400">Syncing with MediPredict Cloud...</div>;

  return (
    <div className="space-y-8 mt-4 animate-in fade-in duration-500 pb-32">
      {/* Hero Search Section */}
      <section>
        <h1 className="text-3xl font-extrabold text-text-primary mb-6 font-display tracking-tight">My Medications</h1>
        <div className="flex bg-gray-100 p-1 rounded-xl">
          {(['active', 'archived'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all capitalize",
                activeTab === tab ? "bg-white text-primary shadow-sm" : "text-gray-400 hover:text-gray-600"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            className="w-full h-14 pl-12 pr-4 bg-white border border-gray-100 rounded-[24px] focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-sm soft-shadow text-base font-medium placeholder:text-gray-400"
            placeholder="Search medications, dosage, or time..."
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </section>

      {/* Medication Grid */}
      <div className="grid grid-cols-1 gap-6">
        {/* ✅ FIX 1: Use a combined filter for Search + Archive Status */}
        {meds
          .filter(m => activeTab === 'archived' ? m.isArchived : !m.isArchived)
          .filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.category.toLowerCase().includes(searchTerm.toLowerCase()))
          .length > 0 ? (
          meds
            .filter(m => activeTab === 'archived' ? m.isArchived : !m.isArchived)
            .filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.category.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((med) => (
              <motion.div
                key={med._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "bg-white rounded-[28px] p-4 flex gap-4 relative overflow-hidden soft-shadow border border-white transition-all group",
                  med.isArchived ? "opacity-75 grayscale-[0.5]" : "hover:border-blue-100"
                )}
              >
                {/* Status Bar */}
                <div className={cn(
                  "absolute left-0 top-0 bottom-0 w-1.5",
                  med.isArchived ? "bg-gray-300" : (med.isTaken ? "bg-success" : med.status === 'missed' ? "bg-alert" : "bg-primary")
                )} />

                {/* Pill Icon */}
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                  med.isArchived ? "bg-gray-100 text-gray-400" : (med.isTaken ? "bg-success/10 text-success" : "bg-surface-container-low text-primary")
                )}>
                  <Pill className="w-8 h-8" />
                </div>

                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-text-primary">{med.name}</h3>
                      <p className="text-sm font-bold text-text-secondary">
                        {med.dosage} • {med.quantity} • {med.category}
                      </p>
                    </div>
                    {/* Status Badge (Hidden if Archived) */}
                    {!med.isArchived && (
                      <div 
                      onClick={() => handleToggleTaken(med)}
                      className={cn(
                        "flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                        med.isTaken ? "bg-green-50 text-success border border-success/10" : "bg-blue-50 text-primary border border-primary/10"
                      )}>
                        {med.isTaken ? "Taken" : med.status}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs font-medium">{med.frequency}, {med.time}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {/* ✅ FIX 2: Edit Button Now Workable */}
                      <button
                        onClick={() => handleEdit(med)}
                        className="w-9 h-9 rounded-full bg-surface-container-low text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* ✅ FIX 3: Archive/Unarchive Toggle */}
                      <button
                        onClick={() => handleArchive(med._id, med.isArchived)}
                        title={med.isArchived ? "Unarchive" : "Archive"}
                        className="w-9 h-9 rounded-full bg-surface-container-low text-amber-600 flex items-center justify-center hover:bg-amber-600 hover:text-white transition-all"
                      >
                        {med.isArchived ? <RotateCcw className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => handleDelete(med._id)}
                        className="w-9 h-9 rounded-full bg-surface-container-low text-error flex items-center justify-center hover:bg-error hover:text-white transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400">
            <Search className="w-12 h-12 mb-4 opacity-20" />
            <p className="font-medium">No {activeTab} medications found.</p>
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => {
          setEditingId(null); // Ensure we're adding, not editing
          setIsAddModalOpen(true);
        }}
        className="fixed bottom-28 right-6 w-16 h-16 bg-primary text-white rounded-[24px] shadow-xl hover:bg-blue-700 flex items-center justify-center transition-all z-40"
      >
        <Plus className="w-8 h-8" />
      </button>

      {/* Add Medication Overlay */ }
  <AnimatePresence>
    {isAddModalOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={() => setIsAddModalOpen(false)}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-white rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        >
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-xl font-bold text-primary font-display">Add Medication</h2>
            <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="p-8 space-y-6 overflow-y-auto">
            {/* Medicine Name */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-widest px-1">Medicine Name</label>
              <div className="relative">
                <Pill className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  className="w-full pl-12 pr-4 py-4 bg-surface-container-low rounded-2xl font-medium focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  placeholder="e.g. Atorvastatin"
                  value={newMedForm.name}
                  onChange={(e) => setNewMedForm({ ...newMedForm, name: e.target.value })}
                />
              </div>
            </div>

            {/* Amount and Type (Spoon/Pill Logic) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Amount</label>
                <input
                  type="number"
                  className="w-full px-4 py-4 bg-surface-container-low rounded-2xl font-medium outline-none"
                  value={newMedForm.quantity}
                  onChange={(e) => setNewMedForm({ ...newMedForm, quantity: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Type</label>
                <select
                  className="w-full px-4 py-4 bg-surface-container-low rounded-2xl font-medium outline-none appearance-none"
                  value={newMedForm.unit}
                  onChange={(e) => setNewMedForm({ ...newMedForm, unit: e.target.value })}
                >
                  <option value="Pill">Pill(s)</option>
                  <option value="Capsule">Capsule(s)</option>
                  <option value="Spoon">Spoon(s)</option>
                  <option value="ml">ml</option>
                </select>
              </div>
            </div>

            {/* Dosage and Time Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-widest px-1">Dosage (mg)</label>
                <input
                  className="w-full px-4 py-4 bg-surface-container-low rounded-2xl font-medium outline-none"
                  placeholder="e.g. 20mg"
                  value={newMedForm.dosage}
                  onChange={(e) => setNewMedForm({ ...newMedForm, dosage: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-widest px-1">Time</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                  <input
                    className="w-full pl-12 pr-4 py-4 bg-surface-container-low rounded-2xl font-medium outline-none"
                    type="time"
                    value={newMedForm.time}
                    onChange={(e) => setNewMedForm({ ...newMedForm, time: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* ✅ INSERT CATEGORY SELECTION HERE */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-widest px-1">Category</label>
                <select
                  className="w-full px-4 py-4 bg-surface-container-low rounded-2xl font-medium outline-none appearance-none cursor-pointer"
                  value={newMedForm.category}
                  onChange={(e) => setNewMedForm({ ...newMedForm, category: e.target.value })}
                >
                  <option value="General">General</option>
                  <option value="Heart">Heart</option>
                  <option value="Antibiotic">Antibiotic</option>
                  <option value="Analgesic">Analgesic</option>
                  <option value="Supplement">Supplement</option>
                  <option value="Other">Other...</option>
                </select>
              </div>

              <AnimatePresence>
                {newMedForm.category === 'Other' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 overflow-hidden"
                  >
                    <label className="text-[10px] font-bold text-primary uppercase tracking-widest px-1">Specify Category</label>
                    <input
                      className="w-full px-4 py-3 bg-white border-2 border-primary/10 rounded-2xl font-medium outline-none focus:border-primary/30 transition-all"
                      placeholder="e.g. Vitamins, Post-Op, etc."
                      value={newMedForm.customCategory}
                      onChange={(e) => setNewMedForm({ ...newMedForm, customCategory: e.target.value })}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ✅ Frequency with Day Selection for 'Custom' */}
            <div className="space-y-4">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Frequency</label>
              <div className="grid grid-cols-3 gap-2">
                {['Daily', 'Weekly', 'Custom'].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setNewMedForm({ ...newMedForm, frequency: f })}
                    className={cn(
                      "py-3 rounded-xl font-bold text-sm transition-all",
                      newMedForm.frequency === f ? "bg-primary text-white shadow-md" : "bg-gray-100 text-gray-500"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {newMedForm.frequency === 'Custom' && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap justify-between pt-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={cn(
                        "w-10 h-10 rounded-full text-[10px] font-bold transition-all border",
                        newMedForm.selectedDays.includes(day)
                          ? "bg-primary text-white border-primary shadow-sm"
                          : "bg-white text-gray-400 border-gray-200"
                      )}
                    >
                      {day[0]}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>

            {/* AI Risk Insight */}
            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex gap-4">
              <Info className="text-primary w-5 h-5 shrink-0" />
              <p className="text-[11px] text-blue-600 leading-relaxed">
                <span className="font-bold block">AI Risk Insight</span>
                Schedule optimized based on your cardiac risk prevention score.
              </p>
            </div>

            <div className="pt-4 flex flex-col gap-3">
              <button
                onClick={handleSaveMedication}
                // ✅ Disable button until validation passes
                disabled={isFormInvalid}
                className={cn(
                  "w-full py-4 rounded-2xl font-bold shadow-lg transition-all duration-200 active:scale-95",
                  isFormInvalid
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none" // ❌ Invalid State (dosage ignored)
                    : "bg-primary text-white shadow-primary/20 hover:bg-blue-700"  // ✅ Valid State
                )}
              >
                Save Medication
              </button>
              <button onClick={() => setIsAddModalOpen(false)} className="w-full py-2 text-text-secondary font-bold text-sm hover:text-red-500">
                Discard Changes
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
  </div>
  );
};

export default MedicationList;
