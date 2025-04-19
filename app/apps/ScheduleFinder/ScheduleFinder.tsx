'use client';

import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import styles from './scheduleFinder.module.css';

// Material UI imports
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { 
  Button, 
  TextField, 
  IconButton, 
  Typography, 
  Box, 
  Paper, 
  Tabs, 
  Tab,
  Grid
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AddIcon from '@mui/icons-material/Add';

// Import the custom hook that contains the logic
import { useScheduleFinder, TimeSlot, Person, CommonTimeSlot } from '../../hooks/useScheduleFinder';

// Component for adding a new time slot
const TimeSlotInput: React.FC<{
  onAdd: (timeSlot: TimeSlot) => void;
}> = ({ onAdd }) => {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [error, setError] = useState('');

  const validateAndAddTimeSlot = () => {
    // Reset previous error
    setError('');

    // Validate inputs
    if (!start || !end) {
      setError('Start and end times are required');
      return;
    }

    // Validate time format using regex (HH:MM)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(start) || !timeRegex.test(end)) {
      setError('Time should be in HH:MM format');
      return;
    }

    // Ensure end time is after start time
    const startMinutes = parseInt(start.split(':')[0]) * 60 + parseInt(start.split(':')[1]);
    const endMinutes = parseInt(end.split(':')[0]) * 60 + parseInt(end.split(':')[1]);
    
    if (endMinutes <= startMinutes) {
      setError('End time should be after start time');
      return;
    }

    // Add time slot
    onAdd({
      id: uuidv4(),
      start,
      end
    });

    // Reset form
    setStart('');
    setEnd('');
  };

  return (
    <Box className={styles.timeSlotRow}>
      <TextField
        label="Start Time"
        placeholder="HH:MM"
        value={start}
        onChange={(e) => setStart(e.target.value)}
        size="small"
      />
      <TextField
        label="End Time"
        placeholder="HH:MM"
        value={end}
        onChange={(e) => setEnd(e.target.value)}
        size="small"
      />
      <Button 
        variant="contained" 
        color="primary" 
        onClick={validateAndAddTimeSlot}
        startIcon={<AddIcon />}
      >
        Add Slot
      </Button>
      {error && <Typography color="error" variant="caption">{error}</Typography>}
    </Box>
  );
};

// Component for displaying common time slots
const CommonTimeSlotsList: React.FC<{
  slots: CommonTimeSlot[];
}> = ({ slots }) => {
  if (slots.length === 0) {
    return (
      <Typography className={styles.emptyMessage}>
        No common time slots found
      </Typography>
    );
  }

  return (
    <div>
      {slots.map((slot, index) => (
        <Paper key={index} className={styles.commonSlotCard} elevation={1}>
          <Typography className={styles.slotTime} variant="subtitle1">
            <AccessTimeIcon fontSize="small" sx={{ mr: 1 }} />
            {slot.start} - {slot.end}
          </Typography>
          <Typography className={styles.participants} variant="body2">
            People available:
          </Typography>
          <ul className={styles.participantsList}>
            {slot.people.map((person, idx) => (
              <li key={idx}>{person}</li>
            ))}
          </ul>
        </Paper>
      ))}
    </div>
  );
};

const ScheduleFinder: React.FC = () => {
  const {
    selectedDate,
    setSelectedDate,
    people,
    currentPerson,
    setCurrentPerson,
    addPerson,
    removePerson,
    findCommonTimeSlots,
    findOverlappingTimeSlots,
  } = useScheduleFinder();

  const [tabValue, setTabValue] = useState(0);
  const [newPersonName, setNewPersonName] = useState('');
  const [currentTimeSlots, setCurrentTimeSlots] = useState<TimeSlot[]>([]);
  const [commonSlots, setCommonSlots] = useState<CommonTimeSlot[]>([]);
  const [overlapSlots, setOverlapSlots] = useState<CommonTimeSlot[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Handle adding a new time slot to the current draft person
  const handleAddTimeSlot = (timeSlot: TimeSlot) => {
    setCurrentTimeSlots([...currentTimeSlots, timeSlot]);
  };

  // Handle removing a time slot from the current draft person
  const handleRemoveTimeSlot = (id: string) => {
    setCurrentTimeSlots(currentTimeSlots.filter(slot => slot.id !== id));
  };

  // Handle adding a new person with their time slots
  const handleAddPerson = () => {
    if (!newPersonName.trim()) return;

    const newPerson: Person = {
      id: uuidv4(),
      name: newPersonName,
      timeSlots: currentTimeSlots,
    };

    addPerson(newPerson);
    
    // Reset form
    setNewPersonName('');
    setCurrentTimeSlots([]);
  };

  // Handle finding common schedule slots
  const handleFindSchedule = () => {
    const common = findCommonTimeSlots();
    const overlapping = findOverlappingTimeSlots();
    
    setCommonSlots(common);
    setOverlapSlots(overlapping);
    setShowResults(true);
  };

  // Format date for display
  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div className={styles.scheduleFinder}>
        <Typography variant="h4" className={styles.title}>
          Schedule Finder
        </Typography>

        {/* Date Selection */}
        <Box className={styles.datePickerContainer}>
          <DatePicker
            label="Select Date"
            value={selectedDate}
            onChange={(newDate) => setSelectedDate(newDate)}
          />
        </Box>

        {/* Add Person Section */}
        <Paper className={styles.section} elevation={2}>
          <Typography variant="h5" className={styles.sectionHeader}>
            Add Person's Availability
          </Typography>

          <Grid container spacing={2}>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Name"
                value={newPersonName}
                onChange={(e) => setNewPersonName(e.target.value)}
                margin="normal"
              />
            </Grid>
            
            <Grid size={12}>
              <Typography variant="subtitle1" gutterBottom>
                Add Available Time Slots:
              </Typography>
              <TimeSlotInput onAdd={handleAddTimeSlot} />
              
              {currentTimeSlots.length > 0 && (
                <Box mt={2}>
                  <Typography variant="subtitle2">Current Time Slots:</Typography>
                  {currentTimeSlots.map(slot => (
                    <Box key={slot.id} display="flex" alignItems="center" my={1}>
                      <Typography variant="body2">
                        {slot.start} - {slot.end}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveTimeSlot(slot.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
            </Grid>
            
            <Grid size={12}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleAddPerson}
                disabled={!newPersonName || currentTimeSlots.length === 0}
                startIcon={<PersonAddIcon />}
              >
                Add Person
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* People List Section */}
        {people.length > 0 && (
          <Paper className={styles.section} elevation={2}>
            <Typography variant="h5" className={styles.sectionHeader}>
              People ({people.length})
            </Typography>
            
            {people.map(person => (
              <Paper key={person.id} className={styles.personCard} elevation={1}>
                <Box className={styles.personHeader}>
                  <Typography className={styles.personName} variant="h6">
                    {person.name}
                  </Typography>
                  <IconButton onClick={() => removePerson(person.id)} color="error" size="small">
                    <DeleteIcon />
                  </IconButton>
                </Box>
                
                {person.timeSlots.length > 0 ? (
                  <Box>
                    <Typography variant="body2">Available Times:</Typography>
                    <ul className={styles.timeSlotsList}>
                      {person.timeSlots.map((slot, index) => (
                        <li key={index} className={styles.timeSlotItem}>
                          {slot.start} - {slot.end}
                        </li>
                      ))}
                    </ul>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No availability added
                  </Typography>
                )}
              </Paper>
            ))}

            <Box mt={2}>
              <Button
                variant="contained"
                color="secondary"
                onClick={handleFindSchedule}
                disabled={people.length < 2}
              >
                Find Common Schedule
              </Button>
            </Box>
          </Paper>
        )}

        {/* Results Section */}
        {showResults && (
          <Paper className={`${styles.section} ${styles.resultSection}`} elevation={2}>
            <Typography variant="h5" className={styles.sectionHeader}>
              Results for {formatDate(selectedDate)}
            </Typography>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs value={tabValue} onChange={handleTabChange}>
                <Tab label="Perfect Match" />
                <Tab label="Partial Matches" />
              </Tabs>
            </Box>

            <Box hidden={tabValue !== 0}>
              <Typography variant="subtitle1" gutterBottom>
                Times when everyone is available:
              </Typography>
              <CommonTimeSlotsList slots={commonSlots} />
            </Box>
            
            <Box hidden={tabValue !== 1}>
              <Typography variant="subtitle1" gutterBottom>
                Times with at least 2 people available:
              </Typography>
              <CommonTimeSlotsList slots={overlapSlots} />
            </Box>
          </Paper>
        )}
      </div>
    </LocalizationProvider>
  );
};

export default ScheduleFinder;